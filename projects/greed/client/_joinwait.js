module.exports = Greed => {return{
  name: '#joinwait#',
  mouse: (mouse,dim) => {
    const {socket,socket_id,game} = Greed
    const {clients} = game
    const {center,buttonRadius} = dim

    if (clients[socket_id]) return
    else if (center.dist(mouse) < buttonRadius) {
      socket.emit('#join#')
    }
  },
  msg: () => {
    const {game,socket_id} = Greed, {clients} = game
    if (clients[socket_id]) return `Wating for other players to Vote Start`
    else return `Vote to start the game`
  },
  draw: dim => {
    const {game,socket_id} = Greed
    const {clients,turn,state} = game
    const {ctx,fontScale,center} = dim

    if (clients[socket_id]) return

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
    dim.fillText(center,'Vote Start')
  },
}}
