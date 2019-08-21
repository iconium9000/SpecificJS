// -----------------------------------------------------------------------------
// server setup

var proj_name = 'Blockade:'
var jquery_dir = '/node_modules/jquery/dist/'
var socket_io_dir = '/node_modules/socket.io-client/dist/'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var err = console.error

log(`Activated Server`)

var default_port = 3001
var port = parseInt(process.argv[2]) || default_port

var express = require('express')
var app = express()
var http = require('http')
var serv = http.Server(app)
var socket_io = require('socket.io')(serv, {})

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
app.use('/client', express.static(__dirname + '/client'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)

LINE_WIDTH = 6
BAR_START = 1 + 0.1
BAR_W_MIN = 1/30
BAR_H_MIN = 1/30
BAR_W = 1/8
BAR_H = 1/10
BAR_FREQ = 4/1      // bar spawn per sec
MAX_BAR_FREQ = 7/1
BAR_SPEED  = 2/3    // w per sec

var client_sockets = {}

setInterval(() => {
  var w = BAR_W_MIN + BAR_W * Math.random()
  var h = BAR_H_MIN + BAR_H * Math.random()
  var x = BAR_START
  var y = Math.random() * (1 - h)

  for (var client_socket_id in client_sockets) {
    var client_socket = client_sockets[client_socket_id]
    client_socket.emit('new bar', x, y, w, h)
  }
}, 1e3/BAR_FREQ)

socket_io.on('connection', client_socket => {

  client_sockets[client_socket.id] = client_socket

  client_socket.on('client name', msg => {
    client_socket.name = msg.name
    client_socket.full_name = `'${msg.name}' (${client_socket.id})`
    log(`${client_socket.full_name} connected`)
  })

  client_socket.on('death', msg => {
    // TODO
    log(`${client_socket.full_name} died at ${msg.score}`)
  })

  client_socket.on('disconnect', () => {
    delete client_sockets[client_socket.id]
    log(`${client_socket.full_name} disconnected`)
  })

})
