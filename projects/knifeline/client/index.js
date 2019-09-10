// -----------------------------------------------------------------------------
// client setup

var is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
var font_size = 30
var max_deltaT = 0.1
var start_time = (new Date()).getTime() * 1e-3
var prev_now = start_time - max_deltaT
var proj_name = 'Knifeline:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error
var name = null
var line_width = 3

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
    client_socket.mouse_x = (e.clientX - 7) / canvas.width
    client_socket.mouse_y = (e.clientY - 7) / canvas.height
  })
  $(document).mousedown(e => {
    client_socket.mouse_x = (e.clientX - 7) / canvas.width
    client_socket.mouse_y = (e.clientY - 7) / canvas.height

    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  })
  $(document).mouseup(e => {
    client_socket.mouse_x = (e.clientX - 7) / canvas.width
    client_socket.mouse_y = (e.clientY - 7) / canvas.height
    client_socket.emit('mouse up', client_socket.mouse_x, client_socket.mouse_y)
  })
  document.addEventListener('touchstart', e => {
    client_socket.mouse_x = (e.clientX - 7) / canvas.width
    client_socket.mouse_y = (e.clientY - 7) / canvas.height
    client_socket.emit('mouse down', client_socket.mouse_x, client_socket.mouse_y)
  }, false)
  document.addEventListener('touchend', e => {
    client_socket.mouse_x = (e.clientX - 7) / canvas.width
    client_socket.mouse_y = (e.clientY - 7) / canvas.height
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

  ctx.lineWidth = line_width

  if (canvas.width > canvas.height) {
    canvas.width = canvas.height
  }
  else {
    canvas.height = canvas.width
  }


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
    ctx.lineWidth = line_width

    ctx.beginPath()
    var lw = line_width*2
    ctx.rect(lw, lw, canvas.width-2*lw, canvas.height-2*lw)
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
      ctx.moveTo(apx * canvas.width, apy * canvas.height)
      ctx.lineTo(bpx * canvas.width, bpy * canvas.height)
      ctx.stroke()

      ctx.strokeStyle = line.node_a.player.color
      ctx.beginPath()
      ctx.moveTo(ax * canvas.width, ay * canvas.height)
      ctx.lineTo(apx * canvas.width, apy * canvas.height)
      ctx.stroke()

      ctx.strokeStyle = line.node_b.player.color
      ctx.beginPath()
      ctx.moveTo(bpx * canvas.width, bpy * canvas.height)
      ctx.lineTo(bx * canvas.width, by * canvas.height)
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
        node.x * canvas.width, node.y * canvas.height,
        functions.node_radius * canvas.width,
        functions.node_radius * canvas.height,
        0, 0, Math.PI*2
      )
      ctx.fill()

      ctx.fillStyle = node.dot_color
      ctx.beginPath()
      ctx.ellipse(
        node.x * canvas.width, node.y * canvas.height,
        functions.node_radius * canvas.width / 2,
        functions.node_radius * canvas.height / 2,
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


    var lw = 2*f.node_radius * canvas.height
    var idx = 2*lw

    for (var player_id in game.players) {
      const player = game.players[player_id]

      ctx.fillStyle = ctx.strokeStyle = player.color
      ctx.beginPath()
      ctx.moveTo(lw, canvas.height - idx)
      ctx.lineTo(
        lw + (player.total_length / game.full_length) * (canvas.width - 2*lw),
        canvas.height - idx)
      ctx.stroke()


      // if (game.state != 'line') {
      //   for (var i = 0; i < player.n_nodes; ++i) {
      //     ctx.beginPath()
      //
      //     ctx.fill()
      //   }
      // }


      idx += lw
    }

    ctx.strokeStyle = f.default_color
    ctx.beginPath()
    ctx.moveTo(lw, canvas.height - idx)
    ctx.lineTo(
      lw + (game.empty_length / game.full_length) * (canvas.width - 2*lw),
      canvas.height - idx)
    ctx.stroke()


    idx = 2*lw


    ctx.fillStyle = player.color
    ctx.textAlign = 'left'
    ctx.fillText(player.name, font_size, font_size)
  }


  window.requestAnimationFrame(tick)
}
