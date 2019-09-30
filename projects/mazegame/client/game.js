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
  MazeGame.node_diameter2 = node_diameter2
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

  MazeGame.check_line_cross = (
    {root_node: a0, spot_node: a1},
    {root_node: b0, spot_node: b1}
  ) => line_cross(a0.x, a0.y, a1.x, a1.y, b0.x, b0.y, b1.x, b1.y)

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

  /* Copy Game (game: Game)
    Return: duplicate of (game: Game)
    Recommended pre-functions for (game: Game): get_game OR copy_game

    Node
      x,y: Float
      state: String
      MOD(only write to input) idx: String
        idx: index of node in game.nodes
    Line
      root_node,spot_node: Node
      MOD(only write to input) idx: String
        idx: index of line in game.lines
    Editors
      id,name,state: String
      node: Node
    Game
      nodes: Node[]
      lines: Line[]
      editors: Editor[]
      action: String
  */
  MazeGame.copy_game = copy_game
  function copy_game(game) {

    const new_game = {
      nodes: [],
      lines: [],
      editors: [],
      action: game.action,
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

    // copy lines
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
        }
        new_game.lines.push(new_line)
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

  /* Measure Lines (game: Game)
    Return: null
    Recommended pre-functions for (game: Game): copy_game
    Node
      x,y: Float
    Line
      root_node,spot_node: Node
      MOD vx,vy,length2: Float
        vx,vy: vector from root_node to spot_node
        length2: length of vx,vy squared
    Game
      nodes: Node[]
      lines: Line[]
  */
  MazeGame.measure_lines = measure_lines
  function measure_lines(game) {
    for (const line_idx in game.lines) {
      let line = game.lines[line_idx]
      line.vx = line.spot_node.x - line.root_node.x
      line.vy = line.spot_node.y - line.root_node.y
      line.length2 = line.vx*line.vx + line.vy*line.vy
    }
  }

  /* Set Game Focus(game: Game, fx,fy: Float)
    Return: null
    Recommended pre-functions for (game: Game): measure_lines

    Node
      x,y: Float
      MOD px,py,dist2,angle: Float
        px,py: vector from x,y to fx,fy
        dist2: length of px,py squared
        angle: arctan of fx,fy
    Line
      root_node,spot_node: Node
      vx,vy,length2: Float
        from measure_lines
      MOD dot,px,py,dist2: Float
        px,py: vector from closest point on Line to fx,fy
        dist2: length of px,py squared
        dot: dot(root_node.(x,y), Line.(vx,vy)) / Line.length2
    Game
      nodes: Node[]
      lines: Line[]
  */
  MazeGame.set_game_focus = set_game_focus
  function set_game_focus(game, fx, fy) {

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      node.px = fx - node.x
      node.py = fy - node.y
      node.dist2 = node.px*node.px + node.py*node.py
      node.angle = Math.atan2(node.py, node.px)
    }

    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]

      line.dot = ( line.root_node.px*line.vx + line.root_node.py*line.vy ) / line.length2
      line.px = fx - (line.root_node.x + line.vx * line.dot)
      line.py = fy - (line.root_node.y + line.vy * line.dot)
      line.dist2 = line.px*line.px + line.py*line.py
    }
  }

  /* Get Node (game: Game, min_dist2: Float)
    Return: closest node if node.dist2 is less than min_dist2
    Recommended pre-functions for (game: Game): set_game_focus
    Node
      dist2: Float
        from set_game_focus
    Game
      nodes: Node[]
  */
  MazeGame.get_node = get_node
  function get_node( game, min_dist2 ) {

    let ret_node = null

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]

      if ( node.dist2 < min_dist2 ) {
        min_dist2 = node.dist2
        ret_node = node
      }
    }

    return ret_node
  }

  /* Get Line (game: Game, min_dist2: Float)
    Return: closest line if line.dist2 is less than min_dist2 and 0 < line.dot < 1
    Recommended pre-functions for (game: Game): set_game_focus
    Node
      dist2: Float
        from set_game_focus
    Game
      lines: Line[]
  */
  MazeGame.get_line = get_line
  function get_line( game, min_dist2 ) {

    let ret_line = null

    for ( const line_idx in game.lines ) {
      const line = game.lines[ line_idx ]

      if ( line.dist2 < min_dist2 && 0 < line.dot && line.dot < 1) {
        min_dist2 = line.dist2
        ret_line = line
      }
    }

    return ret_line
  }

  /* Get Line (game: Game)
    Return: true iff
      no nodes are within node_diameter of each other
      for no line does root_node == spot_node
      no line is within node_diameter of a node
      no line shares both root_node and spot_node with another line (or vice versa)
      no lines cross (unless they share a node)
    Recommended pre-functions for (game: Game): measure_lines
    Node
      x,y: Float
    Line
      root_node,spot_node: Node
      vx,vy,length2: Float
        from measure_lines
    Game
      nodes: Node[]
      lines: Line[]
  */
  function check_is_valid_game (game, log) {

    // make sure no node touches another
    for (let root_idx = 0; root_idx < game.nodes.length; ++root_idx) {
      const root_node = game.nodes[root_idx]

      for (let spot_idx = root_idx + 1; spot_idx < game.nodes.length; ++spot_idx) {
        const spot_node = game.nodes[spot_idx]

        const px = spot_node.x - root_node.x
        const py = spot_node.y - root_node.y
        if (px*px + py*py < node_diameter2) {
          log('INVALID node touch node')
          return false
        }
      }
    }

    for (let root_idx = 0; root_idx < game.lines.length; ++root_idx) {
      const root_line = game.lines[root_idx]

      const root_node = root_line.root_node
      if (root_node == root_line.spot_node) {
        log('INVALID root=spot')
        return false
      }

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


          const qx = root_node.x + root_line.vx * dot - node.x
          const qy = root_node.y + root_line.vy * dot - node.y

          if (qx*qx + qy*qy < node_diameter2) {
            log('INVALID line touch node')
            return false
          }
        }
      }

      // make sure no line crosses another line
      for (let spot_idx = root_idx + 1; spot_idx < game.lines.length; ++spot_idx) {
        const spot_line = game.lines[spot_idx]

        if (root_line.root_node == spot_line.root_node &&
            root_line.spot_node == spot_line.spot_node) {
          log('INVALID dup line')
          return false
        }

        if (root_line.root_node == spot_line.spot_node &&
            root_line.spot_node == spot_line.root_node) {

          log('INVALID dup line')
          return false
        }

        if (root_line.root_node != spot_line.root_node &&
            root_line.root_node != spot_line.spot_node &&
            root_line.spot_node != spot_line.root_node &&
            root_line.spot_node != spot_line.spot_node &&

            MazeGame.check_line_cross(root_line, spot_line))
        {
          log('INVALID line cross')
          return false
        }

      }
    }

    return true
  }

  /* Solve Room (game: Game)
    Recommended pre-functions for (game: Game): measure_lines
    Room:
      MOD lines: Line[]
        an array of lines arrayed clockwise around the room from root_node to spot_node
        for each Line in the array:
          the next element is its next_line
          the previous element is its prev_line
    Line:
      root_node,spot_node: Node
      state: String
      vx,vy,length2: Float
        from measure_lines
      MOD next_line,prev_line: Line
      MOD angle: Float (-pi,pi)
      MOD flip: Line
        line with inverted vx,vy, angle, and root and spot nodes
      MOD room: Room
    Node:
      MOD idx: String
      MOD cord_map: Line{}
      MOD lines: Line[]
        array of Lines that all have Node as their root_node
        sorted by Line.angle from largest to smallest
    Game:
      nodes: Node[]
      lines: Line[]
      MOD rooms: Room[]
  */
  MazeGame.solve_rooms = solve_rooms
  function solve_rooms(game) {

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.idx = node_idx
      node.lines = []
      node.cord_map = {}
    }

    for (const line_idx in game.lines) {
      const line = game.lines[line_idx]

      line.angle = Math.atan2(line.vy, line.vx)

      line.flip = {
        root_node: line.spot_node,
        spot_node: line.root_node,
        state: line.state,

        vx: -line.vx,
        vy: -line.vy,
        length2: line.length2,

        flip: line,
        angle: inverse_angle(line.angle),
      }

      line.root_node.lines.push(line)
      line.root_node.cord_map[line.spot_node.idx] = line

      line.spot_node.lines.push(line.flip)
      line.spot_node.cord_map[line.root_node.idx] = line.flip
    }

    // trace lines
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      node.lines.sort(({angle:a}, {angle:b}) => b - a)
      for ( let line_idx = 0; line_idx < node.lines.length; ++line_idx) {
        const line = node.lines[line_idx].flip
        const next_line = node.lines[(line_idx+1)%node.lines.length]

        line.next_line = next_line
        next_line.prev_line = line
      }
    }

    game.rooms = []
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      for (const line_idx in node.lines) {
        const root_line = node.lines[line_idx]

        if (root_line.room) {
          continue
        }

        const new_room = {
          lines: [],
        }
        game.rooms.push(new_room)

        let line = root_line
        do {
          new_room.lines.push(line)
          line.room = new_room
          line = line.next_line
        }
        while (line != root_line)
      }
    }
  }

  /* Get Room ( game: Game )
    Return: a room iff the fx,fy defined in set_game_focus is inside the room
    Recommended pre-functions for (game: Game): solve_rooms && set_game_focus
    Room: Object
    Node
      px,py: Float
    Flip
      root_node,spot_node
      vx,vy,dot,angle: Float
      MOD side: Boolean
        true iff fx,fy (from set_game_focus) is on the flip's side of the line
      room: Room OR null
      flip: Line,
      prev_line,next_line: Flip
    Line: Flip
      dist2: Float
    Game
      lines: Line[]
  */
  MazeGame.get_room = get_room
  function get_room ( game, log ) {

    let ret_room = null
    let min_dist2 = Infinity

    for ( const line_idx in game.lines ) {
      let line = game.lines[line_idx]
      const dist2 = line.dist2

      line.side = line.root_node.px * line.vy > line.root_node.py * line.vx
      line.flip.side = !line.side
      if (line.side) {
        line = line.flip
      }

      if (line.root_node.dist2 == 0) {
        return
      }

      if (0 < line.dot && line.dot < 1) {
        if (dist2 < min_dist2) {
          min_dist2 = dist2
          ret_room = line.room
        }
      }
      else {

        if (0 < line.dot) {
          line = line.next_line
        }

        if (line.root_node.dist2 < min_dist2) {
          const angle_rank = get_angle_rank(
            line.prev_line.flip.angle,
            line.angle,
            line.root_node.angle)

          if (0 < angle_rank && angle_rank < 1) {
            min_dist2 = line.root_node.dist2
            ret_room = line.room
          }
        }
      }
    }

    return ret_room
  }

  /* Solve Cells
    Return null
    Recommended pre-functions for (game: Game): solve_rooms
    Cell
      root_cord: Line
      room: Room
      cords: Line[]
      is_acute: Boolean
    Line
      root_node,spot_node: Node
      angle: Float (-pi,pi)
      flip: Line
      room: Room
      MOD cell: Cell
      MOD sort_length2: Float
      MOD angle_rank: Float
      MOD cords: Line[]
    Node
      cord_map: Line{}
      idx: String
      lines: Line[]
    Room:
      cells: Cell[]
      lines: Line[]
      MOD cords: Line[]
    Game:
      rooms: Room[]
  */
  MazeGame.solve_cells = solve_cells
  function solve_cells(game) {

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.cords = []
    }

    // split rooms
    for (const room_idx in game.rooms) {
      const room = game.rooms[room_idx]
      room.cells = []
      room.cords = []
      const temp_cords = room.lines.slice(0)

      // make cords
      for (let root_idx = 0; root_idx < room.lines.length; ++root_idx) {

        const root_line = room.lines[root_idx]
        const flip_angle = root_line.prev_line.flip.angle
        const root_node = root_line.root_node

        root_line.sort_length2 = -1

        for (let spot_idx = root_idx + 2; spot_idx < room.lines.length; ++spot_idx) {
          const spot_line = room.lines[spot_idx]
          const spot_node = spot_line.root_node

          if (root_node == spot_node || root_node.cord_map[spot_node.idx]) {
            continue
          }

          const vx = spot_node.x - root_node.x
          const vy = spot_node.y - root_node.y

          const root_angle = Math.atan2(vy, vx)
          const root_angle_rank = get_angle_rank(
            flip_angle,
            root_line.angle,
            root_angle,
          )

          if (0 >= root_angle_rank || root_angle_rank >= 1) {
            continue
          }

          const spot_angle = inverse_angle(root_angle)
          const spot_angle_rank = get_angle_rank(
            spot_line.prev_line.flip.angle,
            spot_line.angle,
            spot_angle,
          )

          if (0 >= spot_angle_rank || spot_angle_rank >= 1) {
            continue
          }

          const length2 = vx*vx + vy*vy
          const new_cord = {
            root_node: root_node,
            spot_node: spot_node,
            cords: root_line.cords,
            sort_length2: length2,
            length2: length2,
            angle: root_angle,

            flip: {
              root_node: spot_node,
              spot_node: root_node,
              cords: spot_line.cords,
              sort_length2: length2,
              length2: length2,
              angle: spot_angle,
            },
          }
          new_cord.flip.flip = new_cord
          root_node.cord_map[spot_node.idx] = new_cord
          spot_node.cord_map[root_node.idx] = new_cord.flip
          temp_cords.push(new_cord)
        }
      }

      // sort cords by accending length
      temp_cords.sort(({sort_length2:a}, {sort_length2:b}) => a - b)

      // remove excess cords
      for ( let root_idx = 0; root_idx < temp_cords.length; ++root_idx) {
        const root_cord = temp_cords[root_idx]

        let spot_idx = root_idx + 1 > room.lines.length ? root_idx + 1 : room.lines.length
        while (spot_idx < temp_cords.length) {
          const spot_cord = temp_cords[spot_idx++]

          if (
            root_cord.root_node != spot_cord.root_node &&
            root_cord.root_node != spot_cord.spot_node &&
            root_cord.spot_node != spot_cord.root_node &&
            root_cord.spot_node != spot_cord.spot_node &&

            MazeGame.check_line_cross(root_cord, spot_cord)
          ) {
            temp_cords.splice(--spot_idx, 1)
            delete spot_cord.root_node.cord_map[spot_cord.spot_node.idx]
            delete spot_cord.spot_node.cord_map[spot_cord.root_node.idx]
          }
        }

        // assign cord to its node
        root_cord.root_node.cords.push(root_cord)
        root_cord.spot_node.cords.push(root_cord.flip)
        room.cords.push(root_cord)
        if (root_idx >= room.lines.length) {
          room.cords.push(root_cord.flip)
        }
      }
    }

    // trace cords
    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      node.cords.sort(({angle:a}, {angle:b}) => b - a)
      for ( let cord_idx = 0; cord_idx < node.cords.length; ++cord_idx) {
        const cord = node.cords[cord_idx].flip
        const next_cord = node.cords[(cord_idx+1)%node.cords.length]

        cord.next_cord = next_cord
        next_cord.prev_cord = cord
      }
    }

    // make cells
    for (const room_idx in game.rooms) {
      const room = game.rooms[room_idx]

      for (const cord_idx in room.cords) {
        const root_cord = room.cords[cord_idx]

        if (root_cord.room) {
          continue
        }

        const new_cell = {
          room: room,
          cords: [],
          is_acute: true,
        }

        let cord = root_cord
        do {
          new_cell.cords.push(cord)
          cord.cell = new_cell

          const angle_dif = (pi2 + cord.flip.angle - cord.next_cord.angle) % pi2
          if (angle_dif > pi) {
            new_cell.is_acute = false
          }

          cord = cord.next_cord
        }
        while (cord != root_cord)

        if (new_cell.is_acute && new_cell.cords.length > 2) {
          room.cells.push(new_cell)
        }
        else {
          new_cell.is_acute = false
        }
      }
    }
  }

  /*
    requires
      game: set_game_focus && solve_cells

  */
  MazeGame.set_colors = set_colors
  function set_colors({nodes, lines}, room) {

    for (const node_idx in nodes) {
      const node = nodes[node_idx]
      const state = states[node.state]
      node.stroke_color = state.stroke_color(node.gate)
      node.fill_color = state.fill_color(node.gate)
    }

    for (const line_idx in lines) {
      const line = lines[line_idx]
      const state = states[line.state]
      line.stroke_color = state.stroke_color(line.gate)
      line.fill_color = state.fill_color(line.gate)
    }
  }


  /*
    requires
      game: set_game_focus

  */
  function try_action(game, editor, px, py, log) {

    let action = ''

    const node = get_node(game, node_diameter2)
    const line = !node && get_line(game, node_diameter2)

    switch (editor.state) {
      case 'node':
      case 'door':
      case 'wall':

        if (editor.node) {
          if (node) {
            if (node == editor.node) {
              if (editor.state == 'node') {
                editor.node.x = px
                editor.node.y = py
                editor.node = null
                return action + `moved and deselected node`
              }
              else {
                editor.node = null
                return `deselected node`
              }
            }
            else if (editor.state == 'node') {
              editor.node = node
              return `selected node`
            }
            else {
              const new_line = {
                root_node: editor.node,
                spot_node: node,
                state: editor.state,
              }
              editor.node = node
              game.lines.push(new_line)
              return `selected node, added new line`
            }
          }
          else if (editor.state == 'node') {
            editor.node.x = px
            editor.node.y = py
            editor.node = null
            return action + `moved and deselected node`
          }
          else {
            const new_node = {
              x: px,
              y: py,
              state: 'node',
            }
            game.nodes.push(new_node)

            if (line) {

              const new_line = {
                root_node: new_node,
                spot_node: line.spot_node,
                state: line.state,
              }
              game.lines.push(new_line)

              line.spot_node = new_node

              action = `split ${line.state}, `
            }

            const new_line = {
              root_node: editor.node,
              spot_node: new_node,
              state: editor.state,
            }
            editor.node = new_node
            game.lines.push(new_line)
            return action + `added and selected new node, added new ${editor.state}`
          }
        }
        else if (node) {
          editor.node = node
          return `selected node`
        }
        else {
          const new_node = {
            x: px,
            y: py,
            state: 'node',
          }
          game.nodes.push(new_node)

          if (line) {
            const new_line = {
              root_node: new_node,
              spot_node: line.spot_node,
              state: line.state,
            }
            game.lines.push(new_line)

            line.spot_node = new_node

            action = `split ${line.state}, `
          }

          if (editor.state == 'node') {
            return action + `added new node`
          }
          else {
            editor.node = new_node
            return action + `added and selected new node`
          }
        }

        return action
    }
  }

  /*
    requires
      game: copy_game

  */
  MazeGame.act_at = act_at
  function act_at(game, editor_id, px, py, log) {

    const game_copy = copy_game(game)

    const editor = game_copy.editors[editor_id]

    if (!editor) {
      return game_copy
    }

    measure_lines(game_copy)
    set_game_focus(game_copy, px, py)

    game_copy.action = try_action(game_copy, editor, px, py, log)

    measure_lines(game_copy)
    if (game_copy.action && !check_is_valid_game(game_copy, log)) {

      const editor = game.editors[editor_id]

      if (editor.node) {
        editor.node = null
        game.action = `deselected node`
      }
      else {
        game.action = `no action`
      }

      if (game.act_at) {
        return copy_game(game)
      }
      else {
        game.act_at = true
        return act_at(game, editor_id, px, py, log)
      }
    }
    else {
      if (!game_copy.action) {
        game.action = `no action`
      }
      return copy_game(game_copy)
    }

  }

  log('game.js')
  return MazeGame
}
