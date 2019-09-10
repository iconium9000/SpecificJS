// -----------------------------------------------------------------------------
// server setup

const games = ['blockade', 'knifeline']
const servers = {}

const jquery_dir = '/node_modules/jquery/dist/'
const socket_io_dir = '/node_modules/socket.io-client/dist/'
const proj_name = 'SpecificJS:'
const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))

log(`Activated Server`)

const default_port = process.env.PORT || 80
const port = parseInt(process.argv[2]) || default_port

const express = require('express')
const app = express()
const http = require('http')
const serv = http.Server(app)
const socket_io = require('socket.io')(serv, {})

app.get('/', (req, res) => res.sendFile(__dirname + '/client/index.html'))
for ( const i in games ) {
  const name = games[i]

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
  const hostname = client_socket.handshake.headers.referer.split('/').pop()
  const server = servers[hostname]
  if (typeof server == 'function') {
    server(client_socket)
  }
})
