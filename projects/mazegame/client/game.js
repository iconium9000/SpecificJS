module.exports = (project_name) => {

  const MazeGame = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2

  const node_color = `#808080`
  const node_radius = 1 / 60
  const line_width = node_radius / 3
  const node_diameter = 2*node_radius

  const portal_radius = 3*node_radius
  const hight_scale = 1.1

  MazeGame.node_color = node_color
  MazeGame.node_radius = node_radius
  MazeGame.line_width = line_width
  MazeGame.node_diameter = node_diameter
  MazeGame.portal_radius = portal_radius
  MazeGame.hight_scale = hight_scale

  const states = {
    node: {
      key: 'n',
    },
    wall: {
      key: 'w',
    },
  }
  const state_keys = {}
  for (const name in states) {
    const state = states[name]
    state.name = name
    state_keys[state.key] = state
  }
  MazeGame.states = states
  MazeGame.state_keys = state_keys


  MazeGame.get_game = get_game
  function get_game(client) {
    const new_game = {
      players: {},
      nodes: [],
      lines: [],
    }

    const new_player = {
      get name() {
        return client.name
      },
      get id() {
        return client.socket.id
      },
      node: null,
      state: 'node',
    }
    new_game.players[new_player.id] = new_player

    return new_game
  }

  MazeGame.get_node = get_node
  function get_node( game, px, py, min_dist ) {

    const min_dist2 = min_dist*min_dist
    var ret_node = null

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]

      const nx = px-node.x, ny = py-node.y
      const dist = nx*nx + ny*ny

      if ( min_dist2 > dist) {
        min_dist = dist
        ret_node = node
      }
    }

    return ret_node
  }

  MazeGame.point_on_line = point_on_line
  function point_on_line ( line, px, py ) {

    const ax = line.node_a.x, ay = line.node_a.y
    const bx = line.node_b.x, by = line.node_b.y

    const bax = bx - ax, bay = by - ay
    const pax = px - ax, pay = py - ay
    const p = ( pax*bax + pay*bay ) / ( bax*bax + bay*bay )

    if ( p > 1 || 0 > p ) {
      return { x: Infinity, y: Infinity }
    }

    const qx = ax + bax*p
    const qy = ay + bay*p

    return { x: qx, y: qy }
  }

  MazeGame.get_line_dist2 = get_line_dist2
  function get_line_dist2 ( line, px, py ) {

    const q = point_on_line( line, px, py )
    const qx = px - q.x, qy = py - q.y

    return qx*qx + qy*qy

  }

  MazeGame.get_line = get_line
  function get_line ( game, px, py, min_dist ) {

    const min_dist2 = min_dist*min_dist
    var ret_line = null

    for ( const idx in game.lines ) {
      const line = game.lines[idx]

      const line_dist2 = get_line_dist2( line, px, py )

      if ( min_dist2 > line_dist2 ) {
        min_dist2 = line_dist2
        ret_line = line
      }
    }

    return ret_line
  }

  MazeGame.check_is_valid_line = check_is_valid_line
  function check_is_valid_line ( game, node_a, node_b ) {
    if ( !node_a || !node_b || node_a == node_b ) {
      return false
    }

    const p111 = node_a.x, p112 = node_a.y, p121 = node_b.x, p122 = node_b.y

    for ( const idx in game.lines ) {
      const line = game.lines[ idx ]

      if (line.node_a == node_a && line.node_b == node_b) {
        return false
      }
      else if (line.node_b == node_a && line.node_a == node_b) {
        return false
      }

      if (line.node_a == node_a || line.node_a == node_b) {
        continue
      }
      if (line.node_b == node_a || line.node_b == node_b) {
        continue
      }

      const p211 = line.node_a.x, p212 = line.node_a.y
      const p221 = line.node_b.x, p222 = line.node_b.y
      const p222_212 = p222 - p212, p221_211 = p221 - p211
      const p122_112 = p122 - p112, p121_111 = p121 - p111

      const p11 = ( p111 - p211 ) * p222_212 > ( p112 - p212 ) * p221_211
      const p12 = ( p121 - p211 ) * p222_212 > ( p122 - p212 ) * p221_211
      const p21 = ( p211 - p111 ) * p122_112 > ( p212 - p112 ) * p121_111
      const p22 = ( p221 - p111 ) * p122_112 > ( p222 - p112 ) * p121_111

      if ( p11 != p12 && p21 != p22 ) {
        return false
      }
    }

    return true
  }

  MazeGame.solve_game = solve_game
  function solve_game(game) {
    const new_game = {
      players: [],
      nodes: [],
      lines: [],
    }

    // export nodes
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.idx = node_idx

      const new_node = {
        x: node.x, y: node.y,
        links: {},
      }
      new_game.nodes.push(new_node)
    }

    // export lines
    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]
      line.idx = line_idx

      const new_line = {
        node_a: new_game.nodes[line.node_a.idx],
        node_b: new_game.nodes[line.node_b.idx],
      }
      new_game.lines.push(new_line)

      const link_a = {
        line: new_line,
        node: new_line.node_b,
      }
      new_line.node_a.links[line.node_a.idx] = link_a
      new_line.link_a = link_a

      const link_b = {
        line: new_line,
        node: new_line.node_a,
      }
      new_line.node_b.links[line.node_b.idx] = link_b
      new_line.link_b = link_b
    }

    // export players
    for (const player_id in game.players) {
      const player = game.players[player_id]

      const new_player = {
        id: player.id,
        name: player.name,
        state: player.state,
        node: player.node && new_game.nodes[player.node.idx],
      }
      new_game.players[new_player.id] = new_player

    }

    return new_game
  }

  MazeGame.act_at = act_at
  function act_at(game, player_id, px, py) {

    const player = game.players[player_id]

    if (!player) {
      return
    }

    const radius_node = get_node(game, px, py, node_radius)
    const diameter_node = get_node(game, px, py, node_diameter)

    switch (player.state) {
      case 'node':


        if (!diameter_node) {
          if (player.node) {
            player.node.x = px
            player.node.y = py
            player.node = null
            return `moved and deselected node`
          }
          else {
            const new_node = {
              x: px,
              y: py,
            }
            game.nodes.push(new_node)
            return `added new node`
          }
        }
        else if (player.node == diameter_node){
          player.node = null
          return `deselected node`
        }
        else {
          player.node = diameter_node
          return `selected node`
        }

      case 'door':
      case 'laser':
      case 'wall':

        const no_diameter_node = !diameter_node
        const other_node = diameter_node || {
          x: px, y: py,
        }
        no_diameter_node && game.nodes.push(other_node)

        if (check_is_valid_line(game, other_node, player.node)) {
          const new_line = {
            node_a: other_node,
            node_b: player.node,
          }
          game.lines.push(new_line)
          player.node = other_node
          return `created line`
        }
        else if (player.node == other_node) {
          player.node = null
          return `deselected node`
        }
        else {
          player.node = other_node
          return `selected node`
        }
    }

  }

  log('game.js')
  return MazeGame
}
