
const Knifeline = (module.exports = () => {

  const Knifeline = {}
  const project_name = 'Knifeline:'
  const log = (...msg) => console.log(project_name, ...msg)

  log ( 'game.js' )

  const display_scale = 0.8
  const node_radius = Knifeline.node_radius = 1 / 50 * display_scale
  const dot_radius = Knifeline.dot_radius = 1 / 100 * display_scale
  const line_grab_radius = Knifeline.line_grab_radius = 1 / 50 * display_scale
  const noise = Knifeline.noise = 1e-9 * display_scale
  const line_width = Knifeline.line_width = 1 / 100 * display_scale
  const font_size = Knifeline.font_size = 1 / 20 * display_scale
  const line_speed = Knifeline.line_speed = 0.3 * display_scale

  const max_n_players = Knifeline.max_n_players = 4

  const blink_rate = Knifeline.blink_rate = 1.5 // blinks per sec

  const default_color = Knifeline.default_color = '#404040'
  const background_color = Knifeline.background_color = '#202020'
  const knife_color = Knifeline.knife_color = 'black'
  const colors = Knifeline.colors = [
    // '#8800ff','#0088ff','#00ff88',
    '#4444ff','#44aa44','#ff4444',
    '#888800','#880888','#008888',
  ]
  const n_states = Knifeline.n_states = {
    node: 'n_nodes',
    line: 'n_lines',
    fountain: 'n_fountains',
    knife: 'n_knives',
  }
  const state_text = Knifeline.state_text = {
    idle: 'KNIFELINE!',
    node: 'NODES frame the land',
    line: 'LINES define land',
    fountain: 'FOUNTAINS claim land',
    knife: 'KNIVES cut off FOUNTAINS',
  }
  const next_state = Knifeline.next_state = {
    idle: 'node',
    node: 'line',
    line: 'fountain',
    fountain: 'knife',
    knife: 'over',
    over: 'idle',
  }

  Knifeline.get_node = get_node
  function get_node ( game, px, py, min_dist, super_line ) {

    min_dist *= min_dist
    var ret_node = null

    for ( const idx in game.nodes ) {
      const node = game.nodes[ idx ]

      const nx = px-node.x, ny = py-node.y
      const dist = nx*nx + ny*ny

      const neg = node.super_line < 0 || super_line < 0
      const eql = node.super_line == super_line

      if ( min_dist > dist && (eql || neg)) {
        min_dist = dist
        ret_node = node
      }
    }

    return ret_node

  }

  Knifeline.point_on_line = point_on_line
  function point_on_line ( line, px, py ) {

    const ax = line.node_a.x, ay = line.node_a.y
    const bx = line.node_b.x, by = line.node_b.y

    const bax = bx - ax, bay = by - ay
    const pax = px - ax, pay = py - ay
    const p = ( pax*bax + pay*bay ) / ( bax*bax + bay*bay )

    if ( p > 1 || 0 > p ) {
      return Infinity
    }

    const qx = ax + bax*p
    const qy = ay + bay*p

    return { x: qx, y: qy }
  }

  Knifeline.get_line_dist = get_line_dist
  function get_line_dist ( line, px, py ) {

    const q = point_on_line( line, px, py )
    const qx = px - q.x, qy = py - q.y

    return qx*qx + qy*qy

  }

  Knifeline.get_line = get_line
  function get_line ( game, px, py, min_dist ) {

    min_dist *= min_dist
    var ret_line = null

    for ( const idx in game.lines ) {
      const line = game.lines[idx]

      const line_dist = get_line_dist( line, px, py )

      if ( min_dist > line_dist ) {
        min_dist = line_dist
        ret_line = line
      }
    }

    return ret_line

  }

  Knifeline.set_game_padding = set_game_padding
  function set_game_padding (game) {
    var max_n = 0
    for (const state in n_states) {
      const n_state = n_states[state]
      const state_n = game[n_state]
      if (max_n < state_n) {
        max_n = state_n
      }
    }
    game.top_pad = font_size + 3*line_width

    var max_name_length = 0
    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]
      if (max_name_length < player.name.length) {
        max_name_length = player.name.length
      }
    }
    const state_pad = 2*line_width + (max_n) * node_radius * 2
    const name_pad = 2*line_width+3*node_radius + font_size*0.61*max_name_length
    game.left_pad = state_pad > name_pad ? state_pad : name_pad
    game.bottom_pad = 6*line_width + game.n_players * line_width * 2
  }

  Knifeline.check_is_valid_line = check_is_valid_line
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

  Knifeline.solve_game = solve_game
  function solve_game ( game, total_length ) {

    const new_game = {
      n_players: 0,
      players: {},
      other_players: {},
      nodes: [],
      lines: [],
      state: game.state,
      reason: game.reason,
      total_length: 0,
      empty_length: 0,
      full_length: 0,
      n_nodes: game.n_nodes,
      n_lines: game.n_lines,
      n_fountains: game.n_fountains,
      n_knives: game.n_knives,
    }

    for ( const player_id in game.other_players ) {
      const other_player = game.other_players[player_id]
      if (!game.players[player_id]) {

        new_game.other_players[player_id] = {
          name: other_player.name,
          color: other_player.color,
          state: other_player.state,
        }
      }
    }

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]
      node.idx = node_idx

      const new_node = {
        idx: node_idx,
        x: node.x, y: node.y,
        is_fountain: node.is_fountain,
        state: node.state,
        lines: [],
        super_line: node.super_line,
      }
      new_game.nodes.push( new_node )
    }

    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]
      ++new_game.n_players


      const new_player = {
        id: player_id,
        name: player.name,
        node: player.node && new_game.nodes[ player.node.idx ],
        color: player.color,
        total_length: 0,
      }

      for ( const state in n_states ) {
        const n_state = n_states[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }


    for ( const node_idx in new_game.nodes ) {
      const new_node = new_game.nodes[ node_idx ]
      const node = game.nodes[ node_idx ]
      new_node.player = new_game.players[ node.player.id ]
    }

    for ( const line_idx in game.lines ) {
      const line = game.lines[ line_idx ]

      const abx = line.node_a.x - line.node_b.x
      const aby = line.node_a.y - line.node_b.y

      const new_line = {
        idx: line_idx,
        progress_a: 0,
        progress_b: 0,
        node_a: new_game.nodes[ line.node_a.idx ],
        node_b: new_game.nodes[ line.node_b.idx ],
        super_line: line.super_line,
        player: new_game.players[ line.player.id ],
        length: Math.sqrt(abx*abx + aby*aby),
      }

      new_game.empty_length += new_line.length
      new_game.full_length += new_line.length
      new_line.node_a.lines.push( new_line )
      new_line.node_b.lines.push( new_line )
      new_game.lines.push( new_line )
    }



    new_game.sanity = 100
    while (new_game.sanity-- > 0){

      var max_length = Infinity

      for (const line_idx in new_game.lines) {
        const line = new_game.lines[line_idx]

        if (line.node_a.state != 'fountain' && line.node_b.state != 'fountain') {
          continue
        }

        var length = line.length - line.progress_a - line.progress_b

        if (length < 0) {
          continue
        }

        if (line.node_a.state == 'fountain' && line.node_b.state == 'fountain') {
          length /= 2
        }

        if (max_length > length) {
          max_length = length
        }
      }


      if (max_length == Infinity) {
        return new_game
      }
      else if (max_length + new_game.total_length > total_length) {
        max_length = total_length - new_game.total_length
      }

      max_length += Math.random() * noise

      for (const line_idx in new_game.lines) {
        const line = new_game.lines[line_idx]
        const length = line.length - line.progress_a - line.progress_b

        if (length < 0) {
          continue
        }

        if (line.node_a.state == 'fountain') {
          line.progress_a += max_length
          line.node_a.player.total_length += max_length
          new_game.empty_length -= max_length
        }

        if (line.node_b.state == 'fountain') {
          line.progress_b += max_length
          line.node_b.player.total_length += max_length
          new_game.empty_length -= max_length
        }
      }


      for (const line_idx in new_game.lines) {
        const line = new_game.lines[line_idx]
        const length = line.length - line.progress_a - line.progress_b

        if (length > 0) {
          continue
        }

        if (line.node_b.state == 'fountain' && line.node_a.state == 'idle') {
          line.node_a.state = 'fountain'
          line.node_a.player = line.node_b.player
        }

        if (line.node_a.state == 'fountain' && line.node_b.state == 'idle') {
          line.node_b.state = 'fountain'
          line.node_b.player = line.node_a.player
        }

      }

      new_game.total_length += max_length
      if (new_game.total_length > total_length) {
        return new_game
      }
    }

    return new_game
  }

  // return a JSONable game object
  Knifeline.export_game = export_game
  function export_game ( game ) {

    const new_game = {
      players: {},
      other_players: {},
      nodes: [],
      lines: [],
      state: game.state,
      reason: game.reason,
      n_nodes: game.n_nodes,
      n_lines: game.n_lines,
      n_fountains: game.n_fountains,
      n_knives: game.n_knives,
    }

    for ( const player_id in game.other_players ) {
      const other_player = game.other_players[player_id]
      if (!game.players[player_id]) {

        new_game.other_players[player_id] = {
          name: other_player.name,
          color: other_player.color,
          state: other_player.state,
        }
      }
    }

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]
      node.idx = new_game.nodes.length

      const new_node = {
        x: node.x, y: node.y,
        state: node.state,
        player_id: node.player.id,
        super_line: node.super_line,
        is_fountain: node.is_fountain,
      }
      new_game.nodes.push( new_node )
    }

    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]

      const new_player = {
        name: player.name,
        node_idx: player.node ? player.node.idx : -1,
        color: game.player_colors[player_id],
      }
      for ( const state in n_states ) {
        const n_state = n_states[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }

    for ( const line_idx in game.lines ) {
      const line = game.lines[ line_idx ]

      const new_line = {
        node_a_idx: line.node_a.idx,
        node_b_idx: line.node_b.idx,
        player_id: line.player.id,
        super_line: line.super_line,
      }
      new_game.lines.push( new_line )
    }

    return new_game

  }

  Knifeline.import_game = import_game
  function import_game ( game ) {

    const new_game = {
      players: {},
      other_players: {},
      n_players: 0,
      nodes: [],
      lines: [],
      state: game.state,
      reason: game.reason,
      n_nodes: game.n_nodes,
      n_lines: game.n_lines,
      n_fountains: game.n_fountains,
      n_knives: game.n_knives,
    }

    for ( const player_id in game.other_players ) {
      const other_player = game.other_players[player_id]
      if (!game.players[player_id]) {

        new_game.other_players[player_id] = {
          name: other_player.name,
          color: other_player.color,
          state: other_player.state,
        }
      }
    }

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]
      node.idx = node_idx

      const new_node = {
        x: node.x, y: node.y,
        state: node.state,
        lines: [],
        super_line: node.super_line,
        is_fountain: node.is_fountain,
      }
      new_game.nodes.push( new_node )
    }

    for ( const player_id in game.players ) {
      const player = game.players[ player_id ]
      ++new_game.n_players

      const new_player = {
        id: player_id,
        name: player.name,
        node: new_game.nodes[ player.node_idx ],
        color: player.color,
      }
      for ( const state in n_states ) {
        const n_state = n_states[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }

    for ( const node_idx in new_game.nodes ) {
      const new_node = new_game.nodes[ node_idx ]
      const node = game.nodes[ node_idx ]
      new_node.player = new_game.players[ node.player_id ]
    }

    for ( const line_idx in game.lines ) {
      const line = game.lines[ line_idx ]

      const new_line = {
        node_a: new_game.nodes[ line.node_a_idx ],
        node_b: new_game.nodes[ line.node_b_idx ],
        player: new_game.players[ line.player_id ],
        super_line: line.super_line,
      }
      new_line.node_a.lines.push( new_line )
      new_line.node_b.lines.push( new_line )
      new_game.lines.push( new_line )
    }

    return new_game

  }

  // return true if state needs to be changed
  Knifeline.update_game_state = update_game_state
  function update_game_state ( game ) {

    switch ( game.state ) {
      case 'idle':

        return true

      case 'node':
      case 'line':
      case 'fountain':
      case 'knife':
        var count = 0
        const n_state = n_states[ game.state ]

        for ( const player_id in game.players ) {
          const player = game.players[ player_id ]
          count += player[ n_state ]
        }

        return count < 1

      case 'over':
        return false

      default:
        return false
    }
  }

  Knifeline.player_act_at = player_act_at
  function player_act_at ( game, caller, px, py ) {

    const min_dist = node_radius*2
    if ( min_dist + game.left_pad > px || px > 1-min_dist-line_width) {
      return
    }
    if (min_dist + game.top_pad > py || py > 1-min_dist-game.bottom_pad ) {
      return
    }

    const caller_node = caller.node
    const closest_node = get_node( game, px, py, node_radius, -1 )
    const closest_line = get_line( game, px, py, node_radius )
    const super_line = closest_line ? closest_line.super_line : -1
    const farther_node = get_node( game, px, py, 2*node_radius, super_line )
    const n_state = n_states[ game.state ]


    if ( !( caller[ n_state ] > 0 ) ) {
      return
    }

    switch ( game.state ) {
      case 'idle':
        return

      case 'node':
        if ( farther_node ) {
          return
        }
        else {
          const new_node = {
            x: px, y: py,
            state: 'idle',
            player: caller,
            lines: [],
            super_line: -1,
            is_fountain: false,
          }
          game.nodes.push( new_node )

          --caller[ n_state ]
          return 'added node'
        }

      case 'line':

        if ( !farther_node ) {
          return
        }
        else if ( !caller_node ) {
          caller.node = farther_node
          return 'selected node'
        }
        else if ( farther_node == caller_node ) {
          caller.node = null
          return 'deselected node'
        }
        else if ( check_is_valid_line( game, farther_node, caller_node ) ) {

          const new_line = {
            node_a: farther_node,
            node_b: caller_node,
            player: caller,
            super_line: game.lines.length,
          }

          game.lines.push( new_line )
          farther_node.lines.push( new_line )
          caller_node.lines.push( new_line )
          caller.node = null

          --caller[ n_state ]
          return 'added line'
        }
        else if (farther_node) {
          caller.node = farther_node
          return 'selected node'
        }
        else {
          return
        }

      case 'fountain':
      case 'knife':

        if ( farther_node && farther_node.state == 'idle' ) {
          farther_node.state = game.state
          farther_node.player = caller
          farther_node.is_fountain = true
        }
        else if ( farther_node && farther_node.player == caller ) {
          return
        }
        else if (!closest_line) {
          return
        }
        else {

          const r = 2 * node_radius

          if ( farther_node ) {
            if ( farther_node == closest_line.node_b ) {
              closest_line.node_b = closest_line.node_a
              closest_line.node_a = farther_node
            }
            else if ( farther_node != closest_line.node_a ) {
              return
            }

            const ax = closest_line.node_a.x, ay = closest_line.node_a.y
            const bx = closest_line.node_b.x, by = closest_line.node_b.y
            const bax = bx - ax, bay = by - ay
            const len = ( r + noise ) / Math.sqrt( bax*bax + bay*bay )
            var q = {
              x: ax + bax * len,
              y: ay + bay * len,
            }
          }
          else {
            var q = point_on_line( closest_line, px, py )
          }


          if ( get_node( game, q.x, q.y, r, closest_line.super_line ) ) {
            return
          }

          const node_a = closest_line.node_a, node_b = closest_line.node_b

          const new_node = {
            x: q.x, y: q.y,
            state: game.state,
            is_fountain: true,
            player: caller,
            lines: [ closest_line ],
            super_line: closest_line.super_line,
          }
          const new_line = {
            node_a: new_node,
            node_b: node_b,
            player: caller,
            super_line: closest_line.super_line,
          }

          const line_idx = node_b.lines.indexOf( closest_line )
          node_b.lines.splice( line_idx, 1 )
          node_b.lines.push(new_line)
          new_node.lines.push(new_line)
          closest_line.node_b = new_node
          game.nodes.push(new_node)
          game.lines.push(new_line)
        }

        --caller[ n_state ]
        return 'added ' + game.state

      case 'over':

        // TODO

        return
    }

  }

  return Knifeline
})()
