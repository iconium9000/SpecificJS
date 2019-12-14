module.exports = MazeGame => class Wall extends MazeGame.Target {

  static get key_bind() { return 'w' }
  static get root_round() { return 2 }
  static get long_round() { return 2 }
  static get long_min() { return 2 }
  static get long_max() { return Infinity }
  static get short_min() { return 2 }
  static get short_max() { return 2 }
  static get default_length() { return 0 }
  static get short_sign() { return false }
  static get is_portal() { return false }

  static get_closest(
    walls, // Wall{}
    spot, // Point
  ) {
    let min_dist = Infinity, return_wall = null
    for (const label in walls) {
      const wall = walls[label], {root,long,short,constructor} = wall
      const {short_sign} = constructor, _sub = spot.sub(root)

      wall.__long_dot = long.strip(1).dot(_sub) / long.scale
      let _short_dot = short.strip(1).dot(_sub)
      if (!short_sign && _short_dot < 0) _short_dot = -_short_dot

      if (
        0 < wall.__long_dot && wall.__long_dot < 1 &&
        0 < _short_dot && _short_dot < short.scale && _short_dot < min_dist
      ) {
        return_wall = wall
        min_dist = _short_dot
      }
    }
    return return_wall
  }

  reroot_locks() {}

  get spot() { return this._spot }

  get short() { return this._short }
  get long() { return this._long }
  set long(
    long, // Point
  ) {
    const {_root, constructor} = this
    const {
      short_min,short_max,short_round,
      long_min,long_max,long_round,
      short_sign,
    } = constructor

    this._long = long.long.cramp(long_min,long_max,long_round)
    this._short = long.short.cramp(short_min,short_max,short_round)

    this._spot = _root.sum(this._long)
    if (short_sign) this._spot = this._spot.sum(this._short)
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    const {short_sign,root_round} = this.constructor
    super.root = root = root.round(this.constructor.root_round)

    const {_root,_long,_short} = this
    if (_root != root) return

    this._spot = root.sum(_long)
    if (short_sign) this._spot = this._spot.sum(_short)
  }


  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    level.walls[id] = this
  }

  copy(
    src, // Level
  ) {
    const _wall = super.copy(src)

    const {_root,_long,_short,_spot,constructor} = this

    _wall._root = _root
    _wall._long = _long
    _wall._short = _short
    _wall._spot = _spot

    return _wall
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_root,_long,_short,constructor} = this
    _serialize.root = constructor.serialize(_root)
    _serialize.long = constructor.serialize(_long.sum(_short))

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, id, src)

    const {root,long} = serialize[id], {constructor} = this
    this._root = constructor.read(root)
    this.long = constructor.read(long)

    return this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const {long_min,short_min} = this
    const _wall = super.init(src)
    _wall._long = Point.init(1,0,long_min)
    _wall._short = Point.init(0,1,short_min)
    _wall.root = root
    return _wall
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.walls[id]
  }
}
