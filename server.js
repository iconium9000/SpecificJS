// -----------------------------------------------------------------------------
// server setup

const projects = {
  menu: {
    path: '',
    title: 'Iconium9000 Games Menu',
  },
  blockade: {
    path: 'blockade',
    title: 'Blockade',
  },
  knifeline: {
    path: 'knifeline',
    title: 'Knifeline',
  },
  mazegame: {
    path: 'mazegame',
    title: 'MazeGame',
  },
}

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

for ( const name in projects ) {
  const project = projects[name]
  project.name = name
  project.socket = socket_io.of(`/${project.path}`)

  app.get(`/${project.path}`, (req, res) => {
    res.sendFile(__dirname + `/projects/${name}/client/index.html`)
  })
  app.use(`/${project.path}`, express.static(__dirname + `/projects/${name}/client`))
}

for ( const name in projects ) {
  const project = projects[name]
  require(`./projects/${project.name}/server.js`)(project, projects)
}

app.use('/images', express.static(__dirname + '/images'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)
