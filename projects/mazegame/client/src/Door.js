module.exports = MazeGame => class Door extends MazeGame.Wall {

  static get key_bind() { return 'd' }
  static get root_round() { return 4 }
  static get long_min() { return 16 }
  static get long_round() { return 4 }
  static get short_min() { return 4 }
  static get short_max() { return 4 }
  static get short_sign() { return true }

  static get lock_names() {
    return ['_root_short','_root_long','_spot_long','_spot_short',]
  }

  get is_open() { return super.is_open }
  set is_open(
    is_open, // Boolean
  ) {
    if (!is_open) return super.is_open = false
    const {lock_names} = this.constructor
    for (const i in lock_names) {
      const lock = this[lock_names[i]]
      if (lock && !lock.is_open) return super.is_open = false
    }
    super.is_open = true
  }

  get length() { return this._length }
  set length(
    length, // Number
  ) {
    const {_length} = this
    length = length < 0 ? 0 : length > 1 ? 1 : length
    if (_length == length) return
    this._length = length
  }

  set_lock(
    lock, // Lock,Null
    name, // String
  ) {
    const {[name]:_lock} = this
    if (_lock == lock) return
    if (_lock) _lock.remove()
    if (lock) {
      this[name] = lock
      lock.parent = this
      this.reroot_lock(name)
    }
    this.is_open = true
  }

  get lines() {
    const {root,long,short,spot,is_open} = this, {sign} = spot.sub(root)
    const root_short = root.sum(short), spot_short = spot.sub(short)

    if (is_open) {
      const long_short = long.strip(short.scale)
      const root_long = root.sum(long_short), spot_long = spot.sub(long_short)
      return sign > 0 ? [
        [root,root_short,root_long,root,], [spot,spot_short,spot_long,spot,],
      ] : [
        [root,root_long,root_short,root,], [spot,spot_long,spot_short,spot,],
      ]
    }
    else return sign > 0 ? [
      [root,root_short,spot,spot_short,root,],
    ] : [
      [root,spot_short,spot,root_short,root,],
    ]
  }

  reroot_locks() {
    const {lock_names} = this.constructor
    for (const i in lock_names) this.reroot_lock(lock_names[i])
  }
  reroot_lock(
    name, // String
  ) {
    const {[name]:_lock, _root,_spot,_long,_short} = this
    if (!_lock) return
    const {length} = _lock
    switch (name) {
      case '_root_short':
        _lock._long = _long.strip(-length).unit
        _lock.root = _short.div(2).sum(_root)
        break
      case '_root_long':
        _lock._long = _short.strip(-length).unit
        _lock.root = _long.strip(_short.scale/2).sum(_root)
        break
      case '_spot_long':
        _lock._long = _short.strip(length)
        _lock.root = _long.strip(-_short.scale/2).sum(_spot)
        break
      case '_spot_short':
        _lock._long = _long.strip(length)
        _lock.root = _short.div(-2).sum(_spot)
        break
      default: return
    }
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.doors[id] = this
  }

  copy(
    src, // Level
  ) {
    const _wall = super.copy(src)

    const {_length,constructor} = this
    _wall._length = _length

    return _wall
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_length,constructor} = this
    _serialize._length = _length

    const {lock_names} = constructor
    for (const i in lock_names) {
      const lock_name = lock_names[i]
      if (this[lock_name]) {
        _serialize[lock_name] = constructor.serialize(this[lock_name], src)
      }
    }

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_length} = serialize[id], {constructor} = this
    this._length = _length

    const {lock_names} = constructor
    for (const i in lock_names) {
      constructor.read(serialize, src, serialize[id][lock_names[i]])
    }

    return this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const _door = super.init(src,root)
    _door.length = 0
    _door.is_open = true
    return _door
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.doors[id]
  }

  move(
    dt, // Number (milliseconds)
  ) {
    const {is_open, _long:{scale}, constructor:{speed}} = this
    this.length += (is_open ? -1 : 1) / scale * speed * dt
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {
      line_width,thin_line_width,
      stroke_color,fill_color,thin_stroke_color,
    } = this.constructor
    const {root,spot,long,short,length} = this

    const _root = root.mul(scale).sum(offset)
    const _spot = spot.mul(scale).sum(offset)
    const _long = long.mul(scale)
    const _short = short.mul(scale)

    const _line_width = line_width * scale
    const _thin_line_width = thin_line_width * scale

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.lineWidth = _line_width
    ctx.strokeStyle = stroke_color
    ctx.fillStyle = fill_color

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
      const _length = _long.mul(length/2)

      ctx.lineWidth = _thin_line_width
      ctx.strokeStyle = thin_stroke_color
      ctx.beginPath()
      _root.sum(_length).lineTo = ctx
      _spot.sub(_length).sub(_short).lineTo = ctx
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      _root.sum(_length).sum(_short).lineTo = ctx
      _spot.sub(_length).lineTo = ctx
      ctx.stroke()

      ctx.lineWidth = _line_width
      ctx.strokeStyle = stroke_color

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
    else {
      ctx.lineWidth = _thin_line_width
      ctx.strokeStyle = thin_stroke_color

      ctx.beginPath()
      _root.lineTo = ctx
      _spot.sub(_short).lineTo = ctx
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      _root.sum(_short).lineTo = ctx
      _spot.lineTo = ctx
      ctx.stroke()

      ctx.lineWidth = _line_width
      ctx.strokeStyle = stroke_color
    }

    ctx.beginPath()
    _root.lineTo = ctx
    _root.sum(_short).lineTo = ctx
    _root.sum(_long.strip(_short.scale)).lineTo = ctx
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    _spot.lineTo = ctx
    _spot.sub(_short).lineTo = ctx
    _spot.sub(_long.strip(_short.scale)).lineTo = ctx
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}
