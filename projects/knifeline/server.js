module.exports = (project) => {
  const project_name = `Knifeline:`
  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const clients = {}

  const Knifeline = require('./client/game.js')()

  log('server.js')

  function check_game(client) {

    if (client.game) {
      return
    }

    for (const other_client_id in clients) {
      const other_client = clients[other_client_id]
      const game = other_client && other_client.game

      if (game && game.n_players < Knifeline.max_n_players) {
        if (game.state == 'idle' || game.state == 'node') {
          client.game = game
          log(client.name + ' joined game')
          break
        }
      }
    }

    if (!client.game) {
      client.game = {
        n_players: 0,
        players: {},
        other_players: clients,
        nodes: [], lines: [],
        state: 'idle',
        n_nodes: 4,
        n_fountains: 3,
        n_knives: 2,
      }
    }

    const game = client.game
    ++game.n_players
    game.n_lines = game.n_players + 3

    if (!game.colors) {
      game.colors = Knifeline.colors.slice(0).sort(() => Math.random() - 0.5)
    }

    const player = {
      id: client.socket.id,
      client: client,
      get name() {
        return client.name
      },
      get full_name() {
        return client.full_name
      },
      color: game.colors.pop(),
      n_nodes: game.n_nodes,
      n_fountains: game.n_fountains,
      n_knives: game.n_knives,
    }
    client.color = player.color
    game.players[player.id] = player

    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]
      player.n_lines = game.n_lines
    }
  }

  function update_game(client, reason, optional_client_name) {
    if (!client) {
      return
    }

    check_game(client)

    const client_game = client.game
    reason = `${optional_client_name || client.name} ${reason}`
    log(reason)

    const games = []
    for (const client_id in clients) {
      const client = clients[client_id]
      const game = client && client.game
      if (game) {
        if (!game.export) {
          game.reason = reason
          Knifeline.set_game_padding(game)
          game.export = Knifeline.export_game(game)
          games.push(game)
        }
        client.socket.emit('update', game.export, game == client_game)
      }
    }
    for (const game_idx in games) {
      const game = games[game_idx]
      delete game.export
    }
  }

  function disconnect_client(client) {
    log(`${client.full_name} disconnected`)

    delete clients[client.socket.id]
    const game = client.game

    if (!game) {
      return
    }

    const player = game.players[client.socket.id]
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

    update_game(client, `disconnected`)
    client.game = null
  }

  project.socket.on('connection', (socket) => {

    const client = {
      socket: socket,
      game: null,
      name: null,
      full_name: null,
    }
    client.socket.emit('connect')

    log('connect', socket.id)
    clients[ client.socket.id ] = client


    client.socket.on('client name', ({name}) => {

      client.game = null
      client.name = name
      client.full_name = `'${name}' (${client.socket.id})`

      log(name + ' was renamed')

      update_game(client, `was renamed`)
    })

    client.socket.on('mouse up', (x,y) => {

      const game = client.game
      if (!game) {
        update_game(client, `clicked`)
        return
      }

      const player = game.players[ client.socket.id ]
      const action = Knifeline.player_act_at(game, player, x, y)
      if (action) {
        update_game(client, action)
      }
      if (Knifeline.update_game_state(game)) {
        game.state = Knifeline.next_state[game.state]
        update_game(client, `changed state to ${game.state}`)
      }
      else if (game.state == 'over') {
        client.game = null
        client.color = Knifeline.default_color
        update_game(client, `restarted game`)
      }
    })

    client.socket.on(`disconnect`, () => {
      disconnect_client(client)
    })

  })
}
