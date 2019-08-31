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

var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var client_socket = io()

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

log('Index.js')

// mouse/touch controls
{
  $(document).mousemove(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mws_x = client_socket.mws_x = e.clientX - 7
    var mws_y = client_socket.mws_y = e.clientY - 7
  })
  $(document).mousedown(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mws_x = client_socket.mws_x = e.clientX - 7
    var mws_y = client_socket.mws_y = e.clientY - 7
    client_socket.emit('mouse down', mws_x/width, mws_y/height)
  })
  $(document).mouseup(e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mws_x = client_socket.mws_x = e.clientX - 7
    var mws_y = client_socket.mws_y = e.clientY - 7
    client_socket.emit('mouse up', mws_x/width, mws_y/height)
  })
  document.addEventListener('touchstart', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mws_x = client_socket.mws_x = e.clientX - 7
    var mws_y = client_socket.mws_y = e.clientY - 7
    client_socket.emit('mouse down', mws_x/width, mws_y/height)
  }, false)
  document.addEventListener('touchend', e => {
    var width = canvas.width = window.innerWidth - 20
    var height = canvas.height = window.innerHeight - 22
    var mws_x = client_socket.mws_x = e.clientX - 7
    var mws_y = client_socket.mws_y = e.clientY - 7
    client_socket.emit('mouse up', mws_x/width, mws_y/height)
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
  client_socket.game = game
  log(`'${game.caller.name}' ${game.reason}`)
  log(game)

  for (var idx in game.lines) {
    var line = game.lines[idx]
    line.node_a = game.nodes[line.node_a]
    line.node_b = game.nodes[line.node_b]
  }
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

  // ctx.textAlign = 'left'
  // ctx.font = `${font_size}px Arial`
  // ctx.fillStyle = 'white'
  // ctx.fillText('Knifeline', 0, font_size)

  var game = client_socket.game
  if (game) {

    for (var idx in game.lines) {
      var line = game.lines[idx]

      ctx.strokeStyle = 'white'
      ctx.beginPath()
      ctx.moveTo(line.node_a.x * width, line.node_a.y * height)
      ctx.lineTo(line.node_b.x * width, line.node_b.y * height)
      ctx.stroke()
    }

    var player = game.players[client_socket.id]
    if (player && player.node && game.state == 'line') {
      ctx.strokeStyle = 'white'
      ctx.beginPath()
      ctx.moveTo(client_socket.mws_x, client_socket.mws_y)
      ctx.lineTo(player.node.x * width, player.node.y * height)
      ctx.stroke()

    }

    for (var idx in game.nodes) {
      var node = game.nodes[idx]

      ctx.strokeStyle = 'white'
      ctx.beginPath()
      ctx.ellipse(node.x * width, node.y * height,
        game.node_grab_radius*width,
        game.node_grab_radius*height,
        0, 0, 2 * Math.PI)
      ctx.stroke()

      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(node.x * width, node.y * height, node_radius, 0, 2 * Math.PI)
      ctx.fill()
    }

  }

  window.requestAnimationFrame(tick)
}
tick()
