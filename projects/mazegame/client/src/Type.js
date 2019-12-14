module.exports = MazeGame => class Type {
  _tally = 0
  get tally() { return ++this._tally }

  get id() { return this._id }
  get name() { return this._name }

  get src() { return this._src }
  set src(
    src, // Type,Null
  ) {
    const {_id,_src} = this
    if (_src || !src) return
    src[_id] = this
    this._src = src
  }

  static copy(
    type, // Type
    src, // Type,Null
  ) {
    return src && src[type.id] ? src[type.id] : type.copy(src)
  }

  copy(
    src, // Type,Null
  ) {
    const {_id,_name,constructor} = this
    const _type = new constructor

    if (_id) _type._id = _id
    if (_name) _type._name = _name
    _type.src = src

    for (const id in this) {
      if (this[id] && this[id].id == id) {
        constructor.copy(this[id], src)
      }
    }

    return _type
  }
  static serialize(
    type, // Type
    src, // Object,Null
  ) {
    if (!src || !src[type.id]) type.serialize(src)
    return type.id
  }
  serialize(
    src, // Object,Null
  ) {
    const {_id,_name,constructor} = this
    const _serialize = {_constructor:constructor.name}

    if (_id) _serialize.id = _id
    if (_name) _serialize.name = _name
    if (src) src[_id] = _serialize

    for (const id in this) {
      if (this[id] && this[id].id == id) {
        constructor.serialize(this[id], _serialize)
      }
    }

    return _serialize
  }
  static read(
    serialize, // Object
    src, // Type,Null
    id, // String,Null
  ) {
    if (src && src[id]) return src[id]
    const _serialize = src ? serialize[id] : serialize
    if (!_serialize || !MazeGame[_serialize._constructor]) return _serialize
    return (new MazeGame[_serialize._constructor]).read(serialize, src, id)
  }
  read(
    serialize, // Object
    src, // Type,Null
    id, // String,Null
  ) {
    if (src) {
      serialize = serialize[id]

      const {name} = serialize
      if (name) this._name = name

      this._id = id
      this.src = src
    }
    const {constructor} = this
    for (const id in serialize) constructor.read(serialize, this, id)

    return this
  }

  static init(
    src, // Type,Null
    id, // String,Null
  ) {
    const _type = new this
    if (src) _type._id = (id || this.name) + src.tally
    _type.src = src
    return _type
  }
  remove() {}

}
