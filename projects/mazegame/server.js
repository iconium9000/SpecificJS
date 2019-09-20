module.exports = (project) => {
  const project_name = 'MazeGame:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2
  const MazeGame = require('./client/game.js')(project_name)

  const clients = {}

  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }

    client.socket.emit('connect')

    client.socket.on('client name', ({name}) => {

      clients[client.socket.id] = client

      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`

    })

    client.socket.on(`disconnect`, () => {
      delete client[client.socket.id]
      if (client.name) {
        log(client.socket.id + ` disconnected`)
      }
    })
  })

  log('server.js')
}
