var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

var node_grab_radius = 1/10
var line_grab_radius = 1/10
var noise = 1e-8

log('game.js')

module.exports = {

  node_grab_radius: node_grab_radius,
  line_grab_radius: line_grab_radius,
  noise: noise,

  get_node: function (game, x, y) {
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
  },

  get_line: function (game, px, py) {
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
  },

  check_is_valid_line: function (game, node_a, node_b) {
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

  copy_game: function (game, total_length) {
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
        length: Math.sqrt(x*x + y*y) + Math.random() * noise,
      }
      new_game.lines.push(new_line)
      new_line.node_a.lines.push(new_line)
      new_line.node_b.lines.push(new_line)
    }

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
          min_length = length + Math.random() * noise
        }
      }

      // log('min_length', min_length)

      if (new_game.cumulative_length > total_length - min_length) {
        min_length = total_length - new_game.cumulative_length
      }

      if (min_length == Infinity || min_length < 0) {
        break
      }

      min_length += Math.random() * noise
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
  }
}
