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

var show_toggle = false
var show_time = Infinity

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var client_socket = io()

var functions = null
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
    client_socket.mouse_x = (e.clientX - 7) / client_socket.scale
    client_socket.mouse_y = (e.clientY - 7) / client_socket.scale
  })
  $(document).mousedown(e => {
    client_socket.mouse_x = (e.clientX - 7) / client_socket.scale
    client_socket.mouse_y = (e.clientY - 7) / client_socket.scale

    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  })
  $(document).mouseup(e => {
    client_socket.mouse_x = (e.clientX - 7) / client_socket.scale
    client_socket.mouse_y = (e.clientY - 7) / client_socket.scale
    client_socket.emit('mouse up', client_socket.mouse_x, client_socket.mouse_y)
  })
  document.addEventListener('touchstart', e => {
    client_socket.mouse_x = (e.clientX - 7) / client_socket.scale
    client_socket.mouse_y = (e.clientY - 7) / client_socket.scale
    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  }, false)
  document.addEventListener('touchend', e => {
    client_socket.mouse_x = (e.clientX - 7) / client_socket.scale
    client_socket.mouse_y = (e.clientY - 7) / client_socket.scale
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

  if (game.state == 'over') {
    return
  }

  client_socket.game = functions.solve_game(game, Infinity)
  client_socket.game_backup = game
})

function tick() {
  canvas.width = window.innerWidth - 20
  canvas.height = window.innerHeight - 22

  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  client_socket.scale = canvas.width > canvas.height?canvas.height:canvas.width
  var line_width = ctx.lineWidth = functions.line_width * client_socket.scale


  // var sum = 10
  // var idx = sum
  // var pi2 = Math.PI*2
  // for (var i = 0; i < functions.colors.length; ++i) {
  //   for (var j = i+1; j < functions.colors.length; ++j) {
  //     ctx.fillStyle = functions.colors[i]
  //     ctx.beginPath()
  //     ctx.arc(100*(1+i),50*(1+j),10,0,pi2)
  //     ctx.fill()
  //     ctx.fillStyle = functions.colors[j]
  //
  //     ctx.beginPath()
  //     ctx.arc(100*(1.25 + i),50*(1+j),10,0,pi2)
  //     ctx.fill()
  //   }
  // }

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

    var total_length = Math.abs(now - show_time) * functions.line_speed

    var game = functions.solve_game(client_socket.game, total_length)
    client_socket.game = game

    // var game = functions.solve_game(client_socket.game, Infinity)
    var player = game.players[client_socket.id]
    ctx.strokeStyle = player.color
    ctx.lineWidth = functions.line_width * client_socket.scale

    ctx.beginPath()
    var lw = functions.line_width*2 * client_socket.scale
    ctx.rect(lw, lw, client_socket.scale-2*lw, client_socket.scale-2*lw)
    ctx.stroke()


    for (var line_idx in game.lines) {
      var line = game.lines[line_idx]

      var ax = line.node_a.x, ay = line.node_a.y
      var bx = line.node_b.x, by = line.node_b.y
      var bax = bx-ax, bay = by-ay
      var len = Math.sqrt(bax*bax + bay*bay)

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
      ctx.moveTo(apx * client_socket.scale, apy * client_socket.scale)
      ctx.lineTo(bpx * client_socket.scale, bpy * client_socket.scale)
      ctx.stroke()

      ctx.strokeStyle = line.node_a.player.color
      ctx.beginPath()
      ctx.moveTo(ax * client_socket.scale, ay * client_socket.scale)
      ctx.lineTo(apx * client_socket.scale, apy * client_socket.scale)
      ctx.stroke()

      ctx.strokeStyle = line.node_b.player.color
      ctx.beginPath()
      ctx.moveTo(bpx * client_socket.scale, bpy * client_socket.scale)
      ctx.lineTo(bx * client_socket.scale, by * client_socket.scale)
      ctx.stroke()
    }

    for ( var node_idx in game.nodes ) {
      var node = game.nodes[ node_idx ]

      if (game.state == 'node') {
        ctx.fillStyle = node.player.color
      }
      else if (game.state == 'line' && player.node == node) {
        ctx.fillStyle = player.color
      }
      else if (node.state == 'fountain') {
        ctx.fillStyle = node.player.color
      }
      else if (node.state == 'knife') {
        ctx.fillStyle = functions.knife_color
      }
      else {
        ctx.fillStyle = functions.default_color
      }

      ctx.beginPath()
      ctx.ellipse(
        node.x * client_socket.scale, node.y * client_socket.scale,
        functions.node_radius * client_socket.scale,
        functions.node_radius * client_socket.scale,
        0, 0, Math.PI*2
      )
      ctx.fill()

      ctx.fillStyle = node.dot_color
      ctx.beginPath()
      ctx.ellipse(
        node.x * client_socket.scale, node.y * client_socket.scale,
        functions.dot_radius * client_socket.scale,
        functions.dot_radius * client_socket.scale,
        0, 0, Math.PI*2
      )
      ctx.fill()
    }

    // var neg = node.super_line < 0 || super_line < 0
    // var eql = node.super_line == super_line
    //
    // if ( min_dist > dist && (eql || neg)) {
    //   min_dist = dist
    //   ret_node = node
    // }


    var lw = functions.line_width * client_socket.scale
    var idx = 0

    var font_size = functions.font_size * client_socket.scale
    ctx.font = `${Math.ceil(font_size)}px sans-serif`
    ctx.textAlign = 'left'
    var pi2 = Math.PI * 2

    var node_radius = functions.node_radius * client_socket.scale
    var dot_radius = functions.dot_radius * client_socket.scale

    for (var player_id in game.players) {
      const player = game.players[player_id]

      if (game.state == 'line') {
        var length = player.n_lines / game.n_lines
      }
      else {
        var length = player.total_length / game.full_length
      }

      if (game.state == 'node') {
        var n_dots = player.n_nodes
        var color = player.color
        var dot_color = functions.default_color
      }
      else if (game.state == 'fountain') {
        var n_dots = player.n_fountains
        var color = player.color
        var dot_color =  player.color
      }
      else if (game.state == 'knife') {
        var n_dots = player.n_knives
        var color = functions.knife_color
        var dot_color =  player.color
      }
      else {
        var n_dots = 0
      }

      for (var i = 0; i < n_dots; ++i) {

        var x = client_socket.scale - 2 * (i+1) * node_radius - 2*lw
        var y = 2 * (idx+1) * node_radius + 2*lw

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()

        ctx.fillStyle = dot_color
        ctx.beginPath()
        ctx.arc(x,y,dot_radius, 0, pi2)
        ctx.fill()
      }

      ctx.fillStyle = ctx.strokeStyle = player.color
      ctx.beginPath()
      ctx.moveTo(4*lw, client_socket.scale - 2*(idx+2)*lw)
      ctx.lineTo(
        4*lw + length * (client_socket.scale - 8*lw),
        client_socket.scale - 2*(idx+2)*lw)
      ctx.stroke()

      ctx.fillText(player.name, font_size, 2*font_size * (idx+1))

      idx += 1
    }

    if (game.state == 'line') {
      var length = 0
    }
    else {
      var length = game.empty_length / game.full_length
    }
    ctx.strokeStyle = functions.default_color
    ctx.beginPath()
    ctx.moveTo(4*lw, client_socket.scale - 2*lw*(idx+2))
    ctx.lineTo(
      4*lw + length * (client_socket.scale - 8*lw),
      client_socket.scale - 2*lw*(idx+2))
    ctx.stroke()


    idx = 2*lw
  }


  window.requestAnimationFrame(tick)
}
