module.exports = MazeGame => class Node extends MazeGame.Type {

  get walls() { return this._doors }
  get nodes() { return this._nodes }

  constructor() {
    super()
    this._depths = {}
    this._walls = {}
    this._doors = {}
    this._nodes = []
    this._is_open = true
  }

  get is_open() {
    const {_walls,_doors} = this
    for (const id in _walls) return false

    for (const id in _doors) {
      const _door = _doors[id]
      if (_door && !_door.is_open) return false
    }

    return true
  }
  get root() { return this._root }

  get src() { return this._src }
  set src(
    src // Level
  ) {
    const {id,_src} = this
    if (_src || !src) return
    this._src = src
    src.nodes[id] = this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const _node = super.init(src,root.serialize())
    _node._root = root

    const {_nodes} = _node, {nodes} = src
    const up_id = root.sub({x:0,y:1}).serialize()
    const left_id = root.sub({x:1,y:0}).serialize()

    if (nodes[up_id]) {
      _nodes.push(nodes[up_id])
      nodes[up_id].nodes.push(_node)
    }
    if (nodes[left_id]) {
      _nodes.push(nodes[left_id])
      nodes[left_id].nodes.push(_node)
    }

    return root
  }

  set_wall(
    id, // String
    wall, // Wall
    depth, // Number
    is_door, // Boolean
  ) {
    if (depth < 0) return

    const {_id,_doors,_nodes,_depths,_walls} = this

    const walls = is_door ? _doors : _walls
    if (wall) walls[id] = wall
    else delete walls[id]

    if (wall && !(depth <= _depths[id])) {
      _depths[id] = depth
      for (const i in _nodes) _nodes[i].set_wall(id,wall,depth-1,is_door)
    }
    else if (!_walls[id] || !_doors[id]) delete _depths[id]
  }

  remove() {
    const {id,src} = this
    delete src.nodes[id]
  }

}
