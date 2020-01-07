module.exports = MazeGame => class Header extends MazeGame.Door {

  static get key_bind() { return 'h' }
  // static get long_min() { return 16 }
  static get long_max() { return this.long_min }
  static get lock_names() {
    return ['_lock0','_lock1','_lock2','_lock3','_lock4',]
  }
  static get button_names() {
    return ['⇐','⟳','⇒',]
  }

  show_button(
    name, // String
  ) {
    const {is_locked,prev_level,next_level} = this.src
    if (name == '⇐') return prev_level
    else if (name == '⇒') {
      return !is_locked && next_level
    }
    else return true
  }
  button_press(
    name, // String
    editor, // Editor
  ) {
    if (name == '⇐') editor.prev_level()
    else if (name == '⇒') editor.next_level()
    else editor.reset_level()
  }

  reroot_locks() {
    super.reroot_locks()
    const {button_names} = this.constructor
    for (const i in button_names) this.reroot_button(button_names[i])
  }

  reroot_button(
    name, // String
  ) {
    const {[name]:_button,root,long,short,constructor} = this
    if (!_button) return

    const {button_names} = constructor
    let i = (button_names.indexOf(name)) / (button_names.length - 1)
    if (long.x < 0) i = 1-i
    _button.root = root.sum(short.strip(_button.length)).sum(long.mul(i))
  }

  reroot_lock(
    name, // String
  ) {
    const {[name]:_lock,_root,_spot,_long,_short,constructor} = this
    const {lock_names} = constructor
    if (!_lock) return
    const {length} = _lock
    let i = (lock_names.indexOf(name)) / (lock_names.length - 1)

    _lock._long = _short.strip(-length)
    _lock.root = _root.sum(_long.mul(i))
  }

  get src() { return super.src }
  set src(
    src // Level
  ) {
    const {id} = this
    super.src = src
    src.headers[id] = this
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const _header = super.init(src,root)

    const {button_names} = this
    for (const i in button_names) {
      MazeGame.Button.init(_header, button_names[i])
    }

    return _header
  }

  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {button_names} = this.constructor
    for (const i in button_names) {
      MazeGame.Button.init(this, button_names[i])
    }

    return this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.headers[id]
  }

  get lines() { return [] }
  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {short,center,src:level,constructor,is_open} = this
    const {stroke_color,font_scale} = constructor

    let _center = center.mul(scale).sum(offset)
    const _font_scale = font_scale * scale
    if (short.y < 0) _center = _center.sub(short.strip(_font_scale/2))

    ctx.font = `${_font_scale}px Arial`
    ctx.textAlign = 'center'
    ctx.fillStyle = stroke_color

    ctx.fillText(level.name, _center.x, _center.y)
  }

}
