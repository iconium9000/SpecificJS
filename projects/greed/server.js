module.exports = ({socket:menu_socket},{app,socket_io}) => {
  const proj_name = 'Greed:'
  const log = (...msg) => console.log(proj_name, ...msg)

  log('server.js')

  const game_names = {}
  const score_map = [
    //   0     1     2     3     4     5     6
    [    0,    0,    0,    0,    0,    0,    0],  // 0
    [    0,  100,  200, 1000, 2000, 4000, 8000],  // 1
    [    0,    0,    0,  200,  400,  800, 1600],  // 2
    [    0,    0,    0,  300,  600, 1200, 2400],  // 3
    [    0,    0,    0,  400,  800, 1600, 3200],  // 4
    [    0,   50,  100,  500, 1000, 2000, 4000],  // 5
    [    0,    0,    0,  600, 1200, 2400, 4800],  // 6
    [    0,    0,    0,    0,    0,    0,    0],  // 7
  ]

  function randtime() {
    return 500 + Math.random() * 2000
  }

  function get_score(dice) {
    const count = [0, 0,0,0, 0,0,0, 0]
    for (const idx in dice) ++count[dice[idx]]

    let score = 0, idx = 0
    while (idx < 6) if (count[++idx] == 1) ++score
    if (score == 6) {
      dice.splice(0,6, 0,0,0, 0,0,0)
      return 3000
    }
    else score = 0


    idx = 0; while (idx < 6) if (count[++idx] == 2) ++score
    if (score == 3) {
      dice.splice(0,6, 0,0,0, 0,0,0)
      return 1000
    }
    else score = 0
    for (const val in count) score += score_map[val][count[val]]

    let die = 0; while (die < dice.length) {
      const val = dice[die]
      if (score_map[val][count[val]] > 0) dice.splice(die,1)
      else ++die
    }
    return score
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
    let index = 'greed', client_idx = 0; const client_queue = []
    const game_id = '/' + _game_socket.id.split('#').pop()
    const client_socket = socket_io.of(game_id)

    const game = {
      clients: {},
      state: '#wait#',
      turn_score: 0,
      roll_score: 0,
    }

    function emit(...argv) {
      client_socket.emit(...argv)
      _game_socket.emit(...argv)
    }

    _game_socket.on('client name', ({name}) => {
      game_names[game_id] = `Join ${name}'s game`
      menu_socket.emit('update', game_names)
    })

    _game_socket.on('disconnect', () => {
      delete game_names[game_id]

      // TODO
      // emit('yeet', index = 'index')
    })

    app.get(game_id, (req,res) => {
      res.sendFile(`${__dirname}/client/${index}.html`)
    })

    client_socket.on('connection', client_connect)

    client_connect(_game_socket)

    function client_connect(_client_socket) {
      const client_id = _client_socket.id.split('#').pop()
      const client = {
        name: client_id,
        id: client_id,
        total_score: 0,
        state: '#wait#',
      }

      function next() {
        client_queue.push(client_id)
        const {length} = client_queue, {clients} = game
        while (++client_idx < length) {
          const _client_id = client_queue[client_idx]
          const _client = clients[_client_id]
          if (_client) {
            game.turn = _client_id
            game.msg += `, now ${_client.name}'s turn`
            _client.state = game.state = '#rollwait#'
            emit('update', game)
            return
          }
        }
        emit('yeet') // should never happen
      }

      _client_socket.on('client name', ({name}) => {
        if (!game.clients[client_id]) {
          game.clients[client_id] = client
          client_queue.push(client_id)
        }

        if (game.state == '#wait#') {
          game.msg `${name} started game`
          game.turn = client_id
          client.state = game.state = '#rollwait#'
          game.dice = [0,0,0,0,0,0]
        }
        else game.msg = `${client.name} was renamed ${name}`

        client.name = name

        emit('update', game)
      })

      _client_socket.on('#roll#', () => {
        const {state,turn,dice,clients} = game
        if (turn != client_id) return
        else if (state == '#rollwait#') {
          for (const die in dice) dice[die] = 0
          game.msg = `${client.name} is rolling...`
          client.state = game.state = '#rolling#'

          emit('update', game)

          setTimeout(() => {
            for (const die in dice) if (dice[die] == 0) {
              dice[die] = Math.ceil(Math.random()*6)
            }
            const score = get_score(dice.slice())
            game.msg = `${client.name} rolled`
            if (score == 0) {
              game.msg += ` and lost`
              client.state = '#lost#'
              game.roll_score = game.turn_score = 0
              game.dice = [0,0,0,0,0,0]
              next()
            }
            else {
              client.state = game.state = '#filterwait#'
              emit('update', game)
            }
          }, randtime())
        }
      })

      _client_socket.on('#filter#', choices => {
        const {state,turn,dice} = game, _dice = dice.slice()
        if (turn != client_id) return
        else if (state == '#filterwait#') {
          for (const idx in choices) {
            const die = choices[idx]
            if (0 <= die && die < _dice.length) _dice[die] = 7
          }
          const score = get_score(_dice)

          if (score == 0) {
            client.state = '#filteragain#'
            emit('update',game)
            return
          }

          game.dice = _dice
          game.roll_score = score
          game.turn_score += score
          client.state = game.state = '#rollwait#'
          emit('update',game)
        }
      })

      _client_socket.on('#pass#', () => {
        const {turn,state,turn_score} = game
        if (turn != client_id) return
        else if (state == '#filterwait#') {
          client.state = '#pass#'
          client.msg = `${client.name} passed`
          client.score += turn_score
          next()
        }
      })

      _client_socket.on('disconnect', () => {
        // delete game.clients[client_id]
        // TODO
        // game.msg = `${client.name} left the game`
        // emit('update', game)

        emit('yeet', index = 'index')
      })
    }
  }

  menu_socket.on('connection', menu_connect)
}
