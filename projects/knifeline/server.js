module.exports = (socket_io) => {
  const proj_name = 'Knifeline:'
  const client_sockets = {}
  const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
  const err = console.error

  const Knifeline = require('./client/game.js')()

  log('server_init')

  function check_game(client_socket) {

    if (client_socket.game) {
      return
    }

    for (const other_client_socket_id in client_sockets) {
      const other_client_socket = client_sockets[other_client_socket_id]
      const game = other_client_socket && other_client_socket.game

      if (game && game.n_players < Knifeline.max_n_players) {
        if (game.state == 'idle' || game.state == 'node') {
          client_socket.game = game
          // log(client_socket.name + ' joined game')
          break
        }
      }
    }

    if (!client_socket.game) {
      client_socket.game = {
        n_players: 0,
        players: {},
        other_players: client_sockets,
        nodes: [], lines: [],
        state: 'idle',
        n_nodes: 4,
        n_fountains: 3,
        n_knives: 2,
      }
    }

    const game = client_socket.game
    ++game.n_players
    game.n_lines = game.n_players + 3

    if (!game.colors) {
      game.colors = Knifeline.colors.slice(0).sort(() => Math.random() - 0.5)
    }

    const player = {
      id: client_socket.id,
      client_socket: client_socket,
      get name() {
        return client_socket.name
      },
      get full_name() {
        return client_socket.full_name
      },
      color: game.colors.pop(),
      n_nodes: game.n_nodes,
      n_fountains: game.n_fountains,
      n_knives: game.n_knives,
    }
    client_socket.color = player.color
    game.players[player.id] = player

    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]
      player.n_lines = game.n_lines
    }
  }

  function update_socket(client_socket, reason, optional_client_name) {
    if (!client_socket) {
      return
    }

    check_game(client_socket)

    const client_socket_game = client_socket.game
    reason = `${optional_client_name || client_socket.name} ${reason}`
    // log(reason)

    const games = []
    for (const client_socket_id in client_sockets) {
      const client_socket = client_sockets[client_socket_id]
      const game = client_socket && client_socket.game
      if (game) {
        if (!game.export) {
          game.reason = reason
          Knifeline.set_game_padding(game)
          game.export = Knifeline.export_game(game)
          games.push(game)
        }
        client_socket.emit('update', game.export, game == client_socket_game)
      }
    }
    for (const game_idx in games) {
      const game = games[game_idx]
      delete game.export
    }
  }

  function disconnect_client_socket(client_socket) {
    // log(`${client_socket.full_name} disconnected`)

    delete client_sockets[client_socket.id]
    const game = client_socket.game

    if (!game) {
      return
    }

    const player = game.players[client_socket.id]
    for (const state in Knifeline.n_states) {
      const n_state = Knifeline.n_states[state]
      player[n_state] = 0
    }

    if (game.state == 'idle' || game.state == 'node') {
      delete game.players[player.id]
      --game.n_players

      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        if (node.player == player) {
          delete game.nodes[node_idx]
        }
      }
    }

    update_socket(client_socket, `disconnected`)
    client_socket.game = null
  }

  function client_socket_init(client_socket) {

    // log('connect', client_socket.id)
    client_socket.emit('connect')
    client_sockets[ client_socket.id ] = client_socket

    client_socket.game = null

    client_socket.on('client name', ({name}) => {

      client_socket.name = name
      client_socket.full_name = `'${name}' (${client_socket.id})`

      // log(name + ' was renamed')

      update_socket(client_socket, `was renamed`)
    })

    client_socket.on('mouse up', (x,y) => {

      const game = client_socket.game
      if (!game) {
        update_socket(client_socket, `clicked`)
        return
      }

      const player = game.players[ client_socket.id ]
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
        client_socket.color = Knifeline.default_color
        update_socket(client_socket, `restarted game`)
      }
    })

    client_socket.on(`disconnect`, () => {
      disconnect_client_socket(client_socket)
    })

  }

  return {
    client_sockets: client_sockets,
    add_client_socket: client_socket_init,
  }
}
