const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Greed)
		Greed[constructor.name] = constructor
	}
}

function Greed() {
  const {Lib} = Greed
  const socket = io('/' + window.location.href.split('/').pop())

  socket.on('connect', () => {
    let name = Lib.get_cookie('name')

		// if no name is found in cookies, get one from the user
		while (!name || name == 'null') {
			name = prompt('Choose a name:', name)
			Lib.set_cookie('name',name,10)
		}

		// reply to server with name
		socket.emit('client name', {name: name})
  })

  socket.on('yeet', () => {
    let {href} = window.location
    window.location.href = href.replace(href.split('/').pop(),'greed')
  })

  socket.on('update', clients => {
    log('clients', clients)
  })
}
