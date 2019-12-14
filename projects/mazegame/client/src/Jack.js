module.exports = MazeGame => class Jack extends MazeGame.Key {

  static get key_bind() { return 'j' }
  static get leg_radius() { return 2 }
  get is_jack() { return true }

  static get lock_names() {
    return ['nose',]
  }

  set_lock(
    lock, // Lock,Null
  ) {
    const {nose} = this
    if (nose == lock) return
    if (nose) { this.nose = null; nose.remove() }
    if (lock) { this.nose = lock; lock.parent = this }
    else MazeGame.Lock.init(this, 'nose')
  }

  reroot_lock() {
    const {_root,_long,nose} = this
    if (nose) {
      nose._long = _long.strip(nose.length)
      nose.root = _root.sum(_long)
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

  copy(
    src, // Level
  ) {
    const _jack = super.copy(src)

    const {_long,nose,constructor} = this

    _jack._long = _long
    if (nose) _jack.set_lock(constructor.copy(nose, src), 'nose')

    return _jack
  }
  serialize(
    src, // Object
  ) {
    const _serialize = super.serialize(src)

    const {_long,nose,constructor} = this

    _serialize.long = _long.serialize()
    if (nose) _serialize.nose = constructor.serialize(nose, src)

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    super.read(serialize, id, src)

    const {long,nose} = serialize[id], {constructor} = this
    this._long = constructor.read(long)
    if (nose) this.set_lock(constructor.read(serialize, src, nose))

    return this
  }

  static init(
    src, // Level
    lock, // Lock,Null
    point, // Null,Point
  ) {
    const _jack = super.init(src,lock,point)
    MazeGame.Lock.init(_jack, 'nose')
    return _jack
  }

  remove() {
    const {id,src,nose} = this
    if (nose) nose.remove()
    super.remove()
    delete src.jacks[id]
  }
}
