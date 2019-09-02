var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

log('game.js')

var f = module.exports = {

  node_grab_radius: 1 / 30,
  line_grab_radius: 1 / 20,
  sub_node_radius: 1 / 60,
  nub_radius: 1 / 120,
  noise: 1e-8,

  colors: ['#ff5050','#00ff80','#0080ff','#ff8000','#ff40ff',
    '#ffff40','#B22222','#00ffff', '#80ff00'],


  get_node: function(game, x, y) {
    var min_dist2 = f.node_grab_radius*f.node_grab_radius
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
  },

  get_line: function(game, px, py) {
    var min_dist2 = f.line_grab_radius * f.line_grab_radius
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
  },

  check_is_valid_node: function(game, x, y) {
    var r = f.node_grab_radius * 2

    if ( r > x || x > 1-r || r > y || y > 1-r ) {
      return false
    }

    var min_dist2 = r*r
    for (var idx in game.nodes) {
      var node = game.nodes[idx]
      var nx = node.x
      var ny = node.y

      var dist2 = (x-nx)*(x-nx) + (y-ny)*(y-ny)
      if (dist2 < min_dist2) {
        return false
      }
    }
    return true
  },

  check_is_valid_line: function(game, node_a, node_b) {
    if (node_a == node_b) {
      return false
    }

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
  },

  copy_game: function(game, total_length) {
    if (!(total_length > 0)) {
      total_length = 0
    }

    var new_game = {
      n_players: 0,
      players: {},
      nodes: [],
      lines: [],
      state: game.state,
      cumulative_length: 0,
    }

    // setup players
    for (var soc_id in game.players) {
      var player = game.players[soc_id]
      var new_player = {
        id: player.id,
        name: player.name,
        color: player.color,
        node: player.node,
        n_nodes: player.n_nodes,
        n_lines: player.n_lines,
        n_fountains: player.n_fountains,
        n_knives: player.n_knives,
        length: 0,
      }
      new_game.players[new_player.id] = new_player
      ++new_game.n_players
    }
    // setup nodes
    for (var idx in game.nodes) {
      var node = game.nodes[idx]
      var new_node = {
        idx: node.idx = new_game.nodes.length,
        x: node.x, y: node.y,
        player: new_game.players[node.player.id],
        state: node.state,
        lines: [],
      }
      new_game.nodes.push(new_node)
    }

    var sub = f.node_grab_radius * 2

    // setup lines
    for (var idx in game.lines) {
      var line = game.lines[idx]
      var x = line.node_a.x - line.node_b.x
      var y = line.node_a.y - line.node_b.y
      var new_line = {
        node_a: new_game.nodes[line.node_a.idx],
        node_b: new_game.nodes[line.node_b.idx],
        state_a: line.state_a,
        state_b: line.state_b,
        player_a: new_game.players[line.player_a.id],
        player_b: new_game.players[line.player_b.id],
        player: new_game.players[line.player.id],
        progress_a: 0,
        progress_b: 0,
        length: Math.sqrt(x*x + y*y) - sub + Math.random() * f.noise,
      }
      new_game.lines.push(new_line)
      new_line.node_a.lines.push(new_line)
      new_line.node_b.lines.push(new_line)
    }

    if (total_length > 0) {

      for (var node_idx in new_game.nodes) {
        var node = new_game.nodes[node_idx]

        if (node.state == 'idle') {
          continue
        }

        for (var line_idx in node.lines) {
          var line = node.lines[line_idx]

          if (line.node_a == node && line.state_a == 'idle') {
            line.state_a = node.state
            line.player_a = node.player
          }
          if (line.node_b == node && line.state_b == 'idle') {
            line.state_b = node.state
            line.player_b = node.player
          }
        }
      }
    }

    new_game.sanity = 1000
    while (new_game.sanity-- > 0) {
      var min_length = Infinity

      for (var idx in new_game.lines) {
        var line = new_game.lines[idx]
        var length = line.length - line.progress_a - line.progress_b

        if (line.state_a == 'fountain' && line.state_b == 'fountain') {
          length /= 2
        }
        else if (line.state_a != 'fountain' && line.state_b != 'fountain') {
          length = Infinity
        }

        // log('length', length)

        if (min_length > length && length > 0) {
          min_length = length + Math.random() * f.noise
        }
      }

      // log('min_length', min_length)

      if (new_game.cumulative_length > total_length - min_length) {
        min_length = total_length - new_game.cumulative_length
      }

      if (min_length == Infinity || min_length < 0) {
        break
      }

      min_length += Math.random() * f.noise
      new_game.cumulative_length += min_length

      for (var idx in new_game.lines) {
        var line = new_game.lines[idx]
        var length = line.length - line.progress_a - line.progress_b


        if (length < 0) {
          continue
        }

        if (line.state_a == 'fountain') {
          line.progress_a += min_length
        }
        if (line.state_b == 'fountain') {
          line.progress_b += min_length
        }

        var new_length = line.length - line.progress_a - line.progress_b

        if (new_length > 0) {
          continue
        }

        if (line.state_a == 'idle') {
          for (var line_idx in line.node_a.lines) {
            var node_line = line.node_a.lines[line_idx]

            if (node_line.node_a == line.node_a && node_line.state_a == 'idle') {
              node_line.state_a = 'fountain'
              node_line.player_a = line.player_b
            }
            if (node_line.node_b == line.node_a && node_line.state_b == 'idle') {
              node_line.state_b = 'fountain'
              node_line.player_b = line.player_b
            }
          }
        }

        if (line.state_b == 'idle') {
          for (var line_idx in line.node_b.lines) {
            var node_line = line.node_b.lines[line_idx]

            if (node_line.node_a == line.node_b && node_line.state_a == 'idle') {
              node_line.state_a = 'fountain'
              node_line.player_a = line.player_a
            }
            if (node_line.node_b == line.node_b && node_line.state_b == 'idle') {
              node_line.state_b = 'fountain'
              node_line.player_b = line.player_a
            }
          }
        }

      }
    }

    return new_game
  },

  check_game_state: function(game) {
    switch (game.state) {
      case 'idle':
        game.state = 'node'

        f.colors.sort(() => Math.random() - 0.5)

        var idx = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          player.color = f.colors[idx++]
        }
        return

      case 'node':
        var n_nodes = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          n_nodes += player.n_nodes
        }
        if (n_nodes <= 0) {
          game.state = 'line'
        }
        return

      case 'line':
        var n_lines = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          n_lines += player.n_lines
        }
        if (n_lines <= 0) {
          game.state = 'fountain'
        }
        return

      case 'fountain':
        var n_fountains = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          n_fountains += player.n_fountains
        }
        if (n_fountains <= 0) {
          game.state = 'knife'
        }
        return

      case 'knife':
        var n_knives = 0
        for (var soc_id in game.players) {
          var player = game.players[soc_id]
          n_knives += player.n_knives
        }
        if (n_knives <= 0) {
          game.state = 'over'
        }
        return

      default:
        return
    }
  },

  player_act_at: function(game, caller, x, y) {

    var node = f.get_node(game, x, y)
    var valid_node = f.check_is_valid_node(game, x, y)
    var line = f.get_line(game, x, y)
    var caller_node = caller.node
    if (caller_node) {
      caller_node = f.get_node(game, caller_node.x, caller_node.y)
    }

    switch (game.state) {
      case 'idle':
        return

      case 'node':

        if (node || caller.n_nodes <= 0 || !valid_node) {
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
        return 'placed node'

      case 'line':
        if (caller.n_lines <= 0 || (!node && !caller_node)) {
          return
        }
        else if (node == caller_node) {
          caller.node = null
          return 'unselected node'
        }
        else if (!caller_node) {
          caller.node = {
            x: node.x,
            y: node.y
          }
          return 'selected node'
        }
        else if (node && caller_node &&
          f.check_is_valid_line(game, node, caller_node))
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
          --caller.n_lines
          game.lines.push(line)
          node.lines.push(line)
          caller_node.lines.push(line)
          caller.node = null

          return 'placed line'
        }
        else {
          return
        }

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
          else if (node.state == 'fountain' && line && node.player != caller) {
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
        else if (line && valid_node) {
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
          return 'placed fountain'
        }
        else if (flag == 'knife') {
          --caller.n_knives
          return 'placed knife'
        }

        return

      case 'over':
        return

      default:
    }
  },

}
