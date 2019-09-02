var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error
var msgs = []



var functions = require('./client/game.js')

var node_grab_radius = functions.node_grab_radius
var line_grab_radius = functions.line_grab_radius
var noise = functions.noise
var colors = functions.colors

module.exports = server_init
var client_sockets = {}

// -----------------------------------------------------------------------------
// Client Socket Manip

function server_init() {
  log('server_init')

  return client_socket_init
}

function update_game(game, reason, caller) {
  // log('update_game', game)

  var n_players = 0
  var players = {}
  for (var soc_id in game.players) {
    var player = game.players[soc_id]
    players[soc_id] = player
    ++n_players
  }

  if (game.state == 'idle') {
    for (var player_id in players) {
      var player = players[player_id]
      player.n_nodes = 3
      player.n_lines = n_players < 6 ? n_players + 1 : 6
      player.n_fountains = 2
      player.n_knives = 2
    }
  }

  var nodes = []
  for (var i in game.nodes) {
    var node = game.nodes[i]
    node.idx = nodes.length
    var temp_node = {
      idx: node.idx,
      state: node.state,
      player: node.player.id,
      x: node.x, y: node.y,
    }
    nodes.push(temp_node)
  }
  var lines = []
  for (var i in game.lines) {
    var line = game.lines[i]
    var temp_line = {
      node_a: line.node_a.idx,
      node_b: line.node_b.idx,
      player_a: line.player_a.id,
      player_b: line.player_b.id,
      player: line.player.id,
      state_a: line.state_a,
      state_b: line.state_b,
    }
    lines.push(temp_line)
  }

  var to_send = {
    n_players: n_players,
    players: players,
    nodes: nodes,
    lines: lines,
    state: game.state,
    caller: caller,
    reason: reason,
  }

  // log('to_send', to_send
  functions.copy_game(game, Infinity)

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

function find_idle_game_and_connect_to_it(client_socket) {

  log('find_idle_game_and_connect_to_it', client_socket.id)

  for (var soc_id in client_sockets) {
    var soc = client_sockets[soc_id]
    var game = soc.game

    if (game) {
      log(soc.id, game.state, game.n_players, colors.length)
    }
    if (game && game.state == 'idle' && game.n_players < colors.length) {
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

    var state = game.state
    functions.check_game_state(game)
    if (game.state != state) {
      update_game(game, `changed state to ${game.state}`, caller)
    }
  })
  client_socket.on('mouse down', (x,y) => {

  })

  client_socket.on('msg', msg => {
    msg = `${client_socket.name}: ${msg}`
    log(msg)
    for (var soc_id in client_sockets) {
      var soc = client_sockets[soc_id]
      soc.emit('msg', msg)
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
