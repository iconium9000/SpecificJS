module.exports = project => {
  const proj_name = 'Circuit:'
  const log = (...msg) => console.log(proj_name, ...msg)
  const fs = require('fs')
  const file_name = __dirname + '/circuit.c'

  log('server.js')

  project.socket.on('connection', socket => {

    socket.on('update', () => {
      try { socket.emit('update', fs.readFileSync(file_name).toString('utf8')) }
      catch (e) {}
    })

    socket.on('readfile', filename => {
      
    })

    socket.on('writefile', (filename,string) => {
      fs.writeFile(__dirname + '/' + filename,string,'utf8',e => {
        if (e) log('file error',filename,e)
        else log('wrote file',filename)
      })
    })

  })
}
