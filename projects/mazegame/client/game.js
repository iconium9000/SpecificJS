module.exports = (project_name) => {

  const MazeGame = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const pi = Math.PI
  const pi2 = pi * 2

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

      if (line.root_node == node || line.spot_node == node) {
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

    const ax = line.root_node.x, ay = line.root_node.y
    const bx = line.spot_node.x, by = line.spot_node.y

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
  function line_cross( line_a, line_b, check_dup ) {

    if (check_dup) {
      if (line_a.root_node == line_b.root_node && line_a.root_node == line_b.spot_node) {
        return true
      }
      if (line_a.spot_node == line_b.root_node && line_a.spot_node == line_b.spot_node) {
        return true
      }
    }

    if (line_a.root_node == line_b.root_node || line_a.root_node == line_b.spot_node) {
      return false
    }
    if (line_a.spot_node == line_b.root_node || line_a.spot_node == line_b.spot_node) {
      return false
    }

    const p111 = line_a.root_node.x, p112 = line_a.root_node.y
    const p121 = line_a.spot_node.x, p122 = line_a.spot_node.y
    const p211 = line_b.root_node.x, p212 = line_b.root_node.y
    const p221 = line_b.spot_node.x, p222 = line_b.spot_node.y

    const p222_212 = p222 - p212, p221_211 = p221 - p211
    const p122_112 = p122 - p112, p121_111 = p121 - p111

    const p11 = ( p111 - p211 ) * p222_212 > ( p112 - p212 ) * p221_211
    const p12 = ( p121 - p211 ) * p222_212 > ( p122 - p212 ) * p221_211
    const p21 = ( p211 - p111 ) * p122_112 > ( p212 - p112 ) * p121_111
    const p22 = ( p221 - p111 ) * p122_112 > ( p222 - p112 ) * p121_111

    return p11 != p12 && p21 != p22
  }

  MazeGame.check_is_valid_line = check_is_valid_line
  function check_is_valid_line ( game, root_node, spot_node, check_dup ) {
    if ( !root_node || !spot_node || root_node == spot_node ) {
      return false
    }

    for ( const idx in game.lines ) {
      const line = game.lines[ idx ]

      if (line_cross(line, {root_node: root_node, spot_node: spot_node}, check_dup)) {
        return false
      }
    }

    return true
  }

  function inverse_angle(angle) {
    return angle + pi > pi ? angle - pi : angle + pi
  }

  function get_angle_rank(a, b, c) {
    return a < c ? (b - c) / (a - c) :
      a < b ? (b - c - pi2) / (a - c - pi2) : b < c ? (b - c) / (a - c - pi2) : -1
  }

  // broken
  function insert_sort(sorted_array, spot_element, sort_by) {

    const sorted_array_length = sorted_array.length
    var mult = Math.floor( sorted_array_length / 2 )
    var root_idx = mult
    const spot_value = spot_element[sort_by]

    while (true) {

      if (sorted_array_length <= root_idx) {
        sorted_array.push(spot_element)
        return sorted_array_length
      }
      else if (root_idx <= 0) {
        sorted_array.splice(0, 0, spot_element)
        return 0
      }

      const root_value = sorted_array[root_idx][sort_by]

      if (mult == 0) {
        if (spot_value >= root_value) {
          ++root_idx
        }
        sorted_array.splice(root_idx, 0, spot_element)
        return root_idx
      }

      mult = Math.floor( mult / 2 )

      if (root_value < spot_value) {
        root_idx += mult || 1
      }
      else if (spot_value < root_value) {
        root_idx -= mult || 1
      }
      else {
        sorted_array.splice(++root_idx, 0, spot_element)
        return root_idx
      }
    }
  }

  MazeGame.solve_game = solve_game
  function solve_game(game, log) {
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

      const bax = line.spot_node.x - line.root_node.x
      const bay = line.spot_node.y - line.root_node.y

      const new_line = {
        root_node: new_game.nodes[line.root_node.idx],
        spot_node: new_game.nodes[line.spot_node.idx],
        length2: bax*bax + bay*bay
      }
      new_game.lines.push(new_line)

      const link_a = {
        idx: new_game.links.length,
        line: new_line,
        root_node: new_line.root_node,
        spot_node: new_line.spot_node,
        bax: bax, bay: bay,
        angle: Math.atan2(bay, bax),
        side: true,
        cords: [],
      }
      new_game.links.push(link_a)
      new_line.root_node.links.push(link_a)
      new_line.link_a = link_a

      const link_b = {
        idx: new_game.links.length,
        line: new_line,
        root_node: new_line.spot_node,
        spot_node: new_line.root_node,
        bax: -bax, bay: -bay,
        angle: Math.atan2(-bay, -bax),
        side: false,
        cords: [],
      }
      new_game.links.push(link_b)
      new_line.spot_node.links.push(link_b)
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
        const new_room = {
          idx: new_game.rooms.length,
          links: [],
          cords: [],
        }
        new_game.rooms.push(new_room)

        // trace links
        while (!link_hash[link.idx]) {
          link_hash[link.idx] = link
          link.room = new_room
          new_room.links.push(link)
          link = link.next_link
        }

        // make cords
        const n_links = new_room.links.length
        for (var root_idx = 0; root_idx < n_links; ++root_idx) {
          const root_link = new_room.links[root_idx]
          const root_next_link = root_link.next_link

          const cord = {
            root_node: root_link.spot_node,
            spot_node: root_next_link.spot_node,
            link: root_next_link,
            length2: -1,
            angle_rank: 1,
            other_cord: null,
          }
          new_room.cords.push(cord)
          root_next_link.cords.push(cord)

          const root_angle = inverse_angle(root_link.angle)
          const root_next_angle = root_next_link.angle

          for (var spot_idx = root_idx + 2; spot_idx < n_links; ++spot_idx) {

            const spot_link = new_room.links[root_idx]
            const spot_next_link = spot_link.next_link

            log(root_idx, spot_idx, spot_link.spot_node == root_link.spot_node)


            if (spot_link.spot_node == root_link.spot_node) {
              continue
            }

            const bax = spot_link.spot_node.x - root_link.spot_node.x
            const bay = spot_link.spot_node.y - root_link.spot_node.y

            const root_cord_angle_rank = get_angle_rank(
              root_angle,
              Math.atan2(bay, bax),
              root_next_angle)

            if (1 < root_cord_angle_rank || root_cord_angle_rank < 0) {
              continue
            }

            const spot_cord_angle_rank = get_angle_rank(
              inverse_angle(spot_link.angle),
              Math.atan2(-bay, -bax),
              spot_next_link.angle)

            if (1 < spot_cord_angle_rank || spot_cord_angle_rank < 0) {
              continue
            }

            const length2 = bax*bax + bay*bay

            const root_cord = {
              root_node: root_link.spot_node,
              spot_node: spot_link.spot_node,
              link: root_next_link,
              length2: length2,
              angle_rank: root_cord_angle_rank,
            }
            new_room.cords.push(root_cord)
            root_next_link.cords.push(root_cord)

            const spot_cord = {
              root_node: spot_link.spot_node,
              spot_node: root_link.spot_node,
              link: spot_next_link,
              length2: length2,
              angle_rank: spot_cord_angle_rank,
            }
            new_room.cords.push(spot_cord)
            spot_next_link.cords.push(spot_cord)

            root_cord.other_cord = spot_cord
            spot_cord.other_cord = root_cord
          }

        }
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

              if (!check_is_valid_line(game, line.root_node, line.spot_node, false)) {
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

              const root_node = diameter_line.root_node
              const spot_node = diameter_line.spot_node

              const new_node = {
                x: q.x, y: q.y,
              }
              diameter_line.spot_node = new_node
              game.nodes.push(new_node)

              const new_line = {
                root_node: new_node,
                spot_node: spot_node,
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

            const root_node = diameter_line.root_node
            const spot_node = diameter_line.spot_node

            other_node = {
              x: q.x, y: q.y,
            }
            diameter_line.spot_node = other_node
            game.nodes.push(other_node)

            const new_line = {
              root_node: other_node,
              spot_node: spot_node,
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
            root_node: other_node,
            spot_node: player.node,
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
