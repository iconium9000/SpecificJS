// -----------------------------------------------------------------------------
// client setup


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

var graphics = canvas.getContext('2d')
var width = canvas.width = window.innerWidth - 20
var height = canvas.height = window.innerHeight - 22
var mouse_down = false

$(document).mousedown(e => { mouse_down = true })
$(document).mouseup(e => { mouse_down = false })
document.addEventListener('touchstart', e => { mouse_down = true }, false)
document.addEventListener('touchend', e => { mouse_down = false }, false)

// -----------------------------------------------------------------------------
// Blockade

function tick() {
  
}
