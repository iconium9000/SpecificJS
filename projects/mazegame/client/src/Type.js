module.exports = MazeGame => class Type {

  static get fill_color() { return 'black' }
  static get stroke_color() { return 'white' }
  static get thin_stroke_color() { return '#505050' }
  static get line_width() { return 0.4 }
  static get scale() { return 60 }
  static get font_scale() { return 2.6 }
  static get thin_line_width() { return this.line_width / 2 }
  static get speed() { return 5e1 } // dist / time = speed
  static get min_dt() { return 1/0x80 }
  get is_type() { return true }

  static act_at(
    editor, // Editor
    spot, // Point
  ) {}

  get lines() { return [] }
  static intersect(
    lines, // Point[][]
    root,spot, // Point
  ) {
    const {radius} = MazeGame.Key, {radius_intersect} = MazeGame.Point
    for (const i in lines) {
      const sub = lines[i]
      for (let j = 1; j < sub.length; ++j) {
        if (radius_intersect(radius,root,spot,sub[j-1],sub[j])) return true
      }
    }
    return false
  }

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
    if (typeof type != 'object') return type
    else return src && src[type.id] ? src[type.id] : type.copy(src)
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
        constructor.copy(this[id], _type)
      }
    }

    return _type
  }
  static serialize(
    type, // Type
    src, // Object,Null
  ) {
    if (type.constructor == MazeGame.Button) {
      if (type.parent[type.name] == type) return
    }
    if (!src || !src[type.id]) type.serialize(src)
    return type.id
  }
  serialize(
    src, // Object,Null
  ) {
    const {_id,_name,constructor,_src} = this
    const _serialize = {_constructor:constructor.name}
    if (src) this.__points = _src.__points
    else this.__points = []

    if (_name) _serialize._name = _name
    if (src) src[_id] = _serialize

    for (const id in this) {
      if (this[id] && this[id].id == id) {
        constructor.serialize(this[id], _serialize)
      }
    }

    if (!src) _serialize._points = this.__points

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
      this._id = id
      this.src = src
      this.__points = src.__points
    }
    const {_name,_points} = serialize, {constructor} = this
    if (!src && _points) {
      this.__points = []

      for (const i in _points) {
        let [sx,sy,scale] = _points[i].split(',')
        sx = parseFloat(sx); if (isNaN(sx)) sx = 0
        sy = parseFloat(sy); if (isNaN(sy)) sy = 0
        scale = parseFloat(scale); if (isNaN(scale)) scale = 1
        this.__points.push(MazeGame.Point.init(sx,sy,scale))
      }

    }
    if (_name) this._name = _name
    for (const id in serialize) constructor.read(serialize, this, id)
    return this
  }

  static init(
    src, // Type,Null
    id, // String,Null
  ) {
    const _type = new this
    if (src) {
      if (id) _type._id = id
      else {
        let tally = 0
        while (src[_type._id = this.name + ++tally]);
      }
    }
    _type.src = src
    return _type
  }
  remove() {
    const {_src,_id} = this
    delete _src[_id]
  }

  move(
    dt, // Number (milliseconds)
  ) {}

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {}
}
