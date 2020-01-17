module.exports = (project) => {
  const project_name = 'Blockade:'
  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  const client_sockets = {}   // map of client sockets in game [client_socket.id]

  const update_freq = 40      // updates per sec
  const timeout_freq = 10     // timeouts per sec
  const bar_start = 1 + 0.1   // default start location for bars
  const bar_width_min = 1/30  // minimum bar width
  const bar_hieght_min = 1/30 // minimum bar height
  const bar_width = 1/8       // bar width variance
  const bar_height = 1/10     // bar height variance
  const bar_freq = 4/1        // bar spawn per sec

  let bar_stop = null, msg_stop = null

  // send a new bar to all client sockets bar_freq times per sec
  function bar_interval() {
    // define specs of new bar
    const w = bar_width_min + bar_width * Math.random()
    const h = bar_hieght_min + bar_height * Math.random()
    const x = bar_start
    const y = Math.random() * (1 - h)

    // send bar to client socket
    for (const client_socket_id in client_sockets) {
      const client_socket = client_sockets[client_socket_id]
      client_socket.emit('new bar', x, y, w, h)
    }
  }

  // update game update_freq times a second
  function msg_interval() {

    // message to send to all client sockets
    const msg = {
      plrs: {},       // players currently in the game
    }

    // before sending msg to players, compile each player's specs
    for (const client_socket_id in client_sockets) {
      const client_socket = client_sockets[client_socket_id]

      msg.plrs[client_socket_id] = {
        // (string) the client's current name
        name: client_socket.name,
        // (int) the client's current score
        score: client_socket.score,
        // (int) the client's current high_score
        high_score: client_socket.high_score,
        // (0 < float < 1) the client's current vertical location
        plr_y: client_socket.plr_y,
        // (boolean) whether the client is dead
        dead: client_socket.dead,
      }
    }

    // send msg to each client socket
    for (const client_socket_id in client_sockets) {
      const client_socket = client_sockets[client_socket_id]
      client_socket.emit('update', msg)
    }

  }

  // called for each client that connects to the server
  // manage each client individually
  project.socket.on('connection', (client_socket) => {

    client_sockets[ client_socket.id ] = client_socket

    bar_stop = bar_stop || setInterval(bar_interval, 1e3/bar_freq)
    msg_interval = msg_interval || setInterval(msg_interval, 1e3/update_freq)

    // change the name when the client tells you to
    client_socket.on('client name', msg => {

      // save the client's name
      client_socket.name = msg.name

      // create a full name (ex: `'John' (2X6KsX5a_UPDHadUAAAB)`)
      client_socket.full_name = `'${msg.name}' (${client_socket.id})`

      // log the loggin of the client
      // log(`${client_socket.full_name} connected`)
    })

    // when a client sends a msg, resend that msg to all clients
    client_socket.on('msg', msg => {

      // change the msg to the form `John: <msg>`
      msg = `${client_socket.name}: ${msg}`

      // log the msg being sent clients
      // log(msg)

      // send the msg to all clients
      for (const client_socket_id in client_sockets) {
        const soc = client_sockets[client_socket_id]
        soc.emit('msg', msg)
      }
    })


    // deal with
    client_socket.on('update', ({score, plr_y, high_score, dead}) => {

      // save the client's score, high_score, plr_y
      client_socket.score = score
      client_socket.high_score = high_score
      client_socket.plr_y = plr_y

      // detect a change the the dead state
      if (!client_socket.dead && dead) {

        // TODO: trake death statistics

        // log where a player has died
        // log(`${client_socket.full_name} died at ${score}`)
      }
      // save the client's death state
      client_socket.dead = dead

      // clear prev timeout
      if (client_socket.timeout) {
        clearTimeout(client_socket.timeout)
      }

      // if you haven't heard from a player for 1/timeout_freq secs, kill them
      client_socket.timeout = setTimeout(() => {
        client_socket.dead = true
      }, 1e3 / timeout_freq)
    })

    // on a client disconnect, remove it from the map, and log it
    client_socket.on('disconnect', () => {
      delete client_sockets[client_socket.id]
      // log(`${client_socket.full_name} disconnected`)

      for (const id in client_sockets) return

      if (bar_stop) clearInterval(bar_stop)
      if (msg_stop) clearInterval(msg_stop)
    })
  })
}
