module.exports = MazeGame => class Lock extends MazeGame.Target {

  static get key_bind() { return 'l' }
  static get long_min() { return 3 }
  static get long_max() { return 3 }
  static get long_round() { return 3 }
  static get radius() { return 0.5 }
  static get search_radius() { return 3 * this.radius }

  static get_closest(
    locks, // Lock{}
    spot, // Point
  ) {
    let min_dist = Infinity, return_lock = null
    for (const label in locks) {
      const lock = locks[label], {search_radius} = lock.constructor
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
    if (_parent) {this._parent = null; _parent[name] = null}
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
    const {id,_root,_long,_key} = this
    if (_root && root.equals(_root)) return _root
    this._root = root
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
  set is_open(
    is_open, // Boolean
  ) {
    const {_parent,_is_open} = this
    _parent.is_open = _is_open
  }

  get key() { return this._key }
  set key(
    key, // Key,Null
  ) {
    const {_key} = this
    if (_key == key) return
    if (_key) { this._key = null; _key.lock = null }
    if (key) { this._key = key; _key.lock = this; this.is_open = key.is_open }
    else this.is_open = false
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    level.locks[id] = this
  }

  copy(
    src, // Level
  ) {
    const {id,_name,_parent,_length,_key} = this, {locks} = src
    if (locks[id]) return locks[id]
    const _lock = super.copy(src)
    _lock.parent = _parent && _parent.copy(src)
    if (_key) _lock.key = _key.copy(src)
    return _lock
  }

  static init(
    parent, // Door,Jack
    name, // String
  ) {
    if (parent[name]) return parent[name]
    const _lock = super.init(parent.src, null, parent.name + name)
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
}
