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
	for (const type_name in MazeGame) {
		const Type = MazeGame[type_name]
		// TODO remove this
		eval(`window.${Type.name} = MazeGame.${Type.name}`)
		key_bindings[Type.key_bind] = Type
	}

	const time = Lib.time
	const game = new Game()
	const level = new Level
	game.set(time,level,Level)

	log(game.get(time))
	log(level.get(time))

	const game_queue = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		editor: null,
		scale: 90,
	}
	const mouse = {} // new MazeGame.Mouse()

	$(document).mousemove(e => {

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale

		if ( mouse.right_down && client.editor ) {
			// client.editor._root._x += mouse.prev_x - mouse.x
			// client.editor._root._y += mouse.prev_y - mouse.y
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mousedown(e => {

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale

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

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale

		if (mouse.left_down) {
			// TODO
			log(Lib.time)
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

		// delete: e.which = 127
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

	  tick()
	})

	function tick() {

		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d')
		mouse.width = canvas.width = window.innerWidth - 20
		mouse.height = canvas.height = window.innerHeight - 22
		window.requestAnimationFrame(tick)

		const now = Lib.now()
		const prev_now = client.prev_now
		const deltaT = now - prev_now > max_deltaT ? max_deltaT : now - prev_now

		client.prev_now = now
		mouse.scale = (
			mouse.width > mouse.height ? mouse.height : mouse.width
		) / client.scale
	}

	log('index.js')
}
