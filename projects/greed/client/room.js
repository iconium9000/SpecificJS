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

function startgame() {
	Greed.Socket.emit('dostart')
}
function seldice(dice_id) {
  Greed.Socket.emit('doseldice',dice_id)
}
function rolldice() {
  Greed.Socket.emit('doroll')
}
function passdice() {
  Greed.Socket.emit('dopass')
}
function cleardice() {
  Greed.Socket.emit('doclear')
}
function rename() {
	Greed.Lib.set_cookie('name','',1)
	Greed.Setup(Greed.Socket)
}
function htmlbutton(fun,text,state) {
  switch (state) {
    case 'disabled-inactive':
      return `<button onclick="${fun}" disabled><i>${text}</i></button>`
    case 'disabled-active':
      return `<button onclick="${fun}" disabled><b>${text}</b></button>`
    case 'disabled':
      return `<button onclick="${fun}" disabled>${text}</button>`
		case 'enabled-inactive':
      return `<button onclick="${fun}"><i>${text}</i></button>`
    case 'enabled-active':
      return `<button onclick="${fun}"><b>${text}</b></button>`
    case 'enabled':
    default:
      return `<button onclick="${fun}">${text}</button>`
  }
}

function drawroom(room,my_user_id) {
  Greed.room = room
  Greed.user_id = my_user_id
	room.user_id = room.whoseturn

	// if (room.whoseturn != my_user_id) Greed.myturn = false
	// else if (!Greed.myturn) {
	// 	alert(`It's Your Turn!`)
	// 	Greed.myturn = true
	// }

  // log('drawroom',room)

  let menu = ''
	menu += `<p><b>${room.name}'s Greed Game</b>`
	if (room.canstart) {
		menu += ' ' + htmlbutton('startgame()','Start Game','enabled')
	}
	menu += '<p><a href="greed/rules.html">(Greed Rules)</a>'
  menu += '<table class="game-table">'

  menu += '<thead><tr>'
  menu += `<th>Players</th><th>Dice</th>`
  menu += '</tr></thead>'

  menu += '<tbody>'
	const scores = []
	for (const user_id in room.users) scores.push(room.users[user_id])
	scores.sort((a,b)=>b.score-a.score)
	let value = Infinity, rank = 0
	for (let i = 0; i < scores.length; ++i) {
		const user = scores[i]
		if (user.score == value) user.rank = rank
		else {
			user.rank = ++rank
			value = user.score
		}
	}
	const vip = room.users[room.vip]
  for (const user_list_idx in room.user_list) {
		const user_id = room.user_list[user_list_idx]
    const user = room.users[user_id]
    menu += `<tr><td>`

		const enabled = user_id == my_user_id ? 'enabled' : 'disabled'

		if (user_id == my_user_id) {
			menu += user.name
			menu += `&nbsp` + htmlbutton('rename()','Rename',enabled)
		}
		else if (room.players[user.player_id]) menu += `<p>${user.name} (Online)`
		else menu += `<p><i>${user.name} (Offline)</i>`
    menu += `<p><i>Score ${user.score}</i>`
		menu += `<p><i>Rank ${user.rank}</i>`
    menu += `</td>`

		if (room.winner != null) {
			if (room.winner == user_id) menu += `<td><b>WINNER!</b></td>`
			else menu += `<td><b>LOSER!</b></td>`
		}
		else if (!room.started) {
			if (user_id == my_user_id) {
				if (my_user_id == room.vip) {
					menu += `<td>Everyone is waiting for <b>You</b> to press`
				}
				else {
					menu += `<td>Waiting for <b>${vip.name}</b> to press`
				}
				menu += ' ' + htmlbutton('startgame()','Start Game','enabled') + '</td>'
			}
		}
    else if (room.whoseturn == user_id) {
      menu += `<td>`
			const {canscoredice,canseldice} = room
			let count = 0
			for (const dice_id in canscoredice) if (!canscoredice[dice_id]) ++count
			let score_dice = room.dice.length - count

			if (room.lost_score > 0) menu += `Missed ${room.lost_score} points`
			else menu += `Play score: ${room.play_score} points`
			if (room.passed);
			else if (score_dice == 0) menu += `<p>No Scoreable Dice = 0 points`
			else {
				menu += `<p>Keep: `
				for (const dice_id in room.dice) {
					let val = room.dice[dice_id]
					if (canscoredice[dice_id]) {
						let dice_enabled = canseldice[dice_id] ? enabled : 'disabled'
						menu += htmlbutton(`seldice('${dice_id}')`,val,dice_enabled)
					}
				}
				menu += `&nbsp= ${room.roll_score} points`
			}

			if (room.canclear) {
				let clearmsg = `Clear <b>Play Score</b> and Roll <b>6 Dice</b>`
				menu += `<p>` + htmlbutton('cleardice()',clearmsg,enabled)
			}

			let roll_count = `Roll <b>${count == 0 ? 6 : count} Dice</b>`
			const roll_enabled = room.canroll ? enabled : 'disabled'
			menu += `<p>${htmlbutton('rolldice()',roll_count,roll_enabled)}&nbsp`
			if (count == 0) for (let i = 0; i < 6; ++i) {
				menu += htmlbutton(`seldice('${i}')`,'?','disabled')
			}
			else for (const dice_id in room.dice) {
				let val = room.dice[dice_id]
				if (!canscoredice[dice_id]) {
					let dice_enabled = canseldice[dice_id] ? enabled : 'disabled'
					val = val < 0 ? -val : val == 0 ? '?' : val
					menu += htmlbutton(`seldice('${dice_id}')`,val,dice_enabled)
				}
			}

			menu += `&nbsp`
			if (room.canpass) {
				menu += `<p>` + htmlbutton('passdice()',room.passmsg,enabled)
			}
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
	Greed.myturn = false
	Greed.winner = false
  const lobby_socket = io('/greed')
  Greed.Socket = io('/' + window.location.href.split('/').pop())
  const {Lib,Setup,Socket,Room} = Greed

  lobby_socket.on('update', lobby => Setup(lobby_socket))

  Socket.on('update', room => {

    const {id,user_id,name} = Setup(Socket)

    drawroom(Object.assign(new Room,room),user_id)
  })

}
