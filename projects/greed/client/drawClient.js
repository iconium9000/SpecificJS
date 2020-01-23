module.exports = Greed => function drawClient(dim,client,angle) {
  const {ctx,clientRadius} = dim

  ctx.fillStyle = dim.backgroundStyle
  const point = Greed.Point.angle(angle,dim.circleRadius).sum(dim.center)
  ctx.beginPath()
  dim.arc(point,clientRadius)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  if (client.id == Greed.socket_id) {
    ctx.beginPath()
    dim.arc(point,clientRadius * 0.9)
    ctx.closePath()
    ctx.stroke()
  }

  ctx.font = dim.font
  ctx.textAlign = 'center'
  ctx.fillStyle = dim.fontStyle
  dim.fillText(point, client.name)
}
