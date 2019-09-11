const project_name = 'Menu:'
const log = (...msg) => console.log.apply(null, [project_name].concat(msg))
const err = console.error

log('server.js')

const client_sockets = {}
const menu = {
  projects: {},
}


module.exports = () => {
  log('server_init')

  return {
    added_socket_other_project: added_socket_other_project,
    client_sockets: client_sockets,
    add_client_socket: client_socket_init,
  }
}

function update_clients() {

  const new_projects = {}

  for (const project_name in menu.projects) {
    const project = menu.projects[project_name]
    const new_project = {
      clients: {},
      title: project.title,
      path: project.path,
      n_clients: 0,
    }

    for (const client_id in project.client_sockets) {
      const client_socket = project.client_sockets[client_id]

      const new_client = {
        name: client_socket.name,
      }
      new_project.clients[client_id] = new_client
      ++new_project.n_clients
    }

    new_projects[project_name] = new_project
  }

  for ( const client_id in client_sockets ) {
    const client_socket = client_sockets[ client_id ]

    client_socket.emit('update', { projects: new_projects })
  }

}

function client_socket_init(client_socket) {

  client_sockets[ client_socket.id ] = client_socket

  client_socket.on('disconnect', () => {
    delete client_sockets[client_socket.id]
    log(`${client_socket.full_name} disconnected`)
  })

}

function added_socket_other_project(projects) {
  // log('added_socket_other_project', projects)
  menu.projects = projects
  update_clients()
}
