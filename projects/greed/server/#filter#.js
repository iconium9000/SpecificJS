// #filter#

module.exports = function (cl,client_id,choices) {
  const {game} = cl, {state,turn,dice,clients} = game
  if (turn != client_id) return
  else if (state != '#filterwait#') return

  const client = clients[client_id]

  const _dice = dice.slice()
  for (const choice_idx in choices) {
    const die = choices[choice_idx]
    if (0 <= die && die < _dice.length) _dice[die] = 7
  }

  const score = cl.get_score(_dice)
  if (score == 0) {
    client.state = '#filteragain#'
    game.msg = `try filter again`
  }
  else {
    game.dice = _dice
    game.roll_score = score
    game.turn_score += score
    client.state = game.state = '#rollwait#'
    game.msg = `filter successful`
  }

  cl.update()
}
