module.exports = MazeGame => class Jack extends MazeGame.Key {

  static get key_bind() { return 'j' }
  static get leg_radius() { return 2 }
  get is_jack() { return true }

  static get lock_names() {
    return ['_nose',]
  }

  get nose_length() {
    const {_nose:{length,key},constructor:{radius}} = this
    return (key ? key.constructor.radius : 0) + length + radius
  }

  get nose() { return this._nose }
  set_lock(
    nose, // Lock,Null
  ) {
    const {_nose} = this
    if (_nose == nose) return
    if (_nose) {
      this._nose = null
      _nose.remove()
    }
    if (nose) {
      this._nose = nose
      nose.parent = this
      this.reroot_lock()
    }
  }

  reroot_lock() {
    const {_root,_long,_nose} = this
    if (_nose) {
      _nose._long = _long.strip(_nose.length)
      _nose.root = _root.sum(_long)
    }
  }

  get long() { return this._long }
  set long(
    long, // Point
  ) {
    this._long = long.unit.strip(this.constructor.radius)
    this.reroot_lock()
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    super.root = root
    if (this._root == root) this.reroot_lock()
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.jacks[id] = this
  }

  get editor() { return super.editor }
  set editor(
    editor, // Editor,Null
  ) {
    super.editor = editor
    super.is_open = !editor
  }

  get is_open() { return !this.editor }
  set is_open(_) { super.is_open = !this.editor }

  copy(
    src, // Level
  ) {
    const _jack = super.copy(src)

    const {_long,_nose,constructor} = this

    _jack._long = _long
    if (_nose) _jack.set_lock(constructor.copy(_nose, src), '_nose')

    return _jack
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_long,_spot,_nose,constructor} = this

    _serialize._long = _long.serialize()
    if (_spot) _serialize._spot = _spot.serialize()
    if (_nose) _serialize._nose = constructor.serialize(_nose, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_long,_spot,_nose} = serialize[id], {constructor} = this
    this._long = constructor.read(_long)
    if (_nose) this.set_lock(constructor.read(serialize, src, _nose))
    if (_spot) this.spot = constructor.read(_spot)

    return this
  }

  static init(
    src, // Level
    lock, // Lock,Null
    point, // Null,Point
  ) {
    const _jack = super.init(src,lock,point)
    _jack._long = MazeGame.Point.init(1,0,this.radius)
    MazeGame.Lock.init(_jack, '_nose')
    return _jack
  }

  remove() {
    const {id,src,_nose} = this
    if (_nose) _nose.remove()
    super.remove()
    delete src.jacks[id]
  }

  get spot() { return this._spot }
  set spot(
    spot, // Point,Null
  ) {
    this.__root_portal = this.__spot_portal = null
    if (!spot) return this._spot = null

    const {nose,root,src,constructor} = this
    const {lines} = src, {intersect} = constructor
    if (intersect(lines,root,spot)) return
    this._spot = spot

    // const {
    //   portals_active,
    //   __active_portals:[root_portal,spot_portal]
    // } = src, _paths = [ [ [root,spot], ], ]
    //
    //
    //
    // if (portals_active) {
    //   const r = root_portal.center, s = spot_portal.center
    //   _paths.push(
    //     [[root,r,root_portal], [s,spot,spot_portal]],
    //     [[root,s,spot_portal], [r,spot,root_portal]],
    //   )
    // }
  }

  move(
    dt, // Number (milliseconds)
  ) {
    this.spot = this.spot
    const {spot,__root_portal,__spot_portal} = this

    // if (__root_portal)/
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,long,spot,mid,constructor} = this, {pi2} = MazeGame.Lib
    const {
      stroke_color,line_width,thin_stroke_color,thin_line_width,
      leg_radius,
    } = constructor
    const _root = root.mul(scale).sum(offset)
    const _long = long.mul(scale)
    const _radius = leg_radius * scale
    const _i_long = _long.strip(_radius).invert
    const _h_long = _long.strip(_radius / 2)

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    if (spot || mid) {
      const _spot = (spot || mid).mul(scale).sum(offset)
      ctx.strokeStyle = thin_stroke_color
      ctx.lineWidth = thin_line_width * scale

      ctx.beginPath()
      _root.lineTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }

    ctx.strokeStyle = stroke_color
    ctx.lineWidth = line_width * scale

    ctx.beginPath()
    _root.sum(_i_long).sum(_h_long).lineTo = ctx
    _root.sub(_i_long).sum(_h_long).lineTo = ctx
    ctx.stroke()
    ctx.beginPath()
    _root.sum(_i_long).sub(_h_long).lineTo = ctx
    _root.sub(_i_long).sub(_h_long).lineTo = ctx
    ctx.stroke()

    super.draw(ctx, offset, scale)
  }
}
