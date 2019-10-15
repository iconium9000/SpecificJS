function Start() {

  const project_name = '2048:'
  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  log('index.js')

  const background_color = '#776e65'
  const colors = [
    ['#776e65', '#eee4da',],
    ['#776e65', '#ede0c8',],
    ['#f9f6f2', '#f2b179',],
    ['#f9f6f2', '#f59563',],
    ['#f9f6f2', '#f67c5f',],
    ['#f9f6f2', '#f65e3b',],
    ['#f9f6f2', '#edcf72',],
    ['#f9f6f2', '#edcc61',],
    ['#f9f6f2', '#edc850',],
    ['#f9f6f2', '#edc53f',],
    ['#f9f6f2', '#edc22e',],
    ['#f9f6f2', '#3c3a32',],
    ['#f9f6f2', '#3c3a32',],
    ['#f9f6f2', '#3c3a32',],
    ['#f9f6f2', '#3c3a32',],
    ['#f9f6f2', '#3c3a32',],
  ]
  colors[-1] = ['#bbada0','#bbada0']
  const keys = {
    ArrowUp: [0, 4, 1],
    ArrowLeft: [0, 1, 4],
    ArrowDown: [12, -4, 1],
    ArrowRight: [3, -1, 4],
  }

  const board = []
  for (let i = 0; i < 16; ++i) {
    board[i] = -1
  }
  randomise_board(board)
  randomise_board(board)

  function shift_board(b, b0, b1, b2, b3) {
    const s = []
    if (b[b0] != -1) s.push(b[b0])
    if (b[b1] != -1) s.push(b[b1])
    if (b[b2] != -1) s.push(b[b2])
    if (b[b3] != -1) s.push(b[b3])
    b[b0] = s[0] >= 0 ? s[0] : -1
    b[b1] = s[1] >= 0 ? s[1] : -1
    b[b2] = s[2] >= 0 ? s[2] : -1
    b[b3] = s[3] >= 0 ? s[3] : -1
  }
  function compress_board_hlpr(b,b0,b1) {
    if (b[b0] == b[b1] && b[b0] != -1) {
      ++b[b0]
      b[b1] = -1
      return true
    }
    else {
      return false
    }
  }
  function compress_board(b, b0, b1, b2, b3) {
    if (compress_board_hlpr(b,b0,b1)) {
      compress_board_hlpr(b,b2,b3)
    }
    else if (!compress_board_hlpr(b,b1,b2)) {
      compress_board_hlpr(b,b2,b3)
    }
  }
  function randomise_board(b) {
    const s = []
    for (let i = 0; i < 16; ++i) {
      if (b[i] == -1) {
        s.push(i)
      }
    }
    if (s.length) {
      b[s[Math.floor(Math.random() * s.length)]] = Math.random() < 0.1 ? 1 : 0
    }
  }
  function copy_board(b) {
    const c = []
    for (let i = 0; i < 16; ++i) {
      c[i] = b[i]
    }
    return c
  }
  function compare_board(a,b) {
    for (let i = 0; i < 16; ++i) {
      if (a[i] != b[i]) {
        return false
      }
    }
    return true
  }

  log(board)

  document.onkeyup = e => {
    // const char = String.fromCharCode(e.which | 0x20)

    const key = keys[e.key]
    if (key) {
      // log(k)
      var base = key[0]
      var move1 = key[1]
      var move4 = key[2]

      var b0 = base
      var b1 = base + 1*move1
      var b2 = base + 2*move1
      var b3 = base + 3*move1

      const board_copy = copy_board(board)

      for (var i = 0; i < 4; ++i) {
        shift_board(board, b0, b1, b2, b3)
        compress_board(board, b0, b1, b2, b3)
        shift_board(board, b0, b1, b2, b3)

        b0 += move4
        b1 += move4
        b2 += move4
        b3 += move4
      }
      if (!compare_board(board, board_copy)) {
        randomise_board(board)
      }
    }
  }

  tick()
  function tick() {

    const canvas = document.getElementById('canvas')
		const ctx = canvas.getContext('2d')
		canvas.width = window.innerWidth - 20
		canvas.height = window.innerHeight - 22
		window.requestAnimationFrame(tick)

		const scale = (
      (canvas.width > canvas.height ? canvas.height : canvas.width) *
      0.5
    )
    const quad = scale / 4, hex = scale / 32
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    ctx.fillStyle = background_color
    ctx.beginPath()
    ctx.rect( cx - scale/2, cy - scale/2, scale,scale, )
    ctx.fill()

    let pow = 1
    const font_size = scale / 16
    ctx.font = `bold ${font_size}px Arial`
    ctx.textAlign = 'center'
		for (let x = 0; x < 4; ++x) {
      for (let y = 0; y < 4; ++y) {
        const i = y*4 + x
        const r = board[i]

        ctx.fillStyle = colors[r][1]
        ctx.beginPath()
        ctx.rect(
          cx + (x - 2) * quad + hex,
          cy + (y - 2) * quad + hex,
          quad - hex*2, quad - hex*2,
        )
        ctx.fill()

        ctx.fillStyle = colors[r][0]
        ctx.fillText(
          `${2<<r}`,
          cx + (x - 2) * quad + quad/2,
          cy + (y - 2) * quad + quad/2 + font_size/4,
        )
      }
    }
  }

  window.requestAnimationFrame(tick)
}
