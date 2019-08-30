// -----------------------------------------------------------------------------
// server setup

var games = ['blockade']
var servers = {}

var jquery_dir = '/node_modules/jquery/dist/'
var socket_io_dir = '/node_modules/socket.io-client/dist/'
// var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
var log = console.log
// var err = console.error

log(`Activated Server`)

var default_port = 80
var port = parseInt(process.argv[2]) || default_port

var express = require('express')
var app = express()
var http = require('http')
var serv = http.Server(app)
var socket_io = require('socket.io')(serv, {})

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
for (var i in games) {
  var name = games[i]
  app.get(`/${name}`, (req, res) => {
    res.sendFile(__dirname + `/projects/${name}/client/index.html`)
  })
  app.use(`/${name}`, express.static(__dirname + `/projects/${name}/client`))
  servers[name] = require(`./projects/${name}/server.js`)()
}

app.use('/images', express.static(__dirname + '/images'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)

socket_io.on('connection', client_socket => {
  // log('connection', client_socket.id)
  var hostname = client_socket.handshake.headers.referer.split('/').pop()
  var server = servers[hostname]
  if (typeof server == 'function') {
    server(client_socket)
  }
})
