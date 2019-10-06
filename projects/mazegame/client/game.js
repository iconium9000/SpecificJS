module.exports = (project_name, Lib) => {

  const MazeGame = {}

  const noise = 1e-10
  MazeGame.noise = noise

  const pi = Math.PI
  const pi2 = pi * 2

  const node_radius = 1 / 120
  const node_radius2 = node_radius*node_radius
  const node_diameter = 2*node_radius
  const node_diameter2 = node_diameter*node_diameter

  const portal_radius = 3 * node_radius
  const portal_radius2 = portal_radius*portal_radius
  const portal_diameter = 2 * portal_radius
  const portal_diameter2 = portal_diameter * portal_diameter

  const handle_radius = node_radius
  const handle_radius2 = handle_radius*handle_radius
  const handle_diameter = 2 * handle_radius
  const handle_diameter2 = handle_diameter * handle_diameter

  const handle_portal_dist = handle_radius + portal_radius
  const handle_portal_dist2 = handle_portal_dist * handle_portal_dist

  const jack_radius = 2 * node_radius
  const jack_diameter = 2 * jack_radius

  const key_radius = node_radius * 0.7
  const key_diameter = 2*key_radius

  const bot_scale = 0.95
  const top_scale = 1.05
  const mid_scale = 1
  const line_width = node_radius / 2

  const states = {
    node: {
      key: 'n',
      stroke_color: gate_is_active => '#ffffff80',
      fill_color: gate_is_active => '#ffffff',
    },
    wall: {
      key: 'w',
      stroke_color: gate_is_active => '#ffffff80',
      fill_color: gate_is_active => '#00000080',
    },
    door: {
      key: 'd',
      stroke_color: gate_is_active => gate_is_active ? '#00ff0080' : '#ff000080',
      fill_color: gate_is_active => gate_is_active ? '#00800080' : '#80000080',
    },
    laser: {
      key: 'l',
      stroke_color: gate_is_active => gate_is_active ? '#00ff0080' : '#ff000080',
      fill_color: gate_is_active => gate_is_active ? '#00800080' : '#80000080',
    },
    handle: {
      key: 'h',
      stroke_color: gate_is_active => gate_is_active ? '#00ff0080' : '#ff000080',
      fill_color: gate_is_active => gate_is_active ? '#00800080' : '#80000080',
    },
    portal: {
      key: 'p',
      stroke_color: gate_is_active => gate_is_active ? '#ff00ff80' : '#ff000080',
      fill_color: gate_is_active => gate_is_active ? '#80008080' : '#80000080',
    },
    square: {
      key: 's',
    },
    key: {
      key: 'k',
      stroke_color: '#ffffff80',
      fill_color: '#ffffff80',
    },
    jack: {
      key: 'j',
      stroke_color: '#ffffff80',
      fill_color: '#ffffff80',
    },
    game: {
      key: 'g',
    }
  }
  const state_keys = {}

  // constants
  {
    MazeGame.node_radius = node_radius
    MazeGame.line_width = line_width
    MazeGame.node_diameter = node_diameter
    MazeGame.node_diameter2 = node_diameter2
    MazeGame.handle_radius = handle_radius
    MazeGame.portal_radius = portal_radius
    MazeGame.key_radius = key_radius
    MazeGame.jack_radius = jack_radius
    MazeGame.mid_scale = mid_scale
    MazeGame.top_scale = top_scale

    // TODO
    for (const name in states) {
      const state = states[name]
      state.name = name
      state_keys[state.key] = state
    }
    MazeGame.states = states
    MazeGame.state_keys = state_keys

    MazeGame.check_line_cross = (
      {root_node: {x: a00, y: a01}, spot_node: {x: a10, y: a11}},
      {root_node: {x: b00, y: b01}, spot_node: {x: b10, y: b11}},
    ) => Lib.line_cross(a00, a01, a10, a11, b00, b01, b10, b11)
  }

  // game manip
  {
    /* Copy Game (game: Game)
      Return: duplicate of (game: Game)
      Recommended pre-functions for Game: get_game,copy_game,import_game

      Node
        x,y: Float
        state: String
        iMOD idx: Id
          idx: index of node in game.nodes
      Line
        root_node,spot_node: Node
        portals: Portal[]
        handles: Handle[]
        iMOD idx: Id
          idx: index of line in game.lines
      Portal
        line: Line
        dot,side: Float
        iMOD idx: Id
          idx: index of portal in game.portals
      Handle
        line: Line
        rel_dot,rel_side: Float
        portal: Portal, handle: Handle, Null
        iMOD idx: Id
        key: Key,Null
        jack: Jack,Null
          idx: index of handle in game.handles
      Jack
        x,y: Float, handle: Handle
        key: Key
        iMOD idx: Id
          idx: index of jack in game.jacks
      Key
        x,y: Float, handle: Handle, jack: Jack
        iMOD idx: Id
          idx: index of key in game.keys
      Editor
        id,name,state: String
        node: Node,Null
        portal: Portal,Null
        handle: Handle,Null
        jack: Jack,Null
        key: Key,Null
      Trail
        x,y,dist,total_dist: Float
      Path
        jack: Jack
        handle: Handle, key: Key, Null
        total_dist: Float
        trails: Trail[]
      Game
        nodes: Node[]
        lines: Line[]
        portals: Portal[]
        handles: Handle[]
        jacks: Jack[]
        keys: Key[]
        editors: Editor{Id}
        path: Path,Null
        action: String
    */
    MazeGame.copy_game = copy_game
    function copy_game(game) {

      // clear idx
      {
        for (const line_idx in game.lines) {
          const line = game.lines[line_idx]
          line.root_node.idx = -1
          line.spot_node.idx = -1
        }
        for (const portal_idx in game.portals) {
          const portal = game.portals[portal_idx]
          portal.line.idx = -1
        }
        for (const handle_idx in game.handles) {
          const handle = game.handles[handle_idx]
          if (handle.portal) {
            handle.portal.idx = -1
          }
          if (handle.handle) {
            handle.handle.idx = -1
          }
          handle.line.idx = -1
        }
        for (const key_idx in game.keys) {
          const key = game.keys[key_idx]
          if (key.handle) {
            key.handle.idx = -1
          }
          if (key.jack) {
            key.jack.idx = -1
          }
        }
        for (const jack_idx in game.jacks) {
          const jack = game.jacks[jack_idx]
          if (jack.handle) {
            jack.handle.idx = -1
          }
        }
        for (const editor_id in game.editors) {
          const editor = game.editors[editor_id]

          if (editor.node) {
            editor.node.idx = -1
          }
          if (editor.portal) {
            editor.portal.idx = -1
          }
          if (editor.handle) {
            editor.handle.idx = -1
          }
          if (editor.key) {
            editor.key.idx = -1
          }
          if (editor.jack) {
            editor.jack.idx = -1
          }
        }

        if (game.path) {
          game.path.jack.idx = -1
          if (game.path.handle) {
            game.path.handle.idx = -1
          }
          if (game.path.key) {
            game.path.key.idx = -1
          }
        }
      }

      const new_game = {
        nodes: [],
        lines: [],
        editors: {},
        portals: [],
        handles: [],
        keys: [],
        jacks: [],
        action: game.action,
      }

      // copy nodes
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]

        const new_node = {
          x: node.x, y: node.y,
          state: node.state,
          portals: [],
          handles: [],
        }
        node.idx = new_game.nodes.length
        new_game.nodes.push(new_node)
      }

      // copy lines
      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]
        line.idx = -1
        const root_node = new_game.nodes[line.root_node.idx]
        const spot_node = new_game.nodes[line.spot_node.idx]

        if (root_node && spot_node) {
          const new_line = {
            root_node: root_node,
            spot_node: spot_node,
            state: line.state,
          }
          line.idx = new_game.lines.length
          new_game.lines.push(new_line)
        }
      }

      // copy portals
      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        portal.idx = -1
        const new_line = new_game.lines[portal.line.idx]

        if (new_line) {
          const new_portal = {
            line: new_line,
            side: portal.side,
            dot: portal.dot,
          }
          portal.idx = new_game.portals.length
          new_game.portals.push(new_portal)
        }
      }

      // copy handles
      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        handle.idx = -1

        const new_handle = {
          is_square: handle.is_square,
          rel_dot: handle.rel_dot,
          rel_side: handle.rel_side,
        }

        if (handle.portal) {
          const portal = new_game.portals[handle.portal.idx]
          if (portal) {
            new_handle.portal = portal
            new_handle.line = portal.line
            handle.idx = new_game.handles.length
            new_game.handles.push(new_handle)
          }
        }
        else if (handle.handle) {
          const spot_handle = new_game.handles[handle.handle.idx]
          if (spot_handle) {
            new_handle.handle = spot_handle
            new_handle.line = spot_handle.line
            handle.idx = new_game.handles.length
            new_game.handles.push(new_handle)
          }
        }
        else {
          const new_line = new_game.lines[handle.line.idx]
          if (new_line) {
            handle.idx = new_game.handles.length
            new_game.handles.push(new_handle)
            new_handle.line = new_line
          }
        }
      }

      // copy jacks
      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]
        jack.idx = -1

        const new_jack = {}

        if (jack.handle) {
          const new_handle = new_game.handles[jack.handle.idx]
          if (new_handle && !new_handle.key) {
            new_jack.handle = new_handle
            new_handle.jack = new_jack
            jack.idx = new_game.jacks.length
          }
        }
        else {
          new_jack.x = jack.x
          new_jack.y = jack.y
          jack.idx = new_game.jacks.length
        }

        if (jack.idx >= 0) {
          new_game.jacks.push(new_jack)
        }
      }

      // copy keys
      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]
        key.idx = -1

        const new_key = {
          is_square: key.is_square,
        }

        if (key.jack) {
          const new_jack = new_game.jacks[key.jack.idx]
          if (new_jack && !new_jack.key) {
            new_key.jack = new_jack
            new_jack.key = new_key
            key.idx = new_game.keys.length
          }
        }
        else if (key.handle) {
          const new_handle = new_game.handles[key.handle.idx]
          if (new_handle && !new_handle.key) {
            new_key.handle = new_handle
            new_handle.key = new_key
            key.idx = new_game.keys.length
          }
        }
        else {
          new_key.x = key.x
          new_key.y = key.y
          key.idx = new_game.keys.length
        }

        if (key.idx >= 0) {
          new_game.keys.push(new_key)
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
          portal: editor.portal && new_game.portals[editor.portal.idx],
          handle: editor.handle && new_game.handles[editor.handle.idx],
          key: editor.key && new_game.keys[editor.key.idx],
          jack: editor.jack && new_game.jacks[editor.jack.idx],

        }
        new_game.editors[new_editor.id] = new_editor
      }

      // copy path
      if (game.path) {

        const new_path ={
          jack: new_game.jacks[game.path.jack.idx],
          handle: game.path.handle && new_game.handles[game.path.handle.idx],
          key: game.path.key && new_game.keys[game.path.key.idx],
          total_dist: game.path.total_dist,
          trails: [],
        }
        if (
          (!game.path.jack || new_path.jack) &&
          (!game.path.handle || new_path.handle) &&
          (!game.path.key || new_path.key)
        ) {
          new_game.path = new_path

          for (const trail_idx in game.path.trails) {
            const {x,y,dist,total_dist} = game.path.trails[trail_idx]
            const new_trail = {
              x: x, y: y,
              dist: dist,
              total_dist: total_dist,
            }
            new_path.trails.push(new_trail)
          }
        }
      }

      return new_game
    }

    /* Export Game (game: Game)
      Recommended pre-functions for Game: get_game,copy_game,import_game

      TODO

      Game: copy_game.Game
      Node
        x,y: Float
        state: String
      Line
        root_node,spot_node: Id
        state: String
      Portal
        line: Id
        side,dot: Float
      Handle
        is_square: Boolean
        rel_dot,rel_side: Float
        line: Id
        portal: Id,Null
        handle: Id,Null
      Jack
        handle: Id,Null
        x,y: Float,Null
      Key
        is_square: Boolean
        handle: Id,Null
        jack: Jack,Null
        x,y: Float,Null
      Editor
        name,state: String
        node,portal,handle,key,jack: Id,Null

      GameExport
        nodes: Node[]
        lines: Line[]
        editors: Editor{Id}
        portals: Portal[]
        handles: Handle[]
        keys: Key[]
        jacks: Jack[]
        action: String
    */
    MazeGame.export_game = export_game
    function export_game(game) {
      const game_export = {
        nodes: [],
        lines: [],
        editors: {},
        portals: [],
        handles: [],
        keys: [],
        jacks: [],
        action: game.action,
      }

      // export nodes
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        node.idx = node_idx

        const node_export = {
          x: node.x, y: node.y,
          state: node.state,
        }
        game_export.nodes.push(node_export)
      }

      // export lines
      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]
        line.idx = line_idx
        const line_export = {
          root_node: line.root_node.idx,
          spot_node: line.spot_node.idx,
          state: line.state,
        }
        game_export.lines.push(line_export)
      }

      // export portals
      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        portal.idx = portal_idx

        const portal_export = {
          line: portal.line.idx,
          side: portal.side,
          dot: portal.dot,
        }
        game_export.portals.push(portal_export)
      }

      // export handles
      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        handle.idx = handle_idx

        const handle_export = {
          is_square: handle.is_square,
          rel_dot: handle.rel_dot,
          rel_side: handle.rel_side,
          line: handle.line.idx,
        }
        if (handle.portal) {
          handle_export.portal = handle.portal.idx
        }
        if (handle.handle) {
          handle_export.handle = handle.handle.idx
        }
        game_export.handles.push(handle_export)
      }

      // export jacks
      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]
        jack.idx = jack_idx

        const jack_export = {}

        if (jack.handle) {
          jack_export.handle = jack.handle.idx
        }
        else {
          jack_export.x = jack.x
          jack_export.y = jack.y
        }
        game_export.jacks.push(jack_export)
      }

      // export keys
      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]
        key.idx = key_idx

        const key_export = {
          is_square: key.is_square,
        }

        if (key.jack) {
          key_export.jack = key.jack.idx
        }
        else if (key.handle) {
          key_export.handle = key.handle.idx
        }
        else {
          key_export.x = key.x
          key_export.y = key.y
        }
        game_export.keys.push(key_export)
      }

      // export editors
      for (const editor_id in game.editors) {
        const editor = game.editors[editor_id]

        const editor_export = {
          name: editor.name,
          state: editor.state,
        }
        if(editor.node) {
           editor_export.node = editor.node.idx
         }
        if(editor.portal) {
           editor_export.portal = editor.portal.idx
         }
        if(editor.handle) {
           editor_export.handle = editor.handle.idx
         }
        if(editor.key) {
           editor_export.key = editor.key.idx
         }
        if(editor.jack) {
           editor_export.jack = editor.jack.idx
         }
        game_export.editors[editor.id] = editor_export
      }

      // export path
      if (game.path) {

        game_export.path = {
          jack: game.path.jack.idx,
          handle: game.path.handle && game.path.handle.idx,
          key: game.path.key && game.path.key.idx,
          trails: [],
        }

        for (const trail_idx in game.path.trails) {
          const {x,y,dist} = game.path.trails[trail_idx]
          const trail_export = {
            x: x, y: y,
            dist: dist,
          }
          game_export.path.trails.push(trail_export)
        }
      }

      return game_export
    }

    /* Import Game (game_export: GameExport)
      TODO
    */
    MazeGame.import_game = import_game
    function import_game(game_export) {

      const game_import = {
        nodes: [],
        lines: [],
        editors: {},
        portals: [],
        handles: [],
        keys: [],
        jacks: [],
        action: game_export.action,
      }

      // import nodes
      for (const node_idx in game_export.nodes) {
        const node_export = game_export.nodes[node_idx]

        const node_import = {
          x: node_export.x, y: node_export.y,
          state: node_export.state,
        }
        game_import.nodes.push(node_import)
      }

      // import lines
      for (const line_idx in game_export.lines) {
        const line_export = game_export.lines[line_idx]
        const line_import = {
          root_node: game_import.nodes[line_export.root_node],
          spot_node: game_import.nodes[line_export.spot_node],
          state: line_export.state,
        }
        game_import.lines.push(line_import)
      }

      // import portals
      for (const portal_idx in game_export.portals) {
        const portal_export = game_export.portals[portal_idx]

        const portal_import = {
          line: game_import.lines[portal_export.line],
          side: portal_export.side,
          dot: portal_export.dot,
        }
        game_import.portals.push(portal_import)
      }

      // import handles
      for (const handle_idx in game_export.handles) {
        const handle_export = game_export.handles[handle_idx]

        const handle_import = {
          is_square: handle_export.is_square,
          rel_dot: handle_export.rel_dot,
          rel_side: handle_export.rel_side,
          line: game_import.lines[handle_export.line],
        }
        if (handle_export.portal >= 0) {
          handle_import.portal = game_import.portals[handle_export.portal]
        }
        else if (handle_export.handle >= 0) {
          handle_import.handle = game_import.handles[handle_export.handle]
        }
        game_import.handles.push(handle_import)
      }

      // import jacks
      for (const jack_idx in game_export.jacks) {
        const jack_export = game_export.jacks[jack_idx]

        const jack_import = {}

        if (jack_export.handle >= 0) {
          jack_import.handle = game_import.handles[jack_export.handle]
        }
        else {
          jack_import.x = jack_export.x
          jack_import.y = jack_export.y
        }
        game_import.jacks.push(jack_import)
      }

      // import keys
      for (const key_idx in game_export.keys) {
        const key_export = game_export.keys[key_idx]

        const key_import = {
          is_square: key_export.is_square,
        }

        if (key_export.jack >= 0) {
          key_import.jack = game_import.jacks[key_export.jack]
        }
        else if (key_export.handle >= 0) {
          key_import.handle = game_import.handles[key_export.handle]
        }
        else {
          key_import.x = key_export.x
          key_import.y = key_export.y
        }
        game_import.keys.push(key_import)
      }

      // import editors
      for (const editor_id in game_export.editors) {
        const editor_export = game_export.editors[editor_id]

        const editor_import = {
          id: editor_id,
          name: editor_export.name,
          state: editor_export.state,
        }
        if(editor_export.node >= 0) {
           editor_import.node = game_import.nodes[editor_export.node]
         }
        if(editor_export.portal >= 0) {
           editor_import.portal = game_import.portals[editor_export.portal]
         }
        if(editor_export.handle >= 0) {
           editor_import.handle = game_import.handles[editor_export.handle]
         }
        if(editor_export.key >= 0) {
           editor_import.key = game_import.keys[editor_export.key]
         }
        if(editor_export.jack >= 0) {
           editor_import.jack = game_import.jacks[editor_export.jack]
         }
        game_import.editors[editor_import.id] = editor_import
      }

      // import path
      if (game_export.path) {

        game_import.path = {
          jack: game_export.jacks[game_export.path.jack],
          handle: game_export.handles[game_export.path.handle],
          key: game_export.keys[game_export.path.key],
          total_dist: 0,
          trails: [],
        }

        for (const trail_idx in game_export.path.trails) {
          const {x,y,dist} = game_export.path.trails[trail_idx]
          const trail_import = {
            x: x, y: y,
            dist: dist,
            total_dist: game_import.path.total_dist += dist,
          }
          game_import.path.trails.push(trail_import)
        }
      }

      return game_import
    }

    /* Measure Game (game: Game)
      Recommended pre-functions for Game: get_game,copy_game,import_game

      Node
        x,y: Float
      Line
        root_node,spot_node: Node
        MOD vx,vy,length2,length2,x,y: Float
          vx,vy: vector from root_node to spot_node
          length: length of vx,vy
          length2: length of vx,vy squared
          x,y: mid point between root_node and spot_node
      Portal
        side,dot: Float
      Handle
        rel_side,rel_dot: Float
        line: Line
        handle: Handle, portal: Portal, null
        MOD x,y,dot,side: Float
      Game
        nodes: Node[]
        lines: Line[]
        handles: Handle[]
    */
    MazeGame.measure_game = measure_game
    function measure_game(game, log) {

      // measure lines
      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]
        line.vx = line.spot_node.x - line.root_node.x
        line.vy = line.spot_node.y - line.root_node.y
        line.length2 = line.vx*line.vx + line.vy*line.vy
        line.length = Math.sqrt(line.length2)
        // log && log(line.length
        line.dx = -line.vy / line.length
        line.dy = line.vx / line.length

        line.x = (line.spot_node.x + line.root_node.x) / 2
        line.y = (line.spot_node.y + line.root_node.y) / 2
      }

      // measure handles
      const handle_portal_dist = handle_radius * 1.25 + portal_radius
      const handle_diameter = handle_radius * 4
      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        const length = handle.line.length

        if (handle.portal) {
          handle.side = handle.portal.side * handle.rel_side
          handle.dot = handle.portal.dot + handle.rel_dot * handle_portal_dist / length
        }
        else if (handle.handle) {
          handle.side = handle.handle.side * handle.rel_side
          handle.dot = handle.handle.dot + handle.rel_dot * handle_diameter / length
        }
        else {
          handle.side = handle.rel_side
          handle.dot = handle_diameter / length
          if (handle.rel_dot) {
            handle.dot = 1 - handle.dot
          }
        }

        const line = handle.line
        handle.x = line.root_node.x + handle.dot * line.vx
        handle.y = line.root_node.y + handle.dot * line.vy
        if (handle.side > 0) {
          handle.wx = handle.x + line.dx * handle_radius
          handle.wy = handle.y + line.dy * handle_radius
        }
        else {
          handle.wx = handle.x - line.dx * handle_radius
          handle.wy = handle.y - line.dy * handle_radius
        }
      }

      // measure portals
      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]


        const line = portal.line
        portal.x = line.root_node.x + portal.dot * line.vx
        portal.y = line.root_node.y + portal.dot * line.vy
        if (portal.side > 0) {
          portal.wx = portal.x + line.dx * portal_radius
          portal.wy = portal.y + line.dy * portal_radius
        }
        else {
          portal.wx = portal.x - line.dx * portal_radius
          portal.wy = portal.y - line.dy * portal_radius
        }

      }

      // measure keys
    }

    /* Set Game Focus(game: Game, fx,fy: Float)
      Return: null
      Recommended pre-functions for Game: measure_game

      Node
        x,y: Float
        MOD px,py,dist2,angle: Float
        px,py: vector from x,y to fx,fy
        dist2: length of px,py squared
        angle: arctan of fx,fy
      Line
        root_node,spot_node: Node
        vx,vy,length2: Float
        MOD side,dot,px,py,dist2: Float
          px,py: vector from closest point on Line to fx,fy
          side: if +y is up, and +x is right...
          +side indicates fx,fy on left side of Line
          -side indicates fx,fy on right side of Line
          0 side indicates fx,fy on line
          side / Line.length = px,py length
          dist2: length of px,py squared
          dot: dot(root_node.(x,y), Line.(vx,vy)) / Line.length2
      Game
        MOD fx,fy: Float
          sets fx,fy as game focus
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
        let line = game.lines[line_idx]

        line.side = line.root_node.py*line.vx - line.root_node.px*line.vy
        line.dot = ( line.root_node.px*line.vx + line.root_node.py*line.vy ) / line.length2
        line.px = fx - (line.root_node.x + line.vx * line.dot)
        line.py = fy - (line.root_node.y + line.vy * line.dot)
        line.dist2 = line.px*line.px + line.py*line.py
      }

      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]

        if (jack.handle) {
          jack.x = jack.handle.wx
          jack.y = jack.handle.wy
        }

        jack.px = fx - jack.x
        jack.py = fy - jack.y
        jack.dist = Math.sqrt(jack.px*jack.px + jack.py*jack.py)
      }

      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]

        if (key.handle) {
          key.x = key.handle.wx
          key.y = key.handle.wy
        }
        else if (key.jack) {
          key.x = key.jack.x + key.jack.px / key.jack.dist * jack_radius
          key.y = key.jack.y + key.jack.py / key.jack.dist * jack_radius
        }

        key.px = fx - key.x
        key.py = fy - key.y
        key.dist = Math.sqrt(key.px*key.px + key.py*key.py)
      }

      game.fx = fx
      game.fy = fy
    }

    /* Check Is Valid Game (game: Game)
      Return: String if...
        nodes are within node_diameter of each other
        for a line root_node == spot_node
        line is within node_diameter of a node
        line shares both root_node and spot_node with another line (or vice versa)
        lines cross (unless they share a node)
        portals overlap
        handles overlap
        portals overlap with handles
        key != key.jack.key
        key != key.handle.key
        jack != jack.handle.jack
        TODO no jack,key overlaps

      Return: Null otherwise
      Recommended pre-functions for Game: measure_game

      Node
        x,y: Float
      Line
        root_node,spot_node: Node
        vx,vy,length2: Float
      Portal
        line: Line
        side,dot: Float
      Handle
        line: Line
        side,dot: Float
      Game
        nodes: Node[]
        lines: Line[]
        handles: Handle[]
        portals: Portal[]
    */
    MazeGame.check_is_valid_game = check_is_valid_game
    function check_is_valid_game (game) {

      // make sure no node touches another
      for (let root_idx = 0; root_idx < game.nodes.length; ++root_idx) {
        const root_node = game.nodes[root_idx]

        for (let spot_idx = root_idx + 1; spot_idx < game.nodes.length; ++spot_idx) {
          const spot_node = game.nodes[spot_idx]

          const px = spot_node.x - root_node.x
          const py = spot_node.y - root_node.y
          if (px*px + py*py < node_diameter2) {
            return 'node touch node'
          }
        }
      }

      for (let root_idx = 0; root_idx < game.lines.length; ++root_idx) {
        const root_line = game.lines[root_idx]

        const root_node = root_line.root_node
        if (root_node == root_line.spot_node) {
          return 'root=spot'
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
              return 'line touch node'
            }
          }
        }

        // make sure no line crosses another line
        for (let spot_idx = root_idx + 1; spot_idx < game.lines.length; ++spot_idx) {
          const spot_line = game.lines[spot_idx]

          if (root_line.root_node == spot_line.root_node &&
            root_line.spot_node == spot_line.spot_node
          ) {
            return 'dup line'
          }

          if (root_line.root_node == spot_line.spot_node &&
            root_line.spot_node == spot_line.root_node
          ) {

            return 'dup line'
          }

          if (root_line.root_node != spot_line.root_node &&
            root_line.root_node != spot_line.spot_node &&
            root_line.spot_node != spot_line.root_node &&
            root_line.spot_node != spot_line.spot_node &&

            MazeGame.check_line_cross(root_line, spot_line)
          ) {
            return 'line cross'
          }

        }
      }

      for (let root_idx = 0; root_idx < game.portals.length; ++root_idx) {
        const root_portal = game.portals[root_idx]
        const length = root_portal.line.length

        for (const handle_idx in game.handles) {
          const handle = game.handles[handle_idx]

          if (handle.line == root_portal.line &&
            handle.side > 0 == root_portal.side > 0 &&
            Math.abs(handle.dot - root_portal.dot) * length < handle_portal_dist
          ) {
            return `handle overlaps portal`
          }
        }

        for (let spot_idx = root_idx + 1; spot_idx < game.portals.length; ++spot_idx) {
          const spot_portal = game.portals[spot_idx]


          if (root_portal.line == spot_portal.line &&
            Math.abs(root_portal.dot - spot_portal.dot) * length < portal_diameter
          ) {
            return `portals overlap`
          }
        }
      }

      for (let root_idx = 0; root_idx < game.handles.length; ++root_idx) {
        const root_handle = game.handles[root_idx]
        const length = root_handle.line.length

        for (let spot_idx = root_idx + 1; spot_idx < game.handles.length; ++spot_idx) {
          const spot_handle = game.handles[spot_idx]

          if (root_handle.line == spot_handle.line &&
            root_handle.side > 0 == spot_handle.side > 0 &&
            Math.abs(root_handle.dot - spot_handle.dot) * length < handle_diameter
          ) {
            return `handles overlap`
          }
        }
      }

      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]

        if (key.jack) {
          if (key.jack.key != key) {
            return `bad key jack`
          }
        }
        else if (key.handle) {
          if (key.handle.key != key) {
            return `bad key handle`
          }
        }
      }

      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]

        if (jack.handle) {
          if (jack.handle.jack != jack) {
            return `bad jack handle`
          }
        }
      }
    }
  }

  // getters
  {
    /* Get Game (client: Client)
      Return: Game

      Game
        MOD nodes,lines,portals,handles: Object[]
        MOD editors: Object{Id}
        MOD action: String
    */
    MazeGame.get_game = get_game
    function get_game() {
      const new_game = {
        editors: {},
        nodes: [],
        lines: [],
        portals: [],
        handles: [],
        keys: [],
        jacks: [],
        action: `new game`
      }

      return new_game
    }

    /* Get Editor (game: Game, client: Client)
      Return: Editor
        if game already has an editor @ client.socket.id
          return editor @ client.socket.id
        else return new_editor @ client.socket.id
      Recommended pre-functions for Game: get_game,copy_game,import_game

      Socket
        id: Id
      Client
        name: String
        socket: Socket
      Editor
        id: Id
        name,state: String
      Game
        editors: Editor{Id}
    */
    MazeGame.get_editor = get_editor
    function get_editor(game, client) {

      const editor = game.editors[client.socket.id]
      if (editor) {
        return editor
      }

      const new_editor = {
        get name() {
          return client.name
        },
        get id() {
          return client.socket.id
        },
        state: 'node',
      }
      game.editors[new_editor.id] = new_editor

      return new_editor
    }

    /* Get Node (game: Game, min_dist2: Float)
      Return: closest node if node.dist2 is less than min_dist2
      Recommended pre-functions for Game: set_game_focus

      Node
        dist2: Float
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
      Recommended pre-functions for Game: set_game_focus

      Node
        dist2: Float
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

      return min_dist2 && ret_line
    }

    /* Get Portal (game: Game, line: Line)
      Recommended pre-functions for Game: set_game_focus

      Line
        dot,length2: Float
      Portal
        dot: Float
        line: Line
      Game
        portals: Portal[]
    */
    MazeGame.get_portal = get_portal
    function get_portal(game, line) {

      let min_dist = portal_radius / line.length
      let ret_portal = null

      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        if (portal.line == line) {
          const dist = Math.abs(portal.dot - line.dot)
          if (dist < min_dist) {
            min_dist = dist
            ret_portal = portal
          }
        }
      }

      return ret_portal
    }

    /* Get Handle (game: Game, line: Line)
      Recommended pre-functions for Game: set_game_focus && measure_game

      Line
        dot,length2: Float
      Handle
        dot: Float
        line: Line
      Game
        handles: Handle[]
    */
    MazeGame.get_handle = get_handle
    function get_handle(game, line) {

      let min_dist = handle_diameter * 2 / line.length
      let ret_handle = null

      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        if (handle.line == line) {
          const dist = Math.abs(handle.dot - line.dot)
          if (dist < min_dist) {
            min_dist = dist
            if (handle.side > 0 != line.side > 0) {
              min_dist += handle_radius
            }
            ret_handle = handle
          }
        }
      }

      return ret_handle
    }

    /* Get Key (game: Game, min_dist2: Float)
      Return: closest key if key.dist2 is less than min_dist2
      Recommended pre-functions for Game: set_game_focus

      Key
        dist: Float
        handle,jack: Object
      Game
        keys: Key[]
    */
    MazeGame.get_key = get_key
    function get_key( game, jack, handle, min_dist ) {

      if (jack && jack.key) {
        return jack.key
      }
      else if (handle) {
        return handle.key
      }

      let ret_key = null

      for ( const key_idx in game.keys ) {
        const key = game.keys[ key_idx ]

        if ( !key.jack && !key.handle && key.dist < min_dist ) {
          min_dist = key.dist
          ret_key = key
        }
      }

      return ret_key
    }

    /* Get Jack (game: Game, min_dist2: Float)
      Return: closest jack if jack.dist2 is less than min_dist2
      Recommended pre-functions for Game: set_game_focus

      Jack
        dist: Float
      Game
        jacks: Jack[]
    */
    MazeGame.get_jack = get_jack
    function get_jack( game, handle, min_dist ) {

    if (handle) {
      return handle.jack
    }

    let ret_jack = null

    for ( const jack_idx in game.jacks ) {
      const jack = game.jacks[ jack_idx ]

      if ( !jack.handle && jack.dist < min_dist ) {
        min_dist = jack.dist
        ret_jack = jack
      }
    }

    return ret_jack
  }

    /* Get Room ( game: Game )
      Return: a room iff the fx,fy defined in set_game_focus is inside the room
      Recommended pre-functions for Game: solve_rooms && set_game_focus

      Room: Object
      Node
        px,py: Float
      Flip
        root_node,spot_node
        vx,vy,angle: Float
        room: Room
        flip: Flip
        prev_line,next_line: Flip
      Line: Flip
        dot,dist2,side: Float
      Game
        lines: Line[]
    */
    MazeGame.get_room = get_room
    function get_room ( game ) {

      let ret_room = null
      let min_dist2 = Infinity

      for ( const line_idx in game.lines ) {
        let line = game.lines[line_idx]
        const dist2 = line.dist2
        let dot = line.dot

        if (line.side < 0) {
          line = line.flip
          dot = 1 - dot
        }

        if (line.root_node.dist2 == 0) {
          return
        }

        if (0 < dot && dot < 1) {
          if (dist2 < min_dist2) {
            min_dist2 = dist2
            ret_room = line.room
          }
        }
        else {

          let dot_line = 0 < dot ? line.next_line : line

          if (dot_line.root_node.dist2 < min_dist2) {
            const angle_rank = Lib.get_angle_rank(
              dot_line.prev_line.flip.angle,
              dot_line.angle,
              dot_line.root_node.angle,
            )

            if (0 < angle_rank && angle_rank < 1) {
              min_dist2 = dot_line.root_node.dist2
              ret_room = line.room
            }
          }
        }
      }

      return ret_room
    }

    /* Get Cell (game: Game, room: Room)
      Returns: Cell,Null
      Recommended pre-functions for Game: set_game_focus && solve_cells
      Recommended pre-functions for Room: get_room(game: Game)

      Node
        x,y,px,py: Float
      Cord
        vx,vy,length2: Float
        root_node,spot_node: Node
        MOD side,dist,px,py,dist2: Float
      Room
        cells: Cell[]
      Game
        fx,fy: Float
    */
    MazeGame.get_cell = get_cell
    function get_cell (game, room) {

      for (const cord_idx in room.cords) {
        let cord = room.cords[cord_idx]

        cord.side = cord.root_node.py*cord.vx - cord.root_node.px*cord.vy
        cord.dot = ( cord.root_node.px*cord.vx + cord.root_node.py*cord.vy ) / cord.length2
        cord.px = game.fx - (cord.root_node.x + cord.vx * cord.dot)
        cord.py = game.fy - (cord.root_node.y + cord.vy * cord.dot)
        cord.dist2 = cord.px*cord.px + cord.py*cord.py
      }

      let ret_cell = null
      let min_dist2 = Infinity

      for ( const cord_idx in room.cords ) {
        let cord = room.cords[cord_idx]
        const dist2 = cord.dist2
        let dot = cord.dot

        if (cord.side < 0) {
          continue
        }

        if (cord.root_node.dist2 == 0) {
          return
        }

        if (0 < dot && dot < 1) {
          if (dist2 < min_dist2) {
            min_dist2 = dist2
            ret_cell = cord.cell
          }
        }
        else {

          let dot_cord = 0 < dot ? cord.next_cord : cord

          if (dot_cord.root_node.dist2 < min_dist2) {
            const angle_rank = Lib.get_angle_rank(
              dot_cord.prev_cord.flip.angle,
              dot_cord.angle,
              dot_cord.root_node.angle,
            )

            if (0 < angle_rank && angle_rank < 1) {
              min_dist2 = dot_cord.root_node.dist2
              ret_cell = cord.cell
            }
          }
        }
      }

      return ret_cell
    }

    /* Get node,line,handle,portal,jack,key
      TODO
    */
    MazeGame.get_all = get_all
    function get_all(game) {

      const getter = {}
      getter.node = get_node(game, node_diameter2)
      getter.line = get_line(game, node_diameter2)
      getter.handle = getter.line && get_handle(game, getter.line)
      getter.portal = getter.line && get_portal(game, getter.line)
      getter.jack = get_jack(game, getter.handle, jack_diameter)
      getter.key = get_key(game, getter.handle, getter.jack, key_diameter)

      return getter
    }

  }

  // solvers
  {
    /* Set Gates (game: Game)
      Recommended pre-functions for Game: game_copy

      Gate
        MOD is_active: Boolean
      Node
        MOD gate: Gate
      Line
        MOD gate: Gate
        state: String
        root_node,spot_node: Node
      Portal
        line: Line
        MOD gate: Gate
      Handle
        line: Line
        rel_dot: Float
        portal: Portal, handle: Handle, null
        MOD gate: Gate
      Game
        nodes: Node[]
        lines: Line[]
        portals: Portal[]
        MOD active_portals: Portal[]
          contains either 0 or 2 portals (with gates that are active)
          if there do not exist exactly 2 portals with active gates,
            the number of active portals is set to zero
            and all portals gates are deactivated
        handles: Handle[]
        MOD gates: Gate[]
    */
    MazeGame.solve_gates = solve_gates
    function solve_gates(game, log) {

      const temp_gates = []

      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]

        if (line.state != 'door' && line.state != 'laser') {
          continue
        }

        const root_gate = temp_gates[line.root_node.gate]
        const spot_gate = temp_gates[line.spot_node.gate]

        if (root_gate) {
          if ( line.spot_node.gate >= 0 ) {
            temp_gates[line.spot_node.gate] = root_gate
          }
          else {
            line.spot_node.gate = line.root_node.gate
          }
        }
        else if (spot_gate) {
          if ( line.root_node.gate >= 0 ) {
            temp_gates[line.root_node.gate] = spot_gate
          }
          else {
            line.root_node.gate = line.spot_node.gate
          }
        }
        else {
          const new_gate = {
            is_active: false,
          }
          line.root_node.gate = temp_gates.length
          line.spot_node.gate = temp_gates.length
          temp_gates.push(new_gate)
        }

        line.gate = line.root_node.gate
      }

      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        node.gate = temp_gates[node.gate]
      }
      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]
        line.gate = temp_gates[line.gate]
      }

      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        const new_gate = {
          is_active: false,
        }
        portal.gate = new_gate
        temp_gates.push(new_gate)
      }

      game.gates = []
      for (const gate_idx in temp_gates) {
        const gate = temp_gates[gate_idx]

        if (!gate.is_active) {
          game.gates.push(gate)
          gate.is_active = true
        }
      }

      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        handle.gate =
        handle.portal ? handle.portal.gate :
        handle.handle ? handle.handle.gate :
        handle.rel_dot ? handle.line.spot_node.gate : handle.line.root_node.gate

        if (handle.gate && handle.gate.is_active) {
          handle.gate.is_active = !!(handle.key || handle.jack)
        }
      }

      game.active_portals = []
      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        if (portal.gate.is_active) {
          game.active_portals.push(portal)
        }
      }
      if (game.active_portals.length != 2) {
        for (const portal_idx in game.active_portals) {
          const portal = game.active_portals[portal_idx]
          portal.is_active = false
        }
        game.active_portals = []
      }
    }

    /* Solve Rooms (game: Game)
      Recommended pre-functions for Game: measure_game

      TODO rebuild Type list

      Room:
        MOD handles: Handle[]
        MOD portals: Handle[]
        MOD lines: Flip[]
          an array of lines arrayed clockwise around the room from root_node to spot_node
          for each Flip in the array:
          the next element is its next_line
          the previous element is its prev_line
      Flip:
        root_node,spot_node: Node
        state: String
        MOD hub: Line
        MOD flip: Flip
          line with inverted vx,vy, angle, and root and spot nodes
        MOD angle: Float (-pi,pi)
        MOD room: Room
        MOD next_line,prev_line: Flip
      Line: Flip
        vx,vy: Float
      Node:
        MOD lines: Flip[]
          array of Flip that all have Node as their root_node
            sorted by Flip.angle from largest to smallest
      Game:
        nodes: Node[]
        lines: Line[]
        MOD rooms: Room[]
    */
    MazeGame.solve_rooms = solve_rooms
    function solve_rooms(game) {

      // add lines to nodes
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        node.lines = []
      }

      // add line flips and angles
      for (const line_idx in game.lines) {
        const line = game.lines[line_idx]

        line.angle = Math.atan2(line.vy, line.vx)
        line.room = null

        line.flip = {
          root_node: line.spot_node,
          spot_node: line.root_node,
          state: line.state,
          flip: line,
          angle: Lib.inverse_angle(line.angle),
          room: null,

          vx: -line.vx,
          vy: -line.vy,
          length2: line.length2,
        }

        if (line.state != 'wall') {
          line.hub = line
          line.flip.hub = line
        }

        line.root_node.lines.push(line)
        line.spot_node.lines.push(line.flip)
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

    /* Solve Cells (game: Game)
      Recommended pre-functions for Game: solve_rooms
      Used functions
        Lib.get_angle_rank
        Lib.inverse_angle

      Hub
        x,y: Float
      Cell NEW
        room: Room
        cords: Cord[]
        hubs: Hub[]
        handles,portals: Handle[]
        is_acute: Boolean
        x,y: Float
      Cord NEW: Hub,Null
        root_node,spot_node: Node
        sort_length2,length2,angle,vx,vy: Float
        room: Room
        flip,next_cord,prev_cord: Cord
        hub: Hub
      Line: Cord
        iMOD sort_length2: Float
        flip,prev_line: Line
        hub: Line,Null
      Node
        iMOD idx: Id
        iMOD cords: Cord[]
        x,y: Float
        lines: Line[]
      Room
        iMOD cords: Cord[]
        lines: Line[]
        cell: Cells[]
        hub: Hubs[]
      Handle: Hub
        side: Float
        line: Line
        iMOD cell: Cell
      Game
        nodes: Node[]
        rooms: Room[]
        portal,handle: Handle[]
        hubs: Hub[]
    */
    MazeGame.solve_cells = solve_cells
    function solve_cells(game) {

      // set node idx and cords (map)
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        node.idx = node_idx
        node.cords = {}
      }

      // map each node.line in node.cords to node.line.spot_node.idx
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]

        for (const line_idx in node.lines) {
          const line = node.lines[line_idx]
          node.cords[line.spot_node.idx] = line
          line.sort_length2 = -1
        }
      }

      // split rooms
      for (const room_idx in game.rooms) {
        const room = game.rooms[room_idx]
        room.cords = []
        const temp_cords = room.lines.slice(0)

        // make cords
        for (let root_idx = 0; root_idx < room.lines.length; ++root_idx) {

          const root_line = room.lines[root_idx]
          const flip_angle = root_line.prev_line.flip.angle
          const root_node = root_line.root_node

          for (let spot_idx = root_idx + 2; spot_idx < room.lines.length; ++spot_idx) {
            const spot_line = room.lines[spot_idx]
            const spot_node = spot_line.root_node

            if (root_node == spot_node || root_node.cords[spot_node.idx]) {
              continue
            }

            const vx = spot_node.x - root_node.x
            const vy = spot_node.y - root_node.y

            const root_angle = Math.atan2(vy, vx)
            const root_angle_rank = Lib.get_angle_rank(
              flip_angle,
              root_line.angle,
              root_angle,
            )

            if (0 >= root_angle_rank || root_angle_rank >= 1) {
              continue
            }

            const spot_angle = Lib.inverse_angle(root_angle)
            const spot_angle_rank = Lib.get_angle_rank(
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
              sort_length2: length2,
              length2: length2,
              angle: root_angle,
              room: room,

              vx: vx, vy: vy,

              x: (spot_node.x + root_node.x) / 2,
              y: (spot_node.y + root_node.y) / 2,

              flip: {
                root_node: spot_node,
                spot_node: root_node,
                sort_length2: length2,
                length2: length2,
                angle: spot_angle,
                room: room,

                vx: -vx, vy: -vy,
              },
            }
            new_cord.flip.flip = new_cord
            new_cord.hub = new_cord.flip.hub = new_cord
            root_node.cords[spot_node.idx] = new_cord
            spot_node.cords[root_node.idx] = new_cord.flip
            temp_cords.push(new_cord)
          }
        }

        // sort cords by accending length
        temp_cords.sort(({sort_length2:a}, {sort_length2:b}) => a - b)

        // remove excess cords
        for ( let root_idx = 0; root_idx < temp_cords.length; ++root_idx) {
          const root_cord = temp_cords[root_idx]

          let spot_idx = root_idx + 1 > room.lines.length ?
            root_idx + 1 : room.lines.length

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
              delete spot_cord.root_node.cords[spot_cord.spot_node.idx]
              delete spot_cord.spot_node.cords[spot_cord.root_node.idx]
            }
          }
        }
      }

      // trace cords
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        const cord_map = node.cords
        node.cords = []

        for (const spot_node_idx in cord_map) {
          const cord = cord_map[spot_node_idx]
          cord.room.cords.push(cord)
          node.cords.push(cord)
        }

        node.cords.sort(({angle:a}, {angle:b}) => b - a)
        for ( let cord_idx = 0; cord_idx < node.cords.length; ++cord_idx) {
          const cord = node.cords[cord_idx].flip
          const next_cord = node.cords[(cord_idx+1)%node.cords.length]

          cord.next_cord = next_cord
          next_cord.prev_cord = cord
        }
      }

      // make cells
      game.hubs = []
      for (const room_idx in game.rooms) {
        const room = game.rooms[room_idx]
        room.cells = []

        for (const cord_idx in room.cords) {
          const root_cord = room.cords[cord_idx]

          if (root_cord.cell) {
            continue
          }

          const new_cell = {
            room: room,
            cords: [],
            hubs: [],
            is_acute: true,

            portals: [],
            handles: [],

            x: 0, y: 0,
          }

          let cord = root_cord
          do {
            new_cell.cords.push(cord)
            cord.cell = new_cell

            if (cord.hub) {
              if (game.hubs.indexOf(cord.hub) < 0) {
                game.hubs.push(cord.hub)
              }
              if (new_cell.hubs.indexOf(cord.hub) < 0) {
                new_cell.hubs.push(cord.hub)
              }
            }

            new_cell.x += cord.root_node.x
            new_cell.y += cord.root_node.y

            const angle_dif = (pi2 + cord.flip.angle - cord.next_cord.angle) % pi2
            if (angle_dif > pi) {
              new_cell.is_acute = false
            }

            cord = cord.next_cord
          }
          while (cord != root_cord)

          new_cell.x /= new_cell.cords.length
          new_cell.y /= new_cell.cords.length

          if (new_cell.is_acute && new_cell.cords.length > 2) {
            room.cells.push(new_cell)
          }
          else {
            new_cell.is_acute = false
          }
        }
      }

      // add handles to cells
      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]
        const line = handle.side > 0 ? handle.line : handle.line.flip
        line.cell.handles.push(handle)
        handle.cell = line.cell
        game.hubs.push(handle)
        handle.cell.hubs.push(handle)
      }

      // add portals to cells
      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]
        const line = portal.side > 0 ? portal.line : portal.line.flip
        line.cell.portals.push(portal)
        portal.cell = line.cell
        game.hubs.push(portal)
        portal.cell.hubs.push(portal)
      }
    }

    /* Check Flip Trail Cross (root_trail,spot_trail: Trail, flips: Flip[])
      Node
        x,y: Float
      Flip
        root_node,spot_node: Node
      Trail: Node
        flip: Flip,Null
    */
    function check_trail_flips_cross(root_trail, spot_trail, flips) {

      for (const flip_idx in flips) {
        const flip = flips[flip_idx]
        if (
          root_trail.flip != flip &&
          spot_trail.flip != flip &&
          Lib.line_cross(
            root_trail.x, root_trail.y,
            spot_trail.x, spot_trail.y,
            flip.root_node.x, flip.root_node.y,
            flip.spot_node.x, flip.spot_node.y,
          )
        ) {
          return false
        }
      }

      return true
    }

    /* Solve Path (game: Game, jack: Jack, handle: Handle, Key: key)
      Return: Path,Null
      Recommended pre-functions for Game:
        set_game_focus && solve_cells && solve_gates

      NOTE: Solve Path cannot be called more than once
        without calling solve_cells again
        to reset the connections between active portals

      Jack
      Trail NEW
        x,y,dist,total_dist: Float
      Handle

      Path
        total_dist: Float
        jack: Jack
        handle: Handle, key: Key, Null
      Game
        active_portals: Portal[]
          see solve_gates.Game.active_portals
    */
    MazeGame.solve_path = solve_path
    function solve_path(game, jack, handle, key, log) {

      const root_hub = jack
      const path = {
        jack: jack,
        total_dist: 0,
        trails: [root_hub],
      }

      if (handle) {
        path.handle = handle
      }
      else if (key) {
        path.key = key
      }

      let spot_hub = handle
      let spot_cell = handle && handle.cell
      if (!spot_hub) {
        if (key) {
          set_game_focus(game, key.x, key.y)
        }
        spot_hub = {
          x: game.fx, y: game.fy,
          links: []
        }
        spot_cell = get_cell(game, get_room(game))
        if (!spot_cell) {
          log && log('solve_path cannot find spot_cell')
          return // cannot locate spot_cell
        }

        game.hubs.push(spot_hub)
        spot_cell.hubs.push(spot_hub)
      }
      else if (!spot_cell) {
        return // cannot locate spot_cell
      }

      set_game_focus(game, jack.x, jack.y)
      const root_cell = get_cell(game, get_room(game))

      if (root_cell == spot_cell) {
        const vx = root_hub.x - spot_hub.x
        const vy = root_hub.y - spot_hub.y
        const dist = Math.sqrt(vx*vx + vy*vy)

        root_hub.dist = 0
        root_hub.total_dist = 0
        spot_hub.dist = dist
        spot_hub.total_dist = dist
        path.total_dist = dist

        path.trails.push(spot_hub)
        return path
      }
      else if (!root_cell) {
        return // cannot locate target root_cell
      }

      game.hubs.push(jack)
      root_cell.hubs.push(jack)
      const root_gate = jack.handle && jack.handle.gate

      for (const hub_idx in game.hubs) {
        const hub = game.hubs[hub_idx]
        hub.total_dist = Infinity
        hub.links = []
      }

      for (const room_idx in game.rooms) {
        const room = game.rooms[room_idx]

        for (const cell_idx in room.cells) {
          const cell = room.cells[cell_idx]

          for (const root_idx in cell.hubs) {
            const root_hub = cell.hubs[root_idx]
            if (
              !root_hub.gate ||
              (root_hub.gate.is_active && root_hub.gate != root_gate)
            ) {
              for (const spot_idx in cell.hubs) {
                const spot_hub = cell.hubs[spot_idx]
                if (
                  root_hub != spot_hub &&
                  (
                    !spot_hub.gate ||
                    (spot_hub.gate.is_active && spot_hub.gate != root_gate)
                  )
                ) {
                  const vx = root_hub.x - spot_hub.x
                  const vy = root_hub.y - spot_hub.y
                  root_hub.links.push({
                    hub: spot_hub,
                    dist: Math.sqrt(vx*vx + vy*vy)
                  })
                }
              }
            }
          }
        }
      }
      const [root_portal, spot_portal] = game.active_portals

      if (
        game.active_portals.length == 2 &&
        (
          !root_gate ||
          (root_portal.gate != root_gate && spot_portal.gate != root_gate)
        )
      ) {
        const vx = root_portal.x - spot_portal.x
        const vy = root_portal.y - spot_portal.y
        const dist = Math.sqrt(vx*vx + vy*vy)

        root_portal.links.push({
          hub: spot_portal,
          dist: dist,
        })
        spot_portal.links.push({
          hub: root_portal,
          dist: dist,
        })
      }

      spot_hub.total_dist = 0
      const hub_stack = [ spot_hub ]

      while (hub_stack.length) {
        const root_hub = hub_stack.pop()

        for (const link_idx in root_hub.links) {
          const {hub: spot_hub, dist} = root_hub.links[link_idx]

          if (root_hub.total_dist + dist < spot_hub.total_dist) {
            spot_hub.total_dist = root_hub.total_dist + dist
            hub_stack.push(spot_hub)
          }
        }
      }

      if (!isFinite(root_hub.total_dist)) {
        return // no path exists
      }

      let hub = root_hub
      do {
        let min_dist = Infinity
        let next_hub = null

        for (const link_idx in hub.links) {
          const {hub: spot_hub, dist} = hub.links[link_idx]

          if (dist < min_dist && spot_hub.total_dist < hub.total_dist) {
            spot_hub.dist = min_dist = dist
            next_hub = spot_hub
          }
        }

        path.trails.push(hub = next_hub)
      }
      while (hub && hub != spot_hub)

      if (!hub) {
        return // path error
      }

      path.total_dist = 0
      root_hub.dist = 0
      for (const trail_idx in path.trails) {
        const trail = path.trails[trail_idx]
        trail.total_dist = path.total_dist += trail.dist
      }

      return path
    }
  }

  /* Do Action (game: Game, editor_id: Id, center,mouse: Point)
    Return: Game
    Recommended pre-functions for Game: get_game,copy_game,import_game

    TODO

    Point
      x,y: Float
    Editor: edit_game.Editor
      MOD path: solve_path.Path
      MOD jack: edit_game.Jack
    Game: edit_game.Game
      MOD action: String
      MOD reaction: String,Null
      MOD center,mouse: Point
    Node
      MOD state: String
      MOD x,y: Float
    Line
      MOD root_node,spot_node: Node
    Editor
      state: String
      MOD node
    Portal
      line: Line
      side,dot: Float
    Handle
      line: Line
      handle: Handle, portal: Portal, null
      rel_dot: Float
    Game
      MOD nodes: Node[]
      MOD lines: Line[]
      MOD handles: Handle[]
      MOD portals: Portal[]
  */
  MazeGame.do_action = do_action
  function do_action(game, client, center, mouse, log) {


    let game_copy = copy_game(game)
		let editor = get_editor(game_copy, client)

    // log && log('do_action', game_copy.path)
		if (game_copy.path) {
			// log && log('COMMAND')
      return game
		}
		else if (editor.state == 'game') {

      measure_game(game_copy)
			if (editor.jack) {
				center = editor.jack.handle || editor.jack
        game_copy.center = center
			}

			set_game_focus(game_copy, mouse.x+center.x, mouse.y+center.y)

      const {node,line,handle,portal,jack,key} = get_all(game_copy)

			// log && log(
			// 	node && 'node',
			// 	line && 'line',
			// 	handle && 'handle',
			// 	portal && 'portal',
			// 	jack && 'jack',
			// 	key && 'key',
			// )

			if (editor.jack) {
				solve_rooms(game_copy)
				solve_cells(game_copy)
				solve_gates(game_copy)
				game_copy.path = solve_path(game_copy, editor.jack, handle, key, log)
        editor.action = game_copy.path ? `made path` : `no action`
			}
			else if (jack) {
				editor.jack = jack
				editor.action = `selected jack`
			}
      return game_copy
		}
		else {
      const fx = mouse.x+center.x, fy = mouse.y+center.y

      let sanity = 2
      while (sanity-- > 0) {

        // try action
        {
          measure_game(game_copy)
          set_game_focus(game_copy, fx, fy)

          game_copy.action = ''

          const {node,line,handle,portal,jack,key} = get_all(game_copy)

          const state = states[editor.state]
          switch (editor.state) {
            case 'node':
            case 'door':
            case 'laser':
            case 'wall':
              if (editor.node) {
                if (node) {
                  if (node == editor.node) {
                    if (editor.state == 'node') {
                      editor.node.x = fx
                      editor.node.y = fy
                      editor.node = null
                      game_copy.action += `moved and deselected node`
                      break
                    }
                    else {
                      editor.node = null
                      game_copy.action = `deselected node`
                      break
                    }
                  }
                  else if (editor.state == 'node') {
                    editor.node = node
                    game_copy.action = `selected node`
                    break
                  }
                  else {
                    const new_line = {
                      root_node: editor.node,
                      spot_node: node,
                      state: editor.state,
                    }
                    editor.node = node
                    game_copy.lines.push(new_line)
                    game_copy.action = `selected node, added new line`
                    break
                  }
                }
                else if (editor.state == 'node') {
                  editor.node.x = fx
                  editor.node.y = fy
                  editor.node = null
                  game_copy.action += `moved and deselected node`
                  break
                }
                else {
                  const new_node = {
                    x: fx,
                    y: fy,
                    state: 'node',
                  }
                  game_copy.nodes.push(new_node)

                  if (line && !node) {

                    const new_line = {
                      root_node: new_node,
                      spot_node: line.spot_node,
                      state: line.state,
                    }
                    game_copy.lines.push(new_line)

                    line.spot_node = new_node

                    game_copy.action = `split ${line.state}, `
                  }

                  const new_line = {
                    root_node: editor.node,
                    spot_node: new_node,
                    state: editor.state,
                  }
                  editor.node = new_node
                  game_copy.lines.push(new_line)
                  game_copy.action += `added and selected new node, added new ${editor.state}`
                  break
                }
              }
              else if (node) {
                editor.node = node
                game_copy.action = `selected node`
                break
              }
              else {
                const new_node = {
                  x: fx,
                  y: fy,
                  state: 'node',
                }
                game_copy.nodes.push(new_node)

                if (line) {
                  const new_line = {
                    root_node: new_node,
                    spot_node: line.spot_node,
                    state: line.state,
                  }
                  game_copy.lines.push(new_line)

                  line.spot_node = new_node

                  game_copy.action = `split ${line.state}, `
                }

                if (editor.state == 'node') {
                  game_copy.action += `added new node`
                  break
                }
                else {
                  editor.node = new_node
                  game_copy.action += `added and selected new node`
                  break
                }
              }
            case 'handle':


              if (!line || line.state != 'wall') {
                break
              }

              const new_handle = {
                line: line,
                is_square: false,
                rel_side: line.side,
              }

              const length = line.dot * line.length
              const handle_diameter = handle_radius * 2.5

              if (length < handle_diameter) {
                new_handle.rel_dot = 0
                game_copy.action = `added new handle to node`
              }
              else if (length > line.length - handle_diameter) {
                new_handle.rel_dot = 1
                game_copy.action = `added new handle to node`
              }
              else if (portal) {
                new_handle.portal = portal
                if (line.side > 0 == portal.side > 0) {
                  new_handle.rel_dot = line.dot > portal.dot ? 1 : -1
                  new_handle.rel_side = 1
                }
                else {
                  new_handle.rel_dot = 0
                  new_handle.rel_side = -1
                }
                game_copy.action = `added new handle to portal`
              }
              else if (handle) {
                if (line.side > 0 == handle.side > 0) {
                  new_handle.rel_dot = line.dot > handle.dot ? 1 : -1
                  new_handle.rel_side = 1
                }
                else {
                  new_handle.rel_dot = 0
                  new_handle.rel_side = -1
                }
                new_handle.handle = handle
                game_copy.action = `added new handle to handle`
              }
              else {
                break
              }

              game_copy.handles.push(new_handle)
              break
            case 'portal':

              if (editor.portal) {
                const line = editor.portal.line
                if (0 < line.dot && line.dot < 1) {
                  editor.portal.dot = line.dot
                  editor.portal.side = line.side
                  editor.portal = null
                  game_copy.action = `moved and deselected portal`
                }
                break
              }
              else if (portal) {
                if (editor.portal == portal) {
                  editor.portal = null
                  game_copy.action = `deselected portal`
                  break
                }
                else {
                  editor.portal = portal
                  game_copy.action = `selected portal`
                  break
                }
              }
              else if (line && line.state == 'wall') {
                const new_portal = {
                  line: line,
                  side: line.side,
                  dot: line.dot,
                }
                game_copy.portals.push(new_portal)
                game_copy.action = `added new portal`
                break
              }

              break
            case 'square':
              if (handle) {
                handle.is_square = !handle.is_square
                game_copy.action = `changed handle is_square to ${handle.is_square}, `
              }
              if (key) {
                key.is_square = !key.is_square
                game_copy.action += `changed key is_square to ${key.is_square}`
              }
              break
            case 'key':
              if (editor.key) {

                editor.key.x = fx
                editor.key.y = fy

                if (editor.key.handle) {
                  editor.key.handle.key = null
                  editor.key.handle = null
                }

                if (editor.key.jack) {
                  editor.key.jack.key = null
                  editor.key.jack = null
                }

                if (jack) {
                  editor.key.jack = jack
                  jack.key = editor.key
                  editor.key.is_square = !!jack.handle && jack.handle.is_square
                  game_copy.action = `added key to jack`
                }
                else if (handle) {
                  editor.key.handle = handle
                  handle.key = editor.key
                  editor.key.is_square = handle.is_square
                  game_copy.action = `added key to handle`
                }

                editor.key = null
                game_copy.action = `moved and deselected key, ${game_copy.action}`
              }
              else if (key) {
                editor.key = key
                game_copy.action = `selected key`
              }
              else {

                const new_key = {
                  x: fx, y: fy,
                  is_square: false,
                }
                game_copy.keys.push(new_key)

                if (jack) {
                  new_key.jack = jack
                  jack.key = new_key
                  new_key.is_square = !!jack.handle && jack.handle.is_square
                  game_copy.action = `added key to jack`
                }
                else if (handle) {
                  new_key.handle = handle
                  handle.key = new_key
                  new_key.is_square = handle.is_square
                  game_copy.action = `added key to handle`
                }
                else {
                  game_copy.action = `added key to game`
                }
              }

              break
            case 'jack':

              if (editor.jack) {
                editor.jack.x = fx
                editor.jack.y = fy

                if (editor.jack.handle) {
                  editor.jack.handle.jack = null
                  editor.jack.handle = null
                }

                if (handle) {
                  editor.jack.handle = handle
                  handle.jack = editor.jack
                  game_copy.action = `added jack to handle`
                }

                editor.jack = null
                game_copy.action = `moved and deselected jack, ${game_copy.action}`
              }
              else if (jack) {
                editor.jack = jack
                game_copy.action = `selected jack`
              }
              else {
                const new_jack = {
                  x: fx, y: fy,
                }
                game_copy.jacks.push(new_jack)

                if (handle) {
                  new_jack.handle = handle
                  handle.jack = new_jack
                  game_copy.action = `added jack to handle`
                }
                else {
                  game_copy.action = `added jack to game`
                }
              }

              break
          }
        }

        measure_game(game_copy)
        const message = game_copy.action && check_is_valid_game(game_copy)
        if (!message) {

          if (!game_copy.action) {
            game_copy.action = `no action`
          }
          return game_copy
        } else if (game_copy.reaction) {
          game.action = game_copy.reaction
          return game
        }
        else {
          game_copy = copy_game(game)
          editor = get_editor(game_copy, client)

          game_copy.reaction = message + `, `

          // clear editor
          if (editor.node) {
            editor.node = null
            game_copy.reaction = `deselected node`
          }
          if (editor.node) {
            editor.node = null
            game_copy.reaction += `deselected node, `
          }
          if (editor.portal) {
            editor.portal = null
            game_copy.reaction += `deselected portal, `
          }
          if (editor.handle) {
            editor.handle = null
            game_copy.reaction += `deselected handle, `
          }
          if (editor.key) {
            editor.key = null
            game_copy.reaction += `deselected key, `
          }
          if (editor.jack) {
            editor.jack = null
            game_copy.reaction += `deselected jack, `
          }
        }
      }
		}
  }

  /* Solve Game (game: Game, center: Point, mouse: Mouse)

    Recommended pre-functions for Game: game_copy
    Requires: ( states: State[] )

    Point:
      x,y: Float
    Mouse: Point
      scale,width,height: Float

    TODO (incomplete)

    State
      stroke_color: Color(Gate)
      fill_color: Color(Gate)
    Gate
      TODO handles
      TODO portals
    Node
      state: String
      gate: Gate
      stroke_color: Color
      fill_color: Color
    Line
      state: String
      gate: Gate
      stroke_color: Color
      fill_color: Color
    Game
      nodes: Node[]
      lines: Line[]

  */
  MazeGame.solve_game = solve_game
  function solve_game(game, {x: px, y: py}, {scale, width, height, x:mx, y:my}, log) {

    const fx = px + mx, fy = py + my

    measure_game(game, log)
    solve_rooms(game)
    solve_cells(game)
    solve_gates(game, log)
    set_game_focus(game, fx, fy)
    const sel_room = get_room(game)
    const sel_cell = sel_room && get_cell(game, sel_room)

    // set colors
    {
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        const state = states[node.state]

        node.stroke_color = state.stroke_color(node.gate && node.gate.is_active)
        node.fill_color = state.fill_color(node.gate && node.gate.is_active)
      }

      for (const line_idx in game.lines) {
        let line = game.lines[line_idx]
        const state = states[line.state]

        line.stroke_color = state.stroke_color(line.gate && line.gate.is_active)
        line.fill_color = state.fill_color(line.gate && line.gate.is_active)
      }

      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]

        portal.fill_color = states.portal.fill_color(portal.gate && portal.gate.is_active)
      }

      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]

        handle.fill_color = states.handle.fill_color(handle.gate && handle.gate.is_active)
        handle.stroke_color = states.handle.stroke_color(handle.gate && handle.gate.is_active)
      }

      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]
        const line = jack.line

        jack.fill_color = states.jack.fill_color
        jack.stroke_color = states.jack.stroke_color
      }

      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]
        const line = key.line

        key.fill_color = states.key.fill_color
        key.stroke_color = states.key.stroke_color
      }

      for (const room_idx in game.rooms) {
        const room = game.rooms[room_idx]

        for (const cell_idx in room.cells) {
          const cell = room.cells[cell_idx]

          cell.fill_color =
            sel_cell == cell ? `#80ffff20` :
            sel_room == room ? `#80ff8020` : `#ffffff20`
        }
      }
    }

    // set transforms
    {
      const scale_bot = scale * bot_scale
      const shift_bot_x = width / 2 - px * scale_bot
      const shift_bot_y = height / 2 - py * scale_bot

      const scale_mid = scale * mid_scale
      const shift_mid_x = width / 2 - px * scale_mid
      const shift_mid_y = height / 2 - py * scale_mid

      const scale_top = scale * top_scale
      const shift_top_x = width / 2 - px * scale_top
      const shift_top_y = height / 2 - py * scale_top

      // set a, b, and p transforms for all nodes
      for (const node_idx in game.nodes) {
        const node = game.nodes[node_idx]
        node.bot_x = node.x * scale_bot + shift_bot_x
        node.bot_y = node.y * scale_bot + shift_bot_y
        node.mid_x = node.x * scale_mid + shift_mid_x
        node.mid_y = node.y * scale_mid + shift_mid_y
        node.top_x = node.x * scale_top + shift_top_x
        node.top_y = node.y * scale_top + shift_top_y
      }

      // set transform for rooms
      for (const room_idx in game.rooms) {
        const room = game.rooms[room_idx]

        for (const cell_idx in room.cells) {
          const cell = room.cells[cell_idx]
          cell.bot_x = cell.x * scale_bot + shift_bot_x
          cell.bot_y = cell.y * scale_bot + shift_bot_y
        }

      }

      for (const portal_idx in game.portals) {
        const portal = game.portals[portal_idx]

        portal.mid_wx = portal.wx * scale_mid + shift_mid_x
        portal.mid_wy = portal.wy * scale_mid + shift_mid_y
        portal.mid_x = portal.x * scale_mid + shift_mid_x
        portal.mid_y = portal.y * scale_mid + shift_mid_y
      }

      for (const handle_idx in game.handles) {
        const handle = game.handles[handle_idx]

        handle.mid_wx = handle.wx * scale_mid + shift_mid_x
        handle.mid_wy = handle.wy * scale_mid + shift_mid_y
        handle.mid_x = handle.x * scale_mid + shift_mid_x
        handle.mid_y = handle.y * scale_mid + shift_mid_y
      }

      for (const key_idx in game.keys) {
        const key = game.keys[key_idx]

        key.mid_x = key.x * scale_mid + shift_mid_x
        key.mid_y = key.y * scale_mid + shift_mid_y
      }

      for (const jack_idx in game.jacks) {
        const jack = game.jacks[jack_idx]

        jack.mid_x = jack.x * scale_mid + shift_mid_x
        jack.mid_y = jack.y * scale_mid + shift_mid_y
      }

      if (game.path) {
        for (const trail_idx in game.path.trails) {
          const trail = game.path.trails[trail_idx]

          trail.mid_x = trail.x * scale_mid + shift_mid_x
          trail.mid_y = trail.y * scale_mid + shift_mid_y
        }
      }
    }
  }

  console.log(project_name, 'game.js')
  return MazeGame
}
