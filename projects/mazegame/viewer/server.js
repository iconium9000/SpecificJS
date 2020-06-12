module.exports = (project, {projects, super_require, app, socket_io}) => {
  const project_name = 'MazeGame Viwer:'
  const log = (...msg) => console.log(project_name, ...msg)

  const {name,socket,path} = project
  const clients = {}

  function update() {
    const _clients = {}
    for (const id in clients) {
      _clients[id] = clients[id].name
    }
    socket.emit('update', _clients)
  }

  projects.mazegame.socket.on('connection', (socket) => {
    const client = {
      name: socket.id,
      socket: socket,
      id: socket.id.split('#').pop()
    }
    clients[client.id] = client
    const listener = socket_io.of(`/${client.id}`)

    socket.on('client name', ({name}) => update(client.name = name))

    socket.on('disconnect', () => {
      listener.emit('disconnect')
      update(delete clients[client.id])
    })

    listener.on('connection', () => socket.emit('update'))
    socket.on('update', string => listener.emit('update', client.name, string))

    app.get(`/${client.id}`, (req, res) => {
      const viewer = clients[client.id] ? 'viewer' : 'index'
      res.sendFile(__dirname + `/client/${viewer}.html`)
    })
  })


  socket.on('connection', (socket) => {

    socket.on('update', update)

  })
}
