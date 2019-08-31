var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error
var msgs = []



var functions = require('./client/game.js')

var node_grab_radius = functions.node_grab_radius
var line_grab_radius = functions.line_grab_radius
var noise = functions.noise


var colors = ['#ff5050','#00ff80','#0080ff','#ff8000','#ff40ff',
  '#ffff40','#B22222','#00ffff', '#80ff00']

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

  for (var soc_id in client_sockets) {
    var soc = client_sockets[soc_id]
    var game = soc.game

    if (game && game.state == 'idle' && game.n_players < colors.length) {
      client_socket.game = soc.game
      soc.game.players[client_socket.id] = client_socket
      update_game(soc.game, 'joined', client_socket.player)
      return
    }
  }

  var player = client_socket.player
  var game = {
    players: {},
    state: 'idle',
    nodes: [],
    lines: [],
  }
  client_socket.game = game
  game.players[client_socket.id] = player
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
    var node = functions.get_node(game, x, y)
    var line = functions.get_line(game, x, y)
    var caller_node = caller.node
    if (caller_node) {
      caller_node = functions.get_node(game, caller_node.x, caller_node.y)
    }

    switch (game.state) {
      case 'idle':
        game.state = 'node'

        colors.sort(() => Math.random() - 0.5)

        var idx = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          player.color = colors[idx++]
        }
        update_game(game, 'started game', caller)

      case 'node':

        if (node || caller.n_nodes <= 0) {
          return
        }

        var node = {
          x: x, y: y,
          lines: [],
          player: caller,
          state: 'idle',
        }
        --caller.n_nodes
        game.nodes.push(node)

        var n_nodes = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          n_nodes += player.n_nodes
        }
        if (n_nodes <= 0) {
          game.state = 'line'
        }
        update_game(game, 'placed node', caller)
        return
      case 'line':
        if (caller.n_lines <= 0) {
          return
        }
        else if (!caller_node) {
          if (node) {
            caller.node = {
              x: node.x,
              y: node.y
            }
            update_game(game, 'selected node', caller)
          }
        }
        else if (node && node != caller_node &&
          functions.check_is_valid_line(game, node, caller_node))
        {
          var line = {
            node_a: node,
            node_b: caller_node,
            state_a: 'idle',
            state_b: 'idle',
            player_a: node.player,
            player_b: caller_node.player,
            player: caller,
          }
          game.lines.push(line)
          node.lines.push(line)
          caller_node.lines.push(line)
          caller.node = null

          --caller.n_lines

          var n_lines = 0
          for (var soc_id in game.players) {
            var player = game.players[soc_id]
            n_lines += player.n_lines
          }
          if (n_lines <= 0) {
            game.state = 'fountain'
          }

          update_game(game, 'placed line', caller)
        }
        else {
          caller.node = null
          update_game(game, 'unselected node', caller)
        }

        return
      case 'fountain':
        if (caller.n_fountains <= 0) {
          return
        }
      case 'knife':
        if (caller.n_knives <= 0) {
          return
        }

        var flag = 'idle'
        if (node) {
          if (node.state == 'idle') {
            node.state = game.state
            node.player = caller

            for (var idx in node.lines) {
              var line = node.lines[idx]
              if (line.node_a == node) {
                line.player_a = caller
                line.state_a = 'idle'
              }
              if (line.node_b == node) {
                line.player_b = caller
                line.state_b = 'idle'
              }
            }

            flag = game.state
          }
          else if (line && node.player != caller) {
            if (line.node_a == node && line.state_a == 'idle') {
              line.state_a = game.state
              line.player_a = caller
              flag = game.state
            }
            if (line.node_b == node && line.state_b == 'idle') {
              line.state_b = game.state
              line.player_b = caller
              flag = game.state
            }
          }
        }
        else if (line) {
          game.lines.splice(game.lines.indexOf(line), 1)
          line.node_a.lines.splice(line.node_a.lines.indexOf(line), 1)
          line.node_b.lines.splice(line.node_b.lines.indexOf(line), 1)

          var node = {
            x: line.x, y: line.y,
            lines: [],
            player: caller,
            state: game.state
          }
          game.nodes.push(node)

          var line_a = {
            node_a: line.node_a,
            node_b: node,
            player_a: line.player_a,
            player_b: caller,
            player: caller,
            state_a: line.state_a,
            state_b: 'idle',
          }
          game.lines.push(line_a)
          line.node_a.lines.push(line_a)
          node.lines.push(line_a)

          var line_b = {
            node_a: node,
            node_b: line.node_b,
            player_a: caller,
            player_b: line.player_b,
            player: caller,
            state_a: 'idle',
            state_b: line.state_b,
          }
          game.lines.push(line_b)
          node.lines.push(line_b)
          line.node_b.lines.push(line_b)

          flag = game.state
        }

        if (flag == 'fountain') {
          --caller.n_fountains

          var n_fountains = 0
          for (var soc_id in game.players) {
            var player = game.players[soc_id]
            n_fountains += player.n_fountains
          }
          if (n_fountains <= 0) {
            game.state = 'knife'
          }

          update_game(game, 'placed fountain', caller)
        }
        else if (flag == 'knife') {
          --caller.n_knives

          var n_knives = 0
          for (var soc_id in game.players) {
            var player = game.players[soc_id]
            n_knives += player.n_knives
          }
          if (n_knives <= 0) {
            game.state = 'over'
          }

          update_game(game, 'placed knife', caller)
        }
        else {
          log('flag', flag)
        }
        return

      case 'over':
        find_idle_game_and_connect_to_it(client_socket)
        return

      default:
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
