module.exports = Greed => {return{
  name: '#filterwait#',
  msg: () => {
    const {socket_id,game} = Greed, {turn,clients} = game

    if (turn == socket_id) {
      return 'will you be greedy?'
    }
    else {
      const {name} = clients[turn]
      return `Waiting for ${name} to decide to be greedy`
    }
  },
  mouse: (mouse,dim) => {
    const {Point,Lib,game,socket,socket_id} = Greed, {clients,turn,dice} = game
    if (socket_id != turn) return

    const {pi2} = Lib
    const {center,buttonRadius,diceRadius} = dim
    const sub = mouse.sub(center)
    if (sub.length < buttonRadius) {
      if (sub.y < 0) socket.emit('#filter#', Greed.choice || [])
      else socket.emit('#pass#')
      Greed.choice = null
    }
    else for (let die = 0; die < dice.length; ++die) {
      const val = dice[die]
      if (val != 1 && val != 5) continue

      const angle = pi2 * die / dice.length
      const point = Point.angle(angle,diceRadius).sum(center)

      if (point.dist(mouse) < buttonRadius) {
        if (!Greed.choice) Greed.choice = []
        const {choice} = Greed

        const idx = choice.indexOf(die)
        if (idx < 0) choice.push(die)
        else choice.splice(idx,1)
        return
      }
    }
  },
  draw: dim => {
    const {Point,game,socket_id} = Greed
    const {ctx,fontScale} = dim, {clients,turn,state} = game
    if (socket_id != turn) return
    const {buttonRadius} = dim

    const {center,shift,half} = dim
    ctx.lineWidth = dim.lineWidth
    ctx.strokeStyle = dim.strokeStyle
    ctx.fillStyle = dim.buttonStyle
    ctx.beginPath()
    dim.arc(center,buttonRadius)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    center.sub(half).lineTo = ctx
    center.sum(half).lineTo = ctx
    ctx.stroke()

    ctx.font = dim.font
    ctx.fillStyle = dim.fontStyle
    ctx.textAlign = 'center'
    dim.fillText(center.sub(shift),'Roll Again')
    dim.fillText(center.sum(shift),'Pass')
  },
}}
