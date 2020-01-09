module.exports = MazeGame => class Node extends MazeGame.Target {

  static get radius() { return 0.5 }
  static get key_bind() { return 'i' }

  get is_node() { return true }
  get round() { return 1 }

  static act_at(
    editor, // MazeGame.Editor
    spot, // MazeGame.Point (in gamespace)
  ) {
    const level = editor.src

    const closest_node = this.get_closest(level.nodes, spot)

    if (closest_node && closest_node != editor.target) {
      editor.target = closest_node
      return true
    }
    else if (editor.target) {
      const node = editor.target
      editor.target = null
      node.root = spot.round(this.round)
      return true
    }
    else {
      const _node = this.init(level, spot.round(this.round))
      return true
    }
  }

  static get_closest(
    nodes, // Node{}
    spot, // Point
  ) {
    let min_dist = Infinity, return_node = null
    for (const label in nodes) {
      const node = nodes[label]

      const {search_radius} = node.constructor
      const _dist = node.root.sub(spot).length
      if (_dist < min_dist && _dist < search_radius) {
        return_node = node
        min_dist = _dist
      }
    }
    return return_node
  }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.nodes[id] = this
  }

  copy(
    src, // Level
  ) {
    const _target = super.copy(src)

    const {_root,constructor} = this
    _target._root = _root

    return _target
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_root,constructor} = this
    _serialize._root = _root.serialize()

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_root} = serialize[id], {constructor,round} = this
    this._root = MazeGame.Point.read(_root).round(round)

    return this
  }

  static init(
    src, // Level
    root, // Null,Point
  ) {
    const _node = super.init(src)
    _node.root = root
    return _node
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.nodes[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {root,constructor} = this, {pi2} = MazeGame.Lib
    const {thin_stroke_color,thin_line_width,radius} = constructor
    const {x,y} = root.vec(scale,offset)

    ctx.strokeStyle = thin_stroke_color
    ctx.lineWidth = thin_line_width * scale

    ctx.beginPath()
    ctx.arc(x, y, radius * scale, 0, pi2)
    ctx.closePath()
    ctx.stroke()
  }

}
