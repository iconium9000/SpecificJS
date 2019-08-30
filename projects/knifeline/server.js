var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

module.exports = server_init

function server_init() {
  log('server_init')

  return client_socket_init
}

var client_sockets = {}

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

  client_socket.on('update', ({}) => {

  })

  client_socket.on('disconnect', () => {
    delete client_sockets[client_socket.id]
    log(`${client_socket.full_name} disconnected`)
  })
}
