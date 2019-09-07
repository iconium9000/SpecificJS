var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

var functions = require('./client/game.js')

module.exports = server_init
var client_sockets = {}

// ---------------------------------------------------------------------------------------

function server_init() {
  log('server_init')

  return client_socket_init
}

// ---------------------------------------------------------------------------------------

function update_game(game, reason, caller) {

  var to_send = functions.export(game, `'${caller.name}' ${reason}`)

  for (var soc_id in game.players) {
    var soc = client_sockets[soc_id]
    if (soc) {
      soc.emit('update', to_send)
    }
    else {
      delete game.players[soc_id]
      game.state = 'over'
      update_game(game, 'disappeared', game.players[soc_id])
      return
    }
  }
}

// ---------------------------------------------------------------------------------------

function find_idle_game_and_connect_to_it(client_socket) {

  log('find_idle_game_and_connect_to_it', client_socket.id)

  for (var soc_id in client_sockets) {
    var soc = client_sockets[soc_id]
    var game = soc.game

    if (game) {
      log(soc.id, game.state, game.n_players, functions.colors.length)
    }
    if (game && game.state == 'idle' && game.n_players < functions.colors.length) {
      client_socket.game = soc.game
      soc.game.players[client_socket.id] = client_socket.player
      ++game.n_players
      log(game)
      update_game(soc.game, 'joined', client_socket.player)
      return
    }
  }

  var player = client_socket.player
  var game = {
    players: {},
    n_players: 0,
    state: 'idle',
    nodes: [],
    lines: [],
  }
  client_socket.game = game
  game.players[client_socket.id] = player
  ++game.n_players
  player.node = null
  update_game(game, 'created game', player)
}

// ---------------------------------------------------------------------------------------

function client_socket_init(client_socket) {
  client_socket.emit('connect')

  client_sockets[client_socket.id] = client_socket
  client_socket.game = null
  client_socket.player = {
    name: null,
    id: client_socket.id,
    n_nodes: 0,
    n_lines: 0,
    n_fountains: 0,
    n_knives: 0,
  }

  client_socket.on('client name', ({name}) => {
    log('client name', name)
    client_socket.name = name
    client_socket.player.name = name
    client_socket.full_name = `'${name}' (${client_socket.id})`
    log(`${client_socket.full_name} connected`)

    if (!client_socket.game) {
      find_idle_game_and_connect_to_it(client_socket)
    }
    else {
      update_game(client_socket.game, 'was renamed', client_socket)
    }
  })

  client_socket.on('mouse up', (x,y) => {
    var game = client_socket.game
    if (!game) {
      find_idle_game_and_connect_to_it(client_socket)
      return
    }

    var caller = client_socket.player
    var action = functions.player_act_at(game, caller, x, y)

    if (action) {
      update_game(game, action, caller)
    }

    if (functions.update_game_state(game)) {
      game.state = functions.next_state[game.state]
      update_game(game, `changed state to ${game.state}`, caller)
    }
  })

  client_socket.on('disconnect', () => {
    delete client_sockets[client_socket.id]
    log(`${client_socket.full_name} disconnected`)

    var game = client_socket.game
    if (game) {
      client_socket.game = null
      delete game.players[client_socket.id]
      game.state = 'over'

      update_game(game, 'disconnected', client_socket.player)
    }
  })
}
