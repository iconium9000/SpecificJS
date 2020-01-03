module.exports = (project, projects, super_require) => {
  const project_name = 'MazeGame:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2
  const fs = require('fs')
  const file_name = __dirname + '/MazeGame.json'

  const enable_editor = true
  // const enable_editor = false

  const clients = {}
  const MazeGame = {}
  const super_classes = ['Lib','Point']
  const classes = [
    'Type','Target','Parse',
    'Lock','Laser','Slot','Button',
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
  catch (e) {
    console.log(e)
    game = MazeGame.Game.init()
  }

  try {
    const string = fs.readFileSync(__dirname + '/test.json').toString('utf8')

    console.log(new MazeGame.Parse(string))
  }
  catch (e) {
    console.log(e)
  }

  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }
    client.socket.on('serial', (serial) => {
      if (serial && enable_editor) {
        try {
          game = MazeGame.Type.read(serial)
          game.remove_editors()
          serial = game.serialize()
          project.socket.emit('serial', serial)

          let string = JSON.stringify(serial,null,' ')
          fs.writeFile(file_name, string, 'utf8', log)

          string = MazeGame.Lib.stringify(serial)
          fs.writeFile(__dirname + 'test.txt', string, 'utf8', log)

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
    client.socket.emit('enable_editor', enable_editor)

    client.socket.on('client name', ({name}) => {

      clients[client.socket.id] = client

      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`
    })

    client.socket.on(`disconnect`, () => {
      delete client[client.socket.id]
      // delete game.editors[client.socket.id]
    })
  })

  log('server.js')
}
