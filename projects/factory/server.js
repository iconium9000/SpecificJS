module.exports = project => {
  const proj_name = 'Factory:'
  const log = (...msg) => console.log(proj_name, ...msg)
  const fs = require('fs')

  project.socket.on('connection', socket => {
    log('connection')
  })
}
