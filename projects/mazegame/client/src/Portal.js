module.exports = MazeGame => class Portal extends MazeGame.Door {

  static get key_bind() { return 'p' }
  static get short_min() { return 3 }
  static get short_max() { return this.short_min }
  static get long_min() { return 12 }
  static get long_max() { return this.long_min }
  static get short_mid() { return this.short_max / 2 }
  static get center_long() { return this.long_max / 2 }
  static get center_short() { return (
    this.short_max*this.short_max - this.short_mid*this.short_mid +
    this.long_max * this.long_max / 4
  ) / 2 / (this.short_max - this.short_mid)}
  static get radius() { return Math.sqrt(
    Math.pow(this.short_max - this.center_short, 2) +
    Math.pow(this.long_max - this.center_long, 2)
  )}
  static get lock_names() { return ['_lock_root','_lock_cent','_lock_spot',] }

  get center() { return this.short.div(4).sum(super.center) }

  get lines() {
    const {root,short,long,spot,is_open} = this, {sign} = spot.sub(root)
    const root_long = root.sum(long), root_short = root.sum(short)
    const long_short = long.strip(short.scale), spot_long = spot.sub(long_short)
    const _lines = [[root_short,root,root_long,spot,root_long,root,root_short]]

    if (!is_open) {
      _lines.push(sign > 0 ? [spot_long,root_short] : [root_short,spot_long])
    }
    return _lines
  }

  reroot_lock(
    name, // String
  ) {
    const {[name]:_lock,_root,_spot,_long,_short,constructor} = this
    if (!_lock) return
    const {length} = _lock, {lock_names} = constructor
    _lock._long = _short.strip(-length).unit
    const i = (lock_names.indexOf(name) + 1) / (lock_names.length + 1)
    return _lock.root = _root.sum(_long.mul(i))
  }

  set is_open(
    is_open, // Boolean
  ) {
    super.is_open = is_open
  }
  get is_open() {
    return super.is_open && this.src.portals_active
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.portals[id] = this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.portals[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,spot,long,short,length,constructor} = this
    const {
      line_width,thin_line_width,
      stroke_color,fill_color,thin_stroke_color,
      center_short, center_long, radius,
    } = constructor
    const _root = root.mul(scale).sum(offset)
    const _spot = spot.mul(scale).sum(offset)
    const _long = long.mul(scale)
    const _short = short.mul(scale)

    const _radius = radius * scale
    const _center_short = center_short * scale
    const _center_long = center_long * scale
    const _center = (
      _root.sum(_short.strip(_center_short)).sum(_long.strip(_center_long))
    )
    const _angle_root = _center.atan2(_root.sum(_short))
    const _angle_spot = _center.atan2(_spot)

    const _line_width = line_width * scale
    const _thin_line_width = thin_line_width * scale

    ctx.lineWidth = _line_width
    ctx.strokeStyle = stroke_color
    ctx.fillStyle = fill_color
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    if (1 <= length) {
      const _mid_root = _long.div(2).sum(_root)
      const _mid_spot = _mid_root.sum(_short)

      ctx.beginPath()
      _root.lineTo = ctx
      _root.sum(_long).lineTo = ctx
      _spot.lineTo = ctx
      _root.sum(_short).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      _mid_root.lineTo = ctx
      _mid_spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }
    else if (0 < length) {
      const _length = _long.mul(length / 2)

      ctx.beginPath()
      _root.lineTo = ctx
      _root.sum(_length).lineTo = ctx
      _root.sum(_length).sum(_short).lineTo = ctx
      _root.sum(_short).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      _spot.lineTo = ctx
      _spot.sub(_length).lineTo = ctx
      _spot.sub(_length).sub(_short).lineTo = ctx
      _spot.sub(_short).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    ctx.beginPath()
    if (
      (_long._sx + _short._sx) > 0 ^
      (_long._sy + _short._sy) > 0 ^
      _long._sx == 0
    ) {
      _root.sum(_short).lineTo = ctx
      _root.lineTo = ctx
      _root.sum(_long).lineTo = ctx
      _spot.lineTo = ctx
      ctx.arc( _center.x, _center.y, _radius, _angle_spot, _angle_root, )
    }
    else {
      ctx.arc( _center.x, _center.y, _radius, _angle_root, _angle_spot, )
      _spot.lineTo = ctx
      _root.sum(_long).lineTo = ctx
      _root.lineTo = ctx
      _root.sum(_short).lineTo = ctx
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}
