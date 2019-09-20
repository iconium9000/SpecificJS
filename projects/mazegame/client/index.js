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
		mouse.x = (e.clientX - 7) / mouse.scale - 1/2
    mouse.y = (e.clientY - 7) / mouse.scale - 1/2

		if (mouse.right_down) {
			client.x += mouse.prev_x - mouse.x
			client.y += mouse.prev_y - mouse.y
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mousedown(e => {
		mouse.x = (e.clientX - 7) / mouse.scale - 1/2
    mouse.y = (e.clientY - 7) / mouse.scale - 1/2
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
		mouse.x = (e.clientX - 7) / mouse.scale - 1/2
    mouse.y = (e.clientY - 7) / mouse.scale - 1/2

		if (mouse.left_down) {
			const action = mg.act_at(client.game, client.socket.id,
				mouse.x + client.x, mouse.y + client.y)
			if (action) {
				log('action', action)
			}
			else {
				log('no action')
			}

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
		const player = game && game.players[ client.socket.id ]
		if (player) {
			const state = mg.state_keys[c]
			if (state) {
				player.state = state.name
				player.node = null
				log('changed state to', state.name)
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
		const shift_x = 1/2 -client.x, shift_y = 1/2 - client.y
		const node_radius = mg.node_radius * mouse.scale
		const node_diameter = mg.node_diameter * mouse.scale
		const line_width = mg.line_width * mouse.scale
		const portal_radius = mg.portal_radius * mouse.scale

		const game = is_mobile ? client.game : mg.solve_game(client.game)
		if (!is_mobile) {
			mg.act_at(game, client.socket.id,
				mouse.x + client.x, mouse.y + client.y)
		}

		ctx.lineWidth = line_width

		// // draw layer 1
		// {
		// 	const scale = mouse.scale
		// 	const shift_x = half_scale - client.x * scale
		// 	const shift_y = half_scale - client.y * scale
		//
		// 	// draw lines
		// 	for (const line_idx in game.lines) {
		// 		const line = game.lines[line_idx]
		//
		// 		ctx.strokeStyle = mg.node_color
		// 		ctx.beginPath()
		// 		ctx.moveTo(line.node_a.x * scale + shift_x, line.node_a.y * scale + shift_y)
		// 		ctx.lineTo(line.node_b.x * scale + shift_x, line.node_b.y * scale + shift_y)
		// 		ctx.stroke()
		// 	}
		//
		// 	// draw nodes
		// 	for (const node_idx in game.nodes) {
		// 		const node = game.nodes[ node_idx ]
		//
		// 		const x = node.x * scale + shift_x
		// 		const y = node.y * scale + shift_y
		//
		// 		ctx.fillStyle = mg.node_color
		// 		ctx.beginPath()
		// 		ctx.arc(x, y, node_radius, 0, pi2)
		// 		ctx.fill()
		// 	}
		// }
		//
		// // draw layer 2
		// {
		// 	const scale = mouse.scale * mg.hight_scale
		// 	const shift_x = half_scale - client.x * scale
		// 	const shift_y = half_scale - client.y * scale
		//
		// 	// draw lines
		// 	for (const line_idx in game.lines) {
		// 		const line = game.lines[line_idx]
		//
		// 		ctx.strokeStyle = mg.node_color
		// 		ctx.beginPath()
		// 		ctx.moveTo(line.node_a.x * scale + shift_x, line.node_a.y * scale + shift_y)
		// 		ctx.lineTo(line.node_b.x * scale + shift_x, line.node_b.y * scale + shift_y)
		// 		ctx.stroke()
		// 	}
		//
		// 	// draw nodes
		// 	for (const node_idx in game.nodes) {
		// 		const node = game.nodes[ node_idx ]
		//
		// 		const x = node.x * scale + shift_x
		// 		const y = node.y * scale + shift_y
		//
		// 		ctx.fillStyle = mg.node_color
		// 		ctx.beginPath()
		// 		ctx.arc(x, y, node_radius, 0, pi2)
		// 		ctx.fill()
		// 	}
		// }


		{
			const scale_a = mouse.scale
			const shift_a_x = half_scale - client.x * scale_a
			const shift_a_y = half_scale - client.y * scale_a

			const scale_b = mouse.scale * mg.hight_scale
			const shift_b_x = half_scale - client.x * scale_b
			const shift_b_y = half_scale - client.y * scale_b

			// draw lines
			for (const line_idx in game.lines) {
				const line = game.lines[line_idx]

				ctx.fillStyle = mg.node_color
				ctx.beginPath()
				ctx.moveTo(line.node_a.x*scale_a + shift_a_x, line.node_a.y*scale_a + shift_a_y)
				ctx.lineTo(line.node_b.x*scale_a + shift_a_x, line.node_b.y*scale_a + shift_a_y)
				ctx.lineTo(line.node_b.x*scale_b + shift_b_x, line.node_b.y*scale_b + shift_b_y)
				ctx.lineTo(line.node_a.x*scale_b + shift_b_x, line.node_a.y*scale_b + shift_b_y)
				ctx.fill()
			}

			// draw nodes
			for (const node_idx in game.nodes) {
				const node = game.nodes[ node_idx ]

				const x = node.x * scale_a + shift_a_x
				const y = node.y * scale_a + shift_a_y

				ctx.fillStyle = mg.node_color
				ctx.beginPath()
				ctx.arc(x, y, node_radius, 0, pi2)
				ctx.fill()
			}
		}

	}

	log('index.js')
}

function get_cookie(cookie_name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${cookie_name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}
