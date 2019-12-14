module.exports = MazeGame => class Type {

  _tally = 0
  get tally() { return ++this._tally }
  get id() { return this._id }
  get name() { return this._name }

  get src() { return this._src }
  set src(
    src, // Type,Null
  ) {
    const {_src} = this
    if (_src || !src) return
    this._src = src
  }

  copy(
    src, // Type,Null
  ) {
    const {_id,_name,_tally,constructor} = this, _type = new constructor
    _type._tally = _tally
    _type._id = _id
    if (_name) _type._name = _name
    _type.src = src
    return _type
  }

  static init(
    src, // Type,Null
    id, // String,Null
  ) {
    const _type = new this
    if (id) _type._id = id
    else if (src) _type._id = this.name + src.tally
    else _type._id = this.name
    _type.src = src
    return _type
  }
  remove() {}

}
