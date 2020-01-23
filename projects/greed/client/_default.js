module.exports = Greed => {return{
  name: '#default#',
  mouse: (mouse,dim) => {},
  msg: () => `default state: (${Greed.game.state})`,
  draw: dim => {
    const {game,socket_id} = Greed, {state} = game
    const {ctx,center} = dim
    if (state != '#joinwait#') return
  },
}}
