module.exports = MazeGame => class Level extends MazeGame.Type {

  _targets = {}; _editors = {}
  _locks = {}; _lasers = {}
  _walls = {}; _doors = {}; _headers = {}; _portals = {}
  _keys = {}; _jacks = {}

  get editors() { return this._editors }
  get targets() { return this._targets }
  get locks() { return this._locks }
  get lasers() { return this._lasers }
  get walls() { return this._walls }
  get doors() { return this._doors }
  get headers() { return this._headers }
  get portals() { return this._portals }
  get keys() { return this._keys }
  get jacks() { return this._jacks }

  get name() { return this._name }
  set name(
    name, // String
  ) {
    this._name = name
  }

  get_lock_key(
    spot, // Point
    flag, // Jack,Null
  ) {
    const {_locks,_keys} = this
    const closest_lock = MazeGame.Lock.get_closest(_locks, spot)
    const closest_key = (closest_lock && closest_lock.key) || (
      MazeGame.Key.get_closest(_keys, spot, flag)
    )
    return [ closest_lock, closest_key ]
  }

  get portals_active() {
    this.__active_portals = []
    const {_portals,__active_portals} = this
    for (const id in _portals) {
      if (_portals[id]._is_open) __active_portals.push(_portals[id])
    }
    return __active_portals.length == 2
  }
  get lines() {
    const {_walls} = this, lines = this.__lines = []
    for (const id in _walls) lines.push(..._walls[id].lines)
    return lines
  }

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
      if (_prev_level) {
        _serialize._prev_level = constructor.serialize(_prev_level, src)
      }
      if (_next_level) {
        _serialize._next_level = constructor.serialize(_next_level, src)
      }
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
      const {_prev_level,_next_level} = serialize[id], {constructor} = this
      this.prev_level = constructor.read(serialize, src, _prev_level)
      this.next_level = constructor.read(serialize, src, _next_level)
    }

    return this
  }


  static init(
    src, // Game,Null
  ) {
    const _level = super.init(src)
    _level._name = _level.id

    if (src) {
      const {_root_level} = src
      if (_root_level && _root_level.next_level) {
        _level.next_level = _root_level.next_level
      }
      _level.prev_level = _root_level
      src.root_level = _level
    }
    return _level
  }

  remove() {
    const {id,src,_prev_level,_next_level} = this
    if (src) {
      delete src.level[id]
      if (_prev_level) _prev_level.next_level = _next_level
      else if (_next_level) _next_level.prev_level = _prev_level
    }
    super.remove()
  }

  move(
    dt, // Number (milliseconds)
  ) {
    const {_jacks,_doors,lines} = this

    for (const id in _jacks) _jacks[id].move(dt)
    for (const id in _doors) _doors[id].move(dt)
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {_locks,_keys,_walls,lines,name,constructor} = this

    for (const id in _locks) _locks[id].draw(ctx,offset,scale)
    for (const id in _keys) _keys[id].draw(ctx,offset,scale)
    for (const id in _walls) _walls[id].draw(ctx,offset,scale)

    const {thin_line_width,thin_stroke_color} = MazeGame.Target
    ctx.lineWidth = thin_line_width * scale
    ctx.strokeStyle = thin_stroke_color

    for (const i in lines) {
      const sub = lines[i]
      ctx.beginPath()
      for (const j in sub) sub[j].mul(scale).sum(offset).lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }
  }
}
