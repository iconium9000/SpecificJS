// #roll#

module.exports = function (cl,client_id) {
  const {game} = cl, {clients,turn,state} = game
  const client = clients[client_id]

  if (turn != client_id || !client) return
  if (state != '#rollwait#') return

  game.state = '#rolling#'
  game.msg = `${client.name} is rolling`
  cl.clear()
  cl.update()

  setTimeout(() => {
    const dice = cl.roll()
    const score = cl.get_score(dice.slice())
    game.msg = `${client.name} rolled`
    if (score == 0) {
      game.msg += ` and lost`
      client.state = '#lost#'
      cl.reset()
      cl.next(client_id)
    }
    else {
      game.state = '#filterwait#'
    }
    cl.update()

  }, cl.randtime())
}
