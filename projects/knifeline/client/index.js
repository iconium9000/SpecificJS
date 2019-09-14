// -----------------------------------------------------------------------------
// client setup

var is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
var max_deltaT = 0.1
var start_time = (new Date()).getTime() * 1e-3
var prev_now = start_time - max_deltaT
var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error
var name = null
const pi2 = Math.PI * 2

var show_toggle = false
var show_time = Infinity

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var client_socket = io()

var functions = {}
module = {
  test: 1,
  set exports(exports) {
    functions = exports
    tick()
  }
}

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

log('Index.js')

// -----------------------------------------------------------------------------
// Game Manip

// mouse/touch controls
{
  $(document).mousemove(e => {
    client_socket.mouse_x = (e.clientX - 7) / functions.scale
    client_socket.mouse_y = (e.clientY - 7) / functions.scale
  })
  $(document).mousedown(e => {
    client_socket.mouse_x = (e.clientX - 7) / functions.scale
    client_socket.mouse_y = (e.clientY - 7) / functions.scale

    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  })
  $(document).mouseup(e => {
    client_socket.mouse_x = (e.clientX - 7) / functions.scale
    client_socket.mouse_y = (e.clientY - 7) / functions.scale
    client_socket.emit('mouse up', client_socket.mouse_x, client_socket.mouse_y)
  })
  document.addEventListener('touchstart', e => {
    client_socket.mouse_x = (e.clientX - 7) / functions.scale
    client_socket.mouse_y = (e.clientY - 7) / functions.scale
    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  }, false)
  document.addEventListener('touchend', e => {
    client_socket.mouse_x = (e.clientX - 7) / functions.scale
    client_socket.mouse_y = (e.clientY - 7) / functions.scale
    client_socket.emit('mouse up', client_socket.mouse_x, client_socket.mouse_y)
  }, false)
}

// -----------------------------------------------------------------------------
// Knifeline

client_socket.on('connect', () => {
  name = null
  if (typeof document.cookie == 'string') {
    name = get_cookie('name')
  }

  // if no name is found in cookies, get one from the user
  while (!name || name == 'null') {
    name = prompt('Choose a name:', name)
    document.cookie = `name=${name}`
  }

  // reply to server with name
  client_socket.emit('client name', {name: name})
})

client_socket.on('update', game_export => {
  if (!game_export) {
    return
  }

  var game = functions.import(game_export)
  log( game.reason )
  client_socket.game = functions.solve_game(game, Infinity)
  client_socket.game_backup = game

})

function draw_node(ctx, x, y, color, dot_color, node_radius, dot_radius) {

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x,y,node_radius, 0, pi2)
  ctx.fill()

  if (dot_color) {
    ctx.fillStyle = dot_color
    ctx.beginPath()
    ctx.arc(x,y,dot_radius, 0, pi2)
    ctx.fill()
  }
}

function tick() {
  canvas.width = window.innerWidth - 20
  canvas.height = window.innerHeight - 22

  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  functions.scale = canvas.width > canvas.height?canvas.height:canvas.width

  if (client_socket && client_socket.game_backup) {
    client_socket.game = functions.solve_game(client_socket.game_backup, 0)
    var caller = client_socket.game.players[client_socket.id]
    if (!caller) {
      return
    }
    var action = functions.player_act_at(client_socket.game, caller,
      client_socket.mouse_x, client_socket.mouse_y)

    if (action) {
      show_time = Infinity
      show_toggle = true
    }
    else if (show_toggle) {
      show_time = now
      show_toggle = false
    }

    const scale = functions.scale
    const line_width = functions.line_width * scale
    const font_size = functions.font_size * scale
    const node_radius = functions.node_radius * scale
    const node_diameter = 2*node_radius
    const dot_radius = functions.dot_radius * scale

    ctx.lineWidth = line_width
    ctx.font = `${font_size}px courier new`
    ctx.textAlign = 'left'

    const total_length = Math.abs(now - show_time) * functions.line_speed
    client_socket.game = functions.solve_game(client_socket.game, total_length)
    const game = client_socket.game
    const player = game.players[client_socket.id]


    ctx.strokeStyle = player.color
    ctx.beginPath()
    const left_pad = scale * game.left_pad
    const bottom_pad = scale * game.bottom_pad
    const top_pad = scale * game.top_pad
    ctx.rect(left_pad, top_pad,
      scale-2*line_width-left_pad, scale-2*line_width-bottom_pad-top_pad)
    ctx.stroke()

    const state_text = 'KNIFELINE!' //functions.state_text[game.state] || 'NEW GAME'
    ctx.fillStyle = player.color
    ctx.textAlign = 'center'
    ctx.fillText(state_text, left_pad/2 + scale / 2, top_pad - 2*line_width)


    for ( const line_idx in game.lines) {
      const line = game.lines[line_idx]

      const ax = line.node_a.x, ay = line.node_a.y
      const bx = line.node_b.x, by = line.node_b.y
      const bax = bx-ax, bay = by-ay
      const len = Math.sqrt(bax*bax + bay*bay)

      var apx = ax, apy = ay, bpx = bx, bpy = by

      if (line.node_a.state == 'fountain') {
        apx += bax * line.progress_a / line.length
        apy += bay * line.progress_a / line.length
      }
      if (line.node_b.state == 'fountain') {
        bpx -= bax * line.progress_b / line.length
        bpy -= bay * line.progress_b / line.length
      }

      if (game.state == 'line') {
        ctx.strokeStyle = line.player.color
      }
      else {
        ctx.strokeStyle = functions.default_color
      }

      ctx.beginPath()
      ctx.moveTo(apx * scale, apy * scale)
      ctx.lineTo(bpx * scale, bpy * scale)
      ctx.stroke()

      ctx.strokeStyle = line.node_a.player.color
      ctx.beginPath()
      ctx.moveTo(ax * scale, ay * scale)
      ctx.lineTo(apx * scale, apy * scale)
      ctx.stroke()

      ctx.strokeStyle = line.node_b.player.color
      ctx.beginPath()
      ctx.moveTo(bpx * scale, bpy * scale)
      ctx.lineTo(bx * scale, by * scale)
      ctx.stroke()
    }

    for ( const node_idx in game.nodes ) {
      const node = game.nodes[ node_idx ]

      const x = node.x * scale, y = node.y * scale

      if (game.state == 'node') {
        var color = node.player.color
        var dot_color = functions.default_color
      }
      else if (game.state == 'line' && player.node == node) {
        var color = player.color
        var dot_color = functions.default_color
      }
      else if (node.state == 'fountain') {
        var color = node.player.color
        var dot_color = node.is_fountain ? color : functions.default_color
      }
      else if (node.state == 'knife') {
        var color = functions.knife_color
        var dot_color = null
      }
      else {
        var color = functions.default_color
        var dot_color = null
      }

      draw_node(ctx, x, y, color, dot_color, node_radius, dot_radius)

      if (node.state == 'knife') {
        ctx.strokeStyle = node.player.color

        ctx.beginPath()
        ctx.moveTo(x - dot_radius, y - dot_radius)
        ctx.lineTo(x + dot_radius, y + dot_radius)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x + dot_radius, y - dot_radius)
        ctx.lineTo(x - dot_radius, y + dot_radius)
        ctx.stroke()
      }
    }

    const players = []
    for (const player_id in game.players) {
      const player = game.players[player_id]
      players.push(player)
    }
    players.sort((player_a, player_b) => {
      return player_a.total_length - player_b.total_length
    })


    ctx.textAlign = 'left'
    for (var player_idx = 0; player_idx < players.length; ++player_idx) {
      const player = players[player_idx]
      var y = 2*font_size + (player_idx) * (2*font_size + 4*(node_diameter+line_width))

      ctx.fillStyle = ctx.strokeStyle = player.color
      ctx.fillText(player.name, 0, y)

      const length = player.total_length / game.full_length
      ctx.beginPath()
      ctx.moveTo(left_pad, scale - 2*(player_idx+2)*line_width)
      ctx.lineTo(left_pad + length * (scale - 8*line_width),
        scale - 2*(player_idx+2)*line_width)
      ctx.stroke()

      y += line_width + node_radius
      for (var n = 0; n < game.n_nodes; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        if (player.n_nodes > n) {
          var color = player.color
          var dot_color = functions.default_color
        }
        else {
          var color = functions.default_color
          var dot_color = functions.background_color
        }
        draw_node(ctx, x, y, color, dot_color, node_radius, dot_radius)
      }

      y += line_width + node_diameter
      for (var n = 0; n < game.n_lines; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        if (player.n_lines > n) {
          ctx.strokeStyle = player.color
        }
        else {
          ctx.strokeStyle = functions.default_color
        }
        ctx.beginPath()
        ctx.moveTo(x - node_radius, y - node_radius)
        ctx.lineTo(x + node_radius, y + node_radius)
        ctx.stroke()
      }

      y += line_width + node_diameter
      for (var n = 0; n < game.n_fountains; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        if (player.n_fountains > n) {
          var color = player.color
        }
        else {
          var color = functions.default_color
        }
        draw_node(ctx, x, y, color, color, node_radius, dot_radius)
      }

      y += line_width + node_diameter
      for (var n = 0; n < game.n_knives; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        ctx.fillStyle = functions.knife_color

        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()

        if (player.n_knives > n) {
          ctx.strokeStyle = player.color
        }
        else {
          ctx.strokeStyle = functions.default_color
        }

        ctx.beginPath()
        ctx.moveTo(x - dot_radius, y - dot_radius)
        ctx.lineTo(x + dot_radius, y + dot_radius)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(x + dot_radius, y - dot_radius)
        ctx.lineTo(x - dot_radius, y + dot_radius)
        ctx.stroke()
      }
    }

    if (canvas.width > canvas.height) {
      var idle_idx = scale - bottom_pad
      var draw_x = canvas.height
    }
    else {
      var idle_idx = canvas.height
      var draw_x = 0
    }
    for (const player_id in game.other_players) {
      const other_player = game.other_players[player_id]
      ctx.fillStyle = other_player.color
      ctx.fillText(other_player.name, draw_x, idle_idx)
      idle_idx -= font_size
    }
  }


  window.requestAnimationFrame(tick)
}
