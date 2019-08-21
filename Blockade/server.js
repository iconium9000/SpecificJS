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

// -----------------------------------------------------------------------------
// on connection

var sockets = {}

socket_io.on('connection', client_socket => {

  sockets[client_socket.id] = client_socket

  client_socket.on('client name', msg => {
    client_socket.name = msg.name
    log(`'${client_socket.name}' (${client_socket.id}) connected`)
  })

  client_socket.on('disconnect', () => {
    delete sockets[client_socket.id]
    log(`'${client_socket.name}' (${client_socket.id}) disconnected`)
  })

})
