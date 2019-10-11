module.exports = (project, projects, Lib) => {
  const project_name = 'MazeGame:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2

  const MazeGame = require('./client/game.js')(project_name, Lib)

  // let game = MazeGame.get_game()
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

      // MazeGame.get_editor(game, client)
      // const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      // project.socket.emit('update', game_export, 'client name')
    })

    client.socket.on(`disconnect`, () => {
      delete client[client.socket.id]
      // delete game.editors[client.socket.id]
    })
  })

  log('server.js')
}
