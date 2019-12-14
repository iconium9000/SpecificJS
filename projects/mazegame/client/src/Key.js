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
    level, // Level
  ) {
    const {id} = this
    super.src = level
    level.keys[id] = this
  }

  copy(
    src, // Level
  ) {
    const {id, _lock, _root, _long} = this, {keys} = src
    if (keys[id]) return keys[id]
    const _key = super.copy(src)
    if (_long) this._long = _long
    if (_lock) _key.lock = _lock.copy(src)
    else _key.root = _root
    return _key
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
