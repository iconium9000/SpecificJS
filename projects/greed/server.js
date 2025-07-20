module.exports = (project,info) => {
  const proj_name = `Greed:`
  function log(...msg) { console.log(proj_name, ...msg) }
  const {app,express,socket_io} = info
  const lobby_socket = project.socket
  const client_path = __dirname + `/client`
  const Greed = {}
  function getlib(path,f) { const lib = f(path)(Greed); Greed[lib.name] = lib; }
  getlib('./client/Score.js',require)
  getlib(`./projects/menu/client/Lib.js`,info.super_require)
  getlib(`./client/Room.js`,require)
  const {Score,Lib,Room} = Greed

  const lobby = {
    name: 'lobby',
    rooms: {},
    users: {}
  }
  const user_keys = {}

  lobby_socket.on('connection', lobby_client_socket => {
    const id = lobby_client_socket.id.split('#').pop()

    app.get('/' + id, (req,res) => res.sendFile(client_path + `/room_index.html`))
    const room_socket = socket_io.of('/' + id)
    const room = new Room; room.init(id)
    let room_user = null, timeout = undefined

    lobby_client_socket.emit('update',lobby)

    lobby_client_socket.on('hideroom', room_id => {
      if (room_user) {
        room_user.hidden_rooms[room_id] = true
        lobby_socket.emit('update',lobby)
      }
    })

    lobby_client_socket.on('client name', ({name,user_id,key}) => {
      if (name == room.name && user_id == room.user_id) return

      if (!user_keys[user_id]) user_keys[user_id] = key
      else if (user_keys[user_id] != key) return

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

      function update() {
        room.time_offset = room.clock - Lib.time
        lobby_socket.emit('update',lobby)
        room_socket.emit('update',room)
      }

      room_client_socket.emit('update',room)

      function dooffset(fname,user_id,dice_id) {
        room.user_id = user_id
        if (room[fname](dice_id)) {
          room.clock = Lib.time + room.timer
          update()

          clearTimeout(timeout)
          timeout = setTimeout(() => {
            dooffset('forcepass',room.whoseturn)
          }, room.time_offset)
        }
      }
      room_client_socket.on('dopass', () => dooffset('dopass',player.user_id))
      room_client_socket.on('dostart', () => dooffset('dostart',player.user_id))
      room_client_socket.on('doroll', () => dooffset('doroll',player.user_id))
      room_client_socket.on('doclear', () => dooffset('doclear',player.user_id))
      room_client_socket.on('doseldice', dice_id => {
        dooffset('doseldice',player.user_id,dice_id)
      })

      room_client_socket.on('client name', ({name,user_id,key}) => {
        if (player.name == name && user_id == player.user_id) return

        if (!user_keys[user_id]) user_keys[user_id] = key
        else if (user_keys[user_id] != key) return

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
        else if (!room.started) {
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
        update()
      })
    })
  })

}
