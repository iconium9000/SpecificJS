module.exports = MazeGame => class Game extends MazeGame.Type {

  static get key_bind() { return 'g' }

  static act_at(
    editor, // Editor
    spot, // Point
  ) {
    const level = editor.src

    const [closest_lock, closest_key] = level.get_lock_key(spot)

    if (closest_key && closest_key.is_jack) {
      const jack = closest_key
      editor.target = jack == editor.target ? null : jack
      // jack.long = spot.sub(jack.root)
      return true
    }

    const jack = editor.target
    if (!jack) return false

    const _spot = (
      closest_key ? closest_key.root :
      closest_lock ? closest_lock.spot : spot
    )

    if (closest_key && jack.nose.key) {
      if (jack.nose.key != closest_key) jack.spot = _spot
      jack.nose.key = null
    }
    else jack.spot = _spot

    return true
  }

  _levels = {}; _editors = {}
  get levels() { return this._levels }
  get editors() { return this._editors }

  get root_level() { return this._root_level || MazeGame.Level.init(this) }
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
