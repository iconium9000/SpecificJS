const proj_name = 'MazeGame:'
const client_sockets = {}
const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
const err = console.error

log('server.js')

module.exports = () => {
  log('server_init')

  return {
    client_sockets: client_sockets,
    add_client_socket: client_socket_init,
  }
}

function client_socket_init(client_socket) {
  client_sockets[client_socket.id] = client_socket

  client_socket.emit('connect')

  client_socket.on('client name', ({name}) => {

    client_socket.name = name
    client_socket.full_name = `'${name}' (${client_socket.id})`

  })

  client_socket.on(`disconnect`, () => {
    delete client_sockets[client_socket.id]
    log(client_socket.id + ` disconnected`)
  })
}
