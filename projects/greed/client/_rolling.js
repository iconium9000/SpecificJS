module.exports = Greed => {return{
  name: '#rolling#',
  mouse: (mouse,dim) => {},
  msg: () => {
    const {game,socket_id} = Greed, {turn,clients} = game

    const name = socket_id == turn ? 'You' : clients[turn].name
    return `${name} is rolling...`
  },
  draw: dim => {
    const {ctx} = dim
    ctx.font = dim.font
    ctx.fillStyle = dim.fontStyle
    ctx.textAlign = 'center'
    dim.fillText(dim.center,'Rolling...')
  },
}}
