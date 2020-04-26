module.exports = (project,info) => {
  const proj_name = `Greed:`
  function log(...msg) { console.log(proj_name, ...msg) }
  const {app,express,socket_io} = info
  const lobby_socket = project.socket
  const client_path = __dirname + `/client`

  const lobby = {
    name: 'lobby',
    rooms: {}
  }

  lobby_socket.on('connection', lobby_client_socket => {
    const id = lobby_client_socket.id.split('#').pop()

    log('socket connection:', lobby_client_socket.id)
    app.get('/' + id, (req,res) => res.sendFile(client_path + `/room.html`))
    const room_socket = socket_io.of('/' + id)
    const room = {
      id: id,
      name: null,
      players: {},
    }

    lobby_client_socket.emit('update',lobby)

    lobby_client_socket.on('client name', ({name,username}) => {
      if (name == room.name && username == room.username) return
      room.name = name
      room.username = username

      log('client name:', name)
      lobby_socket.emit('update',lobby)
      room_socket.emit('update',room)
    })

    lobby_client_socket.on('disconnect', () => {
      log('disconnect:', room.name)
    })

    room_socket.on('connection', room_client_socket => {
      const player = {
        id: room_client_socket.id.split('#').pop(),
        name: null,
        score: Math.floor(Math.random() * 1000)
      }
      room.players[player.id] = player

      log('room_socket connection', player.id)

      room_client_socket.emit('update',room)

      room_client_socket.on('client name', ({name,username}) => {
        if (player.name == name && username == player.username) return

        lobby.rooms[room.id] = room
        player.name = name
        player.username = username

        log('room client name:', name)

        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      })

      room_client_socket.on('disconnect', () => {
        log('disconnect from room:', player.name)
        delete room.players[player.id]

        let flag = true
        for (const i in room.players) flag = false
        if (flag) delete lobby.rooms[room.id]

        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      })
    })
  })

}
