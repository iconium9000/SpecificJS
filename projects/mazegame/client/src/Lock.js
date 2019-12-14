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

    const {_root,_long,_parent,_key,constructor} = this

    _serialize.root = _root.serialize()
    _serialize.long = _long.serialize()
    _serialize.parent = constructor.serialize(_parent, src)
    if (_key) _serialize.key = constructor.serialize(_key, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, id, src)

    const {root,long,parent,key} = serialize[id], {constructor} = this
    this._root = constructor.read(root)
    this._long = constructor.read(long)
    this._length = _long.s
    this.parent = constructor.read(serialize, src, parent)
    if (key) this.key = constructor.read(serialize, src, key)

    return this
  }

  static init(
    parent, // Door,Jack
    name, // String
  ) {
    if (parent[name]) return parent[name]
    const _lock = super.init(parent.src, parent.name + name)
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
}
