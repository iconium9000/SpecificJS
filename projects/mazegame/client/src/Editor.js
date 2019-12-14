module.exports = MazeGame => class Editor extends MazeGame.Type {

  get level() { return this._level }
  set level(
    level, // Level,Null
  ) {
    const {id,name,_level,constructor} = this
    if (_level == level) return
    this._level = level
    if (_level && _level.editors[id]) _level.editors[id].remove()
    if (level) constructor.init(level, id, name)
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
    level, // Level
  ) {
    const {id} = this
    super.src = level
    level.editors[id] = this
  }

  copy(
    src, // Game,Level
  ) {
    const _editor = super.copy(src)

    const {_target,_level,constructor} = this
    if (_target) _editor.target = constructor.copy(_target, src)
    if (_level) _editor.level = constructor.copy(_level, src)

    return _editor
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_target,_level,constructor} = this
    if (_target) _serialize.target = constructor.serialize(_target, src)
    if (_level) _serialize.level = constructor.serialize(_level, src)

    const _serialize
  }
  read(
    serialize, // Object
    src, // Game,Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {target,level} = serialize[id], {constructor} = this
    if (target) this.target = constructor.read(serialize, src, target)
    if (level) this.level = constructor.read(serialize, src, level)

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
    this.target = null
    delete src.editors[id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    center,root,mouse, // MazeGame.Point (in drawspace)
  ) {

  }
}
