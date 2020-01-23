module.exports = Greed => function drawBoard(dim) {
  const {ctx} = dim
  ctx.lineWidth = dim.lineWidth
  ctx.strokeStyle = dim.strokeStyle
  ctx.fillStyle = dim.backgroundStyle
  ctx.beginPath()
  dim.arc(dim.center,dim.circleRadius)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}
