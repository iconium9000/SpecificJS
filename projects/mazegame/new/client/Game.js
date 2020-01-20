module.exports = MazeGame => class Game extends MazeGame.Type {

  static get key_bind() { return 'g' }

  constructor() {
    super()
    this._levels = {}; this._editors = {}
  }

  static act_at(
    editor, // Editor
    spot, // Point
  ) {
    const {src} = editor, {Button,Wall} = MazeGame

    // const closest_wall = Wall.get_closest(src.walls, spot)
    // if (closest_wall) return false

    const closest_buttton = Button.get_closest(src.buttons, spot)
    if (closest_buttton) {
      closest_buttton.press(editor)
      return true
    }
    const [closest_lock, closest_key] = src.get_lock_key(spot)

    src.dohit()
    if (closest_key) {
      if (closest_key.is_jack) {
        if (editor.target != closest_key) editor.target = closest_key
        else if (closest_lock && closest_lock.key == null) {
          closest_lock.key = closest_key
        }
        else editor.target = null
        return true
      }
      else if (closest_key.lock && closest_key.lock.parent.is_jack) {
        editor.target = closest_key.lock.parent
        return true
      }
    }

    const jack = editor.target
    if (!jack) return false

    const _spot = (
      closest_key ? closest_key.root :
      closest_lock ? closest_lock.spot : spot.round(this.round)
    )

    if (closest_key) {
      if (jack.nose.key) jack.nose.key = null

    }
    jack.spot = _spot

    // delete src.__path
    // src.__path = jack.path_to(src.lines,_spot)

    return true
  }

  get level_strings() {
    const {_levels} = this, {Lib} = MazeGame
    const level_strings = {}
    for (const id in _levels) {
      level_strings[id] = Lib.stringify(_levels[id].serialize())
    }
    return level_strings
  }

  get levels() { return this._levels }
  get editors() { return this._editors }

  get tally() { return this._tally }
  set tally(
    tally, // Number
  ) {
    this._tally = tally || 0
  }

  get root_level() { return this._root_level || MazeGame.Level.init(this) }
  set root_level(
    root_level // Level,Null
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

    const {_root_level,_tally,constructor} = this
    _serialize._tally = _tally
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

    const {_root_level,_tally} = serialize, {constructor} = this

    this.tally = 1 + (_tally || 0)
    if (_root_level) {
      this.root_level = constructor.read(serialize, this, _root_level)
    }

    return this
  }

  remove_editors() {
    const map = {}, stack = [], {_editors,_root_level} = this
    for (const id in _editors) _editors[id].remove()
    if (_root_level) {
      map[_root_level.id] = _root_level
      stack.push(_root_level)
    }
    while (stack.length) {
      const level = stack.pop(), {prev_level,next_level} = level
      level.remove_editors()
      if (prev_level && !map[prev_level.id]) {
        map[prev_level.id] = prev_level
        stack.push(prev_level)
      }
      if (next_level && !map[next_level.id]) {
        map[next_level.id] = next_level
        stack.push(next_level)
      }
    }
  }


  static init() {
    const _game = super.init()

    MazeGame.Level.init(_game)

    return _game
  }

}
