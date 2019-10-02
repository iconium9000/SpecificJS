function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const start_time = (new Date()).getTime() * 1e-3
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error
	const pi2 = Math.PI * 2
	const MazeGame = module.exports(project_name)
	const mg = MazeGame

	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,

		scale: 1,
		x: 0, y: 0,
	}

	const mouse = {
		x: -1,
		y: -1,

		right_down: false,
		left_down: false,

		prev_x: -1,
		prev_y: -1,
	}

	$(document).mousemove(e => {
		mouse.x = (e.clientX - 7 - mouse.width / 2) / mouse.scale
    mouse.y = (e.clientY - 7 - mouse.height / 2) / mouse.scale

		if (mouse.right_down) {
			client.x += mouse.prev_x - mouse.x
			client.y += mouse.prev_y - mouse.y
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mousedown(e => {
		mouse.x = (e.clientX - 7 - mouse.width / 2) / mouse.scale
    mouse.y = (e.clientY - 7 - mouse.height / 2) / mouse.scale
		if (e.button == 2) {
			mouse.right_down = true
		}
		else {
			mouse.left_down = true
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mouseup(e => {
		mouse.x = (e.clientX - 7 - mouse.width / 2) / mouse.scale
    mouse.y = (e.clientY - 7 - mouse.height / 2) / mouse.scale

		if (mouse.left_down) {

			client.game = mg.act_at(
				mg.copy_game(client.game),
				client.socket.id,
				mouse.x+client.x, mouse.y+client.y, log)

			log('action', client.game.action)
		}

		if (e.button == 2) {
			mouse.right_down = false
		}
		else {
			mouse.left_down = false
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).keypress(e => {
    var c = String.fromCharCode(e.which | 0x20)

		const game = client.game
		const editor = game && game.editors[ client.socket.id ]
		if (editor) {
			const state = mg.state_keys[c]
			if (state) {
				editor.state = state.name
				editor.node = null
				editor.portal = null
				editor.handle = null
				log('changed state to', state.name)
			}
			// delete
			else if (e.which == 127) {
				if (editor.node) {
					const node_idx = game.nodes.indexOf(editor.node)
					editor.node.idx = -1
					game.nodes.splice(node_idx, 1)
					client.game = mg.copy_game(game)
				}
			}
			else if (c == ' ') {

				const game = mg.copy_game(client.game)

				mg.measure_lines(game)
				mg.solve_rooms(game)
				mg.solve_cells(game)

				log('SPACEBAR', game)

			}
		}

  })

  $(document).keyup(e => {
    var c = String.fromCharCode(e.which | 0x20)

	})

	client.socket.on('connect', () => {
		client.name = null
	  if (typeof document.cookie == 'string') {
	    client.name = get_cookie('name')
	  }

	  // if no name is found in cookies, get one from the user
	  while (!client.name || client.name == 'null') {
	    client.name = prompt('Choose a name:', client.name)
	    document.cookie = `name=${client.name}`
	  }

		client.full_name = `'${client.name}' (${client.socket.id})`

	  // reply to server with name
	  client.socket.emit('client name', {name: client.name})

	  log(client.full_name, 'connected to server')

		client.game = mg.get_game(client)

	  tick()
	})

	function tick() {

		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d')
		mouse.width = canvas.width = window.innerWidth - 20
		mouse.height = canvas.height = window.innerHeight - 22
		window.requestAnimationFrame(tick)

		const now = (new Date()).getTime() * 1e-3
		const prev_now = client.prev_now
		const deltaT = now - prev_now > max_deltaT ? max_deltaT : now - prev_now

		client.prev_now = now
		mouse.scale = mouse.width > mouse.height ? mouse.height : mouse.width

		const scale = mouse.scale
		const half_scale = scale / 2

		const shift_x = 1/2 - client.x, shift_y = 1/2 - client.y
		const node_radius = mg.node_radius * mouse.scale
		const node_diameter = mg.node_diameter * mouse.scale
		const portal_radius = mg.portal_radius * mouse.scale
		const handle_radius = mg.handle_radius * mouse.scale
		const line_width = mg.line_width * mouse.scale
		const half_line_width = line_width / 2

		let game = mg.copy_game(client.game)
		if (!is_mobile) {
			game = mg.act_at(game, client.socket.id,
				mouse.x+client.x,
				mouse.y+client.y, ()=>{})
		}

		const px = client.x
		const py = client.y

		mg.measure_lines(game)
		mg.solve_rooms(game)
		mg.solve_cells(game)
		mg.set_game_focus(game, mouse.x+client.x, mouse.y+client.y)
		const sel_room = mg.get_room(game)
		mg.set_colors(game, sel_room)

		const scale_bot = mouse.scale
		const shift_bot_x = mouse.width / 2 - px * scale_bot
		const shift_bot_y = mouse.height / 2 - py * scale_bot

		const scale_mid = mouse.scale * mg.mid_scale
		const shift_mid_x = mouse.width / 2 - px * scale_mid
		const shift_mid_y = mouse.height / 2 - py * scale_mid

		const scale_top = mouse.scale * mg.top_scale
		const shift_top_x = mouse.width / 2 - px * scale_top
		const shift_top_y = mouse.height / 2 - py * scale_top


		{
			// set a, b, and p transforms for all nodes
			for (const node_idx in game.nodes) {
			const node = game.nodes[node_idx]
			node.bot_x = node.x*scale_bot + shift_bot_x
			node.bot_y = node.y*scale_bot + shift_bot_y
			node.top_x = node.x*scale_top + shift_top_x
			node.top_y = node.y*scale_top + shift_top_y
		}

			for (const portal_idx in game.portals) {
				const portal = game.portals[portal_idx]

				portal.mid_x = portal.x*scale_mid + shift_mid_x
				portal.mid_y = portal.y*scale_mid + shift_mid_y
			}
		}

		// draw level
		{
			ctx.lineWidth = line_width

			// draw rooms
			for (const room_idx in game.rooms) {
				const room = game.rooms[room_idx]

				ctx.fillStyle = sel_room == room ? `#80ff8020` : `#ffffff20`
				for (const cell_idx in room.cells) {
					const cell = room.cells[cell_idx]

					ctx.beginPath()

					const node = cell.cords[0].root_node
					ctx.moveTo(node.x*scale_bot + shift_bot_x, node.y*scale_bot + shift_bot_y)

					for (let node_idx = 1; node_idx < cell.cords.length; ++node_idx) {
						const node = cell.cords[node_idx].root_node
						ctx.lineTo(node.x*scale_bot + shift_bot_x, node.y*scale_bot + shift_bot_y)
					}
					ctx.fill()
				}

				// draw cords
				for (const cord_idx in room.cords) {
					const cord = room.cords[cord_idx]

					ctx.strokeStyle = '#80808020'
					ctx.beginPath()
					ctx.moveTo(cord.root_node.bot_x, cord.root_node.bot_y)
					ctx.lineTo(cord.spot_node.bot_x, cord.spot_node.bot_y)
					ctx.stroke()
				}
			}

			// draw bottom nodes
			for (const node_idx in game.nodes) {
				const node = game.nodes[ node_idx ]

				ctx.fillStyle = node.fill_color
				ctx.beginPath()
				ctx.arc(node.bot_x, node.bot_y, node_radius, 0, pi2)
				ctx.fill()
			}

			// draw bottom lines
			for (const line_idx in game.lines) {
				const line = game.lines[line_idx]

				ctx.strokeStyle = line.stroke_color
				ctx.beginPath()
				ctx.moveTo(line.root_node.bot_x, line.root_node.bot_y)
				ctx.lineTo(line.spot_node.bot_x, line.spot_node.bot_y)
				ctx.stroke()

			}


			for (const portal_idx in game.portals) {
				const portal = game.portals[portal_idx]

				if (portal.side > 0 != portal.line.side) {
					ctx.fillStyle = portal.fill_color
					ctx.beginPath()
					ctx.arc(portal.mid_x, portal.mid_y, portal_radius, 0, pi2)
					ctx.fill()
				}
			}

			// draw polys
			for (const line_idx in game.lines) {
				const line = game.lines[line_idx]

				ctx.fillStyle = line.fill_color
				ctx.beginPath()
				ctx.moveTo(line.root_node.bot_x, line.root_node.bot_y)
				ctx.lineTo(line.spot_node.bot_x, line.spot_node.bot_y)
				ctx.lineTo(line.spot_node.top_x, line.spot_node.top_y)
				ctx.lineTo(line.root_node.top_x, line.root_node.top_y)
				ctx.fill()
			}

			for (const portal_idx in game.portals) {
				const portal = game.portals[portal_idx]

				if (portal.side > 0 == portal.line.side) {
					ctx.fillStyle = portal.fill_color
					ctx.beginPath()
					ctx.arc(portal.mid_x, portal.mid_y, portal_radius, 0, pi2)
					ctx.fill()
				}
			}

			// draw top lines
			for (const line_idx in game.lines) {
				const line = game.lines[line_idx]

				ctx.strokeStyle = line.stroke_color
				ctx.beginPath()
				ctx.moveTo(line.root_node.top_x, line.root_node.top_y)
				ctx.lineTo(line.spot_node.top_x, line.spot_node.top_y)
				ctx.stroke()
			}

			// draw top nodes
			for (const node_idx in game.nodes) {
				const node = game.nodes[ node_idx ]

				const vx = node.bot_x - node.top_x, vy = node.bot_y - node.top_y
				const v = node_radius / Math.sqrt(vx*vx + vy*vy)

				const ax = node.bot_x + vx * v
				const ay = node.bot_y + vy * v

				ctx.strokeStyle = node.stroke_color
				ctx.beginPath()
				ctx.moveTo(ax, ay)
				ctx.lineTo(node.top_x, node.top_y)
				ctx.stroke()

				ctx.fillStyle = node.fill_color
				ctx.beginPath()
				ctx.arc(node.top_x, node.top_y, node_radius, 0, pi2)
				ctx.fill()
			}

			ctx.fillStyle = 'white'
			ctx.beginPath()
			ctx.arc(
				client.x*scale_bot + shift_bot_x,
				client.y*scale_bot + shift_bot_y, node_radius, 0, pi2)
			ctx.fill()
		}

	}

	log('index.js')
}
