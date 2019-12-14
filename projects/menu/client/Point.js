module.exports = constructors => class Point {

  get x() { return this._x }
  get y() { return this._y }
  get sx() { return this._sx }
  get sy() { return this._sy }
  get s() { return this._s }
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

  equals(
    {x,y}, // Float
  ) {
    const {_x,_y} = this
    return x == _x && y == _y
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
    const {_sx,_sy,_s} = this
    return Point.init(-_sy, _sx, _s)
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
    s, // Number
  ) {
    const {_x, _y} = this
    return Point.init(_x,_y,s)
  }
  strip(
    s, // Number
  ) {
    const {_sx, _sy} = this
    return Point.init(_sx,_sy,s)
  }
  atan2(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return Math.atan2( y-_y, x-_x )
  }
  atan2(
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return x*_x + y*_y
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
    const {_sx,_sy,_s} = this
    return Point.init(_sx,_sy,_s * mul)
  }
  div(
    div, // Number
  ) {
    const {_sx,_sy,_s} = this
    return Point.init(_sx,_sy,_s / div)
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
  // NOTE: assumes that sx*sx+sy*sy == 1 && _s > 0
  clamp(
    min,ceil, // Number
  ) {
    const {_sx,_sy,_s} = this
    return Point.init(
      _sx,_sy,
      _s < min ? min : Math.ceil(_s / ceil) * ceil
    )
  }

  // NOTE: ignores tx,ty,time
  // NOTE: assumes that sx*sx+sy*sy == 1 && _s > 0
  cramp(
    min,max,round, // Float
  ) {
    const {_sx,_sy,_s} = this
    return Point.init(_sx,_sy,
      _s < min ? min : max < _s ? max :
      0 < round ? Math.ceil(_s / round) * round : _s
    )
  }

  static get zero() {
    const _point = new this
    _point.sx = _point._sy = _point._s = _point._x = _point._y = 0
    return _point
  }

  static init(
    sx,sy,s, // Number
  ) {
    const _point = new this
    _point._sx = sx; _point._sy = sy; _point._s = s
    _point._x = sx * s; _point._y = sy * s
    return _point
  }
}
