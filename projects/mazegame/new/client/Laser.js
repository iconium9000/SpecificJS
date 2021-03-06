module.exports = MazeGame => class Laser extends MazeGame.Lock {

  static get key_bind() { return 'z' }
  static get long_min() { return 4 }
  static get long_max() { return Infinity }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.lasers[id] = this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.lasers[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // Point (in drawspace)
    scale, // Number
  ) {
    const {root,spot,long,constructor} = this, {pi2} = MazeGame.Lib
    const {
      stroke_color,fill_color,line_width,
      thin_line_width,
      radius,
    } = constructor

    const _root = root.vec(scale,offset)
    const _spot = spot.vec(scale,offset)
    const _radius = radius * scale
    const _long = long.strip(MazeGame.Lock.long_min * scale)
    const _spot_long = _spot.sub(_long)

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.lineWidth = thin_line_width * scale
    ctx.strokeStyle = fill_color

    ctx.beginPath()
    _root.lineTo = ctx
    _spot_long.lineTo = ctx
    ctx.stroke()

    ctx.strokeStyle = stroke_color
    ctx.lineWidth = line_width * scale

    ctx.beginPath()
    _spot_long.lineTo = ctx
    _spot.lineTo = ctx
    ctx.stroke()

    ctx.fillStyle = stroke_color
    ctx.beginPath()
    ctx.arc(_root.x, _root.y, _radius, 0, pi2)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.arc(_spot_long.x, _spot_long.y, _radius, 0, pi2)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = fill_color
    ctx.beginPath()
    ctx.arc(_spot.x, _spot.y, _radius, 0, pi2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}
