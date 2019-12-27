module.exports = Solver => class Door extends Solver.Node {

  get color() { return 'red' }
  get lineWidth() { return 3 }
  get radius() { return super.radius * 0.4 }

  get is_open() {
    const {_locks} = this
    for (const i in _locks) if (!_locks[i]._is_open) return false
    return true
  }

  static Link = class {
    constructor(
      door, // Door
      room, // Room
    ) {
      this._door = door
      this._room = room
    }

    remove() {
      this._door.remove()
    }
  }

  static act_at(
    level, // Level
    spot, // Point
    door, // Door,Null
  ) {
    const {_doors,_rooms} = level

    if (door) {
      if (door._roomB) {
        door._point = spot
        return null
      }

      const _room = this.get(_rooms, spot)
      if (!_room && door._move) {
        door._point = spot
        door._move = false
        return door
      }

      door._roomB = _room || Solver.Room.init(level, spot)
      const {_id,_roomA,_roomB} = door
      _roomA._doors[door._id] = new this.Link(door,_roomB)
      _roomB._doors[door._id] = new this.Link(door,_roomA)
      door._move = true
      return null
    }

    const _door = this.get(_doors, spot)
    if (_door) return _door

    return this.init(this.get(_rooms, spot) || Solver.Room.init(level, spot))
  }

  _locks = {}
  static init(
    room, // Room
  ) {
    const {_level,_point} = room
    const _door = super.init(_level,_point)
    const {_id} = _door, {_doors} = _level
    _doors[_id] = _door
    _door._roomA = room
    return _door
  }
  remove() {
    const {_id,_level,_locks,_roomA,_roomB} = this
    for (const i in _locks) _locks[i].remove()
    delete _level._doors[_id]
    delete _roomA._doors[_id]
    if (_roomB) delete _roomB._doors[_id]
    super.remove()
  }
  copy(
    level, // Level
  ) {
    const _door = super.copy(level)
    const {_level,_id,_roomA,_roomB,constructor} = this
    level._doors[_id] = this
    _door._roomA = constructor.copy(_level,level,_roomA._id)
    if (_roomB) _door._roomB = constructor.copy(_level,level,_roomB._id)
    return _door
  }
  serialize(
    sLevel, // sLevel
  ) {
    const _sDoor = super.serialize(sLevel), {_roomA,_roomB} = this
    _sDoor._roomA = _roomA._id
    if (_roomB) _sDoor._roomB = _roomB._id
    return _sDoor
  }
  read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    super.read(sLevel,level,id)
    const {_roomA,_roomB} = sLevel[id], {read,Link} = this.constructor
    level._doors[id] = this
    this._roomA = read(sLevel,level,_roomA)
    if (_roomB) {
      this._roomB = read(sLevel,level,_roomB)
      this._roomA._doors[id] = new Link(this,this._roomB)
      this._roomB._doors[id] = new Link(this,this._roomA)
    }
    return this
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    super.draw = ctx

    const {_point,_roomA, _roomB} = this
    ctx.beginPath()
    _roomA._point.lineTo = ctx
    _point.lineTo = ctx
    if (_roomB) _roomB._point.lineTo = ctx
    ctx.stroke()
  }

}
