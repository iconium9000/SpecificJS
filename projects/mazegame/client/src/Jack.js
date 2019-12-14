module.exports = MazeGame => class Jack extends MazeGame.Key {

  static get key_bind() { return 'j' }
  static get leg_radius() { return 2 }
  get is_jack() { return true }

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
    this._long = long.unit
  }

  get root() { return this._root }
  set root(
    root, // Point
  ) {
    const {_root, _long, nose} = this
  }

  get src() { return super.src }
  set src(
    level, // Level
  ) {
    const {id} = this
    super.src = level
    level.jacks[id] = this
  }

  copy(
    src, // Level
  ) {
    const {id,nose} = this, {jacks} = src
    if (jacks[id]) return jacks[id]
    const _jack = super.copy(src)
    if (nose) _jack.nose = nose.copy(src)
    return _jack
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
