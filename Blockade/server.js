// -----------------------------------------------------------------------------
// server setup

var proj_name = 'Blockade'
var log = console.log
var err = console.error
log(`Activated ${proj_name} Server`)

var default_port = 3001
var port = parseInt(process.argv[2]) || default_port

var express = require('express')
var app = express()
var http = require('http')
var serv = http.Server(app)
var socket_io = require('socket.io')(serv, {})

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))
serv.listen(port)

log('')

// -----------------------------------------------------------------------------
// on connection
socket_io.on('connection', client_socket => {

  log('connection', client_socket)

  client_socket.on('disconnect', () => {

    log('disconnect')
  })

})
