module.exports = MazeGame => class Editor extends MazeGame.Type {

  static get tally_id() { return false }
  get draw_preview() { return false }

  constructor() {
    super()
    this._mode = MazeGame.Game
  }

  get mode() { return this._mode }
  set mode(
    mode // Function
  ) {
    const {_mode,_level,_target,id} = this
    if (!MazeGame[mode.name]) return
    if (_level) _level[id].mode = mode
    else if (_mode == mode) return
    else {
      this._mode = mode
      if (_target) this.target = null
    }
  }

  get root() {
    const {_level} = this
    return _level ? _level.root : MazeGame.Point.zero
  }
  set root(
    root // Point
  ) {
    const {_level} = this
    if (_level) _level.root = root
  }

  prev_level() {
    const {_parent,_level} = this
    if (_parent) return _parent.prev_level()

    if (_level && _level.prev_level && _level.prev_level != true) {
      this.level = _level.prev_level
    }
  }
  next_level() {
    const {_parent,_level} = this
    if (_parent) return _parent.next_level()

    if (
      _level && _level.next_level
      && _level.next_level != true
      && !_level.is_locked
    ) {
      this.level = _level.next_level
    }
  }
  reset_level() {

    const {_parent,_level} = this
    if (_parent) return _parent.reset_level()

    if (_level && _level.__backup) {
      const {src,prev_level,next_level,is_locked,__backup} = _level
      const level = __backup.copy(src)
      level.prev_level = prev_level
      level.next_level = next_level
      level.is_locked = is_locked
      this.level = level
      src.root_level = level
      level.__backup = __backup
    }
  }

  get parent() { return this._parent }

  get editor() { return this._editor }
  get level() { return this._level }
  set level(
    level // Level,Null
  ) {
    const {id,name,_level,_editor,constructor} = this
    if (_level == level) return
    this._level = level
    if (_editor) {
      _editor.remove()
      this._editor = null
    }
    this._editor = level && constructor.init(level, id, name)
    if (this._editor) this._editor._parent = this
  }

  get target() { return this._target }
  set target(
    target // Target,Null
  ) {
    const {_target} = this
    if (_target == target) return
    if (_target) { this._target = null; _target.editor = null }
    if (target) { this._target = target; target.editor = this }
  }

  get src() { return super.src }
  set src(
    src // Game,Level
  ) {
    const {id} = this
    super.src = src
    src.editors[id] = this
  }

  copy(
    src, // Game,Level
  ) {
    const _editor = super.copy(src)

    const {_target,_level,_mode,constructor} = this
    if (_target) _editor.target = constructor.copy(_target, src)
    if (_level) _editor.level = constructor.copy(_level, src)
    _editor._mode = _mode

    return _editor
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_target,_level,_mode,constructor} = this
    if (_target) _serialize._target = constructor.serialize(_target, src)
    if (_level) _serialize._level = constructor.serialize(_level, src)
    _serialize._mode = _mode.name

    return _serialize
  }
  read(
    serialize, // Object
    src, // Game,Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_target,_level,_mode} = serialize[id], {constructor} = this
    if (_target) this.target = constructor.read(serialize, src, _target)
    if (_level) this.level = constructor.read(serialize, src, _level)
    this.mode = MazeGame[_mode]

    return this
  }

  static init(
    src, // Game,Level
    id,name, // String
  ) {
    const _editor = super.init(src,id)
    _editor._name = name
    _editor.level = src.root_level
    return _editor
  }

  remove() {
    const {id,src} = this
    super.remove()
    this.level = null
    this.target = null
    delete src.editors[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    center,root,mouse, // Point (in drawspace)
  ) {
    const {id,level,target,src,mode} = this

    if (level) level[id].draw(ctx,center,root,mouse)
    else {

      const {id,_mode,draw_preview} = this
      let _level = src
      const _scale = center.short.scale / src.scale
      const _offset = center.sub(root)
      if (draw_preview) {
        _level = _level.copy()
        _mode.act_at(_level[id], mouse.ivec(_scale,_offset))
      }
      _level.draw_nodes = mode == MazeGame.Node// || mode == MazeGame.Game
      _level.draw(ctx,_offset,_scale)
    }
  }

  move() {
    const {level,_time} = this, {time} = MazeGame.Lib
    if (level) {
      const dt = time - _time
      level.move(0 < dt && dt < Infinity ? dt : 0)
      this._time = time
      if (level.header && level.header.is_open) {
        level.is_locked = false
      }
    }
  }
}
