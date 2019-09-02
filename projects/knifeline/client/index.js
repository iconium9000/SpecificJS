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
var node_radius = 10
var line_width = 3

var default_color = '#404040'
var knife_color = 'black'

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var client_socket = io()

var functions = null
module = {
  test: 1,
  set exports(exports) {
    functions = exports

    noise = functions.noise
    node_grab_radius = functions.node_grab_radius
    line_grab_radius = functions.line_grab_radius
    sub_node_radius = functions.sub_node_radius
    nub_radius = functions.nub_radius
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
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    if (width > height) {
      width = height
    }
    else {
      height = width
    }

    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7

    if (!client_socket || !client_socket.game_backup) {
      return
    }

    client_socket.game = functions.copy_game(client_socket.game_backup, 0)
    var caller = client_socket.game.players[client_socket.id]
    if (!caller) {
      return
    }
    var action = functions.player_act_at(client_socket.game, caller,
      mouse_x / width, mouse_y / height)
    var total_length = action ? Infinity : 0
    client_socket.game = functions.copy_game(client_socket.game, total_length)
  })
  $(document).mousedown(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    if (width > height) {
      width = height
    }
    else {
      height = width
    }

    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7

    client_socket.emit('mouse down', mouse_x/width, mouse_y/height)
  })
  $(document).mouseup(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    if (width > height) {
      width = height
    }
    else {
      height = width
    }

    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
    client_socket.emit('mouse up', mouse_x/width, mouse_y/height)
  })
  document.addEventListener('touchstart', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    if (width > height) {
      width = height
    }
    else {
      height = width
    }

    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
    client_socket.emit('mouse down', mouse_x/width, mouse_y/height)
  }, false)
  document.addEventListener('touchend', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    if (width > height) {
      width = height
    }
    else {
      height = width
    }

    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
    client_socket.emit('mouse up', mouse_x/width, mouse_y/height)
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
  while (!name) {
    name = prompt('Choose a name:', name)
    document.cookie = `name=${name}`
  }

  // reply to server with name
  client_socket.emit('client name', {name: name})
})

client_socket.on('update', game => {
  log(`'${game.caller.name}' ${game.reason}`)

  if (game.state == 'over') {
    return
  }

  for (var idx in game.nodes) {
    var node = game.nodes[idx]
    node.player = game.players[node.player]
  }

  for (var idx in game.lines) {
    var line = game.lines[idx]
    line.node_a = game.nodes[line.node_a]
    line.node_b = game.nodes[line.node_b]
    line.player_a = game.players[line.player_a]
    line.player_b = game.players[line.player_b]
    line.player = game.players[line.player]
  }

  client_socket.game = functions.copy_game(game, Infinity)
  client_socket.game_backup = game
})

function tick() {
  var width = canvas.width = window.innerWidth - 20
  var height = canvas.height = window.innerHeight - 22

  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  ctx.lineWidth = line_width

  if (width > height) {
    width = height
  }
  else {
    height = width
  }

  // ctx.textAlign = 'left'
  // ctx.font = `${font_size}px Arial`
  // ctx.fillStyle = default_color
  // ctx.fillText('Knifeline', 0, font_size)

  if (client_socket.game && client_socket.game.players[client_socket.id]) {
    var game = client_socket.game
    // var game = functions.copy_game(client_socket.game, Infinity)
    var player = game.players[client_socket.id]
    ctx.strokeStyle = player.color
    ctx.beginPath()
    var lw = line_width/2
    ctx.rect(lw, lw, width-lw, height-lw)
    ctx.stroke()


    var player_node = null
    if (player.node) {
      player_node = functions.get_node(game, player.node.x, player.node.y)
    }

    // draw nodes
    for (var idx in game.nodes) {
      var node = game.nodes[idx]

      ctx.strokeStyle = default_color
      ctx.beginPath()
      ctx.ellipse(node.x * width, node.y * height,
        node_grab_radius * width, node_grab_radius * height, 0, 0, 2 * Math.PI)
      ctx.stroke()

      if (game.state == 'line' && node == player_node) {
        ctx.fillStyle = player.color
      }
      else if (game.state == 'node' || node.state == 'fountain') {
        ctx.fillStyle = node.player.color
      }
      else if (node.state == 'knife') {
        ctx.fillStyle = knife_color
      }
      else {
        ctx.fillStyle = default_color
      }
      ctx.beginPath()
      ctx.ellipse(node.x * width, node.y * height,
        sub_node_radius * width, sub_node_radius * height, 0, 0, 2 * Math.PI)
      ctx.fill()
    }

    for (var idx in game.lines) {
      var line = game.lines[idx]

      var ax = line.node_a.x, ay = line.node_a.y
      var bx = line.node_b.x, by = line.node_b.y
      var lx = bx-ax, ly = by-ay
      var len = node_grab_radius / Math.sqrt(lx*lx + ly*ly)

      var lax = ax + lx * len, lay = ay + ly * len
      var lbx = bx - lx * len, lby = by - ly * len

      if (game.state == 'line') {
        ctx.strokeStyle = line.player.color
      }
      else {
        ctx.strokeStyle = default_color
      }
      ctx.beginPath()
      ctx.moveTo(lax * width, lay * height)
      ctx.lineTo(lbx * width, lby * height)
      ctx.stroke()

      if (line.state_a == 'fountain') {
        ctx.fillStyle = line.player_a.color
      }
      else if (line.state_a == 'knife') {
        ctx.fillStyle = knife_color
      }
      else {
        ctx.fillStyle = default_color
      }

      ctx.beginPath()
      ctx.ellipse(lax * width, lay * height,
          nub_radius * width, nub_radius * height, 0, 0, 2 * Math.PI)
      ctx.fill()


      if (line.state_b == 'fountain') {
        ctx.fillStyle = line.player_b.color
      }
      else if (line.state_b == 'knife') {
        ctx.fillStyle = knife_color
      }
      else {
        ctx.fillStyle = default_color
      }

      ctx.beginPath()
      ctx.ellipse(lbx * width, lby * height,
        nub_radius * width, nub_radius * height, 0, 0, 2 * Math.PI)
      ctx.fill()
    }

    ctx.fillStyle = player.color
    ctx.textAlign = 'left'
    ctx.fillText(player.name, font_size, font_size)
  }


  window.requestAnimationFrame(tick)
}
tick()
