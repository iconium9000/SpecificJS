module.exports = Greed => function drawDice(dim,die,angle,flip) {
  const {ctx} = dim, {pi2} = Greed.Lib
  const point = Greed.Point.angle(angle,dim.diceRadius).sum(dim.center)

  let val = Greed.game.dice[die], special = val == 1 || val == 5

  ctx.strokeStyle = dim.strokeStyle
  ctx.lineWidth = special ? dim.lineWidth : dim.liteLineWidth
  ctx.fillStyle = dim.buttonStyle
  ctx.beginPath()
  dim.arc(point,dim.buttonRadius)
  ctx.closePath()
  if (special && flip[die]) ctx.fill()
  ctx.stroke()

  ctx.fillStyle = dim.strokeStyle
  if (val == 0) val = Math.ceil(Math.random() * 6)

  if (val == 1) {
    ctx.beginPath()
    dim.arc(point,dim.dotRadius)
    ctx.closePath()
    ctx.fill()
  }
  else for (let v = 0; v < val; ++v) {
    const _angle = pi2 * (v / val + val / 4)
    const _point = Greed.Point.angle(_angle,dim.subDiceRadius).sum(point)

    ctx.beginPath()
    dim.arc(_point,dim.dotRadius)
    ctx.closePath()
    ctx.fill()
  }
}
