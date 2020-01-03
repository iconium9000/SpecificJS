module.exports = MazeGame => class Wall extends MazeGame.Target {

  static get key_bind() { return 'w' }
  static get root_round() { return 1 }
  static get long_round() { return 2 }
  static get long_min() { return 2 }
  static get long_max() { return Infinity }
  static get short_min() { return 2 }
  static get short_max() { return 2 }
  static get default_length() { return 0 }
  static get short_sign() { return false }
  static get is_portal() { return false }

  static act_at(
    editor, // Editor
    spot, // Point
  ) {
    const level = editor.src
    const closest_wall = this.get_closest(level.walls, spot)

    if (editor.target) {
      const wall = editor.target
      editor.target = null
      wall.long = spot.sub(wall.root)
      wall.reroot_locks()
      return true
    }
    else if (closest_wall) {
      const {_root,_long,_spot,_short,__long_dot} = closest_wall

      if (__long_dot < 0.5) {
        closest_wall._root = _spot
        closest_wall._spot = _root
        closest_wall._long = _long.mul(-1).long
        closest_wall._short = _short.mul(-1).long
        closest_wall.reroot_locks()
      }

      editor.target = closest_wall
      return true
    }
    else {
      const _wall = this.init(level, spot)
      editor.target = _wall
      return true
    }

  }

  static get_closest(
    walls, // Wall{}
    spot, // Point
  ) {
    let min_dist = Infinity, return_wall = null
    for (const label in walls) {
      const wall = walls[label], {root,long,short,constructor} = wall
      const {short_sign} = constructor, _sub = spot.sub(root)

      wall.__long_dot = long.strip(1).dot(_sub) / long.scale
      let _short_dot = short.strip(1).dot(_sub)
      if (!short_sign && _short_dot < 0) _short_dot = -_short_dot

      if (
        0 < wall.__long_dot && wall.__long_dot < 1 &&
        0 < _short_dot && _short_dot < short.scale && _short_dot < min_dist
      ) {
        return_wall = wall
        min_dist = _short_dot
      }
    }
    return return_wall
  }

  get lines() {
    const {root,spot} = this
    return [ [root,spot,root], ]
  }

  reroot_locks() {}

  get spot() { return this._spot }
  get center() { return this._root.sum(this._spot).div(2) }

  get short() { return this._short }
  get long() { return this._long }
  set long(
    long, // Point
  ) {
    const {_root,_length,constructor} = this
    const {
      short_min,short_max,short_round,
      long_min,long_max,long_round,
      short_sign,
    } = constructor

    this._long = long.long.cramp(long_min,long_max,long_round)
    this._short = long.short.cramp(short_min,short_max,short_round)

    this._spot = _root.sum(this._long)
    if (short_sign) this._spot = this._spot.sum(this._short)
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    const {short_sign,root_round} = this.constructor
    super.root = root = root.round(this.constructor.root_round)

    const {_root,_long,_short} = this
    if (_root != root) return

    this._spot = root.sum(_long)
    if (short_sign) this._spot = this._spot.sum(_short)
  }


  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.walls[id] = this
  }

  copy(
    src, // Level
  ) {
    const _wall = super.copy(src)

    const {_root,_long,_short,_spot,constructor} = this
    _wall._root = _root
    _wall._long = _long
    _wall._short = _short
    _wall._spot = _spot

    return _wall
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_root,_long,_short,__points,constructor} = this
    _serialize._root = _root.serialize(__points)
    _serialize._long = _long.sum(_short).serialize(__points)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_root,_long} = serialize[id], {constructor} = this
    this._root = constructor.read(_root)
    this.long = constructor.read(_long)

    return this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const {long_min,short_min} = this
    const _wall = super.init(src)
    _wall._long = MazeGame.Point.init(1,0,long_min)
    _wall._short = MazeGame.Point.init(0,1,short_min)
    _wall.root = root
    return _wall
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.walls[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {line_width,stroke_color,} = this.constructor
    const {root,spot} = this
    const _root = root.mul(scale).sum(offset)
    const _spot = spot.mul(scale).sum(offset)

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.lineWidth = line_width * scale
    ctx.strokeStyle = stroke_color

    ctx.beginPath()
    _root.lineTo = ctx
    _spot.lineTo = ctx
    ctx.closePath()
    ctx.stroke()
  }
}
