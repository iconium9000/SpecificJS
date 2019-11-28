function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const start_time = Lib.time * 1e-3
	const project_name = 'MazeGame:'
	const log = (...msg) => console.log(project_name, ...msg)
	const err = console.error
	const pi2 = Math.PI * 2
	const MazeGame = this.MazeGame = module.exports(project_name, Lib)
	this.key_bindings = {}
	for (const type_name in MazeGame) {
		const type = MazeGame[type_name]
		if (type != null) this.key_bindings[type.key_bind] = type
	}

	const effect_stack = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		root: MazeGame.Point.zero, mouse: MazeGame.Point.zero,
		right_down: false, left_down: false,
	}

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
		const {name,socket:{id}} = client

		client.full_name = `'${name}' (${id})`

	  // reply to server with name
	  client.socket.emit('client name', {name: name})

	  log(client.full_name, 'connected to server')

		const time = Lib.time
		const game_state = MazeGame.Game.init(time).state
		MazeGame.Editor.init(game_state, id, name)
		client.game_state = game_state
		log(game_state.child)
	  tick()
	})

	$(document).mousemove(e => {
		const {root,right_down,mouse} = client
		const _mouse = MazeGame.Point.simple(e.offsetX,e.offsetY,1)
		if (right_down) client.root = root.sum(mouse.sub(_mouse))
		client.mouse = _mouse
	})

	$(document).mousedown(e => {
		client.mouse = MazeGame.Point.simple(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = true
	})

	$(document).mouseup(e => {
		const {time} = Lib, {target} = e
		target.width = window.innerWidth - 20
		target.height = window.innerHeight - 20
		const _center = MazeGame.Point.simple(target.width, target.height, 0.5)
		const _mouse = MazeGame.Point.simple(e.offsetX,e.offsetY,1)
		client[e.button == 2 ? 'right_down' : 'left_down'] = false

		const {game_state,socket:{id},root} = client
		if (game_state) {
			const _state = game_state.at(time)
			const _offset = _center.sub(root)
			const _scale = _center.short.scale / MazeGame.Target.scale
			if (_state._child[id].act_at(_mouse.sub(_offset).div(_scale))) {
				client.game_state = _state
			}
		}
		client.mouse = _mouse
	})

	document.onkeydown = e => {
		const code = e.which
		var c = String.fromCharCode(code | 0x20)
		const new_mode = this.key_bindings[c]
		const {game_state,socket:{id}} = client
		if (!game_state) return

		const {time} = Lib, game = game_state.at(time)._child

		if (new_mode) {
			// TODO set state
		}
		// left: 37
		// up: 38
		// right: 39
		// down: 40
		else if (37 <= code && code <= 40) {
			// TODO
		}
		// delete: code = 127
		else if (code == 127) {
			// TODO DELETE
		}
		else if (c == 'z') {
			// TODO KILL
		}
		else if (c == ' ') {
			// MazeGame.State.build_count = 0
			const _state = game[id].level_node.level_state.at(time)
			log(_state)
			// TODO DISPLAY
			// log(client.game)
			// const txt = client.game.to_string
			// log(txt)
			// log(Table.to_table(txt))
		}
	}


	function tick() {

		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d') // CanvasRenderingContext2D
		canvas.width = window.innerWidth - 20
		canvas.height = window.innerHeight - 20
		window.requestAnimationFrame(tick)

		const _center = MazeGame.Point.simple(canvas.width, canvas.height, 0.5)
		const {time} = Lib, {game_state,mouse,root,socket:{id}} = client
		try {
			MazeGame.State.build_count = 0
			game_state.at(time)._child[id].draw( ctx, _center, root, mouse)
			ctx.fillStyle = 'white'
			ctx.fillText(MazeGame.State.build_count, 20, 20)
		}
		catch(e) { log(e) }
	}

	log('index.js')
}
