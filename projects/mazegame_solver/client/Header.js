module.exports = Solver => class Header extends Solver.Node {

  get color() { return 'grey'}

  get is_open() {
    const {_locks} = this
    for (const i in _locks) if (!_locks[i]._is_open) return false
    return true
  }

  static act_at(
    level, // Level
    spot, // Point
    header, // Header,Null
  ) {
    if (header) {
      header._point = spot
      return null
    }
    else if (level._header) return level._header
    else this.init(level,spot)
  }

  _locks = {}
  static init(
    level, // Level
    point, // Point
  ) {
    const _header = super.init(level,point)
    level._header = _header
    return _header
  }
  remove() {
    const {_id,_level,_locks} = this
    for (const i in _locks) _locks[i].remove()
    delete _level._header
    super.remove()
  }
  copy(
    level, // Level
  ) {
    const _header = super.copy(level)
    level._header = _header
    return _header
  }
  read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    super.read(sLevel,level,id)
    level._header = this
    return this
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    super.draw = ctx
  }
}
