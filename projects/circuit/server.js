module.exports = project => {
  const proj_name = 'Circuit:'
  const log = (...msg) => console.log(proj_name, ...msg)
  const fs = require('fs')
  const file_name = __dirname + '/circuit.c'

  log('server.js')

  project.socket.on('connection', socket => {
    socket.on('readfile', filename => {
      let file
      try {
        file = fs.readFileSync(__dirname + '/cfg/' + filename).toString('utf8')
      }
      catch (e) { file = {error:e} }
      finally { socket.emit('readfile',filename,file) }
    })
    socket.on('writefile', (filename,string) => {
      fs.writeFile(__dirname + '/cfg/' + filename,string,'utf8',e => {
        socket.emit('writefile',filename,e)
      })
    })
  })
}
