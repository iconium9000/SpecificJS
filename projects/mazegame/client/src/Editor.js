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
    src, // Level
  ) {
    const {id,_target} = this, {editors} = src
    if (editors[id]) return editors[id]

    const _editor = super.copy(src)
    if (_target) _editor.target = _target.copy(src)
    return _editor
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
}
