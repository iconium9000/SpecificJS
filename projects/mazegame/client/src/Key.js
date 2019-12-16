module.exports = MazeGame => class Key extends MazeGame.Target {

  static get key_bind() { return 'k' }
  static get radius() { return 1.5 }
  static get center_radius() { return MazeGame.Lock.radius }
  static get search_radius() { return this.radius * 2 }

  static act_at(
    editor, // MazeGame.Editor
    spot, // MazeGame.Point (in gamespace)
  ) {
    const level = editor.src
    const closest_lock = MazeGame.Lock.get_closest(level.locks, spot)

    const closest_key = (
      (closest_lock && closest_lock.key) ||
      this.get_closest(level.keys, spot)
    )
    if (closest_key && closest_key != editor.target) {
      editor.target = closest_key
      closest_key.lock = null
      return true
    }
    else if (editor.target) {
      const key = editor.target
      editor.target = null
      if (closest_lock && !closest_lock.is_parent(key)){
         closest_lock.key = key
      }
      else key.root = spot
      return true
    }
    else {
      const _key = this.init(level, closest_lock, spot)
      return true
    }
  }

  static get_closest(
    keys, // MazeGame.Key{}
    spot, // MazeGame.Point
  ) {
    let min_dist = Infinity, return_key = null
    for (const label in keys) {
      const key = keys[label], {search_radius} = key.constructor
      const _dist = key.root.sub(spot).length
      if (_dist < min_dist && _dist < search_radius) {
        return_key = key
        min_dist = _dist
      }
    }
    return return_key
  }

  get is_open () { return super.is_open }
  set is_open(
    is_open, // Boolean
  ) {
    super.is_open = is_open
    const {_lock} = this
    if (_lock) _lock.is_open = is_open
  }

  get lock() { return this._lock }
  set lock(
    lock, // Lock,Null
  ) {
    const {_lock} = this
    if (_lock == lock) return
    if (_lock) { this._lock = null; _lock.key = null }
    if (lock) { this._lock = lock; this.root = lock.spot; lock.key = this }
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.keys[id] = this
  }

  copy(
    src, // Level
  ) {
    const _key = super.copy(src)

    const {_root,_lock,constructor} = this

    if (_lock) _key.lock = constructor.copy(_lock, src)
    else _key._root = _root

    return _key
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_root,_lock,constructor} = this

    if (_lock) _serialize._lock = constructor.serialize(_lock, src)
    else _serialize._root = _root.serialize()

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_root,_lock} = serialize[id], {constructor} = this
    if (_lock) this.lock = constructor.read(serialize, src, _lock)
    else this._root = constructor.read(_root)

    return this
  }

  static init(
    src, // Level
    lock, // Lock,Null
    root, // Null,Point
  ) {
    const _key = super.init(src)
    _key._is_open = true
    if (lock) _key.lock = lock
    else _key.root = root
    return _key
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.keys[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,is_open,constructor} = this, {pi2} = MazeGame.Lib
    const {
      stroke_color,fill_color,line_width,
      radius,center_radius,
    } = constructor
    const _root = root.mul(scale).sum(offset)
    const _radius = radius * scale
    const _center_radius = center_radius * scale

    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = stroke_color
    ctx.fillStyle = fill_color
    ctx.lineWidth = line_width * scale

    ctx.beginPath()
    ctx.arc(_root.x, _root.y, _radius, 0, pi2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    if (is_open) {
      ctx.fillStyle = stroke_color
      ctx.beginPath()
      ctx.arc(_root.x, _root.y, _center_radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
    }
    else {
      ctx.beginPath()
      ctx.lineTo(_root.x+_center_radius, _root.y+_center_radius)
      ctx.lineTo(_root.x-_center_radius, _root.y-_center_radius)
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineTo(_root.x-_center_radius, _root.y+_center_radius)
      ctx.lineTo(_root.x+_center_radius, _root.y-_center_radius)
      ctx.closePath()
      ctx.stroke()
    }
  }
}
