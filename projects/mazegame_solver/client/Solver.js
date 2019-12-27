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

	const solve = 10
	client.socket.on('serial', serial => {
		log(serial)
		try {
			client.level = (new Level).read(JSON.parse(serial))
			log(client.level.solve(solve))
		}
		catch (e) { log(e) }
		client.node = null
	})

  document.onkeydown = e => {
		const {which} = e
		var c = String.fromCharCode(which | 0x20)

    let {mode,level,node,socket} = client

    if (c == ' ') {
      log(level)
      return
    }
		if (c == 'q') {
			try { socket.emit('serial', JSON.stringify(level.serialize,null,' ')) }
			catch (e) { error(e) }
			return
		}
		if (c == 'e') {
			try { socket.emit('serial') }
			catch (e) { error(e) }
			return
		}
		if (c == 'v') {
			try { log(level.solve(solve)) }
			catch (e) { error(e) }
		}

    if (c == 'r') mode = Room
    else if (c == 'w') mode = Node
    else if (c == 'd') mode = Door
    else if (c == 'l') mode = Lock
    else if (c == 's') mode = Slot
    else if (c == 'p') mode = Portal
    else if (c == 'k') mode = Key
    else if (c == 'x') mode = Xey
    else if (c == 'j') mode = Jack
    else if (c == 'h') mode = Header

    // delete: code = 8,46
		else if (which == 8 || which == 46) client.node = node && node.remove()

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
