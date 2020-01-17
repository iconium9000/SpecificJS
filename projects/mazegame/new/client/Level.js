module.exports = MazeGame => class Level extends MazeGame.Type {

  get draw_lines() { return false }
  get draw_nodes() { return this._draw_nodes }
  set draw_nodes(
    draw_nodes // Boolean
  ) {
    this._draw_nodes = draw_nodes
  }

  constructor() {
    super()
    this._draw_nodes = false
    this._is_locked = true; this._root = MazeGame.Point.zero
    this._targets = {}; this._editors = {}
    this._locks = {}; this._lasers = {}; this._slots = {}; this._buttons = {}
    this._walls = {}; this._doors = {}; this._headers = {}; this._portals = {}
    this._keys = {}; this._jacks = {}; this._nodes = {}
  }

  get is_locked() { return this._is_locked }
  set is_locked(
    is_locked // Boolean
  ) {
    this._is_locked = !!is_locked
  }

  get header() {
    const {_headers} = this
    for (const i in _headers) {
      return _headers[i]
    }
    return null
  }

  get editors() { return this._editors }
  get targets() { return this._targets }
  get locks() { return this._locks }
  get lasers() { return this._lasers }
  get slots() { return this._slots }
  get buttons() { return this._buttons }
  get walls() { return this._walls }
  get doors() { return this._doors }
  get headers() { return this._headers }
  get portals() { return this._portals }
  get keys() { return this._keys }
  get jacks() { return this._jacks }
  get nodes() { return this._nodes }

  get scale() { return this._scale }
  set scale(
    scale // Number
  ) {
    const {_scale,constructor} = this
    if (scale > 0) this._scale = scale
    else if (_scale > 0);
    else this._scale = constructor.scale
  }

  set root(
    root // Point
  ) {
    this._root = root
  }
  get root() { return this._root || MazeGame.Point.zero }

  get name() { return this._name }
  set name(
    name // String
  ) {
    this._name = name
  }

  get_lock_key(
    spot, // Point
  ) {
    const {_locks,_keys} = this
    const closest_lock = MazeGame.Lock.get_closest(_locks, spot)
    const closest_key = (closest_lock && closest_lock.key) || (
      MazeGame.Key.get_closest(_keys, spot)
    )
    return [ closest_lock, closest_key ]
  }

  get portals_active() {
    this.__active_portals = []
    const {_portals,__active_portals} = this
    for (const id in _portals) {
      if (_portals[id]._is_open) __active_portals.push(_portals[id])
    }

    if (__active_portals.length == 2) return true
    this.__active_portals = []
    return false
  }
  get lines() {
    const {_walls} = this, lines = this.__lines = []
    for (const id in _walls) lines.push(..._walls[id].lines)
    return lines
  }

  get prev_level() { return this._prev_level }
  set prev_level(
    prev_level // Level,Null
  ) {
    if (prev_level == this._prev_level || typeof prev_level != 'object') return
    this._prev_level = prev_level
    if (prev_level) {
      prev_level.next_level = this
    }
  }

  get next_level() { return this._next_level }
  set next_level(
    next_level // Level,Null
  ) {
    if (next_level == this._next_level || typeof next_level != 'object') return
    this._next_level = next_level
    if (next_level) {
      next_level.prev_level = this
    }
  }

  get src() { return super.src }
  set src(
    src // Game,Null
  ) {
    const {id} = this
    super.src = src
    if (src) src.levels[id] = this
  }

  copy(
    src, // Game,Null
  ) {
    const _level = super.copy(src)

    const {root,_is_locked,_prev_level,_next_level,_scale,constructor} = this
    _level.root = root
    _level.is_locked = _is_locked
    _level._scale = _scale > 0 ? _scale : constructor.scale
    _level.__path = this.__path && this.__path.slice()

    if (src) {
      if (_prev_level) _level.prev_level = constructor.copy(_prev_level, src)
      if (_next_level) _level.next_level = constructor.copy(_next_level, src)
    }
    else {
      _level._prev_level = !!_prev_level
      _level._next_level = !!_next_level
    }

    return _level
  }
  serialize(
    src, // Object,Null
  ) {
    const _serialize = super.serialize(src)

    const {root,_prev_level,_next_level,__points,_scale,constructor} = this
    _serialize._root = root.round(1).serialize(__points)
    _serialize._scale = _scale

    if (src) {
      if (_prev_level) {
        _serialize._prev_level = constructor.serialize(_prev_level, src)
      }
      if (_next_level) {
        _serialize._next_level = constructor.serialize(_next_level, src)
      }
    }
    else {
      _serialize._prev_level = !!_prev_level
      _serialize._next_level = !!_next_level
    }

    return _serialize
  }
  read(
    serialize, // Object
    src, // Game,Null
    id, // String,Null
  ) {
    if (src && src.__points) this.__points = src.__points

    super.read(serialize, src, id)
    if (src) serialize = serialize[id]

    const {_root,_scale} = serialize, {constructor,__points} = this
    if (_root) this.root = MazeGame.Point.read(_root,__points)
    this.scale = _scale


    const {_prev_level,_next_level} = serialize
    if (src) {
      this.prev_level = constructor.read(serialize, src, _prev_level)
      this.next_level = constructor.read(serialize, src, _next_level)
    }
    else {
      serialize._prev_level = _prev_level
      serialize._next_level = _next_level
    }

    this.__backup = this.copy()

    return this
  }


  static init(
    src, // Game,Null
  ) {
    const _level = super.init(src)
    _level._name = _level.id
    _level._scale = this.scale

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

  remove_editors() {
    const {_editors} = this
    for (const id in _editors) _editors[id].remove()
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
    const {lines,_nodes,_locks,_keys,_walls,name,draw_lines,draw_nodes} = this
    const {thin_line_width,thin_stroke_color} = this.constructor

    if (draw_nodes) {
      const _targets = []
      for (const id in this) {
        if (this[id] && this[id].is_node) _targets.push(this[id])
      }

      ctx.lineWidth = thin_line_width * scale
      ctx.strokeStyle = thin_stroke_color
      const {length} = _targets
      for (let i = 0; i < length; ++i) {
        const root_i = _targets[i].center
        const _root_i = root_i.vec(scale,offset)
        for (let j = i+1; j < length; ++j) {
          const root_j = _targets[j].center

          if (!this.constructor.intersect(lines,root_i,root_j)) {
            const _root_j = root_j.vec(scale,offset)
            ctx.beginPath()
            _root_i.lineTo = ctx
            _root_j.lineTo = ctx
            ctx.stroke()
          }
        }
      }


      for (const id in _nodes) _nodes[id].draw(ctx,offset,scale)
    }

    // ctx.lineWidth = thin_line_width * scale
    // ctx.strokeStyle = 'black'
    // const {__path} = this
    // ctx.beginPath()
    // for (const i in __path) __path[i][0].vec(scale,offset).lineTo = ctx
    // ctx.stroke()

    for (const id in _locks) _locks[id].draw(ctx,offset,scale)
    for (const id in _keys) _keys[id].draw(ctx,offset,scale)
    for (const id in _walls) _walls[id].draw(ctx,offset,scale)

    if (draw_lines) {
      const {thin_line_width,thin_stroke_color} = MazeGame.Target
      ctx.lineWidth = thin_line_width * scale
      ctx.strokeStyle = thin_stroke_color

      for (const i in lines) {
        const sub = lines[i]
        ctx.beginPath()
        for (const j in sub) sub[j].vec(scale,offset).lineTo = ctx
        ctx.closePath()
        ctx.stroke()
      }
    }
  }
}
