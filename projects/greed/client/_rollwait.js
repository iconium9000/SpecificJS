module.exports = Greed => {return{
  name: '#rollwait#',
  msg: () => {
    const {game,socket_id} = Greed, {turn,clients} = game

    const name = socket_id == turn ? 'You' : clients[turn].name
    return `wating for ${name} to roll...`
  },
  mouse: (mouse,dim) => {
    if (Greed.game.turn != Greed.socket_id);
    else if (dim.center.dist(mouse) < dim.buttonRadius) {
      Greed.socket.emit('#roll#')
    }
  },
  draw: dim => {
    const {game,socket_id} = Greed
    const {ctx,fontScale,center} = dim, {clients,turn,state} = game
    const client = clients[turn]

    if (turn != socket_id) return

    ctx.lineWidth = dim.lineWidth
    ctx.strokeStyle = dim.strokeStyle
    ctx.fillStyle = dim.buttonStyle
    ctx.beginPath()
    dim.arc(center,dim.buttonRadius)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.font = dim.font
    ctx.fillStyle = dim.fontStyle
    ctx.textAlign = 'center'
    dim.fillText(center,'Roll Dice')
  },
}}
