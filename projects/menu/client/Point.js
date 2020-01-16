module.exports = constructors => class Point {

  get x() { return this._x }
  get y() { return this._y }
  get sx() { return this._sx }
  get sy() { return this._sy }
  get scale() { return this._scale }
  get abs_x () { return Math.abs(this._x) }
  get abs_y () { return Math.abs(this._y) }

  set moveTo(
    ctx // CanvasRenderingContext2D
  ) {
    ctx.moveTo(this._x, this._y)
  }
  set lineTo(
    ctx // CanvasRenderingContext2D
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


  static radius_intersect(
    r,{x:p11,y:p12},{x:v11,y:v12},{x:p21,y:p22},{x:v21,y:v22},
  ) {

    v11 -= p11; v12 -= p12; v21 -= p21; v22 -= p22;

    const s01 = v11*v11, s02 = v12*v12, s03 = v11*v12
    const v13 = s01 + s02, v23 = v21*v21 + v22*v22

    // path or wall length == 0
    if (v13 == 0 || v23 == 0) return false

    const q11 = p11-p21, q21 = q11-v21
    const q12 = p12-p22, q22 = q12-v22

    // c1 < c2*t
    const c1 = v21*q12 - v22*q11
    const c2 = v22*v11 - v12*v21

    // time bounds
    let t1 = 0, t2 = 1


    // going away from the wall is ok
    if (c2 > 0) return false
    // path is parallel to wall
    else if (c2 == 0) {

      // c1 < c2*t => c1 < 0 is always false for all t
       // always on wrong side
      if (c1 > 0) return false

      // t[1,2] = [0,1]
    }
    // valid @ t < c1/c2
    else {
      const c = c1/c2

       // always on wrong side within t[1,2]
      if (c < 0) return false

      // change the upper bound
      if (c < 1) t2 = c
    }

    // get the square of the radius
    const r2 = r*r

    // determinate for the quadratic for a p2 path touch
    let s11 = r2*v13 - s02*q11*q11 - s01*q12*q12 + 2*s03*q11*q12

    // path touches p2
    if (s11 > 0) {
      s11 = Math.sqrt(s11)
      const s12 = q11*v11 + q12*v12
      const s1 = (-s11 - s12) / v13
      const s2 = ( s11 - s12) / v13

      // path touches p2 within t[1,2]
      if (s1 < t2 && t1 < s2) return true
    }

    // determinate for the quadratic for a p2+v2 path touch
    let s21 = r2*v13 - s02*q21*q21 - s01*q22*q22 + 2*s03*q21*q22

    // path touches p2+v2
    if (s21 > 0) {
      s21 = Math.sqrt(s21)
      const s22 = q21*v11 + q22*v12
      const s1 = (-s21 - s22) / v13
      const s2 = ( s21 - s22) / v13

      // path touches p2+v2 within t[1,2]
      if (s1 < t2 && t1 < s2) return true
    }

    // consts for k
    const k01 = p12*v22 + p11*v21
    const k02 = v22*p21 - v21*p22
    const k03 = v12*v22 + v11*v21 // if 0, path is perpendicular to wall

    // kx1
    const k11 = k01*v21 + k02*v22 - v23*p11
    const k21 = k01*v22 - k02*v21 - v23*p12
    let k12 = 0, k22 = 0

    // u1
    const u1 = v23*v23

    // path is parallel to wall
    if (c2 == 0) {

      // path never touches wall
      if (r2*u1 < k11*k11 + k21*k21) return false
    }
    else {

      // kx2
      k12 = k03*v21 - v23*v11
      k22 = k03*v22 - v23*v12
    }


    // u2
    const u2 = (v21*(k11 + v23*q11) + v22*(k21 + v23*q12)) / u1

    // path is perpendicular to wall
    if (k03 == 0) {
      // path does not ever cross wall
      if (u2 > 1 || 0 > u2) return false
    }
    else {
      const u = (v21*(k12 + v11*v23) + v22*(k22 + v12*v23)) / u1
      const w1 = u < 0 ? (1-u2)/u : -u2/u
      const w2 = u < 0 ? -u2/u : (1-u2)/u

      // k is not on wall within t[1,2]
      if (w1 > t2 || t1 > w2) return false

      // change lower bound to
      if (w1 > t1) t1 = w1
      if (t2 > w2) t2 = w2
    }

    // the square of the
    const h0 = k12*k12 + k22*k22

    // path is parallel to wall
    if (h0 == 0) return true

    const h1 = v23 * r * Math.sqrt(h0)
    const h2 = k11*k12 + k21*k22

    const w1 = (-h1-h2)/h0, w2 = (h1-h2)/h0

    return w1 < t2 && t1 < w2
  }

  static __radius_intersect(
    r,p11,p12,v11,v12,p21,p22,v21,v22,
  ) {
    return this.radius_intersect(
      r, {x:p11,y:p12}, {x:p11+v11,y:p12+v12},
      {x:p21,y:p22}, {x:p21+v21,y:p22+v22},
    )
  }

  static next_radius(
    r,{x:a1,y:a2},{x:b1,y:b2},{x:c1,y:c2},
  ) {
    const q1 = b1-a1, q2 = b2-a2, p1 = c1-b1, p2 = c2-b2
    const j1 = q1*q1 + q2*q2, j2 = p1*p1 + p2*p2, j3 = q1*p1+q2*p2
    if (j2 == 0) return j3 == 0 ? 0 : (r*r - j1) / j3
    else {
      let k2 = j2*r*r + j3*j3 - j1*j2
      if (k2 < 0) return 0

      const k1 = -j3/j2
      if (k2 == 0) return k1
      else {
        k2 = Math.sqrt(k2)/j2
        const u1 = k1 + k2, u2 = k1 - k2
        return (
          u1 > u2 ?
          u2 > 0 ? u2 : u1 > 0 ? u1 : 0 :
          u1 > 0 ? u1 : u2 > 0 ? u2 : 0
        )
      }
    }
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
  dist(
    {x,y}, // Point
  ) {
    const {_x,_y} = this; x -= _x; y -= _y
    return Math.sqrt(x*x + y*y)
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
  vec(
    mul, // Number
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    const _point = new Point
    _point._sx = _point._x = _x * mul + x
    _point._sy = _point._y = _y * mul + y
    _point._scale = 1
    return _point
  }
  ivec(
    div, // Number
    {x,y}, // Point
  ) {
    const {_x,_y} = this
    return Point.init(_x - x, _y - y, 1 / div)
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
    return (new this).init(sx,sy,scale)
  }
  init(sx,sy,scale) {
    this._sx = sx; this._sy = sy; this._scale = scale
    this._x = sx * scale; this._y = sy * scale
    return this
  }
  get copy() {
    const {_sx,_sy,_scale,_x,_y} = this
    const _point = new Point
    _point._sx = _sx; _point._sy = _sy; _point._scale = _scale
    _point._x = _x; _point._y = _y
    return _point
  }
  get simple() {
    const {_x,_y} = this
    const _point = new Point
    _point._sx = _point._x = _x
    _point._sy = _point._y = _y
    _point._scale = 1
    return _point
  }
  serialize(
    points, // TODO "points"
  ) {
    const {_sx,_sy,_scale,constructor:{name}} = this
    let txt = ``
    if (_sx != 0) txt += _sx; txt += ','
    if (_sy != 0) txt += _sy
    if (_scale != 1) {
      txt += ','
      txt += _scale
    }

    if (points) {
      let idx = points[txt]
      if (idx == null) idx = points.push(txt)-1
      points[txt] = idx
      return idx
    }
    else return txt
  }
  read() {}
  static read(
    serial, // Object
    points, // TODO "points"
  ) {
    if (points) return points[serial]

    if (typeof serial == 'object') {
      const {sx,sy,scale} = serial
      const _this = new this
      _this._sx = sx; _this._sy = sy; _this._scale = scale
      _this._x = sx*scale; _this._y = sy*scale
      return _this
    }

    let [sx,sy,scale] = serial.split(',')
    sx = parseFloat(sx); if (isNaN(sx)) sx = 0
    sy = parseFloat(sy); if (isNaN(sy)) sy = 0
    scale = parseFloat(scale); if (isNaN(scale)) scale = 1
    return this.init(sx,sy,scale)
  }
}
