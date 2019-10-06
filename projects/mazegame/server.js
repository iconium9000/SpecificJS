module.exports = (project, projects, Lib) => {
  const project_name = 'MazeGame:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2

  const MazeGame = require('./client/game.js')(project_name, Lib)

  let game = MazeGame.get_game()
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

      MazeGame.get_editor(game, client)
      const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      project.socket.emit('update', game_export)
    })

    client.socket.on('update center mouse', (center, mouse) => {
      game = MazeGame.do_action(game, client, center, mouse, log)

      const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      project.socket.emit('update', game_export, 'mouse')
    })

    client.socket.on('update delete', () => {
      const editor = MazeGame.get_editor(game, client)

      if (editor.node) {
        const node_idx = game.nodes.indexOf(editor.node)
        game.nodes.splice(node_idx, 1)
      }

      if (editor.portal) {
        const portal_idx = game.portals.indexOf(editor.portal)
        game.portals.splice(portal_idx, 1)
      }


      const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      project.socket.emit('update', game_export, 'delete')
    })

    client.socket.on('update state', state => {
      const editor = MazeGame.get_editor(game, client, log)

      editor.state = state
      editor.node = null
      editor.portal = null
      editor.handle = null
      editor.key = null
      editor.jack = null

      const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      project.socket.emit('update', game_export, 'state')
    })

    client.socket.on(`disconnect`, () => {
      delete client[client.socket.id]
      delete game.editors[client.socket.id]

      const game_export = MazeGame.export_game(game = MazeGame.copy_game(game))
      project.socket.emit('update', game_export, 'disconnect')
    })
  })

  log('server.js')
}
