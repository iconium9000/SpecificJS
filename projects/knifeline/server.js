const proj_name = 'Knifeline:'
const client_sockets = {}
const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
const err = console.error

const Knifeline = require('./client/game.js')

const all_players = {}

module.exports = () => {
  log('server_init')

  return {
    client_sockets: client_sockets,
    add_client_socket: client_socket_init,
  }
}

function check_game(client_socket) {
  const player = client_socket.player


  if (client_socket.game) {
    return
  }

  for (const other_client_socket_id in client_sockets) {
    const other_client_socket = client_sockets[other_client_socket_id]
    const game = other_client_socket && other_client_socket.game

    if (game && game.state == 'idle' && game.n_players < Knifeline.max_n_players) {
      client_socket.game = game
      break
    }
  }

  if (!client_socket.game) {
    client_socket.game = {
      n_players: 0,
      players: {},
      other_players: all_players,
      nodes: [], lines: [],
      state: 'idle',
    }
  }

  ++client_socket.game.n_players
  client_socket.game.players[client_socket.id] = player
}

function update_socket(client_socket, reason, optional_client_name) {
  if (!client_socket) {
    return
  }

  check_game(client_socket)

  reason = `${optional_client_name || client_socket.name} ${reason}`
  const games = []
  for (const client_socket_id in client_sockets) {
    const client_socket = client_sockets[client_socket_id]
    const game = client_socket && client_socket.game
    if (game) {
      if (!game.export) {
        game.reason = reason
        Knifeline.set_game_padding(game)
        game.export = Knifeline.export(game)
        games.push(game)
      }
      client_socket.emit('update', game.export)
    }
  }
  for (const game_idx in games) {
    const game = games[game_idx]
    delete game.export
  }
}

function disconnect_client_socket(client_socket) {
  log(`${client_socket.full_name} disconnected`)

  delete client_sockets[client_socket.id]
  delete all_players[client_socket.id]
  const game = client_socket.game

  if (!game) {
    return
  }

  if (game.state == 'idle') {
    for (const client_socket_id in game.players) {
      const client_socket = client_sockets[client_socket_id]
      if (client_socket) {
        client_socket.game = null
        check_game(client_socket)
      }
    }
  }
  else {
    game.state = 'over'
    for (const player_id in game.players) {
      const player = game.players[player_id]
      for (const state in Knifeline.n_state) {
        const n_state = Knifeline.n_state[state]
        player[n_state] = 0
      }
    }
  }
  update_socket(client_socket, `disconnected`)
  client_socket.game = null
}

function start_check_active_interval(client_socket) {
  client_sockets[ client_socket.id ] = client_socket
  all_players[client_socket.player.id] = client_socket.player
}

function client_socket_init(client_socket) {

  client_socket.emit('connect')

  client_socket.game = null
  const player = {
    name: null,
    color: Knifeline.default_color,
    id: client_socket.id,
    n_nodes: 0, n_lines: 0, n_fountains: 0, n_knives: 0,
    get state() {
      return client_socket.game ? client_socket.game.state : 'idle'
    }
  }
  client_socket.player = player

  start_check_active_interval(client_socket)

  client_socket.on('client name', ({name}) => {

    client_socket.name = name
    client_socket.player.name = name
    client_socket.full_name = `'${name}' (${client_socket.id})`

    update_socket(client_socket, `was renamed`)
  })

  client_socket.on('mouse up', (x,y) => {

    const game = client_socket.game
    if (!game) {
      update_socket(client_socket, `clicked`)
      return
    }

    const action = Knifeline.player_act_at(game, player, x, y)
    if (action) {
      update_socket(client_socket, action)
    }
    if (Knifeline.update_game_state(game)) {
      game.state = Knifeline.next_state[game.state]
      update_socket(client_socket, `changed state to ${game.state}`)
    }
    else if (game.state == 'over') {
      client_socket.game = null
      player.color = Knifeline.default_color
      update_socket(client_socket, `restarted game`)
    }
  })

  client_socket.on(`disconnect`, () => {
    disconnect_client_socket(client_socket)
  })
}
