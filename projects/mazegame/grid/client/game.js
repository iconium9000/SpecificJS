//	----------------------------------------------------------------------------
//	MazeGame
//	----------------------------------------------------------------------------
module.exports = g => {
	const {pt,fu,idx} = g, mg = {
		name: 'mg',

		// Constants -----------------------------------------------------------------

		// display offset for dragging
		shift: g.pt.zero(),

		// the length and width of each grid cell
		gridSize: 25,

		// the length and width of each cell in the grid
		cellSize: 18,

		lineWidth: 1,

		// the radius of the cell modifier brush
		brushSize: 1,

		// mode TODO
		mode: 'game',

		// state TODO
		state: false,

		// sel
		sel: {
			locked: true
		},

		// Map -----------------------------------------------------------------------
		map: {},

		getMap: f => {
			const map = {}

			map.cell = {}
			map.flag = f

			for (const i in mg.states) {
				map[i] = {}
			}

			return map
		},

		clear: () => {
			mg.map = mg.getMap()
		},

		// Init ----------------------------------------------------------------------
		init: (gw, idx) => {

			// on init, clear the map
			mg.clear()
		},

		// Tick ----------------------------------------------------------------------
		tick: (gw, idx) => {
			// get constants
			const g = gw.display.g
			const ms = gw.mouse

			// pan if mode is not a state mode
			mg.tf.panIf(ms)

			// set the display value for every cell in the map
			mg.tf.setMouseInAllCells()

			// set sel[...]
			//	flag, map, point, mouse, string, cell, state
			mg.tf.setSel(ms)

			// draw states
			mg.tf.drawStates(g)

			// draw mouse
			mg.tf.drawMouse(g, ms)

			// set mode
			mg.tf.setMode(gw.keys.hasDown)

			// set brushSize
			mg.tf.setBrushSize(gw.keys.hasDown)

			// get the cells inside the mouse brush
			//	store the cells in mg.sel.map
			const map = mg.tf.getBrushMap(ms)
			const flag = {}

			// set the states of each of the cells in the brush
			//	use mg.sel.state the modify the cells in mg.sel.map
			mg.tf.setBrushStates(map, mg.mode, mg.sel.state)

			// update each of the modified cells
			mg.tf.updateBrushMap(map)

			// send each of the modified cells
			mg.tf.sendBrushStates(map)

			// TODO
			mg.tf.spread(map, flag)

			// If in gamemode...

			if (mg.mode == 'game') {
				// select level
				mg.tf.selectLevel(ms)

				// select player
				mg.tf.selectPlayer(ms)

				// toggle player?
				mg.tf.togglePlayer(gw.keys.hasDown)

				// move player?
				mg.tf.movePlayer(gw.keys.hasDown)
			}
			mg.sel.map = {}

		},

		tf: {
			panIf: ms => {
				// if mode not a state mode and if mouse is down
				if (!mg.states[mg.mode] && ms.isDown) {

					// then pan around level
					pt.sume(mg.shift, pt.sub(ms, ms.prev))
				}
			},

			setMouseInAllCells: () => {

				// for each cell
				for (const i in mg.map.cell) {

					// get each cell
					const c = mg.map.cell[i]

					// get the point on the screen corresponding to that cell
					c.mouse = mg.cell.pointToMouse(c)
				}
			},

			setSel: ms => {

				// set point, mouse, string, cell of sel
				mg.sel.point = mg.cell.mouseToPoint(ms)
				mg.sel.mouse = mg.cell.pointToMouse(mg.sel.point)
				mg.sel.string = mg.cell.pointToString(mg.sel.point)
				mg.sel.cell = mg.cell.get.string(mg.sel.string)

				// if the mouse has clicked, get the state of the cell at the mouse
				if (ms.hasDown) {
					mg.sel.state = mg.states[mg.mode] && mg.states[mg.mode].get(mg.sel.cell)
				}
			},

			// draw states
			drawStates: g => {

				g.lineWidth = mg.lineWidth
				for (const i in mg.stateOrder) {
					// get consts
					const n = mg.stateOrder[i]
					const s = mg.states[n]
					const r = s.radius()

					// set color if color is const
					if (!s.color.true) {
						g[s.style] = s.color
					}

					// for each cell of each state
					for (const j in mg.map[n]) {
						// get cell
						const c = mg.map[n][j]

						// set color if color depends on wire
						if (s.color.true) {
							g[s.style] = s.color[c.wire.open]
						}

						// draw individual cell
						s.draw(g, c, r)

						// draw net if specified
						if (s.net) {
							if (c.rt && c.rt[n]) {
								pt.drawLine(g, c.mouse, c.rt.mouse)
							}
							if (c.up && c.up[n]) {
								pt.drawLine(g, c.mouse, c.up.mouse)
							}
						}
					}
				}
			},

			// draw mouse
			drawMouse: (g, ms) => {

				// set both stroke style and fill style to white
				g.strokeStyle = g.fillStyle = '#FFFFFF'

				// set the radius of the cursor
				ms.r = mg.gridSize / 2

				// draw the cursor
				pt.fillCircle(g, ms)

				// draw an outline around the cells in the brush radius
				pt.drawRect(g, mg.sel.mouse, ms.r * ((mg.brushSize - 1) * 2 + 1))
			},

			// set mode
			setMode: dn => {
				// for each new mode
				for (const i in mg.modes) {

					// if the key for the new mode is down
					//	and mg.mode is not already selected
					if (dn[mg.modes[i].key] && mg.mode != i) {

						// set mg.mode to the new mode
						mg.mode = i

						// tell the console that you did that
						console.log(`mode set to '${i}'`)
					}
				}
			},

			// set brushSize
			setBrushSize: dn => {

				// for numbers '1' through '9'
				for (let k = 1; k <= 9; ++k) {

					// if <k> is down and brushSize != <k>
					if (dn[`${k}`] && mg.brushSize != k) {

						// set brushSize to <k>
						mg.brushSize = k

						// And tell console that you did that
						console.log(`brushSize set to '${k}'`)
					}
				}
			},

			getBrushMap: ms => {
				const map = {}

				if (ms.isDown) {
					const brush = pt.zero()
					const b = mg.brushSize - 1
					for (brush.x = -b; brush.x <= b; ++brush.x) {
						for (brush.y = -b; brush.y <= b; ++brush.y) {

							const c = mg.cell.set.point(pt.sum(mg.sel.point, brush))
							map[c.string] = c
						}
					}
				}

				return map
			},

			setBrushStates: (map, mode, state) => {
				// for each cell in map
				if (mg.states[mode]) {

					// get the 'add' or 'remove' function from the state
					const s = mg.states[mg.mode][state ? 'add' : 'remove']

					// for each cell in map
					for (const i in map) {

						// do the function
						s(map[i])
					}
				}
			},

			updateBrushMap: (map) => {

				// for each cell in map
				for (const i in map) {

					// update cell at map 'i'
					mg.cell.update(map[i])
				}

			},

			sendBrushStates: (map) => {
				const status = {}
				let send = false

				// for each cell in map
				for (const i in map) {

					// set the status at 'i' to a symplified version of cell's states
					status[i] = mg.cell.get.status(map[i])
					send = true
				}

				// if status has been updated
				if (send) {

					// send the status to the server
					idx.set.status(status)
				}

			},

			spread: (map, flag) => {

				for (const i in map) {
					mg.cell.wire(map[i], flag, null, map)
				}

				for (const i in map) {
					mg.cell.level(map[i], flag, null, map)
				}

				mg.tf.assembleLevels()

			},

			assembleLevels: () => {

				const flag = {}

				mg.level = []

				for (const i in mg.map.cell) {
					const l = mg.map.cell[i].level
					if (l.flag != flag) {
						l.flag = flag

						mg.level.push(l)
					}
				}

			},



			selectLevel: ms => {
				if (ms.hasDown && mg.sel.cell) {

					mg.sel.level = mg.sel.cell.level

				}

			},

			selectPlayer: ms => {

				if (ms.hasDown && mg.sel.cell) {

					if (mg.sel.cell.player) {
						mg.sel.player = mg.sel.cell
					} else if (mg.sel.level) {
						mg.sel.player = fu.getFirstKeyElement(mg.sel.level.player)
					}

				}

			},

			// toggle player?
			togglePlayer: k => {

				if (k[' '] && mg.sel.level) {
					if (mg.sel.player) {
						const plr = mg.sel.player
						const plrs = mg.sel.level.player
						let flag = false
						for (const i in plrs) {
							if (flag) {
								mg.sel.player = plrs[i]
								return
							} else if (i == plr.string) {
								flag = true
							}
						}
					}

					mg.sel.player = fu.getFirstKeyElement(mg.sel.level.player)

				}

				if (k['Enter'] && mg.sel.level) {
					mg.sel.locked = !mg.sel.locked
				}

			},

			// move player?
			movePlayer: k => {
				const plr = mg.sel.player

				if (plr) {

					if (mg.sel.portal && plr.portal && plr.wire.open) {
						const lvl = mg.sel.level
							for (const i in lvl.portal) {
								const p = lvl.portal[i]
								if (p != plr && p.wire.open) {
									mg.move(plr, p)
									mg.sel.portal = false
									break
								}
							}
						}

					for (const i in mg.directions) {
						const d = mg.directions[i]
						if (k[d.key]) {
							mg.move(plr, plr[i])
						}
					}

				}

			}

		},

		// Cell interface
		cell: {
			mouseToPoint: m => pt.math(Math.round, pt.factor(pt.sub(m, mg.shift), mg.gridSize)),
			pointToMouse: p => pt.sum(mg.shift, pt.scale(p, mg.gridSize)),
			pointToString: p => `${p.x},${p.y}`,
			stringToPoint: s => {
				const split = s.split(',')
				return {
					string: s,
					x: parseFloat(split[0]),
					y: parseFloat(split[1]),
					z: 0
				}
			},
			mouseToString: m => mg.cell.pointToString(mg.cell.mouseToPoint(m)),
			stringToMouse: s => mg.cell.pointToMouse(mg.cell.stringToPoint(s)),

			// get even if it doesn't exist
			set: {
				mouse: m => mg.cell.set.string(mg.cell.mouseToString(m)),
				point: p => mg.cell.set.string(mg.cell.pointToString(p)),
				string: s => mg.map.cell[s] || (mg.map.cell[s] = mg.cell.stringToPoint(s)),
				status: s => {
					const m = {}
					for (const i in s) {
						const t = s[i]
						const c = m[i] = mg.cell.set.string(i)
						for (const j in mg.states) {
							c[j] = t[j]
						}
					}
					return m
				}
			},

			// get only if it existsw
			get: {
				mouse: m => mg.cell.get.string(mg.cell.mouseToString(m)),
				point: p => mg.cell.get.string(mg.cell.pointToString(p)),
				string: s => mg.map.cell[s],
				status: c => {
					const s = {}
					for (const i in mg.states) {
						if (c[i]) {

							// TODO on alpha
							s[i] = true
						}
					}
					return s
				}
			},

			level: (cell, flag, level, map) => {

				if (!cell) {
					return false
				} else if (cell.clear) {

					for (const i in mg.directions) {
						const c = cell[i]
						if (c && (!map || !map[c.string])) {
							mg.cell.level(c, flag)
						}
					}

					return false

				} else if ((!level || cell.level != level) && (!cell.level || cell.level.flag != flag)) {
					// TODO
					const l = cell.level = level || mg.getMap(flag)

					// TODO
					l.cell[cell.string] = cell

					// TODO
					for (const i in mg.states) {
						if (cell[i]) {
							l[i][cell.string] = cell
						}
					}

					if (cell.portal) {
						l.nPortals = 0

						for (const i in l.portal) {

							const c = l.portal[i]
							const w = c.wire

							w.open = true
							for (const j in w.pad) {
								if (!w.pad[j].key && !w.pad[j].player) {
									w.open = false
								}
							}

							if (w.open) {
								++l.nPortals
							}
						}

						if (l.nPortals != 2) {
							for (const i in l.portal) {
								l.portal[i].wire.open = false
							}
						}
					}

					// TODO
					for (const i in mg.directions) {
						mg.cell.level(cell[i], flag, l)
					}

					return true
				}
			},

			wire: (cell, flag, wire, map) => {

				if (!cell) {
					return
				} else if (cell.clear) {

					for (const i in mg.directions) {
						const c = cell[i]
						if (c && (!map || !map[c.string])) {
							mg.cell.wire(c, flag)
						}
					}

				} else if (cell.wire && (!wire || cell.wire != wire) && (!cell.wire || cell.wire.flag != flag)) {

					// TODO
					const w = cell.wire = wire || mg.getMap(flag)

					// TODO
					w.cell[cell.string] = cell

					// TODO
					for (const i in mg.states) {
						if (cell[i]) {
							w[i][cell.string] = cell
						}
					}

					// TODO
					cell.wire.open = true

					for (const i in w.pad) {
						if (!w.pad[i].key && !w.pad[i].player) {
							w.open = false
						}
					}

					// TODO
					for (const i in mg.directions) {
						mg.cell.wire(cell[i], flag, cell.wire)
					}
				}
			},

			update: (cell, layer) => {
				cell.clear = true
				for (const i in mg.states) {
					if (cell[i]) {
						cell.clear = false
						break
					}
				}

				if (cell.clear) {
					delete mg.map.cell[cell.string]
				}

				for (const i in mg.states) {
					if (cell[i]) {
						mg.map[i][cell.string] = cell
					} else {
						delete mg.map[i][cell.string]
					}
				}

				for (const i in mg.directions) {
					const d = mg.directions[i]

					const c = cell[i] = mg.cell.get.point(pt.sum(cell, d))
					if (c) {
						c[d.op] = cell.clear ? null : cell
					}
				}
			}
		},

		setState: (c, m, s) => {
			mg.states[m][s ? 'add' : 'remove'](c)
			const map = {}
			const flag = {}
			map[c.string] = c
			mg.tf.updateBrushMap(map)
			mg.tf.spread(map, flag)

			const status = {}
			status[c.string] = mg.cell.get.status(c)
			idx.set.status(status)
		},

		move: (prev, dest) => {

			if (prev && dest && prev.player && prev.level == dest.level) {
				if (dest.player) {
					mg.sel.player = dest
					mg.sel.portal = dest.portal
					mg.sel.level = dest.level
				} else if ((prev.space || prev.door) && (dest.space || dest.door) && (!prev.door || prev.wire.open) && (!dest.door || dest.wire.open)) {
					if (prev.pad && dest.door) {
						if (prev.key) {
							mg.setState(prev, 'player', false)
							mg.setState(dest, 'player', true)
							mg.sel.player = dest
							mg.sel.portal = dest.portal
							mg.sel.player = dest.level
						}
					} else {

						const locked = mg.sel.locked
						const destKey = dest.key
						const prevKey = prev.key

						if (prev.key && !dest.key && mg.sel.locked) {
							if (dest.pad) {
								if (prev.square == dest.square) {
									mg.setState(prev, 'key', false)
									mg.setState(dest, 'key', true)
								}
							} else {
								const square = prev.square && !dest.square
								mg.setState(prev, 'key', false)
								mg.setState(dest, 'key', true)
								if (square) {
									mg.setState(dest, 'square', true)
								}
							}
						}

						if (destKey) {
							mg.sel.locked = true
						} else if (prevKey && dest.pad) {
							mg.sel.locked = false
						}

						mg.setState(prev, 'player', false)
						mg.setState(dest, 'player', true)
						mg.sel.player = dest
						mg.sel.portal = dest.portal
						mg.sel.level = dest.level
					}
				}
			}
		},

		// Directions ----------------------------------------------------------------
		directions: {
			'up': { key: 'ArrowUp', x: 0, y: -1, z: 0, op: 'dn' },
			'dn': { key: 'ArrowDown', x: 0, y: 1, z: 0, op: 'up' },
			'rt': { key: 'ArrowRight', x: 1, y: 0, z: 0, op: 'lf' },
			'lf': { key: 'ArrowLeft', x: -1, y: 0, z: 0, op: 'rt' },
		},

		// State Order ---------------------------------------------------------------
		stateOrder: ['space', 'wall', 'door', 'wire',
			'pad', 'portal', 'player', 'key'
		],

		// Modes ---------------------------------------------------------------------
		modes: {
			// modifier modes
			'game': { key: 'g', str: 'gam', },
			'pan': { key: 'm', str: 'pan' },
			'level': { key: 'l', str: 'lvl' },

			// state modes
			'space': { key: 'x', str: 'spc' },
			'wall': { key: 'w', str: 'wal' },
			'wire': { key: 'v', str: 'wir' },
			'door': { key: 'd', str: 'dor' },
			'pad': { key: 'a', str: 'pad' },
			'portal': { key: 'p', str: 'ptl' },
			'player': { key: 'j', str: 'plr' },
			'key': { key: 'k', str: 'key' },
			'square': { key: 's', str: 'sqr' }
		},

		// States --------------------------------------------------------------------
		states: {
			space: {
				color: '#404040',
				style: 'strokeStyle',
				radius: () => mg.cellSize / 2,
				draw: (g, c, r) => pt.drawRect(g, c.mouse, r),
				get: c => !(c && c.space),
				add: c => {
					c.space = true
					c.wall = c.door = false
				},
				remove: c => c.space = c.pad = c.portal =
					c.player = c.key = c.square = false
			},
			wall: {
				color: '#808080',
				style: 'strokeStyle',
				radius: () => mg.cellSize / 6,
				draw: (g, c, r) => pt.drawRect(g, c.mouse, r),
				net: true,
				get: c => !(c && c.wall),
				add: c => {
					c.wall = true
					c.space = c.pad = c.portal = c.player = c.key = c.square = false
				},
				remove: c => c.wall = false
			},
			wire: {
				color: {
					true: '#408000',
					false: '#804000',
				},
				style: 'strokeStyle',
				radius: () => mg.cellSize / 6,
				draw: (g, c, r) => pt.drawRect(g, c.mouse, r),
				net: true,
				get: c => !(c && c.wire),
				add: c => c.wire = true,
				remove: c => c.wire = c.door = c.pad = c.portal = false
			},
			door: {
				color: {
					true: '#208000',
					false: '#802000'
				},
				style: 'fillStyle',
				radius: () => mg.gridSize / 2,
				draw: (g, c, r) => pt.fillRect(g, c.mouse, r),
				get: c => !(c && c.door),
				add: c => {
					c.wire = c.door = true
					c.space = c.wall = c.pad = c.portal = false
				},
				remove: c => c.door = false
			},
			pad: {
				color: {
					true: '#208000',
					false: '#802000'
				},
				style: 'fillStyle',
				radius: () => mg.cellSize / 3,
				draw: (g, c, r) => pt[c.square ? 'fillRect' : 'fillCircle']
					(g, c.mouse, r),
				get: c => !(c && c.pad),
				add: c => {
					c.space = c.pad = c.wire = true
					c.wall = c.door = c.portal = false
				},
				remove: c => {
					c.pad = false
					c.square = c.square && c.key
				}
			},
			portal: {
				color: {
					true: '#800080',
					false: '#800040',
				},
				style: 'strokeStyle',
				radius: () => mg.gridSize / 2,
				draw: (g, c, r) => pt.drawRect(g, c.mouse, r),
				get: c => !(c && c.portal),
				add: c => {
					c.space = c.portal = c.wire = true
					c.wall = c.door = c.pad = false
				},
				remove: c => c.portal = false
			},
			key: {
				color: '#FFFFFF',
				style: 'strokeStyle',
				radius: () => mg.cellSize / 2,
				draw: (g, c, r) => pt[c.square ? 'drawRect' : 'drawCircle']
					(g, c.mouse, r),
				get: c => !(c && c.key),
				add: c => {
					c.key = true
					c.space = !c.door
					c.wall = false
				},
				remove: c => {
					c.key = false
					c.square = c.square && c.pad
				}
			},
			player: {
				color: '#FFFFFF',
				style: 'strokeStyle',
				radius: () => {
					const r = {
						x: pt.zero(),
						y: pt.zero(),
						r: mg.gridSize / 2
					}
					r.x.x = r.y.y = r.r
					return r
				},
				draw: (g, c, r) => {
					pt.drawLine(g, pt.sum(c.mouse, r.x), pt.sub(c.mouse, r.x))
					pt.drawLine(g, pt.sum(c.mouse, r.y), pt.sub(c.mouse, r.y))
					if (c == mg.sel.player) {
						pt.drawRect(g, c.mouse, r.r)
					}
				},
				get: c => !(c && c.player),
				add: c => {
					c.player = true
					c.space = !c.door
					c.wall = false
				},
				remove: c => c.player = false
			},
			square: {
				get: c => !(c && c.square),
				add: c => {
					c.square = c.pad || c.key
					console.log(`set square: ${c.square}`)
				},
				remove: c => c.square = false
			}
		}
	}

	return mg
}
