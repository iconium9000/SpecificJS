module.exports = MazeGame => class Editor extends MazeGame.Type {

  static get tally_id() { return false }

  _mode = MazeGame.Game
  get mode() { return this._mode }
  set mode(
    mode, // Function
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

  get editor() { return this._editor }
  get level() { return this._level }
  set level(
    level, // Level,Null
  ) {
    const {id,name,_level,_editor,constructor} = this
    if (_level == level) return
    this._level = level
    if (_editor) {
      _editor.remove()
      this._editor = null
    }
    this._editor = level && constructor.init(level, id, name)
  }

  get target() { return this._target }
  set target(
    target, // Target,Null
  ) {
    const {_target} = this
    if (_target == target) return
    if (_target) { this._target = null; _target.editor = null }
    if (target) { this._target = target; target.editor = this }
  }

  get src() { return super.src }
  set src(
    src, // Game,Level
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

    if (level) {
      level[id].draw(ctx,center,root,mouse)
    }
    else {
      const {time} = MazeGame.Lib
      const {id,_time,_mode,constructor:{min_dt}} = this
      const {scale} = MazeGame.Target

      const _scale = center.short.scale / scale
      const _offset = center.sub(root)
      const _level = src.copy()
      _mode.act_at(_level[id], mouse.sub(_offset).div(_scale))
      _level.draw(ctx,_offset,_scale)

      const dt = time - _time
      src.move(0 < dt && dt < min_dt ? dt : min_dt)
      this._time = time
    }
  }
}
