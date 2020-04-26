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

function getinfo(player,thisid) {
  let info = ''
  info += `<p>${player.name}`
  info += `<p><i>Score: ${player.score}</i>`
  return info
}

function drawroom(room,thisid) {

  log('drawroom',room)

  let menu = ''
  menu += `<p><b>${room.name}'s Greed Game</b>`
  menu += '<table class="game-table">'

  menu += '<thead>'
  menu += '<tr>'
  menu += `<th>Players</th>`
  menu += `<th>Dice</th>`
  menu += '</tr>'
  menu += '</thead>'

  menu += '<tbody>'
  for (const id in room.players) {
    const player = room.players[id]
    menu += `<tr><td>`
    menu += getinfo(player,thisid)
    menu += `</td></tr>`
  }
  menu += '</tbody>'
  menu += '</table>'

  document.getElementById('menu').innerHTML = menu
}

function Greed() {
  const room_socket = io('/' + window.location.href.split('/').pop())

  const lobby_socket = io('/greed')
  const {Lib,Setup} = Greed

  lobby_socket.on('update', lobby => Setup(lobby_socket))

  room_socket.on('update', room => {

    const id = Setup(room_socket)

    drawroom(room,id)
  })

}
