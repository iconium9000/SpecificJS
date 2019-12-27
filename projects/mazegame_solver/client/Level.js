module.exports = Solver => class Level {

  _nodes = {}
  _rooms = {}
  _doors = {}
  _locks = {}
  _portals = {}
  _keys = {}

  get _headers() { return {[this._header._id]: this._header} }

  get is_open() {
    const {_locks,_doors,_portals,_header} = this
    for (const i in _locks) _locks[i]._is_open = _locks[i].is_open
    for (const i in _doors) _doors[i]._is_open = _doors[i].is_open

    const portals = []
    for (const i in _portals) {
      const _portal = _portals[i]
      if (_portal._is_open = _portal.is_open) portals.push(_portal)
    }
    if (portals.length != 2) {
      for (const i in portals) portals[i]._is_open = false
    }

    return _header ? _header.is_open : false
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    const {_nodes} = this
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const i in _nodes) _nodes[i].draw = ctx
  }

  get copy() {
    const _level = new this.constructor, {copy} = Solver.Node
    for (const id in this._nodes) copy(this,_level,id)
    return _level
  }
  get serialize() {
    const _sLevel = {}, {_nodes} = this
    for (const id in _nodes) _nodes[id].serialize(_sLevel)
    return _sLevel
  }
  read(
    sLevel, // sLevel
  ) {
    const {read} = Solver.Node
    for (const id in sLevel) read(sLevel,this,id)
    return this
  }

  solve(
    count, // Number
  ) {
    if (!this._header) return null
    return new Solver.Fast(this,count)
  }
}
