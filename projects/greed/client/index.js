const {log,error} = console
const module = {
	set exports(
		get_constructor, // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Greed)
		Greed[constructor.name] = constructor
		console.log(constructor.name)
	}
}

function drawlobby(lobby,id) {

  log('drawlobby',lobby)

  let menu = `<p><b>Welcome to Greed!</b></p>`
  menu += '<i>Select a game to join or start a new game</i>'

  for (const id in lobby.rooms) {
    const room = lobby.rooms[id]
    let txt = ''
    for (const username in room.players) {
      txt += `* ${room.players[username].name} `
    }
    menu += `<p><a href="${id}">${id}</a> ${txt}*`
  }
  menu += `<p><a href="${id}">Start New Game</a>`


  document.getElementById('menu').innerHTML = menu
}

function Greed() {

  const {Lib,Setup} = Greed
  const socket = io('/greed')

  socket.on('update', lobby => {

    // get player id
    const id = Setup(socket)

    // draw lobby
    drawlobby(lobby,id)
  })
}
