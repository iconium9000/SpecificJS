// -----------------------------------------------------------------------------
// client setup

var update_freq = 40
var min_update_freq = 3*update_freq
var max_bar_queue = 20
var is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
var gravity = is_mobile ? 0.7 : 0.8
var thrust = 2.5 * gravity // h per sec per sec

var line_width = 6

var plr_x = 1/15 // 1/60
var plr_y = 1/2
var plr_w = 1/12
var plr_h = 1/20
var plr_v = 0

var bar_speed = 2/3     // w per sec

var score = 0
var all_score = 0
var max_score = 0
var my_deaths = 0

var max_bar_feq = 7/1
var max_deltaT = 0.1
var start_time = (new Date()).getTime() * 1e-3
var prev_now = start_time - max_deltaT
var thrust_time = 0
var bar_timer = start_time + 1/max_bar_feq

var hold = false
var paused = false

var proj_name = 'Blockade:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

var canvas = document.getElementById('canvas')

log('Index.js')

var client_socket = io()
var name = document.cookie.length ? document.cookie.split('=')[1] : ''

// if no name is found in cookies, get one from the user
while (!name) {
  name = prompt('Choose a name:', name)
  var d = new Date()
  var expire_days = 2
  d.setTime(d.getTime() + (expire_days*24*60*60*1000))
  document.cookie = `NAME=${name};expires=${d.toUTCString()};path=/`
}

// reply to server with name
client_socket.emit('client name', {name: name})

var ctx = canvas.getContext('2d')
ctx.lineWidth = line_width
var mouse_down = false

$(document).mousedown(e => { mouse_down = true })
$(document).mouseup(e => { mouse_down = false })
document.addEventListener('touchstart', e => { mouse_down = true }, false)
document.addEventListener('touchend', e => { mouse_down = false }, false)
$(document).keypress(e => { e.which == 32 && (mouse_down = true)})
$(document).keyup(e => { e.which == 32 && (mouse_down = false)})

// -----------------------------------------------------------------------------
// Blockade

var bar_queue = []
var bars = []
var players = {}

client_socket.on('new bar', ({x, y, w, h}) => {
  if (bar_queue.length < max_bar_queue) {
    bar_queue.push({ start_x:x, x:x, y:y, w:w, h:h})
  }
})
client_socket.on('player location', ({x,y,score,id,name}) => {
  if (id == client_socket.id) {
    return
  }
  if (!player) {
    players[id] = { x:x, y:y, score:score, id:id, name:name }
  }
  var player = players[id]
  if (player.clearInterval) {
    clearInterval(player.clearInterval)
  }
  player.clearInterval = setInterval(() => {
    delete players[id]
  }, min_update_freq)
})
client_socket.on('player death', ({score, id, name, full_name}) => {
  delete players[id]
})
setInterval(() => {
  if (!paused) {
    client_socket.emit('player location', {
      x: plr_x, y: plr_y,
      socre: score,
    })
  }
}, update_freq)

function tick() {
  var width = canvas.width = window.innerWidth - 20
  var height = canvas.height = window.innerHeight - 22
  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  // get bar
  if (now > bar_timer && bar_queue.length > 0 && !hold) {
    var bar = bar_queue.splice(0,1)[0]
    bar.t = now
    bars.push(bar)
    bar_timer = now + 1/max_bar_feq
  }

  // draw bars
  for (var i = 0; i < bars.length; ++i) {
    var bar = bars[i]
    bar.x = bar.start_x - bar_speed * (now - bar.t)

    if (bar.x < -bar.w) {
      if (!paused) {
        ++score
        ++all_score
      }
      if (score > max_score) {
        max_score = score
      }
      bars.splice(i--,1)
    }
    else {
      ctx.strokeStyle = 'white'
      ctx.beginPath()
      ctx.rect(bar.x*width, bar.y*height, bar.w*width, bar.h*height)
      ctx.stroke()
    }
  }

  // move player
  if (!paused) {
    var acceleration = gravity - (mouse_down ? thrust : 0)
    plr_v += deltaT * acceleration
    plr_y += deltaT * plr_v
  }

  var hitbox = false
  for (var i in bars) {
    var bar = bars[i]

    if (hitbox = (plr_x < bar.x + bar.w) && (plr_x + plr_w > bar.x) &&
      (plr_y < bar.y + bar.h) && (plr_y + plr_h > bar.y)
    ) {
      break
    }
  }

  if (plr_y < 0 || 1 < plr_y + plr_h || hitbox) {
    plr_y = 1/2
    plr_v = 0
    paused = true
    if (score > 0) {
      client_socket.emit('death', {score: score})
      ++my_deaths
      score = 0
    }
    bar_score = 0
    thrust_time = 0
    start_time = now
  }

  // draw player
  ctx.strokeStyle = ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.rect(plr_x*width, plr_y*height, plr_w*width, plr_h*height)
  paused ? ctx.stroke() : ctx.fill()

  if (mouse_down) {
    paused = false
  }

  window.requestAnimationFrame(tick)
}
tick()
