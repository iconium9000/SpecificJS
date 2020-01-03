const {log} = console
const module = {
	set exports(
		get_constructor, // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(MazeGame)
		MazeGame[constructor.name] = constructor
		// console.log(constructor.name)
	}
}

function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const {Lib} = MazeGame, {pi,pi2} = Lib
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error

	const key_bindings = {}
	for (const type_name in MazeGame) {
		const type = MazeGame[type_name]
		if (type != null) key_bindings[type.key_bind] = type
	}

	const effect_stack = []
	const client = {
	  socket: io('/mazegame'),
		full_name: null,
		root: MazeGame.Point.zero, mouse: MazeGame.Point.zero,
		right_down: false, left_down: false,
		get id() { return client.socket.id }
	}
	// MazeGame.client = client
	client.name = client.id
	setup_game()

	function setup_game(game) {
		const {id,name} = client
		client.game = game || MazeGame.Game.init()
		client.editor = MazeGame.Editor.init(client.game, id, name)
	}

	function send_game() {
		const {editor,game} = client

		const serial = game.serialize()
		log('serial',serial)
		client.socket.emit('serial', serial)
	}

	function get_center_scale(canvas) {
		const _center = MazeGame.Point.init(canvas.width, canvas.height, 0.5)
		const {scale} = client.editor.level || MazeGame.Target
		return [_center, _center.short.scale / scale ]
	}

	document.onkeydown = e => {
		if (!client.enable_editor) return

		const code = e.which
		var c = e.key // String.fromCharCode(code | 0x20)
		const new_mode = key_bindings[c]
		const {editor,game} = client

		const {time} = MazeGame.Lib
		// log(e.which)

		if (new_mode) {
			editor.mode = new_mode
			// TODO UNDO
		}
		else if (c == 't') {
			if (editor.level) {
				editor.level.scale = parseInt(
					prompt('enter level scale', editor.level.scale)
				)
			}
		}
		else if (c == 'r') {
			client.socket.emit('serial')
		}
		else if (c == 'q') {
			send_game()
		}
		// name level
		else if (c == 'm') {
			if (!editor.level) {
				editor.level = game.root_level
			}

			let name = ''
			do {
				name = prompt('Level Name: ', editor.level.name)
			}
			while (!name)

			editor.level.name = name
			send_game()
		}
		else if (c == 'n') {
			editor.level = MazeGame.Level.init(game)
		}
		// left: 37
		// up: 38
		// right: 39
		// down: 40
		else if (37 <= code && code <= 40) {
			const {level} = editor
			if (!level) {
				editor.level = game.root_level
				return
			}

			const {prev_level,next_level} = level
			switch (code) {
				case 37: // left
					if (prev_level) {
						editor.level = game.root_level = prev_level
					}
					break
				case 38: // up
					if (next_level) {
						level.next_level = next_level.next_level
						next_level.prev_level = prev_level
						level.prev_level = next_level
					}
					break
				case 39: // right
					if (next_level) {
						editor.level = game.root_level = next_level
					}
					break
				case 40: // down
					if (prev_level) {
						level.prev_level = prev_level.prev_level
						prev_level.next_level = next_level
						level.next_level = prev_level
					}
					break
			}
		}
		// delete: code = 8,46
		else if (code == 8 || code == 46) {
			const {editor} = client.editor
			if (editor && editor.target) editor.target.remove()
		}
		else if (c == 'z') {
			// TODO UNDO
		}
		else if (c == ' ') {
			log(client.editor)
			window.editor = client.editor
			// client.game = MazeGame.Type.read(client.game.serialize())
			// client.editor = client.game[editor.id]
		}
	}

	client.socket.on('connect', () => {
		client.name = null
	  if (typeof document.cookie == 'string') {
	    client.name = Lib.get_cookie('name')
	  }

	  // if no name is found in cookies, get one from the user
	  while (!client.name || client.name == 'null') {
	    client.name = prompt('Choose a name:', client.name)
	    document.cookie = `name=${client.name}`
	  }
		const {name,id} = client

		client.full_name = `'${name}' (${id})`

	  // reply to server with name
	  client.socket.emit('client name', {name: name})
		client.socket.emit('serial')

	  log(client.full_name, 'connected to server')

	  tick()
	})
	client.socket.on(
		'enable_editor', enable_editor => client.enable_editor = enable_editor
	)
	client.socket.on('serial', serial => {
		const {id,name} = client
		try {
			setup_game(MazeGame.Game.read(serial))
		}
		catch (e) {
			log(e)
		}
	})

	$(document).mousemove(e => {
		const {right_down,mouse,editor} = client
		const _mouse = MazeGame.Point.init(e.offsetX,e.offsetY,1)
		const [_center,_scale] = get_center_scale(e.target)

		if (right_down) {
			editor.root = mouse.sub(_mouse).div(_scale).sum(editor.root)
		}

		client.mouse = _mouse
	})

	$(document).mousedown(e => {
		client.mouse = MazeGame.Point.init(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = true
	})

	$(document).mouseup(e => {
		const {time} = Lib, {target} = e
		target.width = window.innerWidth - 20
		target.height = window.innerHeight - 20
		const [_center, _scale] = get_center_scale(target)
		const _mouse = MazeGame.Point.init(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = false

		const {editor} = client
		const {_editor,root} = editor, {_mode} = _editor
		editor.log = log
    _mode.act_at(_editor, _mouse.sub(_center).div(_scale).sum(root))

		client.mouse = _mouse
	})

	function tick() {

		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d') // CanvasRenderingContext2D
		canvas.width = window.innerWidth - 20
		canvas.height = window.innerHeight - 20
		window.requestAnimationFrame(tick)

		const [_center, _scale] = get_center_scale(canvas)

		const {time,pi2} = Lib, {editor,mouse} = client
		const root = editor.root.mul(_scale)
		try {

			{
				ctx.strokeStyle = 'white'
				const {scale} = _center.short, {x,y} = _center

				ctx.beginPath()
				ctx.rect(x - scale, y - scale, 2*scale, 2*scale)
				ctx.closePath()
				ctx.stroke()
			}

			ctx.fillStyle = 'white'
			ctx.beginPath()
			ctx.arc(_center.x,_center.y,2,0,pi2)
			ctx.fill()

			editor.draw(ctx,_center,root,mouse)
		}
		catch(e) { log(e) }
	}

	log('index.js')
}
