// -----------------------------------------------------------------------------
// server setup

const projects = {
  '': {
    name: 'menu',
    title: 'Iconium9000 Games Menu',
  },
  'blockade': {
    name: 'blockade',
    title: 'Blockade',
  },
  'knifeline': {
    name: 'knifeline',
    title: 'Knifeline',
  },
  '2048': {
    name: '2048',
    title: '2048',
  },
  'circuit': {
    name: 'circuit',
    title: 'Circuit',
  },
  'mazegame_old': {
    name: 'mazegame/old',
    title: 'MazeGame Old',
  },
  'mazegame_grid': {
    name: 'mazegame/grid',
    title: 'MazeGame Grid',
  },
  'mazegame_new': {
    name: 'mazegame/new',
    title: 'MazeGame New',
  },
  'mazegame_viewer': {
    name: 'mazegame/viewer',
    title: 'MazeGame Viewer',
  },
  'mazegame_solver': {
    name: 'mazegame/solver',
    title: 'MazeGame Solver',
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

for ( const path in projects ) {
  const project = projects[path]
  project.path = path

  project.socket = socket_io.of(`/${path}`)

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

const info = {
  projects: projects,
  super_require: require,
  app: app,
  socket_io: socket_io
}
for ( const path in projects ) {
  const project = projects[path]
  try {
    require(`./projects/${project.name}/server.js`)(project,info)
  }
  catch (e) {
    log('error', e)
  }
}

app.use('/images', express.static(__dirname + '/images'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)
