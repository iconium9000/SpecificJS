module.exports = Greed => function mouseup({offsetX,offsetY}) {
  const {Dim,Point,game} = Greed

  const dim = new Dim, mouse = Point.init(offsetX,offsetY,1)

  if (Greed[game.state]) Greed[game.state].mouse(mouse,dim)
  else Greed['#default#'].mouse(mouse,dim)
}
