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

function seldice(diceid) {
  log('seldice',diceid,Greed.room.dice[diceid])
}
function rolldice() {
  log('rolldice')
}
function passdice() {
  log('passdice')
}
function htmlbutton(fun,text,state) {
  switch (state) {
    case 'disabled-inactive':
      return `<button onclick="${fun}" disabled><i>${text}</i></button>`
    case 'disabled-active':
      return `<button onclick="${fun}" disabled><b>${text}</b></button>`
    case 'disabled':
      return `<button onclick="${fun}" disabled>${text}</button>`
    case 'enabled':
    default:
      return `<button onclick="${fun}">${text}</button>`

  }
}

function drawroom(room,user_id) {
  Greed.room = room
  Greed.user_id = user_id

  log('drawroom',room)

  let menu = ''
  menu += `<p><b>${room.name}'s Greed Game</b>`
  menu += '<table class="game-table">'

  menu += '<thead><tr>'
  menu += `<th>Players</th><th>Dice</th>`
  menu += '</tr></thead>'

  menu += '<tbody>'
  for (const id in room.users) {

    const user = room.users[id]
    menu += `<tr><td>`

    if (room.players[user.player_id]) menu += `<p>${user.name} (Online)`
    else menu += `<p><i>${user.name} (Offline)</i>`
    menu += `<p><i>Score: TODO SCORE</i>`
    menu += `</td>`
    log(user)

    if (id == user_id) {
      menu += `<td>`
      for (const i in room.dice) {
        menu += htmlbutton(`seldice(${i})`,room.dice[i],'disabled-active')
      }
      menu += `<p>` + htmlbutton('rolldice()','Roll','disabled-inactive')
      menu += htmlbutton('passdice()','Pass','disabled-active')
      menu += `</td>`
    }
    else menu += `<td></td>`

    menu += `</tr>`
  }
  menu += '</tbody>'
  menu += '</table>'

  document.getElementById('menu').innerHTML = menu
}

function Greed() {
  const lobby_socket = io('/greed')
  Greed.Socket = io('/' + window.location.href.split('/').pop())
  const {Lib,Setup,Socket} = Greed

  lobby_socket.on('update', lobby => Setup(lobby_socket))

  Socket.on('update', room => {

    const {id,user_id,name} = Setup(Socket)

    drawroom(room,user_id)
  })

}
