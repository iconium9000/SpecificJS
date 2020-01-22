// client name

module.exports = function client_name(cl,client_id,{name},
) {
  const {game,client_queue} = cl
  const {clients,state} = game
  let client = clients[client_id]

  if (client) clients[client_id].name = name
  else {
    client = clients[client_id] = {
      name: name,
      id: client_id,
      state: '#wait#',
    }
    cl.reset()
    client_queue.push(client_id)
  }

  if (state == '#wait#') {
    client.state = game.state = '#rollwait#'
    game.msg = `${name} started game`
  }
  else game.msg = `${name} was renamed`

  cl.update()
}
