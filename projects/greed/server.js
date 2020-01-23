const proj_name = 'Greed:'
const log = (...msg) => console.log(proj_name, ...msg)

const game_names = {}
const ClientListener = require(__dirname + '/ClientListener.js')

module.exports = (
  {socket:menu_socket},{app,socket_io}
) => menu_socket.on('connection', _menu_socket => {
  let index = 'greed'
  const menu_id = '/' + _menu_socket.id.split('#').pop()
  const game_socket = socket_io.of(menu_id)

  _menu_socket.on('update', () => menu_socket.emit('update', game_names))

  // temporary page that only works once
  app.get(menu_id, (req,res) => {
    res.sendFile(`${__dirname}/client/${index}.html`)
    index = 'index'
  })

  game_socket.on('connection', _game_socket => {
    const cl = new ClientListener(game_names, socket_io, _game_socket)

    app.get(cl.game_id, (req,res) => {
      res.sendFile(`${__dirname}/client/${cl.index}.html`)
    })

    _game_socket.on('client name', ({name}) => {
      game_names[cl.game_id] = `Join ${name}'s game`
      menu_socket.emit('update', game_names)
    })

  })
})
