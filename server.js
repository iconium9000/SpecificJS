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
    description: `<ul>
    <li> Simple multiplayer side-scroller where players pilot
         a weighted block around obstacles.</li>
    <li> Completed in a fast-paced,
         player-led exercise to quickly produce
         a playable product in an afternoon.</li>
    <li> Is VERY hard, but CAN be mastered.</li>
    <li> Controls with either spacebar or mouse.</li>
    <li> Completed in 2018.</li></ul>`
  },
  'knifeline': {
    name: 'knifeline',
    title: 'Knifeline',
    description: `<ul>
    <li> Turn-based puzzle game in which players build a map out of lines
         and strategically place fountains of paint and knives
        to gain and keep territory.</li>
    <li> Developed clean, intuitive UX which has facilitated
         exhilarating player comradery.</li>
    <li> Completed in 2018.</li></ul>`
  },
  'greed': {
    name: 'greed',
    title: 'Greed',
    description: `<ul>
    <li> Fun Group Game-Night style game designed for
         fun with friends during COVID-19 shutdown.</li>
    <li> Implementation of a fun dice game introduced by friends.</li>
    <li> Completed in 2020.</li></ul>`
  },
  'mazegame': {
    name: 'mazegame/new',
    title: 'MazeGame',
    description: `<ul>
    <li> Minimalist puzzle game in which players manipulate keys, doors,
         and portals to escape colorful rooms in subversive and creative ways.</li>
    <li> First designed around 2010 with paper and markers.</li>
    <li> Has become a pathfinder project used to hone new skills.</li>
    <li> Rewritten dozens of times over the course of many years.</li>
    <li> Completed in 2020.</li></ul>`
  },
  'mazegame_viewer': {
    name: 'mazegame/viewer',
    title: 'MazeGame Viewer',
    description: `<ul><li> Player Game State Viewer
         to aid in game development and player troubleshooting.</ul>`
  },
  'mazegame_old': {
    name: 'mazegame/old',
    title: 'MazeGame 2016',
    description: `<ul>
      <li> Simple Mobile-Compatable MazeGame implemtation.</li>
      <li> Completed in 2016.</li></ul>`
  },
  'mazegame_grid': {
    name: 'mazegame/grid',
    title: 'MazeGame Grid',
    description: `<ul>
      <li> Grid-based, desktop solution to complexity issues with MazeGame.</li>
      <li> Controls with Arrow-Keys. </li>
      <li> Swap Players by pressing the Spacebar. </li>
      <li> Select levels by clicking on them. </li>
      <li> Click and drag to pan around map. </li>
      <li> Completed in 2017.</li></ul>`
  },
  'mazegame_solver': {
    name: 'mazegame/solver',
    title: 'MazeGame Solver (C++ Solver Disabled)',
    description: `<ul>
      <li> Advanced level solver in C++
           to efficiently test optimal puzzle solves.</li>
      <li> Completed in 2020.</li></ul>`
  },
  // '2048': {
  //   name: '2048',
  //   title: '2048',
  // },
  // 'factory': {
  //   name: 'factory',
  //   title: 'Factory',
  // },
  // 'circuit': {
  //   name: 'circuit',
  //   title: 'Circuit',
  // },
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

for (const path in projects) {
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
  socket_io: socket_io,
  express: express,
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
