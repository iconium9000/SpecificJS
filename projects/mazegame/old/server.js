module.exports = (project) => {
  const project_name = 'MazeGame Old:'
  const client_sockets = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  log('server.js')

  project.socket.on('connection', (client_socket) => {
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
  })
}
