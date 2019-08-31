var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error
var msgs = []

var node_grab_radius = 1/10
var line_grab_radius = 1/10

module.exports = server_init
var client_sockets = {}

function server_init() {
  log('server_init')

  return client_socket_init
}

function get_node(game, x, y) {
  var min_dist2 = node_grab_radius*node_grab_radius
  var ret_node = null
  for (var idx in game.nodes) {
    var node = game.nodes[idx]
    var nx = node.x
    var ny = node.y

    var dist2 = (x-nx)*(x-nx) + (y-ny)*(y-ny)
    if (dist2 < min_dist2) {
      min_dist2 = dist2
      ret_node = node
    }
  }
  return ret_node
}

function get_line(game, px, py) {
  var min_dist2 = line_grab_radius * line_grab_radius
  var ret_line = null

  for (var idx in game.lines) {
    var line = game.lines[idx]
    var ax = line.node_a.x, ay = line.node_a.y
    var bx = line.node_b.x, by = line.node_b.y

    var bax = bx - ax, bay = by - ay
    var pax = px - ax, pay = py - ay

    var pa_dot_ba = pax * bax + pay * bay
    var ba_dist2 = bax * bax + bay * bay
    var mult = pa_dot_ba / ba_dist2
    if (1 > mult && mult > 0) {
      var dx = ax + bax * mult
      var dy = ay + bay * mult
      var pd_dist2 = (px-dx)*(px-dx) + (py-dy)*(py-dy)

      if (pd_dist2 < min_dist2) {
        min_dist2 = pd_dist2
        ret_line = line
        line.x = dx
        line.y = dy
      }
    }
  }

  return ret_line
}

function check_is_valid_line(game, node_a, node_b) {
  var aax = node_a.x, aay = node_a.y
  var abx = node_b.x, aby = node_b.y

  for (var i in game.line) {
    var line = game.lines[i]

    if (line.node_a == node_a && line.node_b == node_b) {
      return false
    }
    if (line.node_a == node_b && line.node_b == node_a) {
      return false
    }

    var bax = line.node_a.x, bay = line.node_a.y
    var bbx = line.node_b.x, bby = line.node_b.y

    var aa_ba_x = aax - bax, aa_ba_y = aay - bay
    var bb_ba_x = bbx - bax, bb_ba_y = bby - bay
    var ab_ba_x = abx - bax, ab_ba_y = aby - bay
    var ab_aa_x = abx - aax, ab_aa_y = aby - aay
    var bb_aa_x = bbx - aax, bb_aa_y = bby - aay

    var aa_ba_bb_ba = aa_ba_y * bb_ba_x - aa_ba_x * bb_ba_y
    var ab_ba_bb_ba = ab_ba_y * bb_ba_x - ab_ba_x * bb_ba_y
    var ab_aa_aa_ba = ab_aa_y * aa_ba_x - ab_aa_x * aa_ba_y
    var bb_aa_ab_aa = bb_aa_y * ab_aa_x - bb_aa_x * ab_aa_y
    if (aa_ba_bb_ba * ab_ba_bb_ba < 0 && ab_aa_aa_ba * bb_aa_ab_aa < 0) {
      return false
    }
  }
  return true
}

function update_game(game, reason, caller) {
  log('update_game', game)

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
      player: node.player,
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
      player_a: line.player_a,
      player_b: line.player_b,
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
    node_grab_radius: node_grab_radius,
    line_grab_radius: line_grab_radius,
  }

  log('to_send', to_send)

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

    if (soc.game && soc.game.state == 'idle') {
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
    var node = get_node(game, x, y)
    var line = get_line(game, x, y)
    var caller_node = caller.node
    if (caller_node) {
      caller_node = get_node(game, caller_node.x, caller_node.y)
    }

    switch (game.state) {
      case 'idle':
        game.state = 'node'
      case 'node':
        log('node', node, caller.n_nodes <= 0)

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
          check_is_valid_line(game, node, caller_node))
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
          else if (line) {
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
