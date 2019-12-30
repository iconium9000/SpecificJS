module.exports = (project, projects, super_require) => {
  const project_name = 'MazeGame:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2
  const fs = require('fs')
  const file_name = __dirname + '/MazeGame.json'

  const clients = {}
  const MazeGame = {}
  const super_classes = ['Lib','Point']
  const classes = [
    'Type','Target',
    'Lock','Laser','Slot',
    'Wall','Door','Header','Portal',
    'Key','Jack',
    'Editor','Level','Game'
  ]
  super_classes.forEach(name => MazeGame[name] = super_require(
    `./projects/menu/client/${name}.js`
  )(MazeGame))
  classes.forEach(name => MazeGame[name] = require(
    `./client/src/${name}.js`
  )(MazeGame))

  let game = null
  try {
    const serial = JSON.parse(fs.readFileSync(file_name).toString('utf8'))
    game = MazeGame.Game.read(serial)
  }
  catch {
    game = MazeGame.Game.init()
  }

  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }
    client.socket.on('serial', (serial) => {
      if (serial) {
        try {
          game = MazeGame.Type.read(serial)
          const {editors} = game
          for (const id in editors) editors[id].remove()

          serial = game.serialize()
          project.socket.emit('serial', serial)

          const string = JSON.stringify(serial,null,' ')
          fs.writeFile(file_name, string, 'utf8', log)
        }
        catch (e) {
          log(e)
        }
      }
      else {
        client.socket.emit('serial', game.serialize())
      }
    })

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
