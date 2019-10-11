function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const start_time = (new Date()).getTime() * 1e-3
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error
	const pi2 = Math.PI * 2
	const MazeGame = module.exports(project_name, Lib)
	const key_bindings = {}

	for (const class_name in MazeGame) {
		const Class = MazeGame[class_name]
		key_bindings[Class.key_bind] = Class
	}

	const game_queue = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		scale: 1,
		x: 0, y: 0,

		editor: null,

	}
	function copy_game() {
		if (!client.editor) {
			return
		}

		try {
			client.editor = client.editor.level.game.copy().editors[client.socket.id]
		}
		catch (e) {
			err(e)
		}
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

		// const editor = MazeGame.get_editor(client.game, client)
		//
		// if (
		// 	mouse.right_down &&
		// 	(editor.state != 'game' || !editor.jack) &&
		// 	!client.game.path
		// ) {
		// 	client.x += mouse.prev_x - mouse.x
		// 	client.y += mouse.prev_y - mouse.y
		// }

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

			log('left_down')
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

		if (client.editor) {
			const Class = key_bindings[c]
			if (Class) {
				client.editor.state = Class
				copy_game()
			}
			else if (c == ' ') {
				log(client.editor)
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

		const new_game = new MazeGame.Game()
		const new_level = new MazeGame.Level(new_game, 0, 0, true)
		client.editor = new MazeGame.Editor(
			new_level, client.socket.id, client.name,
			MazeGame.Wall, 0,0,0,0,
		)

		log(client.editor)

	  tick()
	})

	function tick() {

		// draw_game(client.game)
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

	}

	log('index.js')
}
