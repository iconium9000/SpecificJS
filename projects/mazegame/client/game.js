module.exports = (project_name) => {

  const MazeGame = {}
  const log = (...msg) => console.log(project_name, ...msg)
  const pi = Math.PI
  const pi2 = pi * 2

  const noise = 1e-10
  MazeGame.noise = noise

  const node_radius = 1 / 120
  const line_width = node_radius / 2
  const node_diameter = 2*node_radius
  const node_diameter2 = node_diameter*node_diameter

  const portal_radius = 3*node_radius
  const hight_scale = 1.1

  MazeGame.node_radius = node_radius
  MazeGame.line_width = line_width
  MazeGame.node_diameter = node_diameter
  MazeGame.portal_radius = portal_radius
  MazeGame.hight_scale = hight_scale

  const states = {
    node: {
      key: 'n',
      stroke_color: gate => '#ffffff80',
      fill_color: gate => '#ffffff',
    },
    wall: {
      key: 'w',
      stroke_color: gate => '#ffffff80',
      fill_color: gate => '#00000080',
    },
    door: {
      key: 'd',
      stroke_color: gate => '#00ff0080',
      fill_color: gate => '#00800080',
    },
    handle: {
      key: 'h',
      stroke_color: gate => '#ffffff80',
      fill_color: gate => '#00800080',
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
      editors: {},
      nodes: [],
      lines: [],
    }

    const new_editor = {
      get name() {
        return client.name
      },
      get id() {
        return client.socket.id
      },
      node: null,
      state: 'node',
    }
    new_game.editors[new_editor.id] = new_editor

    return new_game
  }

  MazeGame.copy_game = copy_game
  function copy_game(game) {

    const new_game = {
      nodes: [],
      lines: [],
      links: [],
      editors: [],
    }

    // copy nodes
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.idx = node_idx

      const new_node = {
        x: node.x, y: node.y,
        state: node.state,
      }
      new_game.nodes.push(new_node)
    }

    // copy lines/links
    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]
      line.idx = line_idx

      const root_node = new_game.nodes[line.root_node.idx]
      const spot_node = new_game.nodes[line.spot_node.idx]

      if (root_node && spot_node) {
        const new_line = {
          root_node: root_node,
          spot_node: spot_node,
          state: line.state,
          flip: {
            root_node: spot_node,
            spot_node: root_node,
            state: line.state,
          }
        }
        new_line.flip.flip = new_line
        new_game.lines.push(new_line)
        new_game.links.push(new_line, new_line.flip)
      }
    }

    // copy editors
    for (const editor_id in game.editors) {
      const editor = game.editors[editor_id]

      const new_editor = {
        id: editor.id,
        name: editor.name,
        state: editor.state,
        node: editor.node && new_game.nodes[editor.node.idx],
      }
      new_game.editors[new_editor.id] = new_editor

    }

    return new_game
  }

  // game: copy_game
  // sets the focus of all nodes to px,py
  // sorts nodes based on their distance from px,py
  //
  function set_game_focus(game, px, py) {
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      node.px = px - node.x
      node.py = py - node.y
      node.dist2 = node.px*node.px + node.py*node.py
      node.angle = Math.atan2(node.py, node.px)
    }
    node.sort(({dist2:a}, {dist2:b}) => a - b)

    for (const line_idx in game.lines) {
      let line = game.lines[line_idx]

      line.vx = line.spot_node.x - line.root_node.x
      line.vy = line.spot_node.y - line.root_node.y
      line.length2 = line.vx*line.vx + line.vy*line.vy
      line.angle = Math.atan2(line.vy, line.vx)

      line.flip.vx = -line.vx
      line.flip.vy = -line.vy
      line.flip.length2 = line.length2
      line.flip.angle = inverse_angle(line.angle)

      if (line.root_node.px * line.vy > line.root_node.py * line.vx) {
        line = line.flip
        game.lines[line_idx] = line
      }

      line.dot = ( line.root_node.px*line.vx + line.root_node.py*line.vy ) / line.length2
      line.px = px - (link.root_node.x + link.vx * dot)
      line.py = py - (link.root_node.y + link.vy * dot)
      line.dist2 = line.px*line.px + line.py*line.py

      line.flip.dot = 1 - line.dot
      line.flip.px = line.px
      line.flip.py = line.py
      line.flip.dist2 = line.dist2
    }
    node.sort(({dist2:a}, {dist2:b}) => a - b)

    return game
  }

  // game: measure_links
  function check_is_valid_game (game) {

    for (let root_idx = 0; root_idx < game.lines.length; ++root_idx) {
      const root_line = game.lines[root_idx]
      const root_node = root_line.root_node

      // make sure no line touches a node
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]

        if (node == root_node || root_line.spot_node == node) {
          continue
        }

        const px = node.x - root_node.x
        const py = node.y - root_node.y

        const dot = ( px*root_line.vx + py*root_line.vy ) / root_line.length2
        if (0 < dot && dot < 1) {

          const qx = px + root_line.vx * dot
          const qy = py + root_line.vy * dot

          if (qx*qx + qy*qy < node_diameter2) {
            return false
          }
        }
      }

      // make sure no line crosses another line
      for (let spot_idx = root_idx + 1; spot_idx < game.lines.length; ++spot_idx) {
        const spot_line = game.lines[spot_line]

        if (root_line.root_node != spot_line.root_node &&
            root_line.root_node != spot_line.spot_node &&
            root_line.spot_node != spot_line.root_node &&
            root_line.spot_node != spot_line.spot_node &&

          line_cross(
            root_line.root_node.x, root_line.root_node.y,
            root_line.spot_node.x, root_line.spot_node.y,
            spot_line.root_node.x, spot_line.root_node.y,
            spot_line.spot_node.x, spot_line.spot_node.y,
          ))
        {
          return false
        }

      }
    }

    return true
  }

  // game: check_is_valid_game
  function solve_rooms(game) {

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.links = []
    }

    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]
      line.root_node.links.push(line)
      line.spot_node.links.push(line.flip)
    }

  }

  // game with solved rooms
  function solve_cells(game) {

  }

  //
  MazeGame.set_colors = set_colors
  function set_colors(game) {

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      const state = states[node.state]
      node.stroke_color = state.stroke_color(node.gate)
      node.fill_color = state.fill_color(node.gate)
    }

    for (const link_idx in game.links) {
      const link = game.links[link_idx]
      const state = states[link.state]
      link.stroke_color = state.stroke_color(link.gate)
      link.fill_color = state.fill_color(link.gate)
    }
  }

  MazeGame.get_room = get_room
  function get_room ( game, px, py, log ) {

    log = log || (()=>{})

    let ret_room = null
    let min_dist2 = Infinity

    measure_nodes(game)

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


  MazeGame.try_action = try_action
  function try_action(game, editor_id, px, py, log) {

    const editor = game.editors[editor_id]

    if (!editor) {
      return
    }

    switch (editor.state) {
      case 'node':

        const new_node = {
          x: px,
          y: py,
          state: 'node',
        }

        game.nodes.push(new_node)

        return `placed node`

      case 'door':
      case 'wall':
      case 'handle':
    }
  }

  MazeGame.act_at = act_at
  function act_at(game, editor_id, px, py, log) {

    const game_copy = copy_game(game)
    let {link, node} = measure_game(game, px, py)

    if (link && link.dist2 < node_diameter2) {
      px = link.px
      py = link.py
    }

    game_copy.action = try_action(game, editor_id, px, py, node, link, log)

    if (game_copy.action && !check_is_valid_game(game_copy)) {
      return copy_game(game)
    }
    else {
      return game_copy
    }

  }

  log('game.js')
  return MazeGame
}
