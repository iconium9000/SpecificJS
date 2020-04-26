module.exports = Greed => function Setup(socket) {

  const {Lib} = Greed

  // get player id
  const id = socket.id.split('#').pop()
  let username = Lib.get_cookie('username')
  if (typeof username != 'string' || username.length < 10) {
    Lib.set_cookie('username', username = id, 15)
  }

  // select name
  let name = Lib.get_cookie('name')
  while (name == null || name == 'null' || name == 'NULL') {
    name = prompt('Choose a name:', name)
  }
  Lib.set_cookie('name', name, 15)
  socket.emit('client name', {name:name, username:username})

  return id
}
