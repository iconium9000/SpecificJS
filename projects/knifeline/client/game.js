log ( 'game.js' )

const f = module.exports = {

  node_grab_radius: 1 / 30,
  line_grab_radius: 1 / 20,
  sub_node_radius: 1 / 60,
  nub_radius: 1 / 120,
  noise: 1e-8,

  default_color: '#404040',
  knife_color: 'black',
  colors: ['#ff5050','#00ff80','#0080ff','#ff8000','#ff40ff',
    '#ffff40','#B22222','#00ffff', '#80ff00'],
  n_state: {
    node: 'n_nodes',
    line: 'n_lines',
    fountain: 'n_fountain',
    knife: 'n_knives',
  },
  next_state: {
    idle: 'node',
    node: 'line',
    line: 'fountain',
    fountain: 'knife',
    knife: 'over',
    over: 'idle',
  },

  get_node: function ( game, px, py, min_dist ) {

    if ( min_dist > px || px > 1-min_dist || min_dist > py || py > 1-min_dist ) {
      return null
    }

    min_dist *= min_dist
    var ret_node = null

    for ( var idx in game.nodes ) {
      var node = game.nodes[ idx ]

      var nx = px-node.x, ny = py-node.y
      var dist = nx*nx + ny*ny

      if ( min_dist > dist ) {
        min_dist = dist
        ret_node = node
      }
    }

    return ret_node

  },

  point_on_line: function ( line, px, py ) {

    var ax = line.node_a.x, ay = line.node_a.y
    var bx = line.node_b.x, by = line.node_b.y

    var bax = bx - ax, bay = by - ay
    var pax = px - ax, pay = py - ay
    var p = ( pax*bax + pay*bay ) / ( bax*bax + bay*bay )

    if ( p > 1 || 0 > p ) {
      return Infinity
    }

    var qx = ax + bax*p
    var qy = ay + bay*p

    return { x: qx, y: qy }
  },

  line_dist: function ( line, px, py ) {

    var q = f.point_on_line( line, px, py )
    var qx = px - q.x, qy = py - q.y

    return qx*qx + qy*qy

  },

  get_line: function ( game, px, py, min_dist ) {

    min_dist *= min_dist
    var ret_line = null

    for ( var idx in game.lines ) {
      var line = game.lines[idx]

      var line_dist = f.line_dist( line, px, py )

      if ( min_dist < line_dist ) {
        min_dist = line_dist
        ret_line = line
      }
    }

    return ret_line

  },

  check_is_valid_line: function ( game, node_a, node_b ) {
    if ( !node_a || !node_b || node_a == node_b ) {
      return false
    }

    var p111 = node_a.x, p112 = node_a.y, p121 = node_b.x, p122 = node_b.y

    for ( var idx in game.lines ) {
      var line = game.lines[ idx ]
      var p211 = line.node_a.x, p212 = line.node_a.y
      var p221 = line.node_b.x, p222 = line.node_b.y
      var p222_212 = p222 - p212, p221_211 = p221 - p211
      var p122_112 = p122 - p112, p121_111 = p121 - p111

      var p11 = ( p111 - p211 ) * p222_212 > ( p112 - p212 ) * p221_211
      var p12 = ( p121 - p211 ) * p222_212 > ( p122 - p212 ) * p221_211
      var p21 = ( p211 - p111 ) * p122_112 > ( p212 - p112 ) * p121_111
      var p22 = ( p221 - p111 ) * p122_112 > ( p222 - p112 ) * p121_111

      if ( p11 != p12 && p21 != p22 ) {
        return false
      }
    }

    var line = {
      node_a: node_a,
      node_b: node_b
    }

    for ( var idx in game.nodes ) {
      var node = game.nodes[ idx ]
      if ( node == node_a || node == node_b ) {
        continue
      }

      var line_dist = f.line_dist( line, node.x, node.y )
      if ( line_dist < f.node_grab_radius*2 ) {
        return false
      }

    }

    return true
  },

  copy_game: function ( game, total_length ) {

    var new_game = {
      players: {},
      nodes: [],
      lines: [],
      state: game.state,
      reason: game.reason,
    }

    for ( var node_idx in game.nodes ) {
      var node = game.nodes[ node_idx ]
      node.idx = node_idx

      var new_node = {
        idx: node_idx,
        x: node.x, y: node.y,
        state: node.state,
        lines: [],
      }
      new_game.nodes.push( new_node )
    }

    for ( var player_id in game.players ) {
      var player = game.players[ player_id ]

      var new_player = {
        name: player.name,
        node: new_game.nodes[ player.node.idx ],
        color: player.color,
      }
      for ( var state in f.n_state ) {
        var n_state = f.n_state[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }

    new_game.caller = new_game.players[ game.caller.id ]
    for ( var node_idx in new_game.nodes ) {
      var new_node = new_game.nodes[ node_idx ]
      new_node.player = new_game.players[ node.player.id ]
    }

    for ( var line_idx in game.lines ) {
      var line = game.lines[ line_idx ]

      var new_line = {
        node_a: new_game.nodes[ line.node_a.idx ],
        node_b: new_game.nodes[ line.node_b.idx ],
        player: new_game.players[ line.player.id ],
      }
      new_line.node_a.lines.push( new_line )
      new_line.node_b.lines.push( new_line )
      new_game.lines.push( new_line )
    }

    return new_game
  },

  // return a JSONable game object
  export: function ( game, reason ) {

    var new_game = {
      players: {},
      nodes: [],
      lines: [],
      state: game.state,
      reason: reason,
    }

    for ( var node_idx in game.nodes ) {
      var node = game.nodes[ node_idx ]

      var new_node = {
        idx: new_game.nodes.length,
        x: node.x, y: node.y,
        state: node.state,
        player_id: node.player.id,
      }
      new_game.nodes.push( new_node )
    }

    for ( var player_id in game.players ) {
      var player = game.players[ player_id ]

      var new_player = {
        name: player.name,
        node_idx: player.node ? player.node.idx : -1,
        color: player.color,
      }
      for ( var state in f.n_state ) {
        var n_state = f.n_state[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }

    for ( var line_idx in game.lines ) {
      var line = game.lines[ line_idx ]

      var new_line = {
        node_a_idx: line.node_a.idx,
        node_b_idx: line.node_b.idx,
        player_id: line.player.id,
      }
      new_game.lines.push( new_line )
    }

    return new_game

  },

  import: function ( game ) {

    var new_game = {
      players: {},
      nodes: [],
      lines: [],
      state: game.state,
      reason: game.reason,
    }

    for ( var node_idx in game.nodes ) {
      var node = game.nodes[ node_idx ]
      node.idx = node_idx

      var new_node = {
        x: node.x, y: node.y,
        state: node.state,
        lines: [],
      }
      new_game.nodes.push( new_node )
    }

    for ( var player_id in game.players ) {
      var player = game.players[ player_id ]

      var new_player = {
        name: player.name,
        node: new_game.nodes[ player.node_idx ],
        color: player.color,
      }
      for ( var state in f.n_state ) {
        var n_state = f.n_state[ state ]
        new_player[ n_state ] = player[ n_state ]
      }
      new_game.players[ player_id ] = new_player
    }

    new_game.caller = new_game.players[game.caller_id]
    for ( var node_idx in new_game.nodes ) {
      var new_node = new_game.nodes[ node_idx ]
      var node = game.nodes[ node_idx ]
      new_node.player = new_game.players[ node.player_id ]
    }

    for ( var line_idx in game.lines ) {
      var line = game.lines[ line_idx ]

      var new_line = {
        node_a: new_game.nodes[ line.node_a_idx ],
        node_b: new_game.nodes[ line.node_b_idx ],
        player: new_game.players[ line.player_id ],
      }
      new_line.node_a.lines.push( new_line )
      new_line.node_b.lines.push( new_line )
      new_game.lines.push( new_line )
    }

    return new_game

  },

  // return true if state needs to be changed
  update_game_state: function ( game ) {

    switch ( game.state ) {
      case 'idle':
        f.colors.sort( () => Math.random() - 0.5 )

        var idx = 0
        for ( var player_id in game.players ) {
          var player = game.players[ player_id ]
          player.color = f.colors[ idx++ ]
          player.n_nodes = 3
          player.n_links = game.n_players < 6 ? game.n_players + 1 : 6
          player.n_fountains = 2
          player.n_knives = 2
        }

        return true

      case 'node':
      case 'line':
      case 'fountain':
      case 'knife':
        var count = 0
        var n_state = f.n_state[ game.state ]

        for ( var player_id in game.players ) {
          var player = game.players[ player_id ]
          count += player[ n_state ]
        }

        return count < 1

      case 'over':

        // TODO

      default:
        return false
    }
  },

  player_act_at: function ( game, caller, px, py ) {

    var caller_node = caller.node
    var closest_node = f.get_node( game, px, py, f.node_grab_radius )
    var farther_node = f.get_node( game, px, py, 2*f.node_grab_radius )
    var n_state = f.n_state[ game.state ]

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
          var new_node = {
            x: px, y: py,
            state: 'idle',
            player: caller,
            lines: [],
          }
          game.nodes.push( new_node )

          --caller[ n_state ]
          return 'added node'
        }

      case 'line':

        if ( !closest_node ) {
          return
        }
        else if ( !caller_node ) {
          caller.node = closest_node
          return 'selected node'
        }
        else if ( closest_node == caller_node ) {
          caller.node = null
          return 'deselected node'
        }
        else if ( f.check_is_valid_line( game, closest_node, caller_node ) ) {

          var new_line = {
            node_a: closest_node,
            node_b: caller_node,
            player: caller,
          }

          game.lines.push( new_line )
          line.node_a.lines.push( new_line )
          line.node_b.lines.push( new_line )

          --caller[ n_state ]
          return 'added line'
        }

      case 'fountain':
      case 'knife':

        if ( closest_node && closest_node.state == 'idle' ) {
          closest_node.state = game.state
        }
        else if (!line) {
          return
        }
        else if ( farther_node ) {

          if ( farther_node == line.node_a ) {
            line.node_a = line.node_b
            line.node_b = farther_node
          }
          else if ( farther_node != line.node_b ) {
            return
          }

          var r = 2 * f.node_grab_radius
          var ax = line.node_a.x, ay = line.node_a.y
          var bx = line.node_b.x, by = line.node_b.y
          var bax = bx - ax, bay = by - ay
          var q = ( r + f.noise ) / Math.sqrt( bax*bax + bay*bay )
          var qx = ax + bax * q, qy = ay + bay * q

          var closest_node = get_node( game, qx, qy, r )

          if ( closest_node ) {
            return
          }

          var new_node = {
            x: qx, y: qy,
            state: game.state,
            player: caller,
            lines: [ line ],
          }

          farther_node.lines.splice( farther_node.lines.indexOf( line ), 1 )
          line.node_a = new_node
          game.nodes.push( new_node )
        }
        else {

          var node_a = line.node_a, node_b = line.node_b
          var q = f.point_on_line( line, px, py )

          var new_node = {
            x: q.x, y: q.y,
            state: game.state,
            player: caller,
            lines: [ line ],
          }
          var new_line = {
            node_a: new_node,
            node_b: node_b,
            player: caller,
          }

          node_b.lines.splice( node_b.lines.indexOf( line ), 1 )
          node_b.lines.push(new_line)
          new_node.lines.push(new_line)
          line.node_b = new_node
          game.nodes.push(new_node)
          game.lines.push(new_line)
        }

        --caller[ n_state ]
        return 'added ' + game.state

      case 'over':

        // TODO

        return
    }

  },

}
