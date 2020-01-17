const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(MazeGameViwer)
		MazeGameViwer[constructor.name] = constructor
	}
}

const url = '/' + window.location.href.split('/').pop()

const client = {
  socket: io(url)
}

function MazeGameViwer() {
  const proj_name = 'MazeGame Viewer:'
  const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
  const err = console.error
  const {Lib,Point,Scale,Level,Target} = MazeGameViwer

  log('index.js')

  function get_center_scale_offset({scale,root},{width,height}) {
		const center = Point.init(width, height, 0.5)
		scale = center.short.scale / scale
		return [center, scale, center.sub(root.mul(scale)) ]
	}

  client.full_name = client.name = client.socket.id

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

    client.full_name = `'${client.name}' (${client.socket.id})`

    // reply to server with name
    client.socket.emit('client name', {name: client.name})

    log(client.full_name, 'connected to server')

    tick()
  })

  client.socket.on('disconnect', () => {
    let {href} = window.location
    href = href.slice(0,href.indexOf(url)+1) + 'mazegame_viewer'
    log('new href', href)
    window.location.href = href
  })

  client.socket.on('update', (name,string) => {
    document.getElementById('title').innerHTML = name
    try {
      client.level = Level.read(Lib.parse(string))
    }
    catch (e) {
      console.error(e)
    }
  })

  function tick() {
    window.requestAnimationFrame(tick)

    try {
      const {level,_time} = client, {time} = Lib

      const canvas = document.getElementById('canvas')
      const ctx = canvas.getContext('2d') // CanvasRenderingContext2D
      canvas.width = window.innerWidth - 20
      canvas.height = window.innerHeight - 20

      const [center,scale,offset] = get_center_scale_offset(level,canvas)
      level.draw(ctx,offset,scale)

      const dt = time - _time
      level.move(0 < dt && dt < Infinity ? dt : 0)
      client._time = time
    }
    catch (e) {}

  }


}
