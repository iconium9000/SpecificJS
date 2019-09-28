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

  // game requires get_game, copy_game
  MazeGame.copy_game = copy_game
  function copy_game(game) {

    const new_game = {
      nodes: [],
      lines: [],
      links: [],
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

  // game requires copy_game
  MazeGame.setup_links = setup_links
  function setup_links(game) {

    game.links = []

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]
      node.links = []
    }

    for (const line_idx in game.lines) {
      let line = game.lines[line_idx]

      line.vx = line.spot_node.x - line.root_node.x
      line.vy = line.spot_node.y - line.root_node.y
      line.length2 = line.vx*line.vx + line.vy*line.vy
      line.angle = Math.atan2(line.vy, line.vx)

      line.flip = {
        root_node: line.spot_node,
        spot_node: line.root_node,
        state: line.state,
        flip: line,
        vx: -line.vx,
        vy: -line.vy,
        length2: line.length2,
        angle: inverse_angle(line.angle),
      }

      line.root_node.links.push(line)
      line.spot_node.links.push(line.flip)
      game.links.push(line, line.flip)
    }
  }

  // game requires setup_links
  // sets the focus of all nodes to px,py
  // sorts nodes and links based on their distance from px,py
  // if sort_direction is false, nodes and links are sorted closest to farthest
  // if sort_direction is true, nodes and links are sorted farthest to closest
  MazeGame.set_game_focus = set_game_focus
  function set_game_focus(game, px, py, sort_direction) {

    const sorter = sort_direction ?
      (({dist2:a}, {dist2:b}) => b - a) :
      (({dist2:a}, {dist2:b}) => a - b)

    for (const node_idx in game.nodes) {
      const node = game.nodes[node_idx]

      node.px = px - node.x
      node.py = py - node.y
      node.dist2 = node.px*node.px + node.py*node.py
      node.angle = Math.atan2(node.py, node.px)
    }
    game.nodes.sort(sorter)

    for (const line_idx in game.lines) {
      let line = game.lines[line_idx]

      if (line.root_node.px * line.vy > line.root_node.py * line.vx) {
        line = line.flip
        game.lines[line_idx] = line
      }

      line.dot = ( line.root_node.px*line.vx + line.root_node.py*line.vy ) / line.length2
      line.px = px - (line.root_node.x + line.vx * line.dot)
      line.py = py - (line.root_node.y + line.vy * line.dot)
      line.dist2 = line.px*line.px + line.py*line.py

      line.flip.dot = 1 - line.dot
      line.flip.px = line.px
      line.flip.py = line.py
      line.flip.dist2 = line.dist2
    }
    game.lines.sort(sorter)

    return game
  }

  // game requires setup_links
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

            line_cross(
              root_line.root_node.x, root_line.root_node.y,
              root_line.spot_node.x, root_line.spot_node.y,
              spot_line.root_node.x, spot_line.root_node.y,
              spot_line.spot_node.x, spot_line.spot_node.y,
            ))
        {
          log('INVALID line cross')
          return false
        }

      }
    }

    return true
  }

  // game requires setup_links
  function solve_rooms(game) {

    const new_game = {
      editors: [],
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
        link_map: {},
        cord_map: {},
        state: 'node',
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
        idx: new_game.links.length,

        root_node: root_node,
        spot_node: spot_node,
        state: line.state,

        vx: vx, vy: vy,

        angle: root_angle,

        length2: length2,
        sort_length2: -1,
        angle_rank: 1,

        cords: [],
      }
      new_game.lines.push(new_line)

      const root_link = new_line

      new_game.links.push(root_link)
      root_node.links.push(root_link)
      root_node.link_map[spot_node.idx] = new_line

      const root_cord = root_link
      root_cord.link = root_link

      const spot_link = {
        idx: new_game.links.length,

        root_node: spot_node,
        spot_node: root_node,
        state: line.state,

        vx: -vx, vy: -vy,

        angle: spot_angle,

        length2: length2,
        sort_length2: -1,
        angle_rank: 1,

        cords: [],
      }
      new_game.links.push(spot_link)
      spot_node.links.push(spot_link)
      spot_node.link_map[root_node.idx] = spot_link


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
      let link = new_game.links[link_idx]

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
      const link_map = {}
      while (!link_map[link.idx]) {
        link_map[link.idx] = link
        link.room = new_room
        new_room.links.push(link)

        link.root_node.cord_map[link.spot_node.idx] = link
        new_room.cords.push(link)

        link = link.next_link
      }

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

        let spot_idx = root_idx + 1 > n_links ? root_idx + 1 : n_links
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
        root_cord.idx = root_idx
      }

      // trace cords
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
        let cord = new_room.cords[cord_idx]

        if (cord.cell) {
          continue
        }

        const new_cell = {
          root_cord: cord,
          room: new_room,
          cords: [],
          is_acute: true,
        }

        const cord_map = {}
        while (!cord_map[cord.idx]) {
          cord_map[cord.idx] = cord
          cord.cell = new_cell
          new_cell.cords.push(cord)

          if (!cord.next_cord) {
            new_cell.is_acute = false
            break
          }

          const angle_dif = (pi2 + cord.flip.angle - cord.next_cord.angle) % pi2
          if (angle_dif > pi) {
            new_cell.is_acute = false
          }

          cord = cord.next_cord
        }

        if (new_cell.is_acute && new_cell.cords.length > 2) {
          new_room.cells.push(new_cell)
        }
        else {
          new_cell.is_acute = false
        }
      }
    }

  }

  // game requires solve_rooms
  function solve_cells(game) {

  }

  // game requires solve_cells
  MazeGame.set_colors = set_colors
  function set_colors(game, room) {

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

  // game requires solve_rooms
  MazeGame.get_room = get_room
  function get_room ( game, px, py, log ) {


    let ret_room = null
    let min_dist2 = Infinity

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

  // game requires set_game_focus
  function try_action(game, editor, px, py, node, line, log) {

    let action = ''

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

                // if (line) {
                //
                //   const new_line = {
                //     root_node: editor.node,
                //     spot_node: line.spot_node,
                //     state: line.state,
                //   }
                //   game.lines.push(new_line)
                //
                //   line.spot_node = editor.node
                //
                //   action = `split ${line.state}, `
                // }

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

            // if (line) {
            //
            //   const new_line = {
            //     root_node: editor.node,
            //     spot_node: line.spot_node,
            //     state: line.state,
            //   }
            //   game.lines.push(new_line)
            //
            //   line.spot_node = editor.node
            //
            //   action = `split ${line.state}, `
            // }

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

  // game requires copy_game
  MazeGame.act_at = act_at
  function act_at(game, editor_id, px, py, log) {

    const game_copy = copy_game(game)

    const editor = game_copy.editors[editor_id]

    if (!editor) {
      return game_copy
    }

    setup_links(game_copy)
    set_game_focus(game_copy, px, py)

    let line = null
    for (const line_idx in game_copy.lines) {
      const temp_line = game_copy.lines[line_idx]
      if (node_diameter2 <= temp_line.dist2) {
        break
      }
      else if (0 < temp_line.dot && temp_line.dot < 1) {
        line = temp_line
        break
      }
    }

    let node = game_copy.nodes[0]
    if (node && node_diameter2 < node.dist2) {
      node = null
    }

    if (line && node) {
      line = null
    }

    game_copy.action = try_action(game_copy, editor, px, py, node, line, log)

    setup_links(game_copy)
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
