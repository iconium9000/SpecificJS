module.exports = MazeGame => class Game extends MazeGame.Type {

  _levels = {}; _editors = {}
  get levels() { return this._levels }
  get editors() { return this._editors }

  get root_level() { return this._root_level }
  set root_level(
    root_level, // Level,Null
  ) {
    const {_root_level} = this
    if (root_level == _root_level) return
    this._root_level = root_level
  }

  copy() {
    const {_editors,_root_level} = this
    const _game = super.copy()

    if (_root_level) _game._root_level = _root_level.copy(_game)
    for (const id in _editors) _editors[id].copy(_level)

    return _game
  }

  static init() {
    const _game = super.init()

    MazeGame.Level.init(_game)

    return _game
  }

}
