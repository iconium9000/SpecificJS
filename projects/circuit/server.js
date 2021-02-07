module.exports = project => {
  const proj_name = 'Circuit:';
  const log = (...msg) => console.log(proj_name, ...msg);

  log('server.js');

  project.socket.on('connection', socket => {
    
  })
}
