module.exports = ({socket:menu_socket},{app,socket_io}) => {
  const proj_name = 'Greed:'
  const log = (...msg) => console.log(proj_name, ...msg)
  const fs = require('fs')

  log('server.js')

  const game_names = {}

  menu_socket.on('connection', menu_connect)

  function get_score() {

  }

  function menu_connect(_menu_socket) {
    let index = 'greed'
    const menu_id = '/' + _menu_socket.id.split('#').pop()
    const game_socket = socket_io.of(menu_id)

    _menu_socket.on('update', () => _menu_socket.emit('update', game_names))

    app.get(menu_id, (req,res) => {
      res.sendFile(`${__dirname}/client/${index}.html`)
      index = 'index'
    })
    game_socket.on('connection', game_connect)
  }

  function game_connect(_game_socket) {
    let index = 'greed'
    const game_id = '/' + _game_socket.id.split('#').pop()
    const client_socket = socket_io.of(game_id)
    const game = {
      clients: {},
      turn: null,
      state: 'start',
    }

    _game_socket.on('client name', ({name}) => {
      game_names[game_id] = `Join ${name}'s game`
      menu_socket.emit('update', game_names)
    })

    _game_socket.on('disconnect', () => {
      delete game_names[game_id]
      menu_socket.emit('update', game_names)
      client_socket.emit('yeet')
      index = 'index'
    })

    app.get(game_id, (req,res) => {
      res.sendFile(`${__dirname}/client/${index}.html`)
    })

    client_socket.on('connection', client_connect)

    client_connect(_game_socket)

    function update() {
      client_socket.emit('update', game)
      _game_socket.emit('update', game)
    }

    function client_connect(_client_socket) {
      const client_id = _client_socket.id.split('#').pop()
      const client = game.clients[client_id] = {
        name: client_id,
        id: client_id,
        total_score: 0,
        turn_score: 0,
        play_score: 0,
      }

      _client_socket.on('client name', ({name}) => {
        game.msg = `${client.name} was renamed ${name}`
        client.name = name

        if (game.state == 'start') {
          game.turn = client_id
          game.state = '#rollwait#'
          game.dice = [-1,-1,-1,-1,-1,-1]
        }

        update()
      })

      _client_socket.on('#roll#', () => {
        if (game.state == '#rollwait#' && game.turn == client_id) {

        }
      })

      _client_socket.on('disconnect', () => {
        delete game.clients[client_id]
        game.msg = `${client.name} left the game`
        update()
      })
    }
  }



}
