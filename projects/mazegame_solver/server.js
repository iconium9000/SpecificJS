module.exports = (project, projects, super_require) => {
  const project_name = 'Solver:'
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2
  const fs = require('fs')
  const shell = require('shelljs')
  const file_name = __dirname + '/Solver.txt'

  const clients = {}
  let file = '{}'
  try { file = fs.readFileSync(file_name).toString('utf8') }
  catch (e) { log(e) }
  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      name: null,
      full_name: null,
    }
    clients[client.socket.id] = client

    client.socket.emit('connect')
    client.socket.emit('serial', file)

    client.socket.on('client name', ({name}) => {
      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`
    })
    client.socket.on('serial', serial => {
      if (serial) {
        try {
          fs.writeFile(file_name, serial, 'utf8', log)
          file = serial
        }
        catch (e) { log(e) }
      }
      else client.socket.emit('serial', file)
    })
    client.socket.on('solve', string => {
      // DO NOT TRUST: string
      try {
        const array = string.replace(/\n/g, '').split(' ')
        string = ''
        for (let i in array) {
          const int = parseInt(array[i])
          if (int >= 0) string += ` ${int}`
        }
        log(string)
        shell.cd(__dirname)
        // shell.exec(`g++ -o app solver.cpp`)
        shell.exec(`./app${string}`)
      }
      catch (e) {
        log(e)
      }
    })

    client.socket.on(`disconnect`, () => {
      delete clients[client.socket.id]
    })
  })



  log('server.js')
}
