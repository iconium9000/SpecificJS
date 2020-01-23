// #join#
const {log} = console

module.exports = function (cl,client_id) {
  const {names,game} = cl, {state,clients,client_queue} = game

  if (state != '#joinwait#') return
  else if (clients[client_id]) return

  clients[client_id] = {
    name: names[client_id],
    id: client_id,
  }
  client_queue.push(client_id)

  if (!game.turn) game.turn = client_id

  game.msg = `${names[client_id]} joined game`

  for (const id in names) if (!clients[id]) return cl.update()

  game.state = '#rollwait#'
  game.msg += ` and started game`
  cl.reset()
  cl.update()
}
