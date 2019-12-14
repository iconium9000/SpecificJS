module.exports = MazeGame => class Key extends MazeGame.Target {

  static get key_bind() { return 'k' }
  static get radius() { return 1.5 }
  static get center_radius() { return MazeGame.Lock.radius }
  static get search_radius() { return this.radius * 2 }

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

    if (_lock) _serialize.lock = constructor.serialize(_lock, src)
    else _serialize.root = _root.serialize()

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, id, src)

    const {root,lock} = serialize[id], {constructor} = this
    if (lock) this.lock = constructor.read(serialize, src, lock)
    else this._root = constructor.read(root)

    return this
  }

  static init(
    src, // Level
    lock, // Lock,Null
    root, // Null,Point
  ) {
    const _key = super.init(src)
    if (lock) _key.lock = lock
    else _key.root = root
    return _key
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.keys[id]
  }
}
