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



var canvas = document.getElementById('canvas')
var ctx = canvas.getContext('2d')
var client_socket = io()

var functions = null
module = {
  test: 1,
  set exports(exports) {
    functions = exports
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

    if (!client_socket || !client_socket.game_backup) {
      return
    }

    client_socket.game = functions.copy_game(client_socket.game_backup, 0)
    var caller = client_socket.game.players[client_socket.id]
    if (!caller) {
      return
    }
    var action = functions.player_act_at(client_socket.game, caller,
      client_socket.mouse_x, client_socket.mouse_y)
    var total_length = action ? Infinity : 0
    client_socket.game = functions.copy_game(client_socket.game, total_length)
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
  while (!name) {
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

  log(`'${game_export.caller.name}' ${game_export.reason}`)

  var game = functions.import(game_export)

  if (game.state == 'over') {
    return
  }

  client_socket.game = functions.copy_game(game, Infinity)
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
    ctx.rect(lw, lw, canvas.width-lw, canvas.height-lw)
    ctx.stroke()


    ctx.fillStyle = player.color
    ctx.textAlign = 'left'
    ctx.fillText(player.name, font_size, font_size)
  }


  window.requestAnimationFrame(tick)
}
tick()
