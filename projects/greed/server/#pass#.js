// #pass#

module.exports = (cl,client_id) => {
  const {clients,turn,state,dice,turn_score} = cl.game
  const client = clients[client_id]
  if (turn != client_id) return
  else if (state == '#filterwait#') {
    client.state = '#pass#'
    client.msg = `${client.name} passed`
    client.score += turn_score + cl.get_score(dice)
    cl.next(client_id)
    cl.update()
  }
}
