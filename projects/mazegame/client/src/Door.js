module.exports = MazeGame => class Door extends MazeGame.Wall {

  static get key_bind() { return 'd' }
  static get root_round() { return 4 }
  static get long_min() { return 16 }
  static get long_round() { return 4 }
  static get short_min() { return 4 }
  static get short_max() { return 4 }
  static get short_sign() { return true }

  static get lock_names() {
    return ['root_short','root_long','spot_long','spot_short',]
  }

  get length() { return this._length }
  set length(
    length, // Number
  ) {
    const {_length,constructor}
    length = length < 0 ? 0 : length > 1 ? 1 : length
    if (_length == length) return
    this._length = length
  }

  set_lock(
    lock, // Lock,Null
    name, // String
  ) {
    const {name} = lock, {[name]:_lock} = this
    if (_lock == lock) return
    if (_lock) _lock.remove()
    if (lock) { this[name] = lock; lock.parent = this; this.reroot_lock(name) }
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
      case 'root_short':
        _lock._long = _long.strip(-length).unit
        _lock.root = _short.div(2).sum(_root)
        break
      case 'root_long':
        _lock._long = _short.strip(-length).unit
        _lock.root = _long.strip(_short.scale/2).sum(_root)
        break
      case 'spot_long':
        _lock._long = _short.strip(length)
        _lock.root = _long.strip(-_short.scale/2).sum(_spot)
        break
      case 'spot_short':
        _lock._long = _long.strip(length)
        _lock.root = _short.div(-2).sum(_spot)
        break
      default: return
    }
  }

  get src() { return super.src }
  set src(
    level, // Level
  ) {
    const {id} = this
    super.src = level
    level.doors[id] = this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const _door = super.init(src,root)
    _door.length = 0
    return _door
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.doors[id]
  }
}
