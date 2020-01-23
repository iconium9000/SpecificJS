// disconnect

module.exports = function (cl,client_id) {
  const {clients,turn} = cl.game
  const client = clients[client_id]
  if (!client) return

  delete cl.names[client_id]

  cl.game.msg = `${client.name} left the game`
  delete clients[client_id]
  if (client_id == turn) {
    cl.next(client_id)
    cl.reset()
  }
  cl.update()
}
