// -----------------------------------------------------------------------------
// client setup

const is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const max_deltaT = 0.1
var start_time = (new Date()).getTime() * 1e-3
var prev_now = start_time - max_deltaT
const project_name = 'Knifeline:'
const log = (...msg) => console.log(project_name, ...msg)
var err = console.error
var name = null
const pi2 = Math.PI * 2

if (window.Touch) {
  $("#cutCopyPaste").remove()
}

var show_toggle = false
var show_time = Infinity

const client_socket = io('/knifeline')

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

function nowonline() {
  log('noew online')
}

log('Index.js')

// mouse/touch controls
{
  $(document).mousemove(e => {
    if (e.clientX == null || e.clientY == null) {
      return
    }
    const canvas = document.getElementById('canvas')
    client_socket.mouse_x = (e.clientX - 7) / Knifeline.scale || 0
    client_socket.mouse_y = (e.clientY - 7) / Knifeline.scale || 0
  })
  $(document).mouseup(e => {
    if (e.clientX == null || e.clientY == null) {
      return
    }
    const canvas = document.getElementById('canvas')
    client_socket.mouse_x = (e.clientX - 7) / Knifeline.scale || 0
    client_socket.mouse_y = (e.clientY - 7) / Knifeline.scale || 0
    do_action()
    client_socket.emit('mouse up', client_socket.mouse_x, client_socket.mouse_y)
  })
}

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

  log('connect')

  tick()
})

client_socket.on('update', game_export => {
  if (!game_export) {
    return
  }

  show_time = (new Date()).getTime() * 1e-3
  var game = Knifeline.import_game(game_export)
  log( game.reason )
  client_socket.game = Knifeline.solve_game(game, Infinity)
  client_socket.game_backup = game

})

function do_action() {
  const caller = client_socket.game.players[client_socket.id]
  if (!caller) {
    return
  }

  var action = Knifeline.player_act_at(client_socket.game, caller,
    client_socket.mouse_x, client_socket.mouse_y)

  if (action) {
    show_time = Infinity
    show_toggle = true
  }
  else if (show_toggle) {
    show_time = (new Date()).getTime() * 1e-3
    show_toggle = false
  }
}

var tick_flag = 0
function tick() {

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth - 20
  canvas.height = window.innerHeight - 22
  window.requestAnimationFrame(tick)

  const now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now

  Knifeline.scale = canvas.width > canvas.height?canvas.height:canvas.width

  if (client_socket && client_socket.game_backup) {
    client_socket.game = Knifeline.solve_game(client_socket.game_backup, 0)
    const caller = client_socket.game.players[client_socket.id]
    if (!caller) {
      return
    }

    if (!is_mobile) {
      do_action()
    }


    const scale = Knifeline.scale
    const line_width = Knifeline.line_width * scale
    const font_size = Knifeline.font_size * scale
    const node_radius = Knifeline.node_radius * scale
    const node_diameter = 2*node_radius
    const dot_radius = Knifeline.dot_radius * scale

    ctx.lineWidth = line_width
    ctx.font = `${font_size}px courier new`
    ctx.textAlign = 'left'

    const total_length = Math.abs(now - show_time) * Knifeline.line_speed
    client_socket.game = Knifeline.solve_game(client_socket.game, total_length)
    const game = client_socket.game
    Knifeline.set_game_padding(game)
    const player = game.players[client_socket.id]

    ctx.strokeStyle = player.color
    ctx.beginPath()
    const left_pad = scale * game.left_pad
    const bottom_pad = scale * game.bottom_pad
    const top_pad = scale * game.top_pad
    ctx.rect(left_pad, top_pad,
      scale-2*line_width-left_pad, scale-2*line_width-bottom_pad-top_pad)
    ctx.stroke()


    ctx.textAlign = 'center'
    ctx.fillStyle = player.color
    var state_text = ''
    const blink = Math.floor(now * Knifeline.blink_rate % 4)
    if (game.state == 'idle') {
      if (blink == 0) {
        state_text = 'KNIFELINE!'
      }
      if (blink == 2) {
        state_text = 'CLICK TO START!'
      }
    }
    else if (game.state == 'over') {
      if (blink == 0) {
        var winning_score = 0
        var winning_player = null
        for (const player_id in game.players) {
          const player = game.players[player_id]
          if (winning_score < player.total_length) {
            winning_score = player.total_length
            winning_player = player
          }
        }
        if (winning_player == player) {
          state_text = `YOU WON!`
        }
        else if (winning_player) {
          state_text = `${winning_player.name} WON, YOU LOST`
          ctx.fillStyle = winning_player.color
        }
        else {
          state_text = 'GAME OVER!'
        }
      }
      if (blink == 2) {
        state_text = 'CLICK TO RESTART!'
      }
    }
    else {
      state_text = Knifeline.state_text[game.state]
    }
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
        ctx.strokeStyle = Knifeline.default_color
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

      var color = null
      var dot_color = null
      if (game.state == 'node') {
        color = node.player.color
        dot_color = Knifeline.default_color
      }
      else if (game.state == 'line' && player.node == node) {
        color = player.color
        dot_color = Knifeline.default_color
      }
      else if (node.state == 'fountain') {
        if (node.is_fountain) {
          color = node.player.color
        }
        else {
          dot_color = node.player.color
        }
      }
      else if (node.state == 'knife') {
        color = Knifeline.knife_color
        dot_color = null
      }
      else if (game.state == 'fountain' || game.state == 'knife') {
        color = null
        dot_color = Knifeline.default_color
      }
      else {
        color = Knifeline.default_color
        var dot_color = null
      }

      if (color) {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()
      }

      if (dot_color) {
        ctx.fillStyle = dot_color
        ctx.beginPath()
        ctx.arc(x,y,dot_radius, 0, pi2)
        ctx.fill()
      }

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

      if (game.state == 'over') {
        const do_blink = !Math.floor(now * Knifeline.blink_rate % 2)
        ctx.fillStyle = do_blink ? player.color : Knifeline.default_color
      }
      else {
        ctx.fillStyle = player.color
      }
      ctx.fillText(player.name, 0, y)

      const length = player.total_length / game.full_length
      ctx.strokeStyle = player.color
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
          var dot_color = Knifeline.default_color
        }
        else {
          var color = Knifeline.default_color
          var dot_color = Knifeline.background_color
        }

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()

        ctx.fillStyle = dot_color
        ctx.beginPath()
        ctx.arc(x,y,dot_radius, 0, pi2)
        ctx.fill()
      }

      y += line_width + node_diameter
      for (var n = 0; n < game.n_lines; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        if (player.n_lines > n) {
          ctx.strokeStyle = player.color
        }
        else {
          ctx.strokeStyle = Knifeline.default_color
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
          var color = Knifeline.default_color
        }

        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()
      }

      y += line_width + node_diameter
      for (var n = 0; n < game.n_knives; ++n) {
        const x = 2 * (n+1) * node_radius - 2*line_width

        ctx.fillStyle = Knifeline.knife_color

        ctx.beginPath()
        ctx.arc(x,y,node_radius, 0, pi2)
        ctx.fill()

        if (player.n_knives > n) {
          ctx.strokeStyle = player.color
        }
        else {
          ctx.strokeStyle = Knifeline.default_color
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
      var idle_idx = scale - bottom_pad
      var draw_x = 0
    }
    for (const player_id in game.other_players) {
      const other_player = game.other_players[player_id]
      if (other_player.state == 'over') {
        const do_blink = !Math.floor(now * Knifeline.blink_rate % 2)
        ctx.fillStyle = do_blink ? other_player.color : Knifeline.default_color
      }
      else {
        ctx.fillStyle = other_player.color
      }
      ctx.fillText(other_player.name, draw_x, idle_idx)
      idle_idx -= font_size
    }
  }

}
