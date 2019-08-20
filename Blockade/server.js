// -----------------------------------------------------------------------------
// server setup

var proj_name = 'Blockade:'
var jquery = 'node_modules/jquery/dist/jquery.slim.min.js'
var socket_io_dir = 'node_modules/socket.io/lib/client.js'
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
app.use('jquery.js', express.static(__dirname + jquery))
app.use('socket.io.js', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)

// -----------------------------------------------------------------------------
// on connection

socket_io.on('connection', client_socket => {

  log('connection', client_socket)

  client_socket.on('disconnect', () => {

    log('disconnect')
  })

})
