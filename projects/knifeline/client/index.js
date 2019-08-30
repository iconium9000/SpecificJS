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

var name = null
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

$(document).mousedown(e => {  })
$(document).mouseup(e => {  })
document.addEventListener('touchstart', e => {  }, false)
document.addEventListener('touchend', e => { }, false)
$(document).keypress(e => {

})
$(document).keyup(e => {

})

// -----------------------------------------------------------------------------
// Blockade

function tick() {
  var width = canvas.width = window.innerWidth - 20
  var height = canvas.height = window.innerHeight - 22
  var now = (new Date()).getTime() * 1e-3
  var deltaT = now - prev_now
  if (deltaT > max_deltaT) {
    deltaT = max_deltaT
  }
  prev_now = now


  ctx.textAlign = 'left'
  ctx.font = `${font_size}px Arial`
  ctx.fillStyle = 'white'
  ctx.fillText('Knifeline', 0, font_size)

  window.requestAnimationFrame(tick)
}
tick()
