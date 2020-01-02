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

  get lock() { return super.lock }
  set lock(
    lock, // Lock,Null
  ) {
    super.lock = lock
    if (this.lock) this.long = this.lock.long
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
    if (long.length == 0) return
    this._long = long.unit.strip(this.constructor.radius)
    this.reroot_lock()
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    super.root = root
    const {_root} = this
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

  get is_open() {
    const {editor, lock} = this
    return !(editor || (lock && lock.is_slot))
  }
  set is_open(_) { super.is_open = this.is_open }

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
    this._spot = spot
    if (spot) {
      const {root} = this
      this.lock = null
    }
  }

  move(
    dt, // Number (milliseconds)
  ) {
    if (!this._spot) return
    let {root,spot,long} = this

    const {src:level,nose,constructor} = this
    const {lines} = level, {speed,radius,intersect} = constructor
    let [ lock, key ] = level.get_lock_key(spot)
    if (key == nose.key || (key && key.is_jack)) key = null

    const dist = dt * speed
    if (level.portals_active) {
      const [root_portal,spot_portal] = level.__active_portals

      const root_center = root_portal.center
      const spot_center = spot_portal.center
      const temp = [ [root_center,spot_center], [spot_center,root_center], ]
      for (const i in temp) {
        const [root_center,spot_center] = temp[i]

        if (
          !intersect(lines,root,root_center) &&
          !intersect(lines,spot_center,spot)
        ) {
          if (key || nose.key) {
            const lung = root_center.sub(root).unit
            this.long = lung
            const snot = nose.spot
            if (intersect(lines,root,snot)) {
              this.long = root.sub(root_center)
              const sub = root_center.sub(root).unit
              const move = sub.strip(dist).sum(root)

              if (intersect(lines,root,move)) {
                this._spot = null
              }
              else if (sub.scale < dist) {
                this.root = spot_center
                this.long = spot_center.sub(spot)
              }
              else {
                this.root = sub.strip(dist).sum(root)
              }
            }

            const sub = root_center.sub(snot).unit
            const length = nose.length + radius

            if (
              lung.scale < length ? // moving backwards
              intersect(lines,snot,sub.strip(dist).sum(root)) :
              intersect(lines,root,sub.strip(dist).sum(snot))
            ) {
              this._spot = null
            }
            else if (sub.scale < dist) {
              this.root = spot_center
              this.long = spot.sub(spot_center)
            }
            else {
              this.root = sub.strip(dist).sum(root)
            }
          }
          else {
            this.long = root.sub(root_center)
            const sub = root_center.sub(root).unit
            const move = sub.strip(dist).sum(root)

            if (intersect(lines,root,move)) {
              this._spot = null
            }
            else if (sub.scale < dist) {
              this.root = spot_center
              this.long = spot_center.sub(spot)
            }
            else {
              this.root = move
            }
          }

          return
        }
      }
    }

    if (key || nose.key) {
      const lung = spot.sub(root).unit
      this.long = lung
      const snot = nose.spot
      if (intersect(lines,root,snot)) {
        this._spot = null
        this.long = long
        return
      }

      const sub = spot.sub(snot).unit
      const length = nose.length + radius
      const back = lung.scale < length

      if (
        back ? // moving backwards
        intersect(lines,snot,sub.strip(dist).sum(root)) :
        intersect(lines,root,sub.strip(dist).sum(snot))
      ) {
        this._spot = null
      }
      else if (sub.scale < dist) {
        this._spot = null
        if (sub.scale != 0) {
          this.root = spot.sub(sub.strip(length * (back ? -1 : 1)))
        }

        if (nose.key && lock && !key && lock.is_slot == !nose.key.is_open) {
          lock.key = nose.key
        }
        else if (key && !nose.key) nose.key = key
      }
      else {
        this.root = sub.strip(dist).sum(root)
      }
    }
    else {
      this.long = root.sub(spot)
      const sub = spot.sub(root).unit
      const move = sub.strip(dist).sum(root)

      if (intersect(lines,root,move)) {
        this._spot = null
      }
      else if (sub.scale < dist) {
        this._spot = null
        this.root = spot

        if (lock) {
          this.lock = lock
          this.editor = null
        }
      }
      else {
        this.root = sub.strip(dist).sum(root)
      }
    }
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

    if (spot) {

      const {src:level,nose,constructor} = this
      const {lines} = level, {intersect} = constructor

      const _spot = spot.mul(scale).sum(offset)
      ctx.strokeStyle = thin_stroke_color
      ctx.lineWidth = thin_line_width * scale


      ctx.beginPath()
      _root.lineTo = ctx

      if (level.portals_active) {
        const [root_portal,spot_portal] = level.__active_portals

        const root_center = root_portal.center
        const spot_center = spot_portal.center
        const temp = [ [root_center,spot_center], [spot_center,root_center], ]
        for (const i in temp) {
          const [root_center,spot_center] = temp[i]
          if (
            !intersect(lines,root,root_center) &&
            !intersect(lines,spot_center,spot)
          ) {
            root_center.mul(scale).sum(offset).lineTo = ctx
            spot_center.mul(scale).sum(offset).lineTo = ctx
            break
          }
        }
      }

      _spot.lineTo = ctx
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
