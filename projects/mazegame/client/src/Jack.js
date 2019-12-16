module.exports = MazeGame => class Jack extends MazeGame.Key {

  static get key_bind() { return 'j' }
  static get leg_radius() { return 2 }
  get is_jack() { return true }

  static get lock_names() {
    return ['_nose',]
  }

  get nose() { return this._nose }
  set_lock(
    lock, // Lock,Null
  ) {
    const {_nose} = this
    if (_nose == lock) return
    if (_nose) { this._nose = null; _nose.remove() }
    if (lock) { this._nose = lock; lock.parent = this }
    else MazeGame.Lock.init(this, '_nose')
  }

  reroot_lock() {
    const {_root,_long,_nose} = this
    if (_nose) {
      _nose._long = _long.strip(_nose.length)
      _nose.root = _root.sum(_long)
    }
  }

  get long() { return this._long }
  set long(
    long, // Point
  ) {
    this._long = long.unit.strip(this.constructor.radius)
  }

  get root() { return this._root }
  get spot() { return this._root.sum(this._long) }
  set root(
    root, // Point
  ) {
    super.root = root
    if (this._root == root) this.reroot_lock()
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.jacks[id] = this
  }

  get editor() { return super.editor }
  set editor(
    editor, // Editor,Null
  ) {
    super.editor = editor
    super.is_open = !editor
  }

  get is_open() { return !this.editor }
  set is_open(_) { super.is_open = !this.editor }

  copy(
    src, // Level
  ) {
    const _jack = super.copy(src)

    const {_long,_nose,constructor} = this

    _jack._long = _long
    if (_nose) _jack.set_lock(constructor.copy(_nose, src), '_nose')

    return _jack
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_long,_nose,constructor} = this

    _serialize._long = _long.serialize()
    if (_nose) _serialize._nose = constructor.serialize(_nose, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, src, id)

    const {_long,_nose} = serialize[id], {constructor} = this
    this._long = constructor.read(_long)
    if (_nose) this.set_lock(constructor.read(serialize, src, _nose))

    return this
  }

  static init(
    src, // Level
    lock, // Lock,Null
    point, // Null,Point
  ) {
    const _jack = super.init(src,lock,point)
    MazeGame.Lock.init(_jack, '_nose')
    return _jack
  }

  remove() {
    const {id,src,_nose} = this
    if (_nose) _nose.remove()
    super.remove()
    delete src.jacks[id]
  }
}
