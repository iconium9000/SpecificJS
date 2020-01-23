module.exports = Greed => function tick() {

  const {Dim,Point,game,socket_id,Lib} = Greed, {pi2} = Lib, dim = new Dim
  const client = game.clients[socket_id]
  const {ctx,scale,center,circleRadius,clientRadius} = dim

  Greed.drawBoard(dim)

  let {clients,client_idx,client_queue,dice} = game
  const {length} = client_queue, dif = length - client_idx
  while (client_idx < length) {
    const client = clients[client_queue[client_idx++]]
    if (client) Greed.drawClient(dim,client,pi2*(length-client_idx)/dif)
  }

  const {choice} = Greed, flip = []
  for (const die in dice) flip.push(true)
  for (const idx in choice) flip[choice[idx]] = false

  for (let die = 0; die < dice.length; ++die) {
    const angle = pi2 * die / dice.length
    Greed.drawDice(dim,die,angle,flip)
  }

  const {state} = game
  if (Greed[state]) Greed[state].draw(dim)
  else Greed['#default#'].draw(dim)

  window.requestAnimationFrame(tick)
}
