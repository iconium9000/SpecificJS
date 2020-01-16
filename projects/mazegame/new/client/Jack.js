module.exports = MazeGame => class Jack extends MazeGame.Key {

  static get key_bind() { return 'j' }
  static get leg_radius() { return this.radius * 1.2 }
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
    lock // Lock,Null
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
    long // Point
  ) {
    if (long.length == 0) return
    this._long = long.unit.strip(this.constructor.radius)
    this.reroot_lock()
  }

  get root() { return this._root }
  set root(
    root // Point
  ) {
    super.root = root
    this.reroot_lock()
  }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.jacks[id] = this
  }

  get editor() { return super.editor }
  set editor(
    editor // Editor,Null
  ) {
    super.editor = editor
    super.is_open = !editor
  }

  get is_open() {
    const {editor, lock} = this
    const is_open = !(editor || (lock && lock.is_slot))
    return is_open
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

    const {_long,_spot,_nose,constructor,__points} = this

    _serialize._long = _long.serialize(__points)
    if (_spot) _serialize._spot = _spot.serialize(__points)
    if (_nose) _serialize._nose = constructor.serialize(_nose, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_long,_spot,_nose} = serialize[id], {constructor,__points} = this
    this._long = MazeGame.Point.read(_long,__points)
    if (_nose) this.set_lock(constructor.read(serialize, src, _nose))
    if (_spot) this.spot = MazeGame.Point.read(_spot,__points)

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

  path_to(
    lines, // Point[][]
    spot, // Point
    key, // Key,Null
  ) {
    const {_id,src,nose,center,constructor} = this, {speed,radius} = constructor
    const {portals_active,__active_portals} = src
    const [root_portal,spot_portal] = __active_portals || []
    const op_portal = [spot_portal,root_portal]
    const [path,con,out] = [[],{},{}]
    const [nidx,ridx,didx,pidx,] = [0,1,2,3]
    let [min,win,sin] = [[this,center,0],null,null]
    const intersect = (root,spot) => constructor.intersect(lines,root,spot,key)

    const _radius = radius + nose.length

    for (const id in src) {
      if (src[id] && (src[id].is_node || id == _id)) {
        const {center} = src[id]
        const _depth = spot.dist(center)
        out[id] = [src[id],center,_depth]
      }
    }

    do {
      const [node,root,depth] = min, {id} = node
      const __depth = out[id][didx]
      const _depth = depth + __depth; delete out[id]; delete con[id]

      if (!sin || sin[didx] > __depth) {
        sin = [null,spot,__depth,min]
      }
      if ((!win || win[didx] > _depth) && (
        // __depth < _radius ?
        // !intersect(spot, root.sub(spot).mul(_radius/__depth).sum(spot)) :
        !intersect(root,spot)
      )) {
        win = [null,spot,_depth,min]
      }

      for (const id in out) {
        const [target,center,__depth] = out[id]
        const _depth = depth + center.dist(root)
        if ((!con[id] || con[id][didx] > _depth) && !intersect(root,center)) {
          con[id] = [target,center,_depth,min]
        }
      }

      for (const i in __active_portals) {
        const root_portal = __active_portals[i], {id} = op_portal[i]
        if (node == root_portal && out[id]) {
          const [target,center,__depth] = out[id]
          if (!con[id] || con[id] > _depth) {
            con[id] = [target,center,depth,min]
          }
        }
      }

      min = null
      for (const id in con) if (!min || min[didx] > con[id][didx]) min = con[id]
    } while (min != null)

    min = win || sin
    for (let pan = min; pan; pan = pan[pidx]) path.push([pan[ridx],pan[didx]])
    return path
  }

  remove() {
    const {id,src,_nose} = this
    if (_nose) _nose.remove()
    super.remove()
    delete src.jacks[id]
  }

  get spot() { return this._spot }
  set spot(
    spot // Point,Null
  ) {
    if (spot) {
      this._spot = spot//.round(this.constructor.round)
      const {root} = this
      this.lock = null
    }
    else this._spot = null
  }

  get center() {
    const {root,spot,nose,src} = this
    if (!spot) return root
    const key = MazeGame.Key.get_closest(src.keys,spot)
    return (key && !key.is_jack) || nose.key ? root : nose.spot
  }
  move(
    dt, // Number (milliseconds)
  ) {
    let {root,spot,long} = this
    if (!spot) return

    const {src,node,nose,constructor} = this, {lines} = src
    let [lock,key] = src.get_lock_key(spot)
    if (key == nose.key || (key && key.is_jack)) key = null
    const {speed,radius,radius_intersect} = constructor
    const intersect = (root,spot) => constructor.intersect(lines,root,spot,key)
    const flip = key || nose.key

    const path = this.path_to(lines,spot,key)
    if (path.length < 2) return this.spot = null

    const dist = speed * dt, _radius = radius + nose.length
    if (!flip) root = nose.spot

    path.pop()
    const [target,_dist] = path.pop()

    if (path.length == 0) {
      if (
        _dist == _radius ||
        (_dist > _radius ?_radius + dist >= _dist : _radius - dist <= dist)
      ) {
        if (
          _dist > _radius ?
          intersect(root,spot) :
          intersect(spot,root.sub(spot).mul(_radius/_dist).sum(spot))
        ) {
          return this.spot = null
        }

        if (flip) {
          this.long = spot.sub(root)
          this.root = spot.sub(this.long.strip(_radius))
        }
        else this.long = root.sub(this.root = spot)

        if (nose.key && lock && !key && lock.is_slot == !nose.key.is_open) {
          lock.key = nose.key
        }
        else if (key && !nose.key) nose.key = key
        else if (lock) {
          this.lock = lock
          this.editor = null
        }
        this.spot = null
        return
      }
      else if (_dist > _radius) {
        long = spot.sub(root).mul((_radius + dist)/_dist).sum(root)

        if (intersect(root,long)) {
          return this.spot = null
        }

        if (flip) {
          this.long = spot.sub(root)
          this.root = this.long.strip(dist).sum(root)
        }
        else this.long = root.sub(this.root = long)
      }
      else {
        long = spot.sub(root).mul(_radius/_dist).sum(root)
        root = root.sub(spot).mul(dist/_dist).sum(root)

        if (intersect(long,root)) {
          return this.spot = null
        }

        if (flip) this.long = long.sub(this.root = root)
        else {
          this.long = root.sub(spot)
          this.root = this.long.strip(dist).sum(long)
        }
      }
    }
    else {
      const [next,__dist] = path.pop()

      if (_dist <= dist) {
        if (_dist == __dist) {
          if (path.length) {
            const [more,___dist] = path.pop()
            if (flip) this.long = more.sub(this.root = next)
            else {
              this.long = more.sub(next)
              this.root = this.long.strip(-_radius).sum(next)
            }
          }
          else {
            throw "TODO ERROR"
          }
        }
        else if (flip) this.long = next.sub(this.root = target)
        else {
          this.long = target.sub(next)
          this.root = this.long.strip(-_radius).sum(target)
        }
      }
      else {
        root = target.sub(root).unit.strip(dist).sum(root)

        if (_dist - dist < _radius) {
          let scale = MazeGame.Point.next_radius(_radius,root,target,next)
          if (isNaN(scale) || !isFinite(scale)) scale = 0
          long = next.sub(target).unit.strip(scale).sum(target)
        }
        else long = target

        if (flip) this.long = long.sub(this.root = root)
        else {
          this.long = root.sub(target)
          this.root = this.long.strip(-_radius).sum(root)
        }
      }
    }
  }

  __move(
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
      if (intersect(lines,root,snot,key)) {
        this._spot = null
        this.long = long
        return
      }

      const sub = spot.sub(snot).unit
      const length = nose.length + radius
      const back = lung.scale < length

      if (
        back ? // moving backwards
        intersect(lines,snot,sub.strip(dist).sum(root),key) :
        intersect(lines,root,sub.strip(dist).sum(snot),key)
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
    const _root = root.vec(scale,offset)
    const _long = long.mul(scale)
    const _radius = leg_radius * scale
    const _i_long = _long.strip(_radius).invert
    const _h_long = _long.strip(_radius / 2)

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    // if (spot) {
    //
    //   const {src:level,nose,constructor} = this
    //   const {lines} = level, {intersect} = constructor
    //
    //   const _spot = spot.vec(scale,offset)
    //   ctx.strokeStyle = thin_stroke_color
    //   ctx.lineWidth = thin_line_width * scale
    //
    //
    //   ctx.beginPath()
    //   _root.lineTo = ctx
    //
    //   if (level.portals_active) {
    //     const [root_portal,spot_portal] = level.__active_portals
    //
    //     const root_center = root_portal.center
    //     const spot_center = spot_portal.center
    //     const temp = [ [root_center,spot_center], [spot_center,root_center], ]
    //     for (const i in temp) {
    //       const [root_center,spot_center] = temp[i]
    //       if (
    //         !intersect(lines,root,root_center) &&
    //         !intersect(lines,spot_center,spot)
    //       ) {
    //         root_center.vec(scale,offset).lineTo = ctx
    //         spot_center.vec(scale,offset).lineTo = ctx
    //         break
    //       }
    //     }
    //   }
    //
    //   _spot.lineTo = ctx
    //   ctx.stroke()
    // }

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
