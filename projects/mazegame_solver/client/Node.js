module.exports = Solver => class Node {

  get color() { return 'white' }
  get lineWidth() { return 4 }
  static get radius() { return 15 }
  get radius() { return 15 }

  static get(
    nodes, // Node[],Node{}
    spot, // Point
  ) {
    for (const i in nodes) {
      if (nodes[i]._point.sub(spot).length < this.radius) return nodes[i]
    }
    return null
  }

  static act_at(
    level, // Level
    spot, // Point
    node, // Node,Null
  ) {
    const _node = this.get(level._nodes, spot)
    if (_node) {
      if (node == _node) return null
      else return _node
    }
    else {
      if (node) node._point = spot
      return node
    }
  }

  static init(
    level, // Level
    point, // Point
  ) {
    const _node = new this
    _node._point = point
    _node._level = level
    _node._move = true
    const {name} = this, {_nodes} = level
    let tally = 0
    while (_nodes[_node._id = name + ++tally]);
    _nodes[_node._id] = _node
    return _node
  }
  remove() {
    const {_id,_level} = this
    delete _level._nodes[_id]
  }

  static copy(
    level,copy_level, // Level
    id, // String
  ) {
    const {_nodes} = copy_level
    return _nodes[id] ? _nodes[id] : level._nodes[id].copy(copy_level)
  }
  copy(
    level, // Level
  ) {
    const {_nodes} = level, {_point,_id,constructor} = this
    const _node = new constructor
    _node._point = _point
    _node._id = _id
    _nodes[_id] = _node
    return _node
  }
  serialize(
    sLevel, // sLevel
  ) {
    const {_point,_move,_id,constructor} = this
    if (sLevel[_id]) return sLevel[_id]
    const _sNode = {
      _constructor:constructor.name,
      _point:_point.serialize(),
    }
    sLevel[_id] = _sNode
    if (!_move) _sNode = false
    return _sNode
  }
  static read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    const {_nodes} = level
    if (_nodes[id]) return _nodes[id]
    const constructor = Solver[sLevel[id]._constructor]
    if (!constructor) throw `error`
    return (new constructor).read(sLevel, level, id)
  }
  read(
    sLevel, // sLevel
    level, // Level
    id, // String
  ) {
    const {_nodes} = level, {read} = this.constructor
    this._level = level
    this._id = id
    this._point = read(sLevel[id], level, '_point')
    this._move = sLevel[id]._move != false
    _nodes[id] = this
    return this
  }

  set draw(
    ctx, // CanvasRenderingContext2D
  ) {
    const {color,lineWidth} = this
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
  }

  _txt = ''
  set fill(
    ctx, // CanvasRenderingContext2D
  ) {
    const {_txt,_point,color,lineWidth,radius} = this
    const {x,y} = _point, {pi2} = Solver.Lib
    ctx.fillStyle = '#303030'
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.beginPath()
    ctx.arc(x,y,radius,0,pi2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.fillText(_txt,x,y+2)
  }
}
