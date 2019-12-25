module.exports = constructors => class Point {

  get x() { return this._x }
  get y() { return this._y }
  get sx() { return this._sx }
  get sy() { return this._sy }
  get scale() { return this._scale }
  get abs_x () { return Math.abs(this._x) }
  get abs_y () { return Math.abs(this._y) }

  set moveTo(
    ctx, // CanvasRenderingContext2D
  ) {
    ctx.moveTo(this._x, this._y)
  }
  set lineTo(
    ctx, // CanvasRenderingContext2D
  ) {
    ctx.lineTo(this._x, this._y)
  }

  static intersect(
    {x:ax,y:ay},{x:bx,y:by},{x:gx,y:gy},{x:hx,y:hy}, // Point
  ) {
    const dx = bx-ax, dy = by-ay, vx = hx-gx, vy = hy-gy
    const c = dx*vy - dy*vx
    if (c == 0) return false
    const px = gx-ax, py = gy-ay
    if ( dx*py <= dy*px ) return false
    const k = (px*vy - py*vx) / c
    return 0 < k && k < 1 && dx*(hy-ay) < dy*(hx-ax)
  }

  equals(
    {x,y}, // Float
  ) {
    const {_x,_y} = this
    return x == _x && y == _y
  }

  get sign() {
    const {_x,_y,abs_x,abs_y} = this
    return _x * _y * (abs_x - abs_y)
  }
  get length() {
    const {_x,_y} = this
    return Math.sqrt(_x*_x + _y*_y)
  }
  get unit() {
    const {_x,_y,length} = this
    return (
      length > 0 ?
      Point.init(_x/length, _y/length, length) :
      Point.zero
    )
  }
  get invert() {
    const {_sx,_sy,_scale} = this
    return Point.init(-_sy, _sx, _scale)
  }
  get long() {
    const {_x,_y,abs_x,abs_y} = this
    return (
      abs_x < abs_y ?
      Point.init(0, _y < -1 ? -1 : 1, abs_y) :
      Point.init(_x < -1 ? -1 : 1, 0, abs_x)
    )
  }
  get short() {
    const {_x,_y,abs_x,abs_y} = this
    return (
      abs_x < abs_y ?
      Point.init(_x < -1 ? -1 : 1, 0, abs_x) :
      Point.init(0, _y < -1 ? -1 : 1, abs_y)
    )
  }
  set(
    scale, // Number
  ) {
    const {_x, _y} = this
    return Point.init(_x,_y,scale)
  }
  strip(
    scale, // Number
  ) {
    const {_sx, _sy} = this
    return Point.init(_sx,_sy,scale)
  }
  atan2(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return Math.atan2( y-_y, x-_x )
  }
  dot(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return x*_x + y*_y
  }
  dot(
    {x,y}, // MazeGame.Point
  ) {
    const {_x,_y} = this
    return _x*x + _y*y
  }
  sum(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return Point.init(_x+x, _y+y,1)
  }
  sub(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return Point.init(_x-x, _y-y,1)
  }
  mul(
    mul, // Number
  ) {
    const {_sx,_sy,_scale} = this
    return Point.init(_sx,_sy,_scale * mul)
  }
  div(
    div, // Number
  ) {
    const {_sx,_sy,_scale} = this
    return Point.init(_sx,_sy,_scale / div)
  }

  round(
    round, // Number,Null
  ) {
    const {_x,_y} = this
    return (
      round > 0 ?
      Point.init(Math.round(_x/round), Math.round(_y/round), round) :
      Point.init(_x, _y, 1)
    )
  }

  // NOTE: ignores tx,ty,time
  // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
  clamp(
    min,ceil, // Number
  ) {
    const {_sx,_sy,_scale} = this
    return Point.init(
      _sx,_sy,
      _scale < min ? min : Math.ceil(_scale / ceil) * ceil
    )
  }

  // NOTE: ignores tx,ty,time
  // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
  cramp(
    min,max,round, // Float
  ) {
    const {_sx,_sy,_scale} = this
    return Point.init(_sx,_sy,
      _scale < min ? min : max < _scale ? max :
      0 < round ? Math.ceil(_scale / round) * round : _scale
    )
  }

  static get zero() {
    const _point = new this
    _point._sx = _point._sy = _point._scale = _point._x = _point._y = 0
    return _point
  }

  static init(
    sx,sy,scale, // Number
  ) {
    const _point = new this
    _point._sx = sx; _point._sy = sy; _point._scale = scale
    _point._x = sx * scale; _point._y = sy * scale
    return _point
  }
  serialize() {
    const {_sx,_sy,_scale,constructor:{name}} = this
    return {sx:_sx,sy:_sy,scale:_scale,_constructor:name}
  }
  read(
    serialize, // Object
    src, // Object,Null
    id, // String,Null
  ) {
    const {sx,sy,scale} = src ? serialize[id] : serialize
    this._sx = sx; this._sy = sy; this._scale = scale
    this._x = sx*scale; this._y = sy*scale
    return this
  }
}
