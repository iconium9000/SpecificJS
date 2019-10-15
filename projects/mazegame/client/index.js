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

	for (const state_name in MazeGame) {
		const State = MazeGame[state_name]
		key_bindings[State.key_bind] = State
	}

	const game_queue = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		editor: null,
	}
	const mouse = new MazeGame.Mouse()

	$(document).mousemove(e => {
		if (!client.editor) {
			return
		}

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale - client.editor.root_x
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale - client.editor.root_y

		if ( mouse.right_down && client.editor ) {
			client.editor.root_x += mouse.prev_x - mouse.x
			client.editor.root_y += mouse.prev_y - mouse.y
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mousedown(e => {
		if (!client.editor) {
			return
		}

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale - client.editor.root_x
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale - client.editor.root_y

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
		if (!client.editor) {
			return
		}

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale - client.editor.root_x
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale - client.editor.root_y

		if (mouse.left_down) {

			let editor_copy = client.editor.deep_copy()

			editor_copy.spot_x = mouse.x + editor_copy.root_x
			editor_copy.spot_y = mouse.y + editor_copy.root_y

			const now_time = Lib.now()
			editor_copy = editor_copy.state.act(editor_copy, now_time)
			client.editor = editor_copy
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
			const state = key_bindings[c]
			if (state) {
				client.editor = MazeGame.State.act(client.editor, state)
				log(client.editor.action)
			}
			else if (c == ' ') {
				log(client.editor)
			}
			// delete
			else if (e.which == 127) {
				const editor_copy = client.editor.deep_copy()
				if (editor_copy.spot.remove()) {
					client.editor = editor_copy
				}
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
		const now = Lib.now()
		client.editor = new MazeGame.Editor(
			new_level,
			client.socket.id,
			client.name, `new editor`,
			MazeGame.Wall,
			new_level,
			0,0,0,0,
			MazeGame.Editor.scale,
			now,now,
			false,
		)

		log(client.editor)

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
		) / client.editor.scale


		let editor_copy = client.editor
		editor_copy = editor_copy.deep_copy()
		editor_copy.now_time = now
		editor_copy.spot_x = mouse.x + editor_copy.root_x
		editor_copy.spot_y = mouse.y + editor_copy.root_y
		editor_copy = editor_copy.state.act(editor_copy,)
		editor_copy.draw( ctx, mouse, )
	}

	log('index.js')
}
