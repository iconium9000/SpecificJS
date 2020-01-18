module.exports = MazeGame => class Room extends MazeGame.Target {
  static get key_bind() { return 'c' }
  static get root_round() { return 1 }

  static get_closest(
    rooms, // Room{}
    spot, // Point
  ) {
    for (const i in rooms) if (spot.equals(rooms[i].root)) return rooms[i]
    return null
  }

  get src() { return super.src }
  get colors() {
    return [
      '#403030','#304030','#264154','#342E50',
      // '#33331A','#43432D',
    ]
  }
  set src(
    src // Type,Null
  ) {
    super.src = src
    const {_id,colors} = this
    src.rooms[_id] = this
  }

  get root() { return this._root }
  get color() { return this._color }
  get lines() { return this._lines }
  constructor() {
    super()
    this._lines = []
  }
  next_color() {
    const {src,colors} = this
    if (!src.__color) src.__color = 0
    this._color = colors[src.__color++ % colors.length]
  }

  static act_at(
    editor, // Editor
    spot, // Point
  ) {
    const {root_round} = this
    spot = spot.round(root_round)

    const {target,src} = editor
    const closest_room = this.get_closest(src.rooms,spot)
    if (target) {
      if (closest_room == target) editor.target = null
      else target.lines.push(spot)
    }
    else if (closest_room) {
      editor.target = closest_room
      closest_room.next_color()
    }
    else editor.target = this.init(src,spot)
    return true
  }

  static init(
    src, // Level
    root, // Point
  ) {
    const _room = super.init(src)
    _room._root = root
    _room._lines.push(root)
    _room.next_color()
    return _room
  }

  copy(
    src, // Level
  ) {
    const {_id,_root,_color,_lines} = this
    const _room = super.copy(src)
    _room._root = _root
    _room._lines = _lines.slice()
    _room._color = _color
    return _room
  }
  serialize(
    src, // Object
  ) {
    const {_root,_lines,_color,colors,constructor} = this
    const _serialize = super.serialize(src)

    _serialize._color = colors.indexOf(_color)
    _serialize._lines = _root.serialize()
    for (let i = 1; i < _lines.length; ++i) {
      _serialize._lines += '~' + _lines[i].serialize()
    }

    return _serialize
  }
  read(
    serialize, // Object
    src, // Level
    id, // String
  ) {
    const {colors} = this
    const {Point} = MazeGame, {_lines,_key,_color} = serialize[id]
    super.read(serialize, src, id)

    this._lines = _lines.split('~')
    this._root = Point.read(this._lines[0])
    for (const i in this._lines) this._lines[i] = Point.read(this._lines[i])

    if (colors[_color]) this._color = colors[_color]
    else this.next_color()

    return this
  }

  remove() {
    const {_src,_id} = this
    super.remove()
    delete _src.rooms[_id]
  }

  draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {_color,_lines} = this
    ctx.fillStyle = _color
    ctx.beginPath()
    for (const i in _lines) _lines[i].vec(scale,offset).lineTo = ctx
    ctx.closePath()
    ctx.fill()
  }

  _draw(
    ctx, // CanvasRenderingContext2D
    offset, // MazeGame.Point (in drawspace)
    scale, // Number
  ) {
    const {_color,_root} = this, {pi2} = MazeGame.Lib
    const {x,y} = _root.vec(scale,offset)
    ctx.fillStyle = _color
    ctx.beginPath()
    ctx.arc(x,y,0.5*scale,0,pi2)
    ctx.closePath()
    ctx.fill()
  }
}
