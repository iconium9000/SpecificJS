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
		key_bindings[Type.key_bind] = Type
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

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale

		if ( mouse.right_down && client.editor ) {
			client.editor._root._x += mouse.prev_x - mouse.x
			client.editor._root._y += mouse.prev_y - mouse.y
		}

		mouse.prev_x = mouse.x
		mouse.prev_y = mouse.y
	})

	$(document).mousedown(e => {
		if (!client.editor) {
			return
		}

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
		if (!client.editor) {
			return
		}

		mouse.x = (e.clientX-7 - mouse.width/2)/mouse.scale
		mouse.y = (e.clientY-7 - mouse.height/2)/mouse.scale

		if (mouse.left_down) {

			try {
				const now = Lib.now()
				let editor_copy = client.editor.deep_copy(now)

				editor_copy._spot = mouse.sum(editor_copy._root, 1)

				editor_copy.type.act(editor_copy)
				editor_copy = editor_copy.deep_copy(now)
				log(editor_copy.action, editor_copy.level.game)
				client.editor = editor_copy
			}
			catch (e) {
				log(`error 'mouseup'`, e)
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

		if (client.editor) {
			const type = key_bindings[c]
			if (type) {
				MazeGame.Type.act(client.editor, type)
				log(client.editor.action)
				try {
					client.editor = client.editor.deep_copy(Lib.now())
				}
				catch (e) {
					log(`error '${c}'`, e)
				}
			}
			else if (c == ' ') {
				log(client.editor)
			}
			// delete
			else if (e.which == 127) {

				try {
					const editor_copy = client.editor.deep_copy(Lib.now())
					if (editor_copy.spot.remove()) {
						client.editor = editor_copy
					}
				}
				catch (e) {
					log(`error ' '`, e)
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

		const now = Lib.now()
		const new_game = new MazeGame.Game(now)
		const new_level = new MazeGame.Level(new_game, true)
		client.editor = new MazeGame.Editor(
			new_level,
			client.socket.id,
			client.name, `new editor`,
			MazeGame.Wall,
			new_level,
			MazeGame.Editor.scale,
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
		try {
			// throw `e`
			editor_copy = editor_copy.deep_copy(now)
			editor_copy._spot = mouse.sum(editor_copy._root, 1)
			editor_copy.type.act(editor_copy)
			editor_copy = editor_copy.deep_copy(now)
		}
		catch (e) {
			editor_copy = client.editor
		}
		mouse.now_time = now
		editor_copy.draw( ctx, mouse, )

		ctx.strokeStyle = `#000000`
		ctx.lineWidth = editor_copy.Type.line_width * mouse.scale * 0.2

		const lines = editor_copy.level.lines
		for (let i = 0; i < lines.length; i += 2) {
			const p0 = lines[i], p1 = lines[i+1]

			ctx.beginPath()
			ctx.lineTo(
				mouse.width/2 + (p0.x - editor_copy._root._x) * mouse.scale,
				mouse.height/2+ (p0.y - editor_copy._root._y) * mouse.scale,
			)
			ctx.lineTo(
				mouse.width/2 + (p1.x - editor_copy._root._x) * mouse.scale,
				mouse.height/2+ (p1.y - editor_copy._root._y) * mouse.scale,
			)
			ctx.closePath()
			ctx.stroke()

		}
	}

	log('index.js')
}
