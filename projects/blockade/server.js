  var proj_name = 'Blockade:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

module.exports = server_init

function server_init() {
  log('server_init')

  return client_socket_init
}

var update_freq = 40    // updates per sec
var timeout_freq = 10   // timeouts per sec
var line_width = 6
var bar_start = 1 + 0.1
var bar_width_min = 1/30
var bar_hieght_min = 1/30
var bar_width = 1/8
var bar_height = 1/10
var bar_freq = 4/1      // bar spawn per sec
var max_bar_freq = 7/1
var bar_speed  = 2/3    // w per sec

var client_sockets = {}

setInterval(() => {
  var w = bar_width_min + bar_width * Math.random()
  var h = bar_hieght_min + bar_height * Math.random()
  var x = bar_start
  var y = Math.random() * (1 - h)

  for (var client_socket_id in client_sockets) {
    var client_socket = client_sockets[client_socket_id]
    client_socket.emit('new bar', x, y, w, h)
  }
}, 1e3/bar_freq)

setInterval(() => {
  var msg = {
    plrs: {},
    high_score: 0,
  }

  for (var client_socket_id in client_sockets) {
    var client_socket = client_sockets[client_socket_id]

    if (msg.high_score < client_socket.high_score) {
      msg.high_score = client_socket.high_score
    }

    msg.plrs[client_socket_id] = {
      name: client_socket.name,
      score: client_socket.score,
      plr_y: client_socket.plr_y,
      dead: client_socket.dead,
      high_score: client_socket.high_score,
    }
  }

  for (var client_socket_id in client_sockets) {
    var client_socket = client_sockets[client_socket_id]
    client_socket.emit('update', msg)
  }

}, 1e3/update_freq)

function client_socket_init(client_socket) {
  client_sockets[client_socket.id] = client_socket

  client_socket.on('client name', msg => {
    client_socket.name = msg.name
    client_socket.full_name = `'${msg.name}' (${client_socket.id})`
    log(`${client_socket.full_name} connected`)
  })

  client_socket.on('msg', msg => {
    msg = `${client_socket.name}: ${msg}`
    log(msg)
    for (var client_socket_id in client_sockets) {
      var soc = client_sockets[client_socket_id]
      soc.emit('msg', msg)
    }
  })

  client_socket.on('update', ({score, plr_y, high_score, dead}) => {
    // log('update', score)
    client_socket.score = score
    client_socket.high_score = high_score
    client_socket.plr_y = plr_y
    if (!client_socket.dead && dead) {
      // TODO
      log(`${client_socket.full_name} died at ${score}`)
    }
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

  client_socket.on('disconnect', () => {
    delete client_sockets[client_socket.id]
    log(`${client_socket.full_name} disconnected`)
  })
}
