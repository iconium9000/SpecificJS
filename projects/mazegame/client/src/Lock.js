module.exports = MazeGame => class Lock extends MazeGame.Target {

  static get key_bind() { return 'l' }
  static get long_min() { return 3 }
  static get long_max() { return 3 }
  static get long_round() { return 1 }
  static get radius() { return 0.5 }
  static get search_radius() { return 3 * this.radius }

  static act_at(
    editor, // Editor
    spot, // Point (in gamespace)
  ) {
    const level = editor.src

    if (editor.target) {
      const lock = editor.target, {_root,_long} = lock
      editor.target = null
      lock.length = spot.sub(_root).dot(_long.strip(1))
      return true
    }

    const closest_lock = this.get_closest(level.locks, spot)
    if (closest_lock) {
      editor.target = closest_lock
      return true
    }

    const closest_door = MazeGame.Door.get_closest(level.doors, spot)
    if (closest_door) {
      const {lock_names} = closest_door.constructor
      const lock_name = lock_names[
        Math.floor(closest_door.__long_dot * lock_names.length)
      ]
      if (!lock_name) return false
      else if (closest_door[lock_name]) {
        editor.target = closest_door[lock_name]
        return true
      }

      const _lock = this.init(closest_door, lock_name)
      if (this.long_max > this.long_min) editor.target = _lock
      return true
    }
  }

  static get_closest(
    locks, // Lock{}
    spot, // Point
    flag, // Jack,Null
  ) {
    let min_dist = Infinity, return_lock = null
    for (const label in locks) {
      const lock = locks[label]
      if (flag && lock.is_parent(flag)) continue

      const {search_radius} = lock.constructor
      const _dist = lock.spot.sub(spot).length
      if (_dist < min_dist && _dist < search_radius) {
        return_lock = lock
        min_dist = _dist
      }
    }
    return return_lock
  }

  get parent() { return this._parent }
  set parent(
    parent, // Door,Jack,Null
  ) {
    const {_parent,name} = this
    if (_parent == parent) return
    if (_parent) { this._parent = null; _parent.set_lock(null, name) }
    if (parent) { this._parent = parent; parent.set_lock(this, name) }
  }
  is_parent(
    target, // Target
  ) {
    const {_parent} = this
    return super.is_parent(target) || (_parent && _parent.is_parent(target))
  }

  get length() { return this._length }
  set length(
    length, // Number
  ) {
    const {_id,state,_long,_length,constructor} = this
    const {long_min,long_max,long_round} = constructor
    length = (
      length<long_min ? long_min :
      length<long_max ? Math.round(length/long_round)*long_round :
      long_max
    )
    if (_length == length) return
    this._length = length
    if (_long) this.long = _long
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    super.root = root

    const {_root,_key} = this
    if (_root != root) return
    if (_key) _key.root = this.spot
  }

  get long() { return this._long }
  set long(
    long, // Point
  ) {
    const {id,_long} = this
    const {_id,state,_root,_length,_key} = this
    this._long = long.unit.strip(_length)
    if (_key) _key.root = this.spot
  }

  get spot() { return this._root.sum(this._long) }

  get is_open() {
    const {_key} = this
    return _key ? _key.is_open : false
  }
  set is_open(_) {
    const {_parent,is_open} = this
    _parent.is_open = is_open
  }

  get key() { return this._key }
  set key(
    key, // Key,Null
  ) {
    const {_key} = this
    if (_key == key) return
    if (_key) { this._key = null; _key.lock = null }
    if (key) { this._key = key; key.lock = this; this.is_open = key.is_open }
    else this.is_open = false
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.locks[id] = this
  }

  copy(
    src, // Level
  ) {
    const _lock = super.copy(src)

    const {_parent,_length,_root,_long,_key,constructor} = this

    _lock._length = _length
    _lock._long = _long
    _lock._root = _root
    _lock.parent = constructor.copy(_parent, src)

    if (_key) _lock.key = constructor.copy(_key, src)

    return _lock
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_length,_parent,_key,constructor} = this

    _serialize._length = _length
    _serialize._parent = constructor.serialize(_parent, src)
    if (_key) _serialize._key = constructor.serialize(_key, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_length,_parent,_key} = serialize[id], {constructor} = this
    this._length = _length
    this.parent = constructor.read(serialize, src, _parent)
    if (_key) this.key = constructor.read(serialize, src, _key)

    return this
  }

  static init(
    parent, // Door,Jack
    name, // String
  ) {
    if (parent[name]) return parent[name]
    const _lock = super.init(parent.src, parent.id + name)
    _lock._name = name
    _lock._length = this.long_min
    parent.set_lock(_lock, name)
    return _lock
  }

  remove() {
    const {id,src,_key} = this
    if (_key) _key.remove()
    this.parent = null
    super.remove()
    delete src.locks[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,spot,constructor} = this, {pi2} = MazeGame.Lib
    const {
      stroke_color,fill_color,line_width,
      radius,
    } = constructor
    const _root = root.mul(scale).sum(offset)
    const _spot = spot.mul(scale).sum(offset)
    const _radius = radius * scale

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = stroke_color
    ctx.lineWidth = line_width * scale

    ctx.beginPath()
    _root.lineTo = ctx
    _spot.lineTo = ctx
    ctx.closePath()
    ctx.stroke()

    ctx.fillStyle = stroke_color
    ctx.beginPath()
    ctx.arc(_root.x, _root.y, _radius, 0, pi2)
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
