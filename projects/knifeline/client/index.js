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
    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
  })
  $(document).mousedown(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7

    client_socket.emit('mouse down', mouse_x/width, mouse_y/height)
  })
  $(document).mouseup(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
    client_socket.emit('mouse up', mouse_x/width, mouse_y/height)
  })
  document.addEventListener('touchstart', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mouse_x = client_socket.mouse_x = e.clientX - 7
    var mouse_y = client_socket.mouse_y = e.clientY - 7
    client_socket.emit('mouse down', mouse_x/width, mouse_y/height)
  }, false)
  document.addEventListener('touchend', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
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

  client_socket.game = functions.copy_game(game)
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

  // ctx.textAlign = 'left'
  // ctx.font = `${font_size}px Arial`
  // ctx.fillStyle = 'white'
  // ctx.fillText('Knifeline', 0, font_size)

  if (client_socket.game) {
    var game = functions.copy_game(client_socket.game, Infinity)

    for (var idx in game.lines) {
      var line = game.lines[idx]

      if (game.state == 'line') {
        ctx.strokeStyle = line.player.color
      }
      else {
        ctx.strokeStyle = 'white'
      }
      ctx.beginPath()
      ctx.moveTo(line.node_a.x * width, line.node_a.y * height)
      ctx.lineTo(line.node_b.x * width, line.node_b.y * height)
      ctx.stroke()
    }

    // draw player line
    var player = game.players[client_socket.id]
    if (player) {
      var mouse_x = client_socket.mouse_x / width
      var mouse_y = client_socket.mouse_y / height
      var mouse_node = functions.get_node(game, mouse_x, mouse_y)
      var mouse_line = functions.get_line(game, mouse_x, mouse_y)

      if (player.node) {
        var player_node = functions.get_node(game, player.node.x, player.node.y)

        if (game.state == 'line') {

          if (player_node && mouse_node &&
            functions.check_is_valid_line(game, player_node, mouse_node))
          {
            ctx.strokeStyle = 'white'
            ctx.beginPath()
            ctx.moveTo(mouse_node.x * width, mouse_node.y * height)
            ctx.lineTo(player_node.x * width, player_node.y * height)
            ctx.stroke()
          }
          else {
            ctx.strokeStyle = 'grey'
            ctx.beginPath()
            ctx.moveTo(client_socket.mouse_x, client_socket.mouse_y)
            ctx.lineTo(player_node.x * width, player_node.y * height)
            ctx.stroke()
          }
        }
      }
    }

    // draw nodes
    for (var idx in game.nodes) {
      var node = game.nodes[idx]

      ctx.strokeStyle = 'white'
      ctx.beginPath()
      ctx.ellipse(node.x * width, node.y * height,
        node_grab_radius * width, node_grab_radius * height, 0, 0, 2 * Math.PI)
      ctx.stroke()

      if (game.state == 'node') {
        ctx.fillStyle = node.player.color
      }
      else {
        ctx.fillStyle = 'white'
      }
      ctx.beginPath()
      ctx.arc(node.x * width, node.y * height, node_radius, 0, 2 * Math.PI)
      ctx.fill()
    }

  }

  window.requestAnimationFrame(tick)
}
tick()
