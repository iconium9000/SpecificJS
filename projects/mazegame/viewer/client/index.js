const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(MazeGameViwer)
		MazeGameViwer[constructor.name] = constructor
	}
}
const client = {
  socket: io('/mazegame_viewer'),
}

function MazeGameViwer() {
  const proj_name = 'MazeGame Viewer:'
  const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
  const err = console.error
  const {Lib} = MazeGameViwer

  log('index.js')

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
    client.socket.emit('update')

    log(client.full_name, 'connected to server')
  })

  client.socket.on('update', clients => {
    log(clients)
    let menu = '<h>MazeGame Players...</h>\n'
    for (const id in clients) {
      menu += `<p><a href="${id}">${clients[id]}</a></p>\n`
    }
    document.getElementById('menu').innerHTML = menu
  })
}
