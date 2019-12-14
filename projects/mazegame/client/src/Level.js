module.exports = MazeGame => class Level extends MazeGame.Type {

  _targets = {}; _editors = {}
  _locks = {}; _lasers = {}
  _walls = {}; _doors = {}; _portals = {}
  _keys = {}; _jacks = {}

  get targets() { return this._targets }
  get locks() { return this._locks }
  get lasers() { return this._lasers }
  get walls() { return this._walls }
  get doors() { return this._doors }
  get portals() { return this._portals }
  get keys() { return this._keys }
  get jacks() { return this._jacks }

  get prev_level() { return this._prev_level }
  set prev_level(
    prev_level, // Level,Null
  ) {
    if (prev_level == this._prev_level) return
    this._prev_level = prev_level
    if (prev_level) {
      prev_level.next_level = this
    }
  }

  get next_level() { return this._next_level }
  set next_level(
    next_level, // Level,Null
  ) {
    if (next_level == this._next_level) return
    this._next_level = next_level
    if (next_level) {
      next_level.prev_level = this
    }
  }

  get src() { return this._src }
  set src(
    src, // Game,Null
  ) {
    const {id,_src} = this
    if (_src == src) return
    this._src = src
    if (_src) delete _src.levels[id]
    if (src) src.levels[id] = this
  }

  copy(
    src, // Game,Null
  ) {
    const _level = super.copy(src)

    const {_prev_level,_next_level,constructor} = this
    if (src) {
      if (_prev_level) _level.prev_level = constructor.copy(_prev_level, src)
      if (_next_level) _level.next_level = constructor.copy(_next_level, src)
    }

    return _level
  }
  serialize(
    src, // Object,Null
  ) {
    const _serialize = super.serialize(src)

    const {_prev_level,_next_level,constructor} = this
    if (src) {
      if (_prev_level) _serialize.prev = constructor.serialize(_prev_level, src)
      if (_next_level) _serialize.next = constructor.serialize(_next_level, src)
    }

    return _serialize
  }
  read(
    serialize, // Object
    src, // Game,Null
    id, // String,Null
  ) {
    super.read(serialize, src, id)

    if (src) {
      const {prev,next} = serialize[id], constructor = this
      this.prev_level = constructor.read(serialize, src, prev)
      this.next_level = constructor.read(serialize, src, next)
    }

    return this
  }


  static init(
    src, // Game,Null
  ) {
    const _level = super.init(src)
    if (src) {
      const {root_level} = src
      if (root_level && root_level.next_level) {
        _level.next_level = root_level.next_level
      }
      _level.prev_level = root_level
      src.root_level = _level
    }
    return _level
  }

  remove() {
    const {id,src,_prev_level,_next_level} = this
    super.remove()
    if (src) {
      delete src.level[id]
      if (_prev_level) _prev_level.next_level = _next_level
      else if (_next_level) _next_level.prev_level = _prev_level
    }
  }
}
