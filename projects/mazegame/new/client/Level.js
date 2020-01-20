module.exports = MazeGame => class Level extends MazeGame.Type {

  static get key_bind() { return 'b' }
  static get hittxt_round() { return 1 }

  get draw_lines() { return false }
  get draw_path() { return false }
  get draw_nodes() { return this._draw_nodes }
  set draw_nodes(
    draw_nodes // Boolean
  ) {
    this._draw_nodes = draw_nodes
  }

  static act_at(
    editor, // Editor
    spot, // Spot
  ) {
    const {src} = editor, {hittxt_round} = this
    if (src._hittxt) src._hittxt = null
    else src._hittxt = spot.round(hittxt_round)
    return true
  }

  constructor() {
    super()
    this._hit = 0; this._minhit = Infinity
    this._draw_nodes = false
    this._is_locked = true; this._root = MazeGame.Point.zero
    this._targets = {}; this._editors = {}; this._rooms = {}
    this._locks = {}; this._lasers = {}; this._slots = {}; this._buttons = {}
    this._walls = {}; this._doors = {}; this._headers = {}; this._portals = {}
    this._keys = {}; this._jacks = {}; this._nodes = {}
  }

  get hittxt() { return this._hittxt }
  get hit() { return this._hit }
  dohit() { return ++this._hit }

  get minhit() { return this._minhit }
  set minhit(
    minhit, // Number
  ) {
    this._minhit = minhit
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
  get rooms() { return this._rooms }
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
    this.__lines = []; const {__lines,_walls} = this, lines = []
    for (const id in _walls) lines.push(..._walls[id].lines)
    for (const i in lines) {
      const sub = lines[i]
      for (let j = 1; j < sub.length; ++j) __lines.push([sub[j-1],sub[j]])
    }
    return __lines
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

    const {
      _root,_is_locked,_hit,_minhit,_hittxt,
      _prev_level,_next_level,__backup,
      _scale,constructor,
    } = this
    _level._hit = _hit
    _level._minhit = _minhit
    _level._hittxt = _hittxt
    _level.root = _root
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

    _level.__backup = __backup

    return _level
  }
  serialize(
    src, // Object,Null
  ) {
    const _serialize = super.serialize(src)

    const {Type} = MazeGame
    const {root,_prev_level,_next_level,_scale,_minhit,_hittxt} = this

    _serialize._root = root.round(1).serialize()
    _serialize._scale = _scale

    _serialize._minhit = _minhit
    if (_hittxt) _serialize._hittxt = _hittxt.serialize()

    if (src) {
      if (_prev_level) _serialize._prev_level = Type.serialize(_prev_level, src)
      if (_next_level) _serialize._next_level = Type.serialize(_next_level, src)
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
    const {Point,Type} = MazeGame

    super.read(serialize, src, id)
    if (src) serialize = serialize[id]

    const {_root,_scale,_hit,_minhit,_hittxt} = serialize
    if (_root) this.root = Point.read(_root)

    this.scale = _scale
    this._minhit = _minhit || Infinity
    if (_hittxt) this._hittxt = Point.read(_hittxt)

    const {_prev_level,_next_level} = serialize
    if (src) {
      this.prev_level = Type.read(serialize, src, _prev_level)
      this.next_level = Type.read(serialize, src, _next_level)
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
    const {
      lines,_nodes,_rooms,_locks,_keys,_walls,_doors,name,
      _hit,_minhit,_hittxt,constructor
    } = this
    const {
      thin_line_width,thin_stroke_color,stroke_color,font_scale,
    } = constructor

    for (const id in _rooms) _rooms[id].draw(ctx,offset,scale)

    if (this.draw_nodes) {
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

    if (this.draw_path)
    {
      ctx.lineWidth = thin_line_width * scale
      ctx.strokeStyle = 'black'
      const {__path} = this
      ctx.beginPath()
      for (const i in __path) __path[i][0].vec(scale,offset).lineTo = ctx
      ctx.stroke()
    }

    for (const id in _locks) _locks[id].draw(ctx,offset,scale)
    for (const id in _keys) _keys[id].draw(ctx,offset,scale)
    for (const id in _walls) _walls[id].draw(ctx,offset,scale)

    if (_hittxt) {
      ctx.font = `${font_scale * scale}px Arial`
      ctx.textAlign = 'left'
      ctx.fillStyle = stroke_color
      const {x,y} = _hittxt.vec(scale,offset)

      const f = _minhit < _hit ? '<' : _minhit > _hit ? '>' : '='
      let txt = `Hit: ${_minhit}${f}${_hit}`
      ctx.fillText(txt, x, y)
    }

    if (this.draw_rooms) {
      for (const id in _rooms) _rooms[id]._draw(ctx,offset,scale)
    }

    if (this.draw_lines) {
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
