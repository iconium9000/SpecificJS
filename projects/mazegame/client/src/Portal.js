module.exports = MazeGame => class Portal extends MazeGame.Door {

  static get key_bind() { return 'p' }
  static get short_min() { return 3 }
  static get short_max() { return this.short_min }
  static get long_min() { return 12 }
  static get long_max() { return this.long_min }
  static get short_mid() { return this.short_max / 2 }
  static get center_long() { return this.long_max / 2 }
  static get center_short() { return (
    this.short_max*this.short_max - this.short_mid*this.short_mid +
    this.long_max * this.long_max / 4
  ) / 2 / (this.short_max - this.short_mid)}
  static get radius() { return Math.sqrt(
    Math.pow(this.short_max - this.center_short, 2) +
    Math.pow(this.long_max - this.center_long, 2)
  )}
  static get lock_names() { return ['lock_root','lock_cent','lock_spot',] }

  get center() { return this.root.sum(this.spot).div(2) }

  reroot_lock(
    name, // String
  ) {
    const {[name]:_lock,_root,_spot,_long,_short} = this
    if (!_lock) return
    const {length} = _lock
    _lock._long = _short.strip(-length)
    switch (name) {
      case 'lock_root':
        return _lock.root = _root.sum(_long.div(4))
      case 'lock_cent':
        return _lock.root = _root.sum(_long.div(2))
      case 'lock_spot':
        return _lock.root = _root.sum(_long.mul(3/4))
      default: return
    }
  }

  get is_open() {
    const {src:{portals},_is_open} = this
    if (!_is_open) return false
    let count = 0
    for (const id in portals) if (portals[id]._is_open) ++count
    return count == 2
  }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    src.portals[id] = this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.portals[id]
  }
}
