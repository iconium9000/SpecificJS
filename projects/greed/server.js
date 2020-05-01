module.exports = (project,info) => {
  const proj_name = `Greed:`
  function log(...msg) { console.log(proj_name, ...msg) }
  const {app,express,socket_io} = info
  const lobby_socket = project.socket
  const client_path = __dirname + `/client`
  const Score = require('./client/Score.js')()
  const Room = require(`./client/Room.js`)({Score:Score})
  const timeout_clock = 15000

  const lobby = {
    name: 'lobby',
    rooms: {},
    users: {}
  }

  lobby_socket.on('connection', lobby_client_socket => {
    const id = lobby_client_socket.id.split('#').pop()

    app.get('/' + id, (req,res) => res.sendFile(client_path + `/room.html`))
    const room_socket = socket_io.of('/' + id)
    const room = new Room; room.init(id)
    let room_user = null

    lobby_client_socket.emit('update',lobby)

    lobby_client_socket.on('hideroom', room_id => {
      if (room_user) {
        room_user.hidden_rooms[room_id] = true
        lobby_socket.emit('update',lobby)
      }
    })

    lobby_client_socket.on('client name', ({name,user_id}) => {
      if (name == room.name && user_id == room.user_id) return
      room.name = name
      room.user_id = user_id

      room_user = lobby.users[user_id]
      if (!room_user) room_user = lobby.users[user_id] = {
        name: name,
        user_id: user_id,
        hidden_rooms: {}
      }

      lobby_socket.emit('update',lobby)
      room_socket.emit('update',room)
    })

    room_socket.on('connection', room_client_socket => {
      const player = {
        id: room_client_socket.id.split('#').pop(),
        name: null
      }
      room.players[player.id] = player

      let timeout = null
      function settimer() {
        // log('settimer')
        // clearInterval(timeout)
        update()
        // timeout = setTimeout(() => {
        //   room.user_id = room.whoseturn
        //   room.dopass()
        //   settimer()
        // },timeout_clock)
      }
      function update() {
        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      }

      room_client_socket.emit('update',room)

      room_client_socket.on('dopass', () => {
        room.user_id = player.user_id
        if (room.dopass()) settimer()
      })
      room_client_socket.on('dostart', () => {
        room.user_id = player.user_id
        if (room.dostart()) settimer()
      })
      room_client_socket.on('doroll', () => {
        room.user_id = player.user_id
        if (room.doroll()) settimer()
      })
      room_client_socket.on('doclear', () => {
        room.user_id = player.user_id
        if (room.doclear()) settimer()
      })
      room_client_socket.on('doseldice', dice_id => {
        room.user_id = player.user_id
        if (room.doseldice(dice_id)) settimer()
      })

      room_client_socket.on('client name', ({name,user_id}) => {
        if (player.name == name && user_id == player.user_id) return
        // else if (room.started) return update()

        if (!room.vip) room.vip = user_id

        lobby.rooms[room.id] = room
        player.name = name
        player.user_id = user_id

        let lobby_user = lobby.users[user_id]
        if (!lobby_user) lobby.users[user_id] = {
          name: name,
          user_id: user_id,
          hidden_rooms: {}
        }
        lobby_user.hidden_rooms[room.id] = false

        let room_user = room.users[user_id]
        if (room_user) {
          room_user.name = name
          room_user.player_id = player.id
        }
        else {
          room.users[user_id] = {
            name: name,
            user_id: user_id,
            player_id: player.id,
            user_idx: room.user_list.length,
            score: 0,
          }
          room.user_list.push(user_id)
        }

        update()
      })

      room_client_socket.on('disconnect', () => {

        delete room.players[player.id]

        // let flag = true
        // for (const i in room.players) flag = false
        // if (flag) delete lobby.rooms[room.id]

        update()
      })
    })
  })

}
