module.exports = MazeGame => class Laser extends MazeGame.Lock {

  static get key_bind() { return 's' }
  static get long_min() { return 9 }
  static get long_max() { return Infinity }

  get src() { return super.src }
  set src(
    src, // Level
  ) {
    const {id} = this
    super.src = src
    level.lasers[id] = this
  }

  remove() {
    const {id,src} = this
    super.remove()
    delete src.lasers[id]
  }
}
