const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(MazeGame)
		MazeGame[constructor.name] = constructor
	}
}

function MazeGame() {
	const max_deltaT = 0.1
	const {Lib,Game,Point,Level,Editor,Target} = MazeGame
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error

	const cookie_age = 15 // years

	const key_bindings = {}
	for (const type_name in MazeGame) {
		const type = MazeGame[type_name]
		if (type != null) key_bindings[type.key_bind] = type
	}

	const effect_stack = []
	const client = {
	  socket: io('/mazegame_new'),
		full_name: null,
		root: Point.zero, mouse: Point.zero,
		right_down: false, left_down: false,
		free: true,
		stack: [],
		get id() { return client.socket.id },
	}
	client.name = client.id
	setup_game()

	function setup_game(game) {
		const {id,name,stack} = client
		client.game = game || Game.init()
		client.editor = Editor.init(client.game, id, name)
		stack.push(client.game.copy())
	}

	function update() {
		const {game,stack,editor,level_strings,socket} = client, {level} = editor
		try {
			const string = Lib.stringify(level.serialize())
			socket.emit('update', string)
			stack.push(game.copy())
		}
		catch (e) {
			log(e)
		}
	}

	function send_game() {
		const {editor,game,stack} = client

		try {
			client.socket.emit('serial', Lib.stringify(game.serialize()))
		}
		catch (e) {
			log(e)
		}
	}

	function get_center_scale(canvas) {
		const _center = Point.init(canvas.width, canvas.height, 0.5)
		const {scale} = client.editor.level || Target
		return [_center, _center.short.scale / scale ]
	}

	document.onkeydown = e => {
		if (!client.devmode) return

		const code = e.which
		const new_mode = key_bindings[e.key]
		const {editor,game} = client

		const {time} = Lib
		// log(e.which)

		if (new_mode) {
			// log('new mode', new_mode.name)
			editor.mode = new_mode
			// TODO UNDO
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
			if (editor && editor.target) {
				editor.target.remove()
			}
		}

		switch (e.key) {
			// change level scale
			case 't':
				if (editor.level) {
					editor.level.scale = parseInt(
						prompt('enter level scale', editor.level.scale)
					)
				}
				break;
			case 'v':
				if (editor.level) {
					let minhit = editor.level.minhit
					do { minhit = parseInt(prompt('Min Hit',minhit)) }
					while (!(0 < minhit && minhit < Infinity))
					editor.level.minhit = minhit
				}
				break
			// reload game
			case 'r': client.socket.emit('serial'); break
			// save game
			case 'q': send_game(); break
			// name level
			case 'm':
				if (!editor.level) {
					editor.level = game.root_level
				}

				let name = ''
				do {
					name = prompt('Level Name: ', editor.level.name)
				}
				while (!name)
				editor.level.name = name
				break
			// new level
			case 'n': editor.level = Level.init(game); break
			// UNDO
			case 'e': {
				const {game,editor} = client
					try {
						client.game = client.stack.pop()
						client.editor = client.game[editor.id]
						if (!client.game || !client.editor) throw client
					}
					catch (e) {
						client.game = game; client.editor = editor
					}
				}
				break
			// get gamestate
			case ' ': log(client.editor); break
			default:

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
	    Lib.set_cookie('name', client.name, cookie_age)
	  }
		const {name,id} = client

		client.full_name = `'${name}' (${id})`

	  // reply to server with name
	  client.socket.emit('client name', {name: name})
		if (client.free) client.socket.emit('serial')

	  log(client.full_name, 'connected to server')

	  tick()
	})
	client.socket.on('devmode', devmode => client.devmode = devmode)
	client.socket.on('update', update)
	client.socket.on('serial', string => {
		const {id,name} = client
		try {
			client.string = string

			const serial = Lib.parse(string)
			setup_game(Game.read(serial))
			client.free = false

			const {editor} = client, {src,level} = editor
			client.level_strings = src.level_strings

			if (src.tally != Lib.get_cookie('game_tally')) {
				Lib.set_cookie('game_tally', src.tally, cookie_age)
			}
			else {
				const unlocked_levels = Lib.get_cookie('unlocked_levels').split(' ')
				const {levels} = editor.src
				for (const i in unlocked_levels) {
					const level = levels[unlocked_levels[i]]
					if (level) level.is_locked = false
				}

				const root_level = levels[Lib.get_cookie('root_level')]
				if (root_level) {
					src.root_level = editor.level = root_level
				}
			}

		}
		catch (e) {
			log(e)
		}
	})

	$(document).mousemove(e => {
		const {right_down,mouse,editor} = client
		const _mouse = Point.init(e.offsetX,e.offsetY,1)
		const [_center,_scale] = get_center_scale(e.target)

		if (right_down) {
			editor.root = mouse.sub(_mouse).div(_scale).sum(editor.root)
		}

		client.mouse = _mouse
	})

	$(document).mousedown(e => {
		client.mouse = Point.init(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = true
	})

	$(document).mouseup(e => {
		const {time} = Lib, {target} = e
		target.width = window.innerWidth - 20
		target.height = window.innerHeight - 20
		const [_center, _scale] = get_center_scale(target)
		const _mouse = Point.init(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = false

		const {editor} = client
		const {_editor,root} = editor, {_mode} = _editor
		editor.log = log
    _mode.act_at(_editor, _mouse.sub(_center).div(_scale).sum(root))
		update()

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

			if (client.rect) {
				ctx.strokeStyle = 'white'
				const {scale} = _center.short, {x,y} = _center

				ctx.beginPath()
				ctx.rect(x - scale, y - scale, 2*scale, 2*scale)
				ctx.closePath()
				ctx.stroke()

				ctx.fillStyle = 'white'
				ctx.beginPath()
				ctx.arc(_center.x,_center.y,2,0,pi2)
				ctx.fill()
			}

			editor.draw(ctx,_center,root,mouse)
			editor.move()

			if (!client.free) {
				const {src,level} = client.editor, {levels} = src
				let unlocked_levels = ''
				for (const id in levels) {
					if (!levels[id].is_locked) unlocked_levels += ' ' + id
				}
				Lib.set_cookie('unlocked_levels', unlocked_levels, cookie_age)
				Lib.set_cookie('root_level', level.id, cookie_age)
			}
		}
		catch(e) { log(e) }
	}

	log('index.js')
}
