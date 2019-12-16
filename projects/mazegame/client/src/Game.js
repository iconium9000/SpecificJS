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

  copy(
    src, // Null
  ) {
    const _game = super.copy(src)

    const {_root_level,constructor} = this

    if (_root_level) _game.root_level = constructor.copy(_root_level, _game)

    return _game
  }
  serialize(
    src, // Null
  ) {
    const _serialize = super.serialize(src)

    const {_root_level,constructor} = this
    if (_root_level) {
      _serialize._root_level = constructor.serialize(_root_level, _serialize)
    }

    return _serialize
  }
  read(
    serialize, // Object
    src, // Null
    id, // Null
  ) {
    super.read(serialize, src, id)

    const {_root_level} = serialize, {constructor} = this
    if (_root_level) {
      this.root_level = constructor.read(serialize, this, _root_level)
    }

    return this
  }

  static init() {
    const _game = super.init()

    MazeGame.Level.init(_game)

    return _game
  }

}
