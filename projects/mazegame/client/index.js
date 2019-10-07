function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const start_time = (new Date()).getTime() * 1e-3
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error
	const pi2 = Math.PI * 2
	const MazeGame = module.exports(project_name, Lib)

	const game_queue = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,

		game: MazeGame.get_game(),

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

		const editor = MazeGame.get_editor(client.game, client)

		if (
			mouse.right_down &&
			(editor.state != 'game' || !editor.jack) &&
			!client.game.path
		) {
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

			client.socket.emit(
				'update center mouse',
				{ x: client.x, y: client.y, },
				{ x: mouse.x, y: mouse.y, },
			)
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

		let game = client.game
		const editor = MazeGame.get_editor(game, client)
		if (editor) {
			const state = MazeGame.state_keys[c]
			if (state) {
				client.socket.emit('update state', state.name)
			}
			// Enter
			else if (e.which == 13) {

			}
			// Delete
			else if (e.which == 127) {
				client.socket.emit('update delete')
			}
			else if (c == ' ') {
				const game = MazeGame.do_action(
					MazeGame.copy_game(client.game),
					client, client, mouse, log
				)
				MazeGame.solve_game(game, game.center || client, mouse, log)

				log('SPACEBAR', game,
					MazeGame.export_game(MazeGame.copy_game(client.game))
				)
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

		MazeGame.get_editor(client.game, client)

	  tick()
	})

	function do_queue() {
		while (!client.game.path && game_queue.length) {
			const msg = game_queue.pop()
			client.game = game_queue.pop()

			log('update', msg, client.game.action, client.game)

			if (client.game.path) {
				client.game.path.start_time = Lib.now()

				setTimeout(
					() => {
						MazeGame.measure_game(client.game)
						MazeGame.do_path(client.game)
						do_queue()
					},
					client.game.path.total_dist * MazeGame.jack_speed * 1e3
				)
			}
		}
	}

	client.socket.on('update', (game_export, msg) => {
		game_queue.push(MazeGame.import_game(game_export), msg)
		do_queue()
	})

	function tick() {

		let game_copy = MazeGame.copy_game(client.game)
		const editor = MazeGame.get_editor(game_copy, client)

		if (editor.state == 'game' && editor.jack) {
			client.x = editor.jack.x
			client.y = editor.jack.y
		}

		game_copy = MazeGame.do_action(game_copy, client, client, mouse,)

		if (!client.game.path && game_copy.path) {
			MazeGame.measure_game(game_copy)
			MazeGame.do_path(game_copy)
		}
		else if (game_copy.path) {
			MazeGame.proj_path(game_copy.path)
			if (client.game.path) {
				client.x = editor.jack.x
				client.y = editor.jack.y
			}
		}

		MazeGame.solve_game(game_copy, client, mouse)
		draw_game(game_copy)
	}

	function draw_game(game)  {
		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d')
		mouse.width = canvas.width = window.innerWidth - 20
		mouse.height = canvas.height = window.innerHeight - 22
		window.requestAnimationFrame(tick)

		const now = Lib.now()
		const prev_now = client.prev_now
		const deltaT = now - prev_now > max_deltaT ? max_deltaT : now - prev_now

		client.prev_now = now
		mouse.scale = mouse.width > mouse.height ? mouse.height : mouse.width

		const scale = mouse.scale
		const half_scale = scale / 2

		const shift_x = 1/2 - client.x, shift_y = 1/2 - client.y
		const node_radius = MazeGame.node_radius * mouse.scale
		const node_diameter = MazeGame.node_diameter * mouse.scale
		const portal_radius = MazeGame.portal_radius * mouse.scale
		const handle_radius = MazeGame.handle_radius * mouse.scale
		const key_radius = MazeGame.key_radius * mouse.scale
		const jack_radius = MazeGame.jack_radius * mouse.scale

		const cell_radius = node_radius / 4

		const line_width = MazeGame.line_width * mouse.scale
		const half_line_width = line_width / 2

		ctx.lineWidth = line_width

		// draw rooms
		for (const room_idx in game.rooms) {
			const room = game.rooms[room_idx]

			for (const cell_idx in room.cells) {
				const cell = room.cells[cell_idx]

				ctx.fillStyle = cell.fill_color
				ctx.beginPath()

				const node = cell.cords[0].root_node
				ctx.moveTo(node.bot_x, node.bot_y)

				for (let node_idx = 1; node_idx < cell.cords.length; ++node_idx) {
					const node = cell.cords[node_idx].root_node
					ctx.lineTo(node.bot_x, node.bot_y)
				}
				ctx.fill()

				ctx.beginPath()
				ctx.arc(cell.bot_x, cell.bot_y, cell_radius, 0, pi2)
				ctx.fill()
			}

			// draw cords
			ctx.strokeStyle = '#80808020'
			for (const cord_idx in room.cords) {
				const cord = room.cords[cord_idx]

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

		// draw far portals
		for (const portal_idx in game.portals) {
			const portal = game.portals[portal_idx]

			if (portal.side > 0 != portal.line.side > 0) {
				ctx.fillStyle = portal.fill_color
				ctx.beginPath()
				ctx.arc(portal.mid_wx, portal.mid_wy, portal_radius, 0, pi2)
				ctx.fill()
			}
		}

		// draw far handles
		for (const handle_idx in game.handles) {
			const handle = game.handles[handle_idx]

			if (handle.side > 0 != handle.line.side > 0) {
				ctx.strokeStyle = handle.stroke_color
				ctx.beginPath()
				ctx.moveTo(handle.mid_x, handle.mid_y)
				let node = null
				if (handle.portal) {
					node = handle.portal
				}
				else if (handle.handle) {
					node = handle.handle
				}
				else if (handle.rel_dot) {
					node = handle.line.spot_node
				}
				else {
					node = handle.line.root_node
				}
				ctx.lineTo(node.mid_x, node.mid_y)
				ctx.stroke()

				ctx.fillStyle = handle.fill_color
				ctx.beginPath()
				if (handle.is_square) {
					ctx.rect(
						handle.mid_wx - handle_radius,
						handle.mid_wy - handle_radius,
						handle_radius*2,
						handle_radius*2,
					)
				}
				else {
					ctx.arc(handle.mid_wx, handle.mid_wy, handle_radius, 0, pi2)
				}
				ctx.fill()
			}
		}

		// draw polys
		for (const line_idx in game.lines) {
			const line = game.lines[line_idx]

			if (line.state != 'laser') {
				ctx.fillStyle = line.fill_color
				ctx.beginPath()
				ctx.moveTo(line.root_node.bot_x, line.root_node.bot_y)
				ctx.lineTo(line.spot_node.bot_x, line.spot_node.bot_y)
				ctx.lineTo(line.spot_node.top_x, line.spot_node.top_y)
				ctx.lineTo(line.root_node.top_x, line.root_node.top_y)
				ctx.fill()
			}
		}

		// draw close handles
		for (const handle_idx in game.handles) {
			const handle = game.handles[handle_idx]

			if (handle.side > 0 == handle.line.side > 0) {
				ctx.strokeStyle = handle.stroke_color
				ctx.beginPath()
				ctx.moveTo(handle.mid_x, handle.mid_y)
				let node = null
				if (handle.portal) {
					node = handle.portal
				}
				else if (handle.handle) {
					node = handle.handle
				}
				else if (handle.rel_dot) {
					node = handle.line.spot_node
				}
				else {
					node = handle.line.root_node
				}
				ctx.lineTo(node.mid_x, node.mid_y)
				ctx.stroke()

				ctx.beginPath()
				ctx.fillStyle = handle.fill_color
				if (handle.is_square) {
					ctx.rect(
						handle.mid_wx - handle_radius,
						handle.mid_wy - handle_radius,
						handle_radius*2,
						handle_radius*2,
					)
				}
				else {
					ctx.arc(handle.mid_wx, handle.mid_wy, handle_radius, 0, pi2)
				}
				ctx.fill()
			}
		}
		// draw close portals
		for (const portal_idx in game.portals) {
			const portal = game.portals[portal_idx]

			if (portal.side > 0 == portal.line.side > 0) {
				ctx.fillStyle = portal.fill_color
				ctx.beginPath()
				ctx.arc(portal.mid_wx, portal.mid_wy, portal_radius, 0, pi2)
				ctx.fill()
			}
		}

		// draw top lines
		for (const line_idx in game.lines) {
			const line = game.lines[line_idx]

			if (line.state != 'laser') {
				ctx.strokeStyle = line.stroke_color
				ctx.beginPath()
				ctx.moveTo(line.root_node.top_x, line.root_node.top_y)
				ctx.lineTo(line.spot_node.top_x, line.spot_node.top_y)
				ctx.stroke()
			}
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

		// draw jacks
		for (const jack_idx in game.jacks) {
			const jack = game.jacks[jack_idx]

			ctx.fillStyle = jack.fill_color
			ctx.beginPath()
			ctx.arc(jack.mid_x, jack.mid_y, jack_radius, 0, pi2)
			ctx.fill()
		}

		// draw keys
		for (const key_idx in game.keys) {
			const key = game.keys[key_idx]

			ctx.fillStyle = key.fill_color
			ctx.beginPath()
			if (key.is_square) {
				ctx.rect(
					key.mid_x - key_radius,
					key.mid_y - key_radius,
					key_radius*2,
					key_radius*2,
				)
			}
			else {
				ctx.arc(key.mid_x, key.mid_y, key_radius, 0, pi2)
			}
			ctx.fill()
		}

		// if (game.path) {
		//
		// 	let f = 'moveTo'
		// 	ctx.strokeStyle = 'white'
		// 	ctx.beginPath()
		// 	for (const trail_idx in game.path.trails) {
		// 		const trail = game.path.trails[trail_idx]
		// 		ctx[f](trail.mid_x, trail.mid_y)
		// 		f = 'lineTo'
		// 	}
		// 	ctx.stroke()
		// }

	}

	log('index.js')
}
