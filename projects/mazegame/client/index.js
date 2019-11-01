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

	const effect_stack = []
	const client = {
	  socket: io('/mazegame'),
		now: start_time,
	  prev_now: start_time - max_deltaT,
		name: null,
		full_name: null,
		editor: null,
		root: new MazeGame.Point(0,0,0,60),
		spot: new MazeGame.Point(0,0,0,1),
		right_down: false, left_down: false,
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
		new Effect(
			time, 'init state as Wall', MazeGame.Wall,
			[game], [game, 'state'],
		)
		const level = new Level( time, 'added new level', game, [game, 'level'], )
		client.game = game
	  tick()
	})

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

		const {game,state,left_down,right_down} = client
		if ((left_down || right_down) && game) {
			const level = game.get_label(game, 'level')
			const state = game.get_label(time, 'state')
			const level_action = state && state.act_at(game, spot.at(time))
			if (level_action) {
				log(level_action.description)
				level.check(time, [level_action])
				effect_stack.push(level_action)
			}
		}

		client[e.button == 2 ? 'right_down' : 'left_down'] = false
		client.prev_spot = spot
	})

	$(document).keypress(e => {
    var c = String.fromCharCode(e.which | 0x20)
		const state = key_bindings[c]
		const time = Lib.time
		const game = client.game
		const level = game && game.get_label(time, 'level')
		const target = level && level.get_label(time, 'target')

		if (state) {
			const update_state = new Effect(
				time, `set state to ${state.name}`, state,
				[game], [game, 'state'],
			)
			if (target) {
				const clear_target = new Effect(
	        time, `clear level target`, null,
	        [update_state], [target], [level], [level, 'target'],
	      )
				level.check(time, [clear_target])
			}
			log(update_state.description)
			effect_stack.push(update_state)
		}
		// delete: e.which = 127
		else if (e.which == 127) {
			if (target) {
				const remove_target = target.remove( time, [level], [level, 'target'],)
				if (remove_target) {
					log(remove_target.description)
					level.check(time, [remove_target])
					effect_stack.push(remove_target)
				}
			}
		}
		else if (c == 'z') {
			if (game) {
				const effect = effect_stack.pop()
				if (effect) {
					effect.kill(game)
					log(`removed '${effect.description}'`)
				}
			}
		}
		else if (c == ' ') {
			log( game, level, effect_stack, )
		}
  })

  $(document).keyup(e => {
    var c = String.fromCharCode(e.which | 0x20)

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
		const {root,spot,game} = client
		const _center = center.strip()
		const _spot = spot.sub(root,1).mul(center.scale).sum(_center)


		try {
			const state = game.get_label(time, 'state')
			const effect = state && state.act_at(game, spot.at(time))
			game.draw(ctx,time,root,center)
			ctx.fillStyle = 'white'
			if (effect) {
				const start = Lib.time
				effect.kill(game)
				const stop = Lib.time
				ctx.fillText(stop-start, 20, 50)
			}
			ctx.fillText(Math.round(1/deltaT), 20, 20)
		} catch (e) {
			log(e)
		}
		client.prev_now = now
	}

	log('index.js')
}
