module.exports = Solver => class Key extends Solver.Node {

  get color() { return 'yellow' }
  get lineWidth() { return 3 }
  get radius() { return super.radius * 0.7 }
  get can_lock() { return true }
  get can_slot() { return false }

  static act_at(
    level, // Level
    spot, // Point
    key, // Key,Null
  ) {
    const {_keys,_rooms,_locks} = level

    if (key) {
      key._point = spot
      return null
    }

    const _key = this.get(_keys,spot)
    if (_key) return _key

    const _room = this.get(_rooms,spot)
    if (_room) return this.init(_room)

    const _lock = this.get(_locks,spot)
    if (_lock && !_lock._key) return this.init(_lock)

    return null
  }

  static init(
    parent, // Room,Lock
  ) {
    const {_level,_point} = parent
    const _key = super.init(_level,_point)
    _key._parent = parent
    if (parent._keys) parent._keys[_key._id] = _key
    else parent._key = _key
    _level._keys[_key._id] = _key
    return _key
  }
  remove() {
    const {_id,_level,_parent} = this
    if (_parent._keys) delete _parent._keys[_id]
    else _parent._key = null
    delete _level._keys[_id]
    super.remove()
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    const {color,lineWidth,_point,_parent} = this
    super.draw = ctx

    ctx.beginPath()
    _point.lineTo = ctx
    _parent._point.lineTo = ctx
    ctx.stroke()
  }
}
