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

		const {game,state,left_down} = client
		if (left_down && game) {
			const effect = state.act_at(game, spot.at(time))
			log(game, effect)
			log(effect.description)

			// if (effect) {
			// 	effect.flag = effect
			// 	game.remove_flag(effect)
			// }
		}

		client[e.button == 2 ? 'right_down' : 'left_down'] = false
		client.prev_spot = spot
	})

	$(document).keypress(e => {
    var c = String.fromCharCode(e.which | 0x20)
		const state = key_bindings[c]
		const time = Lib.time
		const level = client.game && client.game.get_label(time, 'level')
		const target = level && level.get_label(time, 'target')

		if (state) {
			client.state = state
			log('set state to', state.name)
			if (target) {
				new Effect(
	        time, level.flag, `clear level target`,
	        target, level, 'target', null,
	      )
			}
		}
		// delete: e.which = 127
		else if (e.which == 127) {
			if (target) {
				const remove_target = target.remove(time,null,null)
				log(remove_target.description)
				new Effect(
	        time, remove_target, `clear level target`,
	        target, level, 'target', null,
	      )
			}
		}
		else if (c == ' ') {

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
		const game = new Game(time)
		const level = new Level(time, game, 'added new level', game)
		client.game = game
		log(level)
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
		const {root,spot,state,game} = client
		const _center = center.strip()
		const _spot = spot.sub(root,1).mul(center.scale).sum(_center)

		try {
			const effect = state.act_at(game, spot.at(time))
			game.draw(ctx,time,root,center)
			if (effect) game.remove_flag(effect)
		} catch (e) {}
		client.prev_now = now
	}

	log('index.js')
}
