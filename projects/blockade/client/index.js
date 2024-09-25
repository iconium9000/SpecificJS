const module = {
  set exports(
    get_constructor, // (Function{Function.name}) => Function
  ) {
    const constructor = get_constructor(Blockade)
    Blockade[constructor.name] = constructor
    console.log(constructor.name)
  }
}

function Blockade() {
  const proj_name = 'Blockade:'
  const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
  const err = console.error
  const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const Lib = Blockade.Lib

  if (window.Touch) {
    $("#cutCopyPaste").remove()
  }

  // -----------------------------------------------------------------------------
  // client setup

  const colors = [
    'green', 'yellow', 'orange', 'red',
    'purple', 'magenta', 'lightblue', 'blue'
  ]
  const high_block_color = '#202020'
  function get_color(v, max) {
    if (max <= v || v < 0) {
      return 'white'
    }
    return colors[Math.floor(v / max * colors.length)]
  }

  function getTime() {
    return (new Date()).getTime() * 1e-3
  }

  // if
  const gravity = (is_mobile ? 0.7 : 0.8) * 0.92 / 0.8
  const thrust = 2.5 * gravity // h per sec per sec

  const timeout_freq = 20   // when to timeout
  const max_deltaT = 0.1
  var start_time = getTime()
  var prev_now = start_time - max_deltaT

  const max_bar_queue = 5
  const max_bar_freq = 7 / 1
  const bar_freq = 4 / 1
  const bar_speed = 2 / 3     // w per sec

  const font_size_scale = 1 / 20

  const line_width = 6

  const msgs = []
  const num_msgs = 5
  const msg_key = 109

  const plr_x = 1 / 15 // 1/60
  const plr_w = 1 / 12
  const plr_h = 1 / 20

  var plr_v = 0
  var plr_y = 1 / 2

  var score = 0
  var my_deaths = 0
  const default_high_score = 10
  var player_high_score = default_high_score
  var dead = true

  var next_thrust_time = 0
  var bar_timer = start_time + 1 / max_bar_freq

  const min_width_to_height_ratio = 1 / 1.5

  const canvas = document.getElementById('canvas')
  const client_socket = io('/blockade')

  log('Index.js')

  var name = null
  if (typeof document.cookie == 'string') {
    name = Lib.get_cookie('name')
  }

  // if no name is found in cookies, get one from the user
  while (!name) {
    name = prompt('Choose a name:', name)
    document.cookie = `name=${name}`
  }

  var temp = 0
  var player_high_score = parseInt(Lib.get_cookie('blockade_high_score'))
  if (!player_high_score) {
    player_high_score = default_high_score
    document.cookie = `blockade_high_score=${player_high_score}`
  }

  // reply to server with name
  client_socket.emit('client name', { name: name, high_score: player_high_score })

  const ctx = canvas.getContext('2d')
  ctx.lineWidth = line_width

  var mouse_down = false

  $(document).mousedown(e => { mouse_down = true })
  $(document).mouseup(e => { mouse_down = false })
  document.addEventListener('touchstart', e => { mouse_down = true }, false)
  document.addEventListener('touchend', e => { mouse_down = false }, false)
  $(document).keypress(e => {
    if (e.which == 32) mouse_down = true
    if (e.which == msg_key) {
      const msg = prompt('msg for group')
      if (msg) {
        client_socket.emit('msg', msg)
      }
    }
  })
  $(document).keyup(e => { if (e.which == 32) mouse_down = false })

  // -----------------------------------------------------------------------------
  // Blockade

  var max_score = 0
  var max_high_score = 0
  var temp_high_score = 0
  const bar_queue = []
  const bars = []
  var players = {}

  client_socket.on('new bar', (x, y, w, h) => {
    if (bar_queue.length < max_bar_queue) {
      const bar = {
        start_x: x, x: x, y: y, w: w, h: h,
        dead: dead,
        c: get_color(dead ? 0 : score + bar_speed * bar_freq, temp_high_score)
      }
      bar_queue.push(bar)
    }
  })

  client_socket.on('msg', (msg) => {
    msgs.splice(0, 0, msg)
    msgs.splice(num_msgs, msgs.length - num_msgs)
  })

  client_socket.on('update', ({ plrs }) => {
    max_score = max_high_score = 0
    for (const i in plrs) {
      const plr = plrs[i]

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

  let thrust_active = false

  // Shadow
  let shw_y = 1 / 2
  let shw_v = 0
  function tick() {

    canvas.width = window.innerWidth - 20
    canvas.height = window.innerHeight - 22

    if (canvas.width / canvas.height > min_width_to_height_ratio) {
      canvas.width = canvas.height * min_width_to_height_ratio
    }

    const width = canvas.width
    const height = canvas.height
    const font_size = width * font_size_scale

    const now = getTime()

    var deltaT = now - prev_now
    ctx.lineWidth = line_width
    if (deltaT > max_deltaT) {
      deltaT = max_deltaT
    }
    prev_now = now

    function drawParabola(
      strokeStyle,
      acceleration,
      apoapsis_t,
      apoapsis_y,
      end_t,
      offset_x,
    ) {
      const a = acceleration
      const v1 = apoapsis_t
      const v2 = apoapsis_y
      let a1 = end_t
      let a2 = v2 + (1 / 2) * a * (a1 - v1) * (a1 - v1)
      let b2 = 2 * v2 - a2
      let c1 = 2 * v1 - a1
      let b1 = (a1 + c1) / 2
      let c2 = a2

      ctx.strokeStyle = strokeStyle
      ctx.lineTo((a1 * bar_speed + offset_x) * width, a2 * height)
      ctx.quadraticCurveTo((b1 * bar_speed + offset_x) * width,
        b2 * height,
        (c1 * bar_speed + offset_x) * width, c2 * height)
      ctx.stroke()
    }

    // get bar
    if (now > bar_timer && bar_queue.length > 0) {
      const bar = bar_queue.splice(0, 1)[0]
      bar.t = now
      bars.push(bar)
      bar_timer = now + 1 / max_bar_freq
    }

    {
      function adjust_math(do_draw) {
        {
          const a = gravity
          const v0 = shw_v
          const y0 = shw_y + plr_h
          const ap_t = - v0 / a
          const ap_y = y0 - (v0 * v0) / (2 * a)

          const b = gravity - thrust
          const b2 = 1
          const A = a * (b - a)
          const B = 2 * v0 * (b - a)
          const C = -v0 * v0 + 2 * b * (-b2) + 2 * b * y0
          const T = - (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A)
          const b1 = (T - (a * T + v0) / b)

          if (do_draw) {
            drawParabola("white", a, ap_t, ap_y, 10, plr_x + plr_w)
          }
          if (do_draw && !thrust_active) {
            drawParabola("white", b, b1, b2, 10, plr_x + plr_w)
            ctx.strokeStyle = "red"
            ctx.beginPath()
            ctx.moveTo((plr_x + plr_w + T * bar_speed) * width, 0)
            ctx.lineTo((plr_x + plr_w + T * bar_speed) * width, height)
            ctx.stroke()
          }

          if (!do_draw && thrust_active && (next_thrust_time < now)) {
            next_thrust_time = now + T * Math.random() * 0.8
            thrust_active = false
          }
        }
        {
          const a = gravity - thrust
          const v0 = shw_v
          const y0 = shw_y
          const ap_t = - v0 / a
          const ap_y = y0 - (v0 * v0) / (2 * a)

          const b = gravity
          const b2 = 0
          const A = a * (b - a)
          const B = 2 * v0 * (b - a)
          const C = -v0 * v0 + 2 * b * (-b2) + 2 * b * y0
          const T = - (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A)
          const b1 = T - (a * T + v0) / b

          if (!do_draw && !thrust_active && (next_thrust_time < now)) {
            next_thrust_time = now + T * Math.random() * 0.8
            thrust_active = true
          }

          if (do_draw) {
            drawParabola("white", a, ap_t, ap_y, 10, plr_x + plr_w)
          }
          if (do_draw && thrust_active) {
            drawParabola("white", b, b1, b2, 10, plr_x + plr_w)
            ctx.beginPath()
            ctx.moveTo((plr_x + plr_w + T * bar_speed) * width, 0)
            ctx.lineTo((plr_x + plr_w + T * bar_speed) * width, height)
            ctx.stroke()
          }
        }
      }

      adjust_math(true)
      ctx.beginPath()
      ctx.moveTo((plr_x + (next_thrust_time - now) * bar_speed) * width, 0)
      ctx.lineTo((plr_x + (next_thrust_time - now) * bar_speed) * width, height)
      ctx.stroke()

      const acceleration = gravity - (thrust_active ? thrust : 0)
      // Step 1: Save the old velocity
      let prr_v_old = shw_v;

      // Step 2: Update velocity (same as before)
      shw_v += deltaT * acceleration;

      // Step 3: Update position using the average of the old and new velocity
      shw_y += deltaT * (prr_v_old + shw_v) / 2;

      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.rect(plr_x * width, shw_y * height, plr_w * width, plr_h * height)
      ctx.fill()

      adjust_math(false)
    }

    // move player
    if (!dead) {
      const acceleration = gravity - (mouse_down ? thrust : 0)
      // Step 1: Save the old velocity
      let prr_v_old = plr_v;

      // Step 2: Update velocity (same as before)
      plr_v += deltaT * acceleration;

      // Step 3: Update position using the average of the old and new velocity
      plr_y += deltaT * (prr_v_old + plr_v) / 2;
    }

    // is plr in bar?
    var hitbox = false
    for (const i in bars) {
      const bar = bars[i]
      if (bar.dead) {
        continue
      }
      // if (hitbox = (plr_x < bar.x + bar.w) && (plr_x + plr_w > bar.x) &&
      //   (plr_y < bar.y + bar.h) && (plr_y + plr_h > bar.y)
      // ) {
      //   break
      // }
    }

    // detect death
    if (plr_y < 0 || 1 < plr_y + plr_h || hitbox) {
      plr_y = 1 / 2
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
        for (const i in bars) {
          const bar = bars[i]
          bar.dead = true
        }
        score = 0
      }
      start_time = now
    }

    const scores = []

    // draw other players
    for (const player_id in players) {
      const player = players[player_id]
      if (!player.dead && player_id != client_socket.id) {
        const color = get_color(player.score, temp_high_score)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.rect(plr_x * width, player.plr_y * height, plr_w * width, plr_h * height)
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
    ctx.rect(0, 0, width, height)
    ctx.fill()

    // draw bars
    ctx.lineWidth = 1
    for (var i = 0; i < bars.length; ++i) {
      const bar = bars[i]
      bar.x = bar.start_x - bar_speed * (now - bar.t)

      if (bar.x < -bar.w) {
        if (!dead && !bar.dead) {
          ++score
        }
        bars.splice(i--, 1)
      }
      else {
        const color = bar.c == 'white' ? high_block_color : bar.c
        ctx.strokeStyle = ctx.fillStyle = color
        // ctx.strokeStyle = ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.rect(bar.x * width, bar.y * height, bar.w * width, bar.h * height)
        bar.dead ? ctx.stroke() : ctx.fill()
        // ctx.stroke()
      }
    }
    ctx.lineWidth = line_width

    // draw progress bar
    const scale = temp_high_score < max_score ? temp_high_score / max_score : 1
    for (var i = 0; i < colors.length; ++i) {
      ctx.strokeStyle = colors[i]
      ctx.beginPath()
      ctx.moveTo(i / colors.length * width * scale, line_width / 2)
      ctx.lineTo((i + 1) / colors.length * width * scale, line_width / 2)
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
    ctx.rect(plr_x * width, plr_y * height, plr_w * width, plr_h * height)
    dead ? ctx.stroke() : ctx.fill()

    ctx.textAlign = 'right'
    ctx.font = `${font_size}px Arial`

    ctx.fillStyle = 'white'
    for (var i = 0; i < msgs.length; ++i) {
      const msg = msgs[i]
      ctx.fillText(msg, width, line_width * 2 + (1 + i) * font_size)
    }

    for (var i = 0; i < scores.length; ++i) {
      const player = scores[i]

      ctx.fillStyle = get_color(player.high_score, temp_high_score)
      const txt = `${player.name}: ${player.score} (${player.high_score})`
      ctx.fillText(txt, width - 20, height - i * font_size * 1.2)
    }
    if (mouse_down) {
      dead = false
    }

    window.requestAnimationFrame(tick)
  }
  tick()
}
