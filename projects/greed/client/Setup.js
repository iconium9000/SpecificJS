module.exports = Greed => function Setup(socket) {

  const {Lib} = Greed

  // get player id
  const id = socket.id.split('#').pop()
  let user_id = Lib.get_cookie('user_id')
  if (typeof user_id != 'string' || user_id.length < 10) {
    Lib.set_cookie('user_id', user_id = id, 15)
  }

  // select name
  let name = Lib.get_cookie('name')
  while (!name || name == 'null' || name == 'NULL') {
    name = prompt('Choose a name:', name)
  }
  Lib.set_cookie('name', name, 15)
  socket.emit('client name', {name:name, user_id:user_id})

  return { id:id, name:name, user_id:user_id }
}
