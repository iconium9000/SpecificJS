module.exports = (project, projects, super_require) => {
  const project_name = 'Solver:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2
  const fs = require('fs')

  const clients = {}
  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }
    clients[client.socket.id] = client

    client.socket.emit('connect')

    client.socket.on('client name', ({name}) => {
      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`
    })

    client.socket.on(`disconnect`, () => {
      delete clients[client.socket.id]
    })
  })

  log('server.js')
}
