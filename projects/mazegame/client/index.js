function MazeGame() {
	const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
	const max_deltaT = 0.1
	const start_time = Lib.time * 1e-3
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

	const game_queue = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		editor: null,
		root: new MazeGame.Point(0,0,0,20),
		spot: new MazeGame.Point(0,0,0,1),
		right_down: false, left_down: false,
		state: MazeGame.Wall,
	}

	function get_center(canvas) {
		const {root} = client
		const {width:x,height:y} = canvas
		const point = new Point(Lib.time,x,y)
		return point.div(2).set((x < y ? x : y) / root.scale )
	}
	function set_spot({offsetX,offsetY}, center) {
		const {root} = client, spot = new Point(Lib.time,offsetX,offsetY)
		client.spot = spot.sub(center,1).div(center.scale).sum(root,1)
	}

	$(document).mousemove(e => {
		const center = get_center(canvas)
		set_spot(e, center)
		if ( client.right_down ) {
			const {root,spot,prev_spot} = client
			client.root = prev_spot.sub(spot).sum(root,1,root.scale)
		}
		client.prev_spot = client.spot
	})

	$(document).mousedown(e => {
		const canvas = e.target
		const center = get_center(canvas)
		set_spot(e, center)

		const {root,spot} = client
		client[e.button == 2 ? 'right_down' : 'left_down'] = true
		client.prev_spot = spot
	})

	$(document).mouseup(e => {
		const canvas = e.target
		const time = Lib.time
		const center = get_center(canvas)
		set_spot(e, center)

		const {root,spot} = client

		if (client.left_down) {
			// game.build_to(time)
			// const cause = client.state.get_spec( game, spot.at(time) )
			// cause && cause.push()

			const {game} = client
			if (game) {
				log(game)
				log(game.get_label(time, 'level'))
				log(game.get_label_map(time, 'level', 'time'))
			}
		}

		client[e.button == 2 ? 'right_down' : 'left_down'] = false
		client.prev_spot = spot
	})

	$(document).keypress(e => {
    var c = String.fromCharCode(e.which | 0x20)

		// delete: e.which = 127
		if (c == ' ') {
			const time = Lib.time
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

		const time = Lib.time
		const game = new Game(time, client.socket.id)
		const level = new Level(time, game)
		game.push(level)
		level.push(new Effect(time+2000,level,'stop_time',time+2000,true))
		client.game = game
	  tick()
	})

	function tick() {

		const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d') // CanvasRenderingContext2D
		canvas.width = window.innerWidth - 20
		canvas.height = window.innerHeight - 20
		window.requestAnimationFrame(tick)

		const now = Lib.now()
		const prev_now = client.prev_now
		const deltaT = now - prev_now > max_deltaT ? max_deltaT : now - prev_now

		const time = Lib.time
		const center = get_center(canvas, time)
		const {root,spot} = client
		const _center = center.strip()
		const _spot = spot.sub(root,1).mul(center.scale).sum(_center)

		if (client.game) client.game.draw(ctx,root,center)

		client.prev_now = now
	}

	log('index.js')
}
