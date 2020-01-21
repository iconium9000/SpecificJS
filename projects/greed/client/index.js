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
  const socket = io('/greed')

  socket.on('connect', () => {
		let name = Lib.get_cookie('name')

		// if no name is found in cookies, get one from the user
		while (!name || name == 'null') {
			name = prompt('Choose a name:', name)
			Lib.set_cookie('name',name,10)
		}

		// reply to server with name
		socket.emit('client name', {name: name})
		socket.emit('update')
  })

  socket.on('update', clients => {
		const id = '/' + socket.id.split('#').pop()
		clients[id] = 'New Game?'
		log('clients')

		let menu = '<h>Greed!</h>'
		for (const id in clients) {
			menu += `<p><a href="${id}">${clients[id]}</a></p>\n`
		}
		document.getElementById('menu').innerHTML = menu
  })
}
