module.exports = Solver => class Portal extends Solver.Node {

  get color() { return 'fuchsia' }
  get lineWidth() { return 3 }

  get is_open() {
    const {_locks} = this
    for (const i in _locks) if (!_locks[i]._is_open) return false
    return true
  }

  static act_at(
    level, // Level
    spot, // Point
    portal, // Key,Null
  ) {
    const {_portals,_rooms} = level

    if (portal) {
      portal._point = spot
      return null
    }

    const _portal = this.get(_portals,spot)
    if (_portal) return _portal

    const _room = this.get(_rooms,spot)
    if (_room) return this.init(_room)

    return null
  }

  _locks = {}
  static init(
    parent, // Room
  ) {
    const {_level,_point} = parent
    const _portal = super.init(_level,_point)
    _level._portals[_portal._id] = _portal
    _portal._parent = parent
    parent._portals[_portal._id] = _portal
    return _portal
  }
  remove() {
    const {_id,_locks,_parent,_level} = this
    for (const i in _locks) _locks[i].remove()
    delete _level._portals[_id]
    delete _parent._portals[_id]
    super.remove()
  }
  copy(
    level, // Level
  ) {
    const _portal = super.copy(level)
    const {_id,_level,_parent,constructor} = this
    _portal._parent = constructor.copy(_level,level,_parent._id)
    _portal._parent._portals[_id] = _portal
    return _portal
  }
  serialize(
    sLevel, // sLevel
  ) {
    const _sPortal = super.serialize(sLevel), {_parent} = this
    _sPortal._parent = _parent._id
    return _sPortal
  }
  read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    super.read(sLevel,level,id)
    const {_parent} = sLevel[id], {read} = this.constructor
    level._portals[id] = this
    this._parent = read(sLevel,level,_parent)
    this._parent._portals[id] = this
    return this
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    const {_parent,_point} = this
    super.draw = ctx

    ctx.beginPath()
    _parent._point.lineTo = ctx
    _point.lineTo = ctx
    ctx.stroke()
  }

}
