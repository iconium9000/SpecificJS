module.exports = Solver => class Room extends Solver.Node {
  get type() { return -1 }

  static act_at(
    level, // Level
    spot, // Point
    room, // Room,Null
  ) {
    const _room = this.get(level._rooms, spot)

    if (room) {
      room._point = spot
      return null
    }
    else if (_room) return _room
    else this.init(level,spot)
  }

  _links = {}
  _keys = {}
  _locks = {}
  _doors = {}
  _portals = {}
  _headers = {}

  static init(
    level, // Level
    point, // Point
  ) {
    const _room = super.init(level,point)
    const {_rooms} = level, {_id} = _room
    _rooms[_id] = _room
    return _room
  }
  remove() {
    const {_id,_level,_links,_keys,_locks,_doors,_portals} = this
    delete _level._rooms[_id]
    for (const i in _keys) _keys[i].remove()
    for (const i in _locks) _locks[i].remove()
    for (const i in _doors) _doors[i].remove()
    for (const i in _portals) _portals[i].remove()
    super.remove()
  }
  copy(
    level, // Level
  ) {
    const _room = super.copy(level)
    level._rooms[this._id] = _room
    return _room
  }
  read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    super.read(sLevel,level,id)
    level._rooms[id] = this
    return this
  }

  set draw(
    ctx // CanvasRenderingContext2D
  ) {
    super.draw = ctx
  }
}
