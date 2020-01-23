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
	Greed.socket = io('/' + window.location.href.split('/').pop())
	const {Lib,Point,Dim,socket} = Greed

  socket.on('connect', () => {
    let name = Lib.get_cookie('name')
		Greed.socket_id = socket.id.split('#').pop()

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

  socket.on('update', game => {
    if (Greed.game == null) {
			Greed.game = game
			Greed.tick()
			$(document).mouseup(Greed.mouseup)
		}
		else Greed.game = game

		log('update', game)
  })
}
