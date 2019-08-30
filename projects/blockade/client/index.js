// -----------------------------------------------------------------------------
// client setup

var max_bar_queue = 20
var is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
var gravity = is_mobile ? 0.7 : 0.8
var thrust = 2.5 * gravity // h per sec per sec

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

var colors = [
  'green','yellow','orange','red',
  'purple','magenta','lightblue','blue'
]
var high_block_color = '#202020'
function get_color(v, max) {
  if (max <= v || v < 0) {
    return 'white'
  }
  return colors[Math.floor(v / max * colors.length)]
}

var line_width = 6
var font_size = 20
var msgs = []
var num_msgs = 5
var msg_key = 109

var plr_x = 1/15 // 1/60
var plr_y = 1/2
var plr_w = 1/12
var plr_h = 1/20
var plr_v = 0

var bar_speed = 2/3     // w per sec

var score = 0
var all_score = 0
var my_deaths = 0
var player_high_score = 0

var timeout_freq = 20   // when to timeout
var bar_freq = 4/1
var max_bar_feq = 7/1
var max_deltaT = 0.1
var start_time = (new Date()).getTime() * 1e-3
var prev_now = start_time - max_deltaT
var thrust_time = 0
var bar_timer = start_time + 1/max_bar_feq

var dead = true

var proj_name = 'Blockade:'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

var canvas = document.getElementById('canvas')
var client_socket = io()

log('Index.js')

var name = null
if (typeof document.cookie == 'string') {
  name = get_cookie('name')
}

// if no name is found in cookies, get one from the user
while (!name) {
  name = prompt('Choose a name:', name)
  document.cookie = `name=${name}`
}

var temp = 0
var player_high_score = parseInt(get_cookie('blockade_high_score'))
if (!player_high_score) {
  player_high_score = 0
  document.cookie = `blockade_high_score=${player_high_score}`
}

// reply to server with name
client_socket.emit('client name', {name: name, high_score: player_high_score})

var ctx = canvas.getContext('2d')
ctx.lineWidth = line_width

var mouse_down = false

$(document).mousedown(e => { mouse_down = true })
$(document).mouseup(e => { mouse_down = false })
document.addEventListener('touchstart', e => { mouse_down = true }, false)
document.addEventListener('touchend', e => { mouse_down = false }, false)
$(document).keypress(e => {
  e.which == 32 && (mouse_down = true)
  if (e.which == msg_key) {
    var msg = prompt('msg for group')
    if (msg) {
      client_socket.emit('msg', msg)
    }
  }
})
$(document).keyup(e => { e.which == 32 && (mouse_down = false)})

// -----------------------------------------------------------------------------
// Blockade

var max_score = 0
var max_high_score = 0
var temp_high_score = 0
var bar_queue = []
var bars = []
var players = {}

client_socket.on('new bar', (x, y, w, h) => {
  if (bar_queue.length < max_bar_queue) {
    var bar = {
      start_x:x, x:x, y:y, w:w, h:h,
      dead: dead,
      c: get_color(dead ? 0 : score + bar_speed * bar_freq, temp_high_score)
    }
    bar_queue.push(bar)
  }
})

client_socket.on('msg', (msg) => {
  msgs.splice(0,0,msg)
  msgs.splice(num_msgs, msgs.length - num_msgs)
})

client_socket.on('update', ({plrs}) => {
  max_score = max_high_score = 0
  for (var i in plrs) {
    var plr = plrs[i]

    if (!plr.dead && max_score < plr.score) {
      max_score = plr.score
    }
    if (max_high_score < plr.high_score) {
      max_high_score = plr.high_score
    }
  }
  if (dead) {
    temp_high_score = max_high_score
  }
  players = plrs

  client_socket.emit('update', {
    high_score: player_high_score,
    plr_y: plr_y,
    dead: dead,
    score: score,
    deaths: my_deaths,
  })

  if (client_socket.timeout) {
    clearTimeout(client_socket.timeout)
  }
  client_socket.timeout = setTimeout(() => {
    client_socket.dead = true
  }, 1e3 / timeout_freq)
})

function tick() {
  var width = canvas.width = window.innerWidth - 20
  var height = canvas.height = window.innerHeight - 22
  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  ctx.lineWidth = line_width
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  // get bar
  if (now > bar_timer && bar_queue.length > 0) {
    var bar = bar_queue.splice(0,1)[0]
    bar.t = now
    bars.push(bar)
    bar_timer = now + 1/max_bar_feq
  }

  // move player
  if (!dead) {
    var acceleration = gravity - (mouse_down ? thrust : 0)
    plr_v += deltaT * acceleration
    plr_y += deltaT * plr_v
  }

  // is plr in bar?
  var hitbox = false
  for (var i in bars) {
    var bar = bars[i]
    if (bar.dead) {
      continue
    }
    if (hitbox = (plr_x < bar.x + bar.w) && (plr_x + plr_w > bar.x) &&
      (plr_y < bar.y + bar.h) && (plr_y + plr_h > bar.y)
    ) {
      break
    }
  }

  // detect death
  if (plr_y < 0 || 1 < plr_y + plr_h || hitbox) {
    plr_y = 1/2
    plr_v = 0
    dead = true
    if (score > 0) {
      log('update', score)
      if (player_high_score < score) {
        player_high_score = score
      }
      document.cookie = `blockade_high_score=${player_high_score}`
      ++my_deaths
      client_socket.emit('update', {
        high_score: player_high_score,
        plr_y: plr_y,
        dead: dead,
        score: score,
        deaths: my_deaths,
      })
      for (var i in bars) {
        var bar = bars[i]
        bar.dead = true
      }
      score = 0
    }
    bar_score = 0
    thrust_time = 0
    start_time = now
  }

  var scores = []

  // draw other players
  for (var player_id in players) {
    var player = players[player_id]
    if (!player.dead && player_id != client_socket.id) {
      var color = get_color(player.score, temp_high_score)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.rect(plr_x*width, player.plr_y*height, plr_w*width, plr_h*height)
      ctx.fill()

      var x = player.score / temp_high_score * width
      if (x > width) x = width
      ctx.strokeStyle = color
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, line_width * 2)
      ctx.stroke()
    }

    var idx = 0;
    while (idx < scores.length) {
      if (scores[idx].high_score > player.high_score) {
        break
      }
      ++idx
    }
    scores.splice(idx, 0, player)
  }

  // draw black frost
  ctx.fillStyle = '#000000a0'
  ctx.beginPath()
  ctx.rect(0,0, width, height)
  ctx.fill()

  // draw bars
  ctx.lineWidth = 1
  for (var i = 0; i < bars.length; ++i) {
    var bar = bars[i]
    bar.x = bar.start_x - bar_speed * (now - bar.t)

    if (bar.x < -bar.w) {
      if (!dead && !bar.dead) {
        ++score
        ++all_score
      }
      bars.splice(i--,1)
    }
    else {
      var color = bar.c == 'white' ? high_block_color : bar.c
      ctx.strokeStyle = ctx.fillStyle = color
      // ctx.strokeStyle = ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.rect(bar.x*width, bar.y*height, bar.w*width, bar.h*height)
      bar.dead ? ctx.stroke() : ctx.fill()
      // ctx.stroke()
    }
  }
  ctx.lineWidth = line_width

  // draw progress bar
  var scale = temp_high_score < max_score ? temp_high_score / max_score : 1
  for (var i = 0; i < colors.length; ++i) {
    ctx.strokeStyle = colors[i]
    ctx.beginPath()
    ctx.moveTo(i / colors.length * width * scale, line_width/2)
    ctx.lineTo((i+1) / colors.length * width * scale, line_width/2)
    ctx.stroke()
  }
  if (!dead) {
    ctx.strokeStyle = 'white'
    ctx.beginPath()
    var x = score / temp_high_score * width
    if (x > width) x = width
    ctx.moveTo(x, 0)
    ctx.lineTo(x, line_width * 2)
    ctx.stroke()
  }


  // draw player
  ctx.strokeStyle = ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.rect(plr_x*width, plr_y*height, plr_w*width, plr_h*height)
  dead ? ctx.stroke() : ctx.fill()

  ctx.textAlign = 'right'
  ctx.font = `${font_size}px Arial`

  ctx.fillStyle = 'white'
  for (var i = 0; i < msgs.length; ++i) {
    var msg = msgs[i]
    ctx.fillText(msg, width, line_width * 2 + (1+i)*font_size)
  }

  for (var i = 0 ; i < scores.length; ++i) {
    var player = scores[i]

    ctx.fillStyle = get_color(player.high_score, temp_high_score)
    var txt = `${player.name}: ${player.score} (${player.high_score})`
    ctx.fillText(txt, width-20, height - i*font_size*1.2)
  }
  if (mouse_down) {
    dead = false
  }

  window.requestAnimationFrame(tick)
}
tick()
