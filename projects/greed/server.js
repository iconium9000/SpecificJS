module.exports = (project,info) => {
  const proj_name = `Greed:`
  function log(...msg) { console.log(proj_name, ...msg) }
  const {app,express,socket_io} = info
  const lobby_socket = project.socket
  const client_path = __dirname + `/client`

  const lobby = {
    name: 'lobby',
    rooms: {},
    users: {},
    // TODO SCORE
  }

  lobby_socket.on('connection', lobby_client_socket => {
    const id = lobby_client_socket.id.split('#').pop()

    app.get('/' + id, (req,res) => res.sendFile(client_path + `/room.html`))
    const room_socket = socket_io.of('/' + id)
    const room = {
      id: id,
      name: null,
      players: {},
      users: {},
      user_turn: 0,
      dice: [1,6,4],
      num_users: 0,
      // TODO SCORE
    }

    lobby_client_socket.emit('update',lobby)

    lobby_client_socket.on('client name', ({name,user_id}) => {
      if (name == room.name && user_id == room.user_id) return
      room.name = name
      room.user_id = user_id

      if (!lobby.users[user_id]) lobby.users[user_id] = {
        name: name,
        user_id: user_id,
        // TODO SCORE
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

      room_client_socket.emit('update',room)

      room_client_socket.on('hideroom', room_id => {
        
      })

      room_client_socket.on('client name', ({name,user_id}) => {
        if (player.name == name && user_id == player.user_id) return

        lobby.rooms[room.id] = room
        player.name = name
        player.user_id = user_id

        let lobby_user = lobby.users[user_id]
        if (!lobby_user) lobby.users[user_id] = {
          name: name,
          user_id: user_id
          // TODO SCORE
        }

        let room_user = room.users[user_id]
        if (room_user) {
          room_user.name = name
          room_user.player_id = player.id
        }
        else room.users[user_id] = {
          name: name,
          user_id: user_id,
          player_id: player.id,
          user_idx: room.num_users++
          // TODO SCORE
        }

        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      })

      room_client_socket.on('disconnect', () => {

        delete room.players[player.id]

        // let flag = true
        // for (const i in room.players) flag = false
        // if (flag) delete lobby.rooms[room.id]

        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      })
    })
  })

}
