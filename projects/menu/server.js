module.exports = (project, projects) => {

  const project_name = 'Menu:'
  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  log('server.js')

  // set up projects
  for (const name in projects) {
    const project = projects[name]
    project.clients = {}

    project.socket.on('connection', (socket) => {

      const client = {
        socket: socket,
        name: null,
        full_name: null,
      }

      socket.on('client name', ({name}) => {
        project.clients[ socket.id ] = client

        client.name = name
        client.full_name = `'${name}' (${socket.id})`
        update_clients()
      })

      socket.on('disconnect', () => {
        delete project.clients[ socket.id ]
        if (client.name) {
          update_clients()
        }
      })
    })
  }

  function update_clients() {

    // log('update_clients', project.title)

    const new_projects = {}

    for (const project_name in projects) {
      const project = projects[ project_name ]
      const new_project = {
        clients: {},
        title: project.title,
        path: project.path,
        n_clients: 0,
      }

      for (const client_id in project.clients) {
        const client = project.clients[ client_id ]

        const new_client = {
          name: client.name,
        }
        new_project.clients[client_id] = new_client
        ++new_project.n_clients
      }

      new_projects[ project_name ] = new_project
    }

    project.socket.emit('update', { projects: new_projects })
  }

}
