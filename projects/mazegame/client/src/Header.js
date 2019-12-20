module.exports = MazeGame => class Header extends MazeGame.Door {

  static get key_bind() { return 'h' }
  // static get long_min() { return 16 }
  static get long_max() { return this.long_min }
  static get lock_names() {
    return ['_lock0','_lock1','_lock2','_lock3','_lock4',]
  }

  reroot_lock(
    name, // String
  ) {
    const {[name]:_lock,_root,_spot,_long,_short,constructor} = this
    const locks = constructor.lock_names.length
    if (!_lock) return
    const {length} = _lock
    let i = parseInt(name[5])
    i = i < locks ? i : 0

    _lock._long = _short.strip(-length)
    _lock.root = _root.sum(_long.mul(i / (locks-1)))
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.headers[id] = this
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
    const {center,src:level,constructor} = this
    const {stroke_color,font_scale} = constructor

    const _center = center.mul(scale).sum(offset)
    const _font_scale = font_scale * scale

    ctx.font = `${_font_scale}px Arial`
    ctx.textAlign = 'center'
    ctx.fillStyle = stroke_color

    ctx.fillText(level.name, _center.x, _center.y)
  }

}
