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

function hideroom(room_id) {
  Greed.socket.emit('hideroom',room_id)
}

function drawlobby(lobby) {
  const {Lib,Setup,socket} = Greed
  const {name,id,user_id} = Setup(socket)

  log('drawlobby',lobby)
  Greed.lobby = lobby

  let menu = `<p><b>Welcome to Greed, ${name}!</b></p>`
  menu += '<i>Select a game to join or start a new game</i>'


  menu += `<table class="game-table">`
  menu += `<thead><tr><th>Players</th><th>Games</th></tr></thead>`
  menu += '<tbody>'
  menu += `<tr>`
  menu += `<td>New Game</td>`
  menu += `<td><a href="${id}">Start!</a></td>`
  menu += `</tr>`

  for (const room_id in lobby.rooms) {
    const room = lobby.rooms[room_id]
    let flag = false
    for (const id in room.players) { flag = true; break; }
    if (flag || room.users[user_id] && !room.hidden) {
      menu += `<tr>`
      menu += `<td>`
      for (const user_id in room.users) {
        const user = room.users[user_id]
        // txt += `* ${user.name} (${room.players[user.player_id] ? 'on' : 'off'})`

        if (room.players[user.player_id]) {
          menu += `<p>${user.name} (Online)`
        }
        else menu += `<p><i>${user.name} (Offline)</i>`
      }
      menu += `</td>`
      menu += `<td>`
      menu += `<p><a href="${id}">Continue</a>`
      menu += `<p><button onclick="hideroom('${room_id}')">Hide</button>`
      menu += `</td>`
      menu += `</tr>`
    }
  }
  menu += '</tbody></table>'

  document.getElementById('menu').innerHTML = menu
}

function Greed() {
  Greed.socket = io('/greed')
  Greed.socket.on('update',drawlobby)
}
