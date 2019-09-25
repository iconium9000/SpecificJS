module.exports = (project_name) => {

  const MazeGame = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const pi = Math.PI
  const pi2 = pi * 2

  const noise = 1e-10
  MazeGame.noise = noise

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

    for ( let line_idx = 0; line_idx < game.lines.length; ++line_idx) {
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

    const vx = px - line.root_node.x, vy = py - line.root_node.y
    const p = ( vx * line.vx + vy * line.vy ) / line.length2

    if ( p > 1 || 0 > p ) {
      return { x: Infinity, y: Infinity }
    }

    const qx = line.root_node.x + line.vx * p
    const qy = line.root_node.y + line.vy * p

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

  MazeGame.get_room = get_room
  function get_room ( game, px, py, log ) {

    log = log || (()=>{})

    var ret_room = null
    var min_dist2 = Infinity

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[node_idx]
      node.px = px - node.x
      node.py = py - node.y
      node.dist2 = node.px*node.px + node.py*node.py
      node.angle = Math.atan2(node.py, node.px)
    }

    for ( const line_idx in game.lines ) {
      let link = game.lines[line_idx]

      const side = link.root_node.px * link.vy > link.root_node.py * link.vx
      if (side) {
        link = link.flip
      }

      if (link.root_node.dist2 == 0) {
        return
      }

      const dot = ( link.root_node.px*link.vx + link.root_node.py*link.vy ) / link.length2
      if (0 < dot && dot < 1) {

        const qx = link.root_node.x + link.vx * dot - px
        const qy = link.root_node.y + link.vy * dot - py

        const dist2 = qx*qx + qy*qy

        if (dist2 < min_dist2) {
          min_dist2 = dist2
          ret_room = link.room
        }
      }
      else {

        if (0 < dot) {
          link = link.next_link
        }

        if (link.root_node.dist2 < min_dist2) {
          const angle_rank = get_angle_rank(
            link.prev_link.flip.angle,
            link.angle,
            link.root_node.angle)

          if (0 < angle_rank && angle_rank < 1) {
            min_dist2 = link.root_node.dist2
            ret_room = link.room
          }
        }
      }
    }


    return ret_room

  }

  MazeGame.line_cross = line_cross
  function line_cross( line_a, line_b, check_dup) {

    if (check_dup) {
      if (line_a.root_node == line_b.root_node && line_a.spot_node == line_b.spot_node) {
        return true
      }
      if (line_a.spot_node == line_b.root_node && line_a.root_node == line_b.spot_node) {
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
  function check_is_valid_line ( game, root_node, spot_node, check_dup) {

    if ( !root_node || !spot_node || root_node == spot_node ) {
      return false
    }

    const temp_line = {
      root_node: root_node,
      spot_node: spot_node
    }

    for ( const idx in game.lines ) {
      const line = game.lines[ idx ]

      if (line_cross(line, temp_line, check_dup)) {
        return false
      }
    }

    return true
  }

  function inverse_angle(angle) {
    return angle + pi > pi ? angle - pi : angle + pi
  }

  /*
    given three angles a,f,t such that {-pi < a,f,t < pi}
      find the angle scaler (r) of t such that (f - a)r + a ~ t
      the purpose of this function is
        1st: determine whether t is a member of the set of angles spanning from a to f
        2nd: produce a value that can be used to sort angles between a and f
    if t == a -> r == 0
    if t == f -> r == 1

    angle rank of t is 0 < r < 1 iff
      t is a member of the set of angles spanning from a to f
  */
  function get_angle_rank(a, f, t) {
    return f < a ? (t - a) / (f - a) :
      f < t ? (t - a - pi2) / (f - a - pi2) : t < a ? (t - a) / (f - a - pi2) : -1
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
        idx: node_idx,
        x: node.x, y: node.y,
        links: [],
        cord_map: {},
      }
      new_game.nodes.push(new_node)
    }

    // export lines
    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]
      line.idx = line_idx

      const root_node = new_game.nodes[line.root_node.idx]
      const spot_node = new_game.nodes[line.spot_node.idx]

      const vx = spot_node.x - root_node.x
      const vy = spot_node.y - root_node.y

      const root_angle = Math.atan2(vy, vx)
      const spot_angle = Math.atan2(-vy, -vx)

      const length2 = vx*vx + vy*vy

      const new_line = {
        root_node: root_node,
        spot_node: spot_node,

        vx: vx, vy: vy,

        angle: root_angle,

        length2: length2,
        sort_length2: -1,
        angle_rank: 1,

        cords: [],
      }
      new_game.lines.push(new_line)

      const root_link = new_line
      root_link.line = new_line
      root_link.idx = new_game.links.length

      new_game.links.push(root_link)
      new_line.root_node.links.push(root_link)

      const root_cord = root_link
      root_cord.link = root_link

      const spot_link = {
        idx: new_game.links.length,
        line: new_line,

        root_node: spot_node,
        spot_node: root_node,

        vx: -vx, vy: -vy,

        angle: spot_angle,

        length2: length2,
        sort_length2: -1,
        angle_rank: 1,

        cords: [],
      }
      new_game.links.push(spot_link)
      new_line.spot_node.links.push(spot_link)

      const spot_cord = spot_link
      spot_cord.link = spot_link

      root_link.flip = spot_link
      spot_link.flip = root_link
    }

    // assign next_links
    for (const node_idx in new_game.nodes) {
      const new_node = new_game.nodes[node_idx]
      new_node.links.sort(({angle:a},{angle:b}) => b - a)

      for ( let link_idx = 0; link_idx < new_node.links.length; ++link_idx) {
        const link = new_node.links[link_idx].flip
        const next_link = new_node.links[(link_idx+1)%new_node.links.length]

        link.next_link = next_link
        next_link.prev_link = link
      }
    }

    // setup rooms
    for (const link_idx in new_game.links) {
      var link = new_game.links[link_idx]

      if (link.room) {
        continue
      }

      const new_room = {
        idx: new_game.rooms.length,
        root_link: link,

        links: [],
        cords: [],
        cells: [],
      }
      new_game.rooms.push(new_room)

      // trace links
      const link_hash = {}
      while (!link_hash[link.idx]) {
        link_hash[link.idx] = link
        link.room = new_room
        new_room.links.push(link)

        link.root_node.cord_map[link.spot_node.idx] = link
        new_room.cords.push(link)

        link = link.next_link
      }

      // log('rm', new_room.idx)

      // make cords
      const n_links = new_room.links.length
      for ( let root_idx = 0; root_idx < n_links; ++root_idx) {
        const root_link = new_room.links[root_idx]
        const flip_angle = root_link.prev_link.flip.angle
        const root_node = root_link.root_node

        for ( let spot_idx = root_idx + 2; spot_idx < n_links; ++spot_idx) {
          const spot_link = new_room.links[spot_idx]
          const spot_node = spot_link.root_node

          if (root_node.cord_map[spot_node.idx] || root_node == spot_node) {
            continue
          }

          const vx = spot_node.x - root_node.x
          const vy = spot_node.y - root_node.y

          const root_angle = Math.atan2(vy, vx)
          const root_angle_rank = get_angle_rank(
            flip_angle,
            root_link.angle,
            root_angle,
          )

          if (0 >= root_angle_rank || root_angle_rank >= 1) {
            continue
          }

          const spot_angle = Math.atan2(-vy, -vx)
          const spot_angle_rank = get_angle_rank(
            spot_link.prev_link.flip.angle,
            spot_link.angle,
            spot_angle,
          )

          if (0 >= spot_angle_rank || spot_angle_rank >= 1) {
            continue
          }

          const length2 = vx*vx + vy*vy
          const root_cord = {
            root_node: root_node,
            spot_node: spot_node,
            link: root_link,
            sort_length2: length2,
            length2: length2,
            angle_rank: root_angle_rank,
            angle: root_angle,
          }
          root_node.cord_map[spot_node.idx] = root_cord
          new_room.cords.push(root_cord)

          const spot_cord = {
            root_node: spot_node,
            spot_node: root_node,
            link: spot_link,
            sort_length2: length2,
            length2: length2,
            angle_rank: spot_angle_rank,
            angle: spot_angle,
          }
          spot_node.cord_map[root_node.idx] = spot_cord
          new_room.cords.push(spot_cord)

          spot_cord.flip = root_cord
          root_cord.flip = spot_cord
        }
      }

      new_room.cords.sort(({sort_length2:a}, {sort_length2:b}) => a-b)

      // remove excess cords
      for ( let root_idx = 0; root_idx < new_room.cords.length; ++root_idx) {
        const root_cord = new_room.cords[root_idx]

        var spot_idx = root_idx + 1 > n_links ? root_idx + 1 : n_links
        while (spot_idx < new_room.cords.length) {
          const spot_cord = new_room.cords[spot_idx++]

          if (line_cross(root_cord, spot_cord, false)) {
            new_room.cords.splice(--spot_idx, 1)
            delete spot_cord.root_node.cord_map[spot_cord.spot_node.idx]
            delete spot_cord.spot_node.cord_map[spot_cord.root_node.idx]
          }
        }

        // assign cord to its link
        root_cord.link.cords.push(root_cord)
      }

      // sort cords
      for (const link_idx in new_room.links) {
        const prev_link = new_room.links[link_idx]
        const link = prev_link.next_link

        link.cords.sort(({angle_rank:a}, {angle_rank:b}) => a-b)

        const prev_cord = prev_link
        const first_cord = link.cords[0]

        prev_cord.next_cord = first_cord
        first_cord.prev_cord = prev_cord

        for ( let cord_idx = 0; cord_idx < link.cords.length-1; ++cord_idx) {
          const cord = link.cords[cord_idx].flip
          const next_cord = link.cords[cord_idx + 1]

          cord.next_cord = next_cord
          next_cord.prev_cord = cord
        }
      }

      // make cells
      for (const cord_idx in new_room.cords) {
        const first_cord = new_room.cords[cord_idx]

        if (first_cord.cell) {
          continue
        }

        const secnd_cord = first_cord.next_cord
        const third_cord = secnd_cord && secnd_cord.next_cord

        if (third_cord && first_cord != third_cord && third_cord.next_cord == first_cord) {
          const cell = {
            cords: [first_cord, secnd_cord, third_cord],
            nodes: [first_cord.root_node, secnd_cord.root_node, third_cord.root_node],
          }
          first_cord.cell = cell
          secnd_cord.cell = cell
          third_cord.cell = cell
          new_room.cells.push(cell)
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
  function act_at(game, player_id, px, py, log) {

    if (!log) {
      log = ()=>{}
    }

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

        log('check_is_valid_line?')
        if (check_is_valid_line(game, other_node, player.node, true)) {
          const new_line = {
            root_node: player.node,
            spot_node: other_node,
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
