module.exports = MazeGame => class Node extends MazeGame.Type {

  get translation() {
    const {_root} = this
    return [
      _root.sub({x:0,y:1}).serialize(), _root.sub({x:1,y:0}).serialize(),
      // _root.sub({x:1,y:1}).serialize(), _root.sub({x:1,y:-1}).serialize(),
    ]
  }
  get_dist(
    idx, // String,Number
  ) {
    if (idx < 2) return 1
    else return Math.sqrt(2)
  }

  static get key_bind() { return 'i' }
  static act_at(
    editor, // Editor
    spot, // Point
  ) {
    const {nodes,node_round} = editor.src
    const node = nodes[spot.round(node_round).simple.serialize()]
    if (!node) return

    const {target} = editor
    if (target) {
      editor.target = null
    }
    else {
      editor.target = node
      return
    }

    if (target == node) {

      log('same point')
      return
    }
    else if (!node.is_open) {

      log('bad node')
      return
    }
    else {
      const [nodes,keys,jacks,portals,locks] = this.connect(editor.src,target)

      let tuple = nodes[node.id], path = []
      while (tuple) {
        path.push(tuple[0])
        tuple = tuple[2]
      }

      if (path.length) {
        log('can path...', node.path = path)
        return
      }

      for (const i in portals) {
        const portal = portals[i]
        if (!tuple || portal[1] < tuple[1]) tuple = portal
      }

      if (tuple == null) {
        log('no root portal')
        return
      }

      do {
        path.push(tuple[0])
        tuple = tuple[2]
      } while (tuple)

      const _path = []
      {
        const [nodes,keys,jacks,portals,locks] = this.connect(editor.src,node)

        for (const i in portals) {
          const portal = portals[i]
          if (!tuple || portal[1] < tuple[1]) tuple = portal
        }

        if (tuple == null) {
          log('no spot portal')
          return
        }
        do {
          _path.push(tuple[0])
          tuple = tuple[2]
        } while (tuple)
      }

      const __path = []
      while (_path.length) __path.push(_path.pop())
      __path.push(false)
      for (const i in path) __path.push(path[i])

      log('portal path...', node.path = __path)
    }

  }

  static connect(
    level, // Level
    node, // Node
  ) {
    const nodes = {}, keys = {}, jacks = {}, portals = {}, locks = {}
    const queue = [nodes[node.id] = [node,0,null]], {Lib} = MazeGame
    for (let i = 0; i < queue.length; ++i) {
      let tuple = queue[i], [node,depth] = tuple, {id} = node

      const {_nodes,Wall,Door,Portal,Key,Jack,Lock} = node

      if (Wall) continue
      else if (Door && !Door.is_open) continue
      else if (Portal) {
        if (Portal.is_open) portals[id] = tuple
        continue
      }
      if (Key) keys[id] = tuple
      if (Jack) jacks[id] = tuple
      if (Lock) locks[id] = tuple

      ++depth
      for (const i in _nodes) {
        const _node = _nodes[i]
        if (nodes[_node.id]) continue
        queue.push(nodes[_node.id] = [_node,depth,tuple])
      }
    }

    return [nodes,keys,jacks,portals,locks]
  }

  get nodes() { return this._nodes }

  constructor() {
    super()
    this._depth = -Infinity
    this._nodes = []
  }

  get color() {
    const {Wall,Door,Portal,Lock,Jack,Key} = this
    return (
      Wall ? '#808080' :
      Door ? 'red' :
      Portal ? 'purple' :
      Lock || Jack || Key ? 'black' :
      '#363636'
    )
  }
  get is_open() {
    const {Wall,Door,Portal} = this

    if (Wall) return false
    else if (Door && !Door.is_open) return false
    else if (Portal && !Portal.is_open) return false
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

    const {_nodes} = _node, {nodes} = src, {translation} = _node
    for (const i in translation) {
      const id = translation[i]
      if (nodes[id]) {
        _nodes.push(nodes[id])
        nodes[id].nodes.push(_node)
      }
    }

    return root
  }

  set_target(
    target, // Target
    depth, // Number
    type, // String
  ) {
    if (depth < 0) return

    const {_id,_nodes,_depth,node_round} = this

    this[type] = target
    this._depth = depth
    depth -= node_round
    for (const i in _nodes) _nodes[i].set_target(target,depth,type)

  }

  remove() {
    const {id,src} = this
    delete src.nodes[id]
  }


  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,color,_nodes} = this, {pi2} = MazeGame.Lib
    const _point = root.vec(scale,offset)
    ctx.fillStyle = color

    const {Wall,Door,Portal} = this
    if (Wall || Door || Portal) {
      ctx.beginPath()
      ctx.arc( _point.x, _point.y, 0.1 * scale, 0, pi2)
      ctx.closePath()
      ctx.fill()
    }

    const {path} = this
    if (path) {
      ctx.strokeStyle = color
      ctx.beginPath()
      for (const i in path) {
        if (path[i]) path[i].root.vec(scale,offset).lineTo = ctx
        else {ctx.stroke(); ctx.beginPath()}
      }
      ctx.stroke()
    }

    // ctx.strokeStyle = '#505050'
    // ctx.lineWidth = 1
    // for (const i in _nodes) {
    //   ctx.beginPath()
    //   _point.lineTo = ctx
    //   _nodes[i].root.vec(scale,offset).lineTo = ctx
    //   ctx.stroke()
    // }
  }

}
