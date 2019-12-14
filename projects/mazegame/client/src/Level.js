module.exports = MazeGame => class Level extends MazeGame.Type {

  _targets = {}; _editors = {}
  _locks = {}; _lasers = {}
  _walls = {}; _doors = {}; _portals = {}
  _keys = {}; _jacks = {}

  get targets() { return this._targets }
  get locks() { return this._locks }
  get lasers() { return this._lasers }
  get walls() { return this._walls }
  get doors() { return this._doors }
  get portals() { return this._portals }
  get keys() { return this._keys }
  get jacks() { return this._jacks }

  get prev_level() { return this._prev_level }
  set prev_level(
    prev_level, // Level,Null
  ) {
    if (prev_level == this._prev_level) return
    this._prev_level = prev_level
    if (prev_level) {
      prev_level.next_level = this
    }
  }

  get next_level() { return this._next_level }
  set next_level(
    next_level, // Level,Null
  ) {
    if (next_level == this._next_level) return
    this._next_level = next_level
    if (next_level) {
      next_level.prev_level = this
    }
  }

  get src() { return this._src }
  set src(
    src, // Game,Null
  ) {
    const {id,_src} = this
    if (_src == src) return
    this._src = src
    if (_src) delete _src.levels[id]
    if (src) src.levels[id] = this
  }

  copy(
    game, // Game,Null
  ) {
    const {id,_targets,_editors,_prev_level,_next_level} = this
    if (game && game.levels[id]) return game.levels[id]

    const _level = super.copy(game)
    if (game && _prev_level) _level.prev_level = _prev_level.copy(game)
    if (game && _next_level) _level.next_level = _next_level.copy(game)

    for (const id in _targets) _targets[id].copy(_level)
    for (const id in _editors) _editors[id].copy(_level)

    return _level
  }

  static init(
    src, // Game,Null
  ) {
    const _level = super.init(src)
    if (src) {
      const {root_level} = src
      if (root_level && root_level.next_level) {
        _level.next_level = root_level.next_level
      }
      _level.prev_level = root_level
      src.root_level = _level
    }
    return _level
  }

  remove() {
    const {id,src,_prev_level,_next_level} = this
    super.remove()
    if (src) {
      delete src.level[id]
      if (_prev_level) _prev_level.next_level = _next_level
      else if (_next_level) _next_level.prev_level = _prev_level
    }
  }
}
