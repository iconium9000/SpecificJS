module.exports = MazeGame => class Button extends MazeGame.Target {

  get length() { return 4 }
  static get radius() { return 1.5 }

  press(editor) {
    const {parent,name} = this
    parent.button_press(name, editor)
  }

  static get_closest(
    buttons, // Button{}
    spot, // Point
  ) {
    let min_dist = Infinity, return_button = null
    for (const label in buttons) {
      const button = buttons[label]

      const {search_radius} = button.constructor
      const _dist = button.root.sub(spot).length
      if (_dist < min_dist && _dist < search_radius) {
        return_button = button
        min_dist = _dist
      }
    }
    return return_button
  }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.buttons[id] = this
  }

  get parent() { return this._parent }
  set parent(
    parent // Header
  ) {
    const {name} = this
    this._parent = parent
    parent[name] = this
    parent.reroot_button(name)
  }

  static init(
    parent, // Header
    name, // String
  ) {
    if (parent[name]) return parent[name]
    const {src} = parent
    const _button = super.init(src, parent.id + name)
    _button._name = name
    _button.parent = parent
    return _button
  }

  copy(
    src, // Level
  ) {
    const _button = super.copy(src)

    const {_parent,constructor} = this
    _button.parent = constructor.copy(_parent, src)

    return _button
  }

  serialize(
    src, // Object
  ) {
    const {_parent,constructor} = this
    const serial_parent = constructor.serialize(_parent, src)
    const _serial = super.serialize(src)

    _serial._parent = serial_parent

    return _serial
  }

  read(
    serial_level, // Object
    level, // Level
    id, // String
  ) {
    const {_parent} = serial_level[id], {constructor} = this
    const parent = constructor.read(serial_level, level, _parent)

    super.read(serial_level, level, id)
    this.parent = parent

    return this
  }

  remove() {
    const {id,src,name,parent} = this
    super.remove()
    delete parent[name]
    delete src.buttons[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {parent,root,name,constructor} = this, {pi2} = MazeGame.Lib
    if (!parent.show_button(name)) return

    const { stroke_color, font_scale, } = constructor

    const _root = root.vec(scale,offset)
    const _font_scale = font_scale * scale

    ctx.font = `${_font_scale}px Arial`
    ctx.textAlign = 'center'
    ctx.fillStyle = stroke_color
    ctx.fillText(name, _root.x, _root.y + _font_scale * 0.35)
  }
}
