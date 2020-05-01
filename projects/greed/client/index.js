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
  menu += '<p><i>Select a game to join or start a new game</i>'
	menu += '<p><a href="greed/rules.html">(Greed Rules)</a>'


  menu += `<table class="game-table">`
  menu += `<thead><tr><th>Players</th><th>Games</th></tr></thead>`
  menu += '<tbody>'
  menu += `<tr>`
  menu += `<td>New Game</td>`
  menu += `<td><a href="${id}">Start!</a></td>`
  menu += `</tr>`

	const user = lobby.users[user_id]
  for (const room_id in lobby.rooms) {
    const room = lobby.rooms[room_id]
    let flag = room.users[user_id] && !room.hidden
    for (const id in room.players) { flag = true; break; }
		const hidden_room = user && user.hidden_rooms[room_id]
		if (hidden_room) flag = false

    if (flag) {
      menu += `<tr>`
      menu += `<td>`
      for (const user_id in room.users) {
        const user = room.users[user_id]

        if (room.players[user.player_id]) {
          menu += `<p>${user.name} (Online)`
        }
        else menu += `<p><i>${user.name} (Offline)</i>`
      }
      menu += `</td>`
      menu += `<td>`
			if (room.started && !room.users[user_id]) {
				menu += `<p><a href="${room_id}">Spectate</a>`
			}
			else if (hidden_room == false) {
				menu += `<p><a href="${room_id}">Continue</a>`
			}
			else {
				menu += `<p><a href="${room_id}">Join</a>`
			}
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
