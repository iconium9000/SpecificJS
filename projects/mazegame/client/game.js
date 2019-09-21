module.exports = (project_name) => {

  const MazeGame = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const pi2 = Math.PI * 2

  const node_color = `#808080`
  const line_color = `#ffffff`
  const node_radius = 1 / 60
  const line_width = node_radius / 4
  const node_diameter = 2*node_radius

  const portal_radius = 3*node_radius
  const hight_scale = 1.1

  MazeGame.node_color = node_color
  MazeGame.line_color = line_color
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

  MazeGame.remove_line = remove_line
  function remove_line(game, line) {
    const line_idx = game.lines.indexOf(line)
    log('remove_line', line_idx)
    game.lines.splice(line_idx, 1)
  }

  MazeGame.remove_node = remove_node
  function remove_node(game, node) {

    for (var line_idx = 0; line_idx < game.lines.length; ++line_idx) {
      const line = game.lines[line_idx]

      if (line.node_a == node || line.node_b == node) {
        remove_line(game, line)
        --line_idx
      }
    }

    const node_idx = game.nodes.indexOf(node)
    game.nodes.splice(node_idx, 1)

    for (const player_id in game.players) {
      const player = game.players[player_id]

      if (player.node == node) {
        player.node = null
      }
    }
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

    var min_dist2 = min_dist*min_dist
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

  MazeGame.line_cross = line_cross
  function line_cross( line_a, line_b, check_duplicate ) {

    if (check_duplicate) {
      if (line_a.node_a == line_b.node_a && line_a.node_a == line_b.node_b) {
        return true
      }
      if (line_a.node_b == line_b.node_a && line_a.node_b == line_b.node_b) {
        return true
      }
    }

    if (line_a.node_a == line_b.node_a || line_a.node_a == line_b.node_b) {
      return false
    }
    if (line_a.node_b == line_b.node_a || line_a.node_b == line_b.node_b) {
      return false
    }

    const p111 = line_a.node_a.x, p112 = line_a.node_a.y
    const p121 = line_a.node_b.x, p122 = line_a.node_b.y
    const p211 = line_b.node_a.x, p212 = line_b.node_a.y
    const p221 = line_b.node_b.x, p222 = line_b.node_b.y

    const p222_212 = p222 - p212, p221_211 = p221 - p211
    const p122_112 = p122 - p112, p121_111 = p121 - p111

    const p11 = ( p111 - p211 ) * p222_212 > ( p112 - p212 ) * p221_211
    const p12 = ( p121 - p211 ) * p222_212 > ( p122 - p212 ) * p221_211
    const p21 = ( p211 - p111 ) * p122_112 > ( p212 - p112 ) * p121_111
    const p22 = ( p221 - p111 ) * p122_112 > ( p222 - p112 ) * p121_111

    return p11 != p12 && p21 != p22
  }

  MazeGame.check_is_valid_line = check_is_valid_line
  function check_is_valid_line ( game, node_a, node_b, check_duplicate ) {
    if ( !node_a || !node_b || node_a == node_b ) {
      return false
    }

    for ( const idx in game.lines ) {
      const line = game.lines[ idx ]

      if (line_cross(line, {node_a: node_a, node_b: node_b}, check_duplicate)) {
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
      links: [],
      rooms: [],
    }

    // export nodes
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.idx = node_idx

      const new_node = {
        x: node.x, y: node.y,
        links: [],
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

      const bax = line.node_b.x - line.node_a.x
      const bay = line.node_b.y - line.node_a.y

      const link_a = {
        line: new_line,
        node: new_line.node_b,
        angle: Math.atan2(bay, bax),
        side: true,
        idx: new_game.links.length
      }
      new_game.links.push(link_a)
      new_line.node_a.links.push(link_a)
      new_line.link_a = link_a

      const link_b = {
        line: new_line,
        node: new_line.node_a,
        angle: Math.atan2(-bay, -bax),
        side: false,
        idx: new_game.links.length,
      }
      new_game.links.push(link_b)
      new_line.node_b.links.push(link_b)
      new_line.link_b = link_b

      link_a.other_link = link_b
      link_b.other_link = link_a
    }

    // setup rooms
    {

      // assign next_links
      for (const node_idx in new_game.nodes) {
        const new_node = new_game.nodes[node_idx]
        new_node.links.sort(({angle:angle_a},{angle:angle_b}) => angle_b-angle_a)

        for (var link_idx = 0; link_idx < new_node.links.length; ++link_idx) {
          const link_a = new_node.links[link_idx].other_link
          const link_b = new_node.links[(link_idx+1)%new_node.links.length]

          link_a.next_link = link_b
        }
      }

      // create rooms
      for (const link_idx in new_game.links) {
        var link = new_game.links[link_idx]

        if (link.room) {
          continue
        }

        const link_hash = {}
        const room = {
          idx: new_game.rooms.length,
          links: [],
          nodes: [],
          cords: [],
        }
        const nodes = room.nodes
        const cords = room.cords
        new_game.rooms.push(room)

        // trace links
        while (!link_hash[link.idx]) {
          link_hash[link.idx] = link
          link.room = room
          room.links.push(link)
          nodes.push(link.node)


          link = link.next_link
        }

        for (var link_a_idx = 0; link_a_idx < room.links.length; ++link_a_idx) {
          const link_a = room.links[link_a_idx]
          const link_b = link_a.next_link
          const node_a = link_a.node

          const cord = {
            node_a: link_a.line.node_a,
            node_b: link_a.line.node_b,
            length2: -1,
          }
          cords.push(cord)

          const angle_a = link_a.other_link.angle
          const angle_c = link_b.angle

          for (var link_c_idx = link_a_idx+2; link_c_idx < room.links.length; ++link_c_idx) {
            const link_c = room.links[link_c_idx]
            const node_b = link_c.node

            const bax = node_b.x - node_a.x
            const bay = node_b.y - node_a.y
            const angle_b = Math.atan2(bay, bax)

            const angle_ac = angle_a < angle_c
            if ((angle_a < angle_b) == angle_ac && (angle_b < angle_c) == angle_ac) {
              const cord = {
                node_a: node_a,
                node_b: node_b,
                length2: bax*bax + bay*bay,
              }
              cords.push(cord)
            }
          }

        }

        // sort cords by length2
        cords.sort(({length2:a}, {length2:b}) => a-b)

        for (var cord_a_idx = 0; cord_a_idx < cords.length; ++cord_a_idx) {
          const cord_a = cords[cord_a_idx]
          for (var cord_b_idx = cord_a_idx+1; cord_b_idx < cords.length; ++cord_b_idx) {
            const cord_b = cords[cord_b_idx]

            if (cord_b.length2 > 0 && line_cross(cord_a, cord_b, true)) {
              cords.splice(cord_b_idx--, 1)
            }
          }
        }
        // log(cords)
      }
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

    // log('solve_game', new_game)
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
    const diameter_line = get_line(game, px, py, node_diameter)

    switch (player.state) {
      case 'node':

        if (!diameter_node || diameter_node == player.node) {

          if (player.node) {
            const tx = player.node.x, ty = player.node.y

            player.node.x = px
            player.node.y = py

            for (const link_idx in player.node.links) {
              const line = player.node.links[link_idx].line

              if (!check_is_valid_line(game, line.node_a, line.node_b, false)) {
                // log('bad move')
                player.node.x = tx
                player.node.y = ty

                return
              }
            }

            player.node = null
            return `moved and deselected node`
          }
          else if (diameter_line) {
            var q = point_on_line( diameter_line, px, py )

            if ( !get_node( game, q.x, q.y, node_diameter) ) {

              const node_a = diameter_line.node_a
              const node_b = diameter_line.node_b

              const new_node = {
                x: q.x, y: q.y,
              }
              diameter_line.node_b = new_node
              game.nodes.push(new_node)

              const new_line = {
                node_a: new_node,
                node_b: node_b,
              }
              game.lines.push(new_line)

              return `split line`
            }

            return
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

        var other_node = diameter_node

        if (!other_node) {

          var q = diameter_line && point_on_line( diameter_line, px, py )
          if ( q && !get_node( game, q.x, q.y, node_diameter) ) {

            const node_a = diameter_line.node_a
            const node_b = diameter_line.node_b

            other_node = {
              x: q.x, y: q.y,
            }
            diameter_line.node_b = other_node
            game.nodes.push(other_node)

            const new_line = {
              node_a: other_node,
              node_b: node_b,
            }
            game.lines.push(new_line)
          }
          else {
            other_node = {
              x: px, y: py,
            }
            game.nodes.push(other_node)
          }
        }

        if (check_is_valid_line(game, other_node, player.node, true)) {
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
