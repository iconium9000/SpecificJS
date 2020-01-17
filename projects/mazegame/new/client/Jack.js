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
    const [path,con,out,pout,opout] = [[],{},{},{},[1,0]]
    const [nidx,ridx,didx,pidx,] = [0,1,2,3]
    let [min,win,sin] = [[this,center,0],null,null]
    const intersect = (root,spot) => constructor.intersect(lines,root,spot,key)
    const _radius = radius + nose.length

    out[_id] = [src[_id],center,spot.dist(center)]

    for (const i in __active_portals) {
      const portal = __active_portals[i], {center} = portal
      pout[i] = [portal,center,spot.dist(center)]
    }

    for (const id in src) {
      if (src[id] && src[id].is_node) {
        const {center} = src[id]
        const _depth = spot.dist(center)
        out[id] = [src[id],center,_depth]
      }
    }

    const add_out = min => {
      const [node,root,depth] = min
      for (const id in out) {
        const [target,center,__depth] = out[id]
        const _depth = depth + center.dist(root)
        if ((!con[id] || con[id][didx] > _depth) && !intersect(root,center)) {
          con[id] = [target,center,_depth,min]
        }
      }
    }

    do {
      const [node,root,depth] = min, {id} = node
      const __depth = out[id][didx]
      const _depth = depth + __depth; delete out[id]; delete con[id]

      if (!sin || sin[didx] > __depth) {
        sin = [null,spot,__depth,min]
      }
      if ((!win || win[didx] > _depth) && !intersect(root,spot)) {
        win = [null,spot,_depth,min]
      }

      add_out(min)

      for (const i in pout) {
        const [portal,center] = pout[i]
        const _depth = depth + root.dist(center)
        const _min = [portal,center,_depth,min]
        if (!intersect(root,center)) {
          const [portal,center] = pout[opout[i]]
          add_out([portal,center,_depth,_min])
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

  flip(lock,key) {
    const _key = this.nose.key
    if (key == _key || (key && key.is_jack)) key = null
    return key || (_key && (!lock || !lock.is_slot != !_key.is_open))
  }

  get center() {
    const {root,spot,nose,src} = this
    if (!spot) return root
    const [lock,key] = src.get_lock_key(spot)
    // return (key && !key.is_jack) || nose.key ? nose.spot : root
    return this.flip(lock,key) ? nose.spot : root
  }
  move(
    dt, // Number (milliseconds)
  ) {
    let {root,spot,long} = this
    if (!spot) return

    const {src,nose,constructor} = this, {lines} = src
    let snot = nose.spot, [lock,key] = src.get_lock_key(spot)
    if (key == nose.key || (key && key.is_jack)) key = null
    const {speed,radius,radius_intersect} = constructor
    const intersect = (root,spot) => constructor.intersect(lines,root,spot,key)
    const flip = this.flip(lock,key)

    const path = this.path_to(lines,spot,key)
    if (path.length < 2) return this.spot = null

    const dist = speed * dt, _radius = radius + nose.length
    if (flip) {
      root = snot
      snot = this.root
    }

    path.pop()
    const [target,_dist] = path.pop()

    const path_length = path.length == 0
    if (dist < _dist) {
      long = target.sub(root).unit.strip(dist).sum(root)
    }
    else if (path_length) long = target
    else {
      const [next,__dist] = path.pop()
      if (_dist == __dist && path.length != 0) {
        const [nextB,___dist] = path.pop()
        if (flip) {
          this.long = nextB.sub(next)
          this.root = next
        }
        else {
          this.long = next.sub(nextB)
          this.root = this.long.strip(-_radius).sum(next)
        }
        return
      }
      else long = target
    }

    if (intersect(root,long)) {
      this.spot = null
      return
    }
    else root = long

    // if (false)
    {
      const {radius} = MazeGame[flip ? 'Key' : 'Lock']
      snot = snot.sub(root).ustrip(_radius).sum(root)

      const intersect = (a,b) => {
        return MazeGame.Point.radius_intersect(radius,root,snot,a,b)
      }

      const _lines = []
      for (const i in lines) {
        const sub = lines[i]
        for (let j = 1; j < sub.length; ++j) {
          _lines.push([sub[j-1],sub[j]])
        }
      }

      const a = root, queue = [snot]
      for (let i = 0; i < queue.length && i < 4; ++i) {
        snot = queue[i]; const b = snot
        for (const j in _lines) {
          const [c,d] = _lines[j]
          if (intersect(c,d)) {
            const [p,q] = [d.sub(c),b.sub(a)]
            const s = a.sub(c), j1 = p.square
            const g = s.sub(p.mul(s.dot(p)/j1)).ustrip(radius+1e-8).sub(s)
            const j2 = g.dot(p) / j1, j3 = (g.square - q.square) / j1

            let u, u0 = Infinity, j4 = j2*j2 - j3
            if (j4 < 0) continue
            if (j4 == 0) u = -j2
            else {
              j4 = Math.sqrt(j4)
              const w = b.sub(c).dot(p) / j1, u1 = j4 - j2, u2 = -j4 - j2
              u = Math.abs(u2-w) > Math.abs(u1-w) ? u1 : u2
              u0 = u1 == u ? u2 : u1
            }

            const snot2 = p.vec(u,g).sum(a)
            let flag = true
            for (const k in queue) if (queue[k].dist(snot2) <= 1e-7) {
              flag = false
              break
            }
            if (flag) {
              // log(queue.length)
              if (queue.length < 2) queue.push(snot2)
              else if (queue.length == 2) {
                const [snot0,snot1] = queue
                // if (isFinite(u0)) queue.push(p.vec(u0,g).sum(a))
                // else
                queue.push(
                  snot1.sub(a).sum(snot2).sub(a).ustrip(-radius).sum(a)
                )
              }
              else snot = queue[0]
            }
          }
        }
      }
    }

    if (flip) {
      this.long = root.sub(snot)
      this.root = this.long.strip(-_radius).sum(root)
    }
    else this.long = snot.sub(this.root = root)

    if (path_length && dist >= _dist) {
      if (nose.key && lock && !key && lock.is_slot == !nose.key.is_open) {
        lock.key = nose.key
      }
      else if (key && !nose.key) nose.key = key
      else if (lock) {
        this.lock = lock
        this.editor = null
      }
      this.spot = null
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
