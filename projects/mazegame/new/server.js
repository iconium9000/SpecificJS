module.exports = (project, projects, super_require) => {
  const project_name = 'MazeGame New:'
  const log = (...msg) => console.log(project_name, ...msg)
  const fs = require('fs')
  const file_name = __dirname + '/MazeGame.txt'

  const devmode = true
  // const devmode = false

  const clients = {}
  const MazeGame = {}
  const super_classes = ['Lib','Point']
  const classes = [
    'Type','Target',
    'Lock','Laser','Slot','Button',
    'Wall','Door','Header','Portal',
    'Key','Jack','Node',
    'Editor','Level','Game'
  ]
  super_classes.forEach(name => MazeGame[name] = super_require(
    `./projects/menu/client/${name}.js`
  )(MazeGame))
  classes.forEach(name => MazeGame[name] = require(
    `./client/${name}.js`
  )(MazeGame))

  let game = null, serial
  try {
    serial = MazeGame.Lib.parse(fs.readFileSync(file_name).toString('utf8'))
    game = MazeGame.Game.read(serial)
  }
  catch (e) {
    console.log(e)
    game = MazeGame.Game.init()
  }

  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }
    client.socket.on('serial', (serial) => {
      if (serial && devmode) {
        try {
          game = MazeGame.Type.read(serial)
          game.remove_editors()
          serial = game.serialize()

          let string = MazeGame.Lib.stringify(serial)
          project.socket.emit('serial', string)

          fs.writeFile(file_name, string, 'utf8', log)
        }
        catch (e) {
          log(e)
        }
      }
      else {
        const serial = game.serialize()
        const string = MazeGame.Lib.stringify(serial)
        client.socket.emit('serial', string)
      }
    })

    client.socket.emit('connect')
    client.socket.emit('devmode', devmode)

    client.socket.on('client name', ({name}) => {

      clients[client.socket.id] = client

      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`
    })

    client.socket.on(`disconnect`, () => {
      delete clients[client.socket.id]
      // delete game.editors[client.socket.id]
    })
  })

  log('server.js')
}
