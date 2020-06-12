
const proj_name = 'Menu:'
const log = (...msg) => console.log.apply(null, [proj_name].concat(msg))
const err = console.error

log('index.js')

const client_socket = io()

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

var name = null
if (typeof document.cookie == 'string') {
  name = get_cookie('name')
}

// if no name is found in cookies, get one from the user
while (!name) {
  name = prompt('Choose a name:', name)
  document.cookie = `name = ${name}`
}

client_socket.emit('client name', {name: name})

client_socket.on('update', ({ projects }) => {

  log('update', projects)

  let menu = ''
  menu += `<table class="table">`
  // menu += `<thead><tr><th>Games</th></tr></thead>`
  menu += '<tbody>'

  for ( const project_idx in projects ) {
    const project = projects[ project_idx ]

    menu += `<tr>`
    menu += `<td>`

    menu += `<p><a href="${project.path}" class="button">${project.title}</a>`

    var count = project.n_clients

    if (count > 0) {
      menu += ' * '
      for (const client_id in project.clients){
        const client = project.clients[client_id]
        menu += client.name + ' * '
      }
    }
    menu += '</p>\n'
    if (project.description) {
      menu += project.description
    }

    menu += `</td>`
    menu += `</tr>`
  }

  menu += '</tbody></table>'

  document.getElementById('menu').innerHTML = menu

})
