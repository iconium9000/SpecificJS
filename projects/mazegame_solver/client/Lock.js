module.exports = Solver => class Lock extends Solver.Node {

  get color() { return 'green' }
  get lineWidth() { return 2 }
  get radius() { return super.radius * 0.5 }

  get is_open() {
    const {_key} = this
    return _key ? _key.can_lock : false
  }

  static act_at(
    level, // Level
    spot, // Point
    lock, // Lock,Null
  ) {
    const {_locks,_rooms,_doors,_header,_portals} = level

    if (lock) {
      if (lock._room) {
        lock._point = spot
        return null
      }

      const _room = this.get(_rooms, spot)
      if (!_room && lock._move) {
        lock._point = spot
        lock._move = false
        return lock
      }

      lock._room = _room || Solver.Room.init(level,spot)
      lock._room._locks[lock._id] = lock
      lock._move = true
      return null
    }

    const _lock = this.get(_locks,spot)
    if (_lock) return _lock

    if (_header && _header._point.sub(spot).length < this.radius) {
      return this.init(_header)
    }

    const _parent = this.get(_doors,spot) || this.get(_portals,spot)
    if (_parent) return this.init(_parent)

    return null
  }

  static init(
    parent, // Door,Portal,Header
  ) {
    const {_level,_point} = parent
    const _lock = super.init(_level,_point)
    _lock._parent = parent
    parent._locks[_lock._id] = _lock
    _level._locks[_lock._id] = _lock
    return _lock
  }
  remove() {
    const {_id,_level,_parent,_room,_key} = this
    if (_key) _key.remove()
    delete _parent._locks[_id]
    if (_room) delete _room._locks[_id]
    delete _level._locks[_id]
    super.remove()
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    const {_point,_parent,_room,color,lineWidth} = this
    super.draw = ctx

    ctx.beginPath()
    _parent._point.lineTo = ctx
    _point.lineTo = ctx
    if (_room) _room._point.lineTo = ctx
    ctx.stroke()
  }
}
