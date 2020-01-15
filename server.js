// -----------------------------------------------------------------------------
// server setup

const projects = [
  {
    name: 'menu',
    path: '',
    title: 'Iconium9000 Games Menu',
  },
  {
    name: 'blockade',
    path: 'blockade',
    title: 'Blockade',
  },
  {
    name: 'knifeline',
    path: 'knifeline',
    title: 'Knifeline',
  },
  {
    name: '2048',
    path: '2048',
    title: '2048',
  },
  {
    name: 'mazegame/old',
    path: 'mazegame_old',
    title: 'MazeGame Old',
  },
  {
    name: 'mazegame/grid',
    path: 'mazegame_grid',
    title: 'MazeGame Grid',
  },
  {
    name: 'mazegame/new',
    path: 'mazegame_new',
    title: 'MazeGame New',
  },
  {
    name: 'mazegame/solver',
    path: 'mazegame_solver',
    title: 'MazeGame Solver',
  },
]

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

// const Lib = require(`./projects/menu/client/Lib.js`)
// const Point = require(`./projects/menu/client/Point.js`)

for ( const project_idx in projects ) {
  const project = projects[project_idx]

  project.socket = socket_io.of(`/${project.path}`)

  app.get(
    `/${project.path}`,
    (req, res) => {
      res.sendFile(__dirname + `/projects/${project.name}/client/index.html`)
    },
  )
  app.use(
    `/${project.path}`,
    express.static(__dirname + `/projects/${project.name}/client`),
  )
}

for ( const project_idx in projects ) {
  const project = projects[project_idx]
  require(`./projects/${project.name}/server.js`)(project, projects, require)
}

app.use('/images', express.static(__dirname + '/images'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)
