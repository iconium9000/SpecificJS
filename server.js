// -----------------------------------------------------------------------------
// server setup

const project_details = {
  '': {
    name: 'menu',
    title: 'Iconium9000 Games Menu',
  },
  blockade: {
    name: 'blockade',
    title: 'Blockade',
  },
  knifeline: {
    name: 'knifeline',
    title: 'Knifeline',
  },
  mazegame: {
    name: 'mazegame',
    title: 'MazeGame',
  },
}
const projects = {}

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

for ( const project_path in project_details ) {
  const project_detail = project_details[project_path]
  const project_name = project_detail.name

  app.get(`/${project_path}`, (req, res) => {
    res.sendFile(__dirname + `/projects/${project_name}/client/index.html`)
  })
  app.use(`/${project_path}`,
     express.static(__dirname + `/projects/${project_name}/client`))
  const project = require(`./projects/${project_name}/server.js`)()
  project.name = project_name
  project.path = project_path
  project.title = project_detail.title
  projects[project_name] = project
}

app.use('/images', express.static(__dirname + '/images'))
app.use('/jquery', express.static(__dirname + jquery_dir))
app.use('/socket_io', express.static(__dirname + socket_io_dir))
serv.listen(port)

log(`listening on port:${port}`)

// log(projects)

socket_io.on('connection', client_socket => {
  try {
    const project_path = client_socket.handshake.headers.referer.split('/').pop()
    client_socket.project_path = project_path

    const project_name = project_details[project_path].name
    client_socket.project_name = project_name

    const project = projects[ project_name ]

    project.add_client_socket(client_socket)
    projects.menu.added_socket_other_project(projects)

    client_socket.on('client name', ({ name }) => {
      client_socket.name = name
      client_socket.full_name = `'${name}' (${client_socket.id})`
      projects.menu.added_socket_other_project(projects)
    })
  }
  catch (e) {
    log('ERROR', e)
  }
})
