const {log,error} = console
const module = {
	set exports(
		get_constructor, // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Solver)
		Solver[constructor.name] = constructor
	}
}

function Solver() {
  const {
    Point,Lib,Level,
    Node,Room,Header,Lock,Slot,
    Door,Portal,Key,Xey,Jack,
  } = Solver

  const client = {
		socket: io('/mazegame_solver'),
    right_down: false,
    left_down: false,
    mouse: Point.zero,
    level: new Level,
    mode: Node,
  }

	const solve = 1e6
	client.socket.on('serial', serial => {
		log(serial)
		try {
			client.level = (new Level).read(JSON.parse(serial))
			log(client.level.solve())
			// client.level._solve.solve_queue(solve)
		}
		catch (e) { log(e) }
		client.node = null
	})
	client.socket.on('solve', string => {
		try {
			const solve = JSON.parse(string), {_solve} = client.level._solve
			log(solve)
			if (client.level._solve) {
				for (let i = solve.length; i > 0;) {
					_solve.push({key_parents: solve[--i]})
				}
			}
		}
		catch (e) { log(e) }
	})

  document.onkeydown = e => {
		const {which} = e
		var c = String.fromCharCode(which | 0x20)

    let {mode,level,node,socket} = client

		// delete: code = 8,46
		if (which == 8 || which == 46) {
			client.node = node && node.remove()
			return
		}

		switch (c) {
			case 'm':
				log(level)
				return
			case 'n':
				client.socket.emit('solve', level.toString)
				return
			case ' ':
				level.pop()
				return
			case 'q':
				try { socket.emit('serial', JSON.stringify(level.serialize,null,' ')) }
				catch (e) { error(e) }
				return
			case 'e':
				try { socket.emit('serial') }
				catch (e) { error(e) }
				return
			case 'v':
				try { client.socket.emit('solve', client.level.toString) }
				catch (e) { error(e) }
				return
			case 'u':
				client.socket.emit('get_solve')
				return
			case 'r': mode = Room; break
			case 'w': mode = Node; break
			case 'd': mode = Door; break
			case 'l': mode = Lock; break
			case 's': mode = Slot; break
			case 'p': mode = Portal; break
			case 'k': mode = Key; break
			case 'x': mode = Xey; break
			case 'j': mode = Jack; break
			case 'h': mode = Header; break
		}

    if (client.mode != mode) {
      client.mode = mode
      client.node = null
    }
  }

  $(document).mousemove(e => {
		const {right_down,mouse,level} = client
		const _mouse = Point.init(e.offsetX,e.offsetY,1)

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
		const _mouse = Point.init(e.offsetX,e.offsetY,1)

    const {left_down,mode,level,node} = client
    if (left_down) client.node = mode.act_at(level,_mouse,node)
    client[e.button == 2 ? 'right_down' : 'left_down'] = false

		client.mouse = _mouse
	})

  tick()
  function tick() {
    const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d') // CanvasRenderingContext2D
		canvas.width = window.innerWidth - 20
		canvas.height = window.innerHeight - 20
		window.requestAnimationFrame(tick)

    const {mode,mouse,level,node} = client
    if (node && node._move) node._point = mouse

    level.draw = ctx
  }
}
