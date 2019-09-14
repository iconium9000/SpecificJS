const proj_name = 'Knifeline:'
const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
const err = console.error

const functions = require('./client/game.js')

const client_sockets = {}
const all_players = {}

module.exports = () => {
  log('server_init')

  return {
    client_sockets: client_sockets,
    add_client_socket: client_socket_init,
  }
}

function update_socket(client_socket, reason, optional_client_name) {
  if (!client_socket) {
    return
  }

  const player = client_socket.player

  if (!client_socket.game) {

    for (const other_client_socket_id in client_sockets) {
      const other_client_socket = client_sockets[other_client_socket_id]
      const game = other_client_socket && other_client_socket.game

      if (game && game.state == 'idle' && game.n_players < functions.max_n_players) {
        client_socket.game = game
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

  var reason = `${optional_client_name || client_socket.name} ${reason}`

  const games = []
  for (const client_socket_id in client_sockets) {
    const client_socket = client_sockets[client_socket_id]
    const game = client_socket && client_socket.game
    if (game) {
      if (!game.export) {
        game.reason = reason
        game.export = functions.export(game)
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

function client_socket_init(client_socket) {

  client_socket.emit('connect')
  client_sockets[ client_socket.id ] = client_socket

  client_socket.game = null
  const player = {
    name: null,
    color: functions.default_color,
    id: client_socket.id,
    n_nodes: 0, n_lines: 0, n_fountains: 0, n_knives: 0,
    get state() {
      return client_socket.game ? client_socket.game.state : 'idle'
    }
  }
  client_socket.player = player
  all_players[player.id] = player

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

    const action = functions.player_act_at(game, player, x, y)
    if (action) {
      update_socket(client_socket, action)
    }
    if (functions.update_game_state(game)) {
      game.state = functions.next_state[game.state]
      update_socket(client_socket, `changed state to ${game.state}`)
    }
    else if (game.state == 'over') {
      client_socket.game = null
      player.color = functions.default_color
      update_socket(client_socket, `restarted game`)
    }
  })

  client_socket.on(`disconnect`, () => {
    log(`${client_socket.full_name} disconnected`)

    delete client_sockets[client_socket.id]
    delete all_players[player.id]

    if (!client_socket.game) {
      return
    }

    client_socket.game.state = 'over'
    update_socket(client_socket, `disconnected`)
  })
}
