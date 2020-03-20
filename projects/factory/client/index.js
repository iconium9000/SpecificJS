const {log,error} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Factory)
		Factory[constructor.name] = constructor
	}
}

const grid = {}
function Factory() {
  const {Lib,Point} = Factory

  const radius = 15
  let offset = Point.zero, scale = 2*radius
  let selcell = null

  class Cell {
    constructor(
      point, // Point (grid)
      id // String (Point serial)
    ) {
      this._point = point
      this._id = id
    }
    draw(
      ctx, // CanvasRenderingContext2D
    ) {
      const {x,y} = gtow(this._point)
      ctx.beginPath()
      ctx.arc(x,y,radius,0,Math.PI*2)
      ctx.closePath()
      ctx.fillStyle = 'white'
      ctx.fill()
    }
  }

  // return point on window
  function gtow(
    point // point on grid
  ) {
    return point.sum(offset).mul(scale)
  }
  function wtog(
    point // point on window
  ) {
    return point.div(scale).sub(offset).round(1)
  }


  $(document).mouseup(({offsetX,offsetY}) => {
    const g = wtog(Point.init(offsetX,offsetY,1))
    const id = g.serialize()
    let tempcell = null
    if (grid[id]) tempcell = grid[id]
    else tempcell = grid[id] = new Cell(g,id)

    if (tempcell == selcell) selcell = null
    else selcell = tempcell
  })

  const socket = io('/factory')
  let name = null
  socket.on('connect', () => {
    name = null
    if (typeof document.cookie == 'string') {
      name = Lib.get_cookie('name')
    }
    while (!name || name == 'null') {
      name = prompt('Choose a name:', name)
    }
    Lib.set_cookie('name',name,15)
  })

  tick()
  function tick() {

    const canvas = document.getElementById('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth - 20
    canvas.height = window.innerHeight - 22
    window.requestAnimationFrame(tick)

    for (const i in grid) {
      grid[i].draw(ctx)
    }
  }

}
