module.exports = MazeGame => class Slot extends MazeGame.Lock {

  static get long_min() { return 2 }
  static get long_max() { return 2 }

  static get key_bind() { return 's' }
  get is_slot() { return true }

  get is_open() {
    const {_key} = this
    return _key ? _key.is_jack || !_key.is_open : false
  }
  set is_open(
    is_open // Boolean
  ) {
    super.is_open = is_open
  }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.slots[id] = this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.slots[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {spot,key} = this, {pi2} = MazeGame.Lib
    if (key) return

    const {
      thin_line_width,thin_stroke_color,fill_color,
      radius,center_radius,
    } = MazeGame.Key

    const {x,y} = spot.vec(scale,offset)
    const _radius = radius * scale
    const _center_radius = center_radius * scale

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = thin_stroke_color
    ctx.fillStyle = fill_color
    ctx.lineWidth = thin_line_width * scale

    ctx.beginPath()
    ctx.arc(x, y, _radius, 0, pi2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.lineTo(x + _center_radius, y + _center_radius)
    ctx.lineTo(x - _center_radius, y - _center_radius)
    ctx.closePath()
    ctx.stroke()

    ctx.beginPath()
    ctx.lineTo(x - _center_radius, y + _center_radius)
    ctx.lineTo(x + _center_radius, y - _center_radius)
    ctx.closePath()
    ctx.stroke()
  }

}
