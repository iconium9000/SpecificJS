module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  MazeGame = {}

  class Type {
    static Type = this
    static key_bind = undefined
    static fill_color = 'black'
    static stroke_color = 'white'
    static thin_stroke_color = '#505050'
    static line_width = 0.5
    static get thin_line_width() { return this.line_width / 3 }
    static speed = 2e-2 // dist / time = speed
    static get single_name() { return this.name.toLowerCase() }
    static get plural_name() { return this.single_name + 's' }

    static to_line_dash(
      line_width, // Float
    ) {
      return [1 * line_width, 1 * line_width]
    }

    constructor(
      time, // Float
    ) {
      return this._time = time
    }

    get time() { return this._time }

    static lerp(
      src_t,dst_t,mid_t, // Float
      src,dst, // Object
    ) {
      return src
    }

    // returns this.Type
    get Type() {
      return this.constructor
    }
  }
  class Float extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Float
      src,dst, // Float
    ) {
      return (dst-src)*(mid_t-src_t)/(dst_t-src_t) + src
    }
  }
  class Point extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Float
      src,dst, // Point
    ) {
      const ratio = (mid_t-src_t)/(dst_t-src_t)
      const {x,y} = src
      return new Point( mid_t, (dst.x-x)*ratio+x, (dst.y-y)*ratio+y, 1, )
    }

    static dot(
      {time:rt,x:rx,y:ry}, {time:at,x:ax,y:ay}, {time:bt,x:bx,y:by},
    ) {
      return (at-rt)*bt + (ax-rx)*bx + (ay-ry)*by
    }
    static cross(
      {time:rt,x:rx,y:ry}, {time:at,x:ax,y:ay}, {time:bt,x:bx,y:by},
    ) {
      const pt = at-rt, px = ax-rx, py = ay-ry
      const qt = bt-rt, qx = bx-rx, qy = by-ry
      return new this( px*qy-py*qx, py*qt-pt*qy, pt*qx-px*qt, 1)
    }
    static signed_volume(
      a,b,c,d, // Point
    ) {
      return this.dot( a,d, this.cross(a,b,c) ) // /6
    }
    static line_through(
      qr,qs, pr,pa,pb, // Point
    ) {
      // https://stackoverflow.com/questions/42740765/
      // intersection-between-line-and-triangle-in-3d
      const va = this.signed_volume(qa,pr,pa,pb)
      const vb = this.signed_volume(qb,pr,pa,pb)
      const vra = this.signed_volume(qr,qs,pr,pa)
      const vab = this.signed_volume(qr,qs,pa,pb)
      if (0<va != 0<vb && 0<vra == 0<vab) {
        const qrt = qr.time, qst = qs.time, pn = this.cross(pr,pa,pb)
        return qrt + (qrt-qst)*this.dot(pr,qa,pn)/this.dot(qa,qb,pn)
      }
      return Infinity
    }
    static line_through_polys(
      qr,qs, // Point
      polys, // Point[]
    ) {
      let min_dist = Infinity
      for (const idx in polys) {
        const dist = this.line_through(qr,qs, ...polys[idx])
        if (dist < min_dist) {
          min_dist = dst
        }
      }
      return min_dist
    }

    get x() { return this._x * this._scale }
    get y() { return this._y * this._scale }
    get abs_x() { return Math.abs(this._x * this._scale) }
    get abs_y() { return Math.abs(this._y * this._scale) }
    get scale() { return this._scale }
    get _length() {
      const {_x,_y} = this
      return Math.sqrt(_x*_x + _y*_y)
    }
    get length() { return this._scale * this._length }
    get unit() {
      const {_x,_y,_scale,_length} = this
      return (
        _scale < 0 ?
        new Point(this.time, -_x/_length, -_y/_length, _length * -_scale) :
        new Point(this.time, _x/_length, _y/_length, _length * _scale)
      )
    }
    get long() {
      const {time,x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        new Point(time, 0, y < -1 ? -1 : 1, abs_y) :
        new Point(time, x < -1 ? -1 : 1, 0, abs_x)
      )
    }
    get short() {
      const {time,x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        new Point(time, x < -1 ? -1 : 1, 0, abs_x) :
        new Point(time, 0, y < -1 ? -1 : 1, abs_y)
      )
    }
    get invert() {
      const {time,x,y} = this
      return new Point(time,-y,x)
    }

    set lineTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.lineTo(this.x, this.y)
    }
    set moveTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.moveTo(this.x, this.y)
    }

    constructor(
      time, // Float
      x,y,scale, // Float,Null
    ) {
      super(time)
      this._x = x != undefined ? x : 0
      this._y = y != undefined ? y : 0
      this._scale = scale != undefined ? scale : 1
    }
    equals(
      point, // Point,Null
    ) {
      if (!point) return false
      const {x:tx, y:ty} = this, {x:px, y:py} = point
      return tx == px && ty == py
    }

    set(
      scale, // Float,Null
    ) {
      const {time,x,y} = this
      return new Point(time, x,y, scale)
    }
    strip(
      scale, // Float,Null
    ) {
      const {time,_x,_y} = this
      return new Point(time, _x,_y, scale)
    }
    at(
      time, // Float
    ) {
      const {_x,_y,_scale} = this
      return new Point(time, _x,_y,_scale)
    }

    atan2(
      point, // Point
    ) {
      const {x:px,y:py} = point, {x:tx,y:ty} = this
      return Math.atan2( py-ty, px-tx )
    }

    dot(
      point, // Point
      scale, // Float,Null
    ) {
      const {x,y} = this, {_x,_y,_scale} = point
      return (x*+_x + y*+_y) * (scale != undefined ? scale : _scale)
    }

    sum(
      point, // Point
      point_scale,scale, // Float,Null
    ) {
      const {time,x,y} = this
      if (point_scale == undefined) {
        return new Point(time, x + point.x, y + point.y, scale )
      }
      const {_x,_y} = point
      return new Point(
        time, x + _x * point_scale,
        y + _y * point_scale, scale
      )
    }

    sub(
      point, // Point
      point_scale,scale, // Float,Null
    ) {
      const {time,x,y} = this
      if (scale == undefined) scale = 1
      if (point_scale == undefined) {
        return new Point(time, x - point.x, y - point.y, scale )
      }
      const {_x,_y} = point
      return new Point(time,x - _x * point_scale, y - _y * point_scale, scale)
    }

    mul(
      mul, // Float
    ) {
      const {time,_x,_y,_scale} = this
      return new Point(time,_x,_y,_scale*mul)
    }
    div(
      div, // Float
    ) {
      const {time,_x,_y,_scale} = this
      return new Point(time,_x,_y,_scale/div)
    }

    // NOTE: assumes that this._length == 1
    // NOTE: assumes that this._scale > 0
    clamp(
      min,ceil, // Float
      scale, // Float,Null
    ) {
      const {time,_x,_y,_scale} = this
      return new Point(time,_x,_y,
        scale != undefined ? scale :
        _scale < min ? min :
        Math.ceil(_scale / ceil) * ceil
      )
    }

    // NOTE: assumes that this._length == 1
    // NOTE: assumes that this._scale > 0
    cramp(
      min,max,round, // Float
      scale, // Float,Null
    ) {
      const {time,_x,_y,_scale} = this
      if (scale == undefined) scale = _scale
      return new Point(time, _x,_y,
        scale < min ? min : max < scale ? max :
        0 < round ? Math.ceil(scale / round) * round : scale
      )
    }

    round(
      round, // Float
    ) {
      const {time,x,y} = this
      return (
        round > 0 ?
        new Point(time, Math.round(x/round), Math.round(y/round), round) :
        new Point(time, x, y, 1)
      )
    }
  }
  MazeGame.Point = Point

  class Effect extends Type {
    static _Node = class {
      constructor(
        label, // String,Null
        super_node, // _Node,Null
      ) {
        this._map = {}
        this._count = 0
        this._array = []
        this._listeners = []
        if (super_node) {
          ++super_node._count
          super_node._map[label] = this
        }
      }
      get is_empty() {
        const {_count,_array,_listeners} = this
        return _count + _array.length + _listeners.length <= 0
      }
      // return Undefined
      insert(
        effect, // Effect @ time
        ...labels // String
      ) {
        const {_map,_array,constructor:_Node} = this
        if (labels.length) {
          const [label, ...sub_labels] = labels
          const sub_node = _map[label] || new _Node(label, this)
          return sub_node.insert(effect, sub_labels)
        }
        const insert_idx = Lib.bin_insert(_array, effect, 'time')
        for (let idx = insert_idx; idx < _array.length; ++idx) {
          const postxcl = _array[idx]
          Lib.bin_insert(effect._postxcls, postxcl, 'time')
          Lib.bin_insert(postxcl._prexcls, effect, 'time')
        }
      }
      // return Boolean
      kill(
        effect, // Effect @ time
        ...labels // String
      ) {
        const {_map,_array} = this
        if (labels.length) {
          const [label, ...sub_labels] = labels
          const sub_node = _map[label]
          if (!sub_node) return false
          let kill = sub_node.kill(effect, sub_labels)
          if (sub_node.is_empty) {
            delete _map[label]
            --this._count
          }
          return kill
        }
        return Lib.bin_delete(_array, effect, 'time')
      }

      // return Object,Null,Undefined
      get_value(
        time, // Float
        ...labels // String
      ) {
        const {_array,_map} = this
        if (labels.length) {
          const [label, ...sub_labels] = labels
          const sub_node = _map[label]
          if (!sub_node) return undefined
          return sub_node.get_value( time, ...sub_labels, )
        }
        let idx = Lib.bin_idx_high(_array, time, 'time')
        while (idx >= 0) {
          const effect = _array[idx]
          if (effect._is_valid) return effect.get_value(time)
          else --idx
        }
        return undefined
      }

      // return Object[]
      get_values(
        time, // Float
        ...labels // String
      ) {
        const {_array,_map} = this
        if (labels.length) {
          const [label, ...sub_labels] = labels
          const sub_node = _map[label]
          if (!sub_node) return {}
          return sub_node.get_values( time, ...sub_labels, )
        }
        const values = {}
        for (const label in _map) {
          const value = _map[label].get_value(time)
          if (value != undefined) values[label] = value
        }
        return values
      }
    }
    static _Listener = class extends Type {

      // NOTE: assumes that method is the label for a method with format:
      // (listener: _Listener, old_effect,new_effect: Effect)
      constructor(
        time, // Float
        description, // String
        prereq, // Effect
        method, // String
        prereq, // Effect
        ...labels // String
      ) {
        super(time)
        
      }
    }

    // Note: if value is undefined, defaults to this
    constructor(
      time, // Float
      description, // String
      value, // Object,Undefined,Null
      ...prereq_paths // [prereq: Effect, ...labels: String]
    ) {
      super(time)
      this._description = description
      this._value = value === undefined ? this : value
      this._prereq_paths = []; this._listeners = []
      this._prereqs = []; this._prexcls = []
      this._postreqs = []; this._postxcls = []
      this._root_node = new this.Type._Node
      this._is_valid = true
      this._is_dead = false

      for (const idx in prereq_paths) {
        const prereq_path = prereq_paths[idx]
        const [prereq, ...labels] = prereq_path
        if (!prereq) continue
        prereq._root_node.insert(this, ...labels)
        Lib.bin_insert(this._prereqs, prereq, 'time')
        Lib.bin_insert(prereq._postreqs, this, 'time')
        if (!prereq._is_valid) this._is_valid = false
        this._prereq_paths.push(prereq_path)
      }

      for (const idx in this._is_valid && this._postxcls) {
        const postxcl = this._postxcls[idx]
        postxcl.check_is_valid()
      }
    }

    get value() { return this._value }
    get description() { return this._description }
    get is_valid() { return this._is_valid }
    check_is_valid() {
      const {_prereqs,_prexcls,_postreqs,_postxcls} = this
      let is_valid = true
      for (const idx in _prereqs) {
        if (!_prereqs[idx]._is_valid) {
          is_valid = false
          break
        }
      }
      for (const idx in is_valid && _prexcls) {
        if (_prexcls[idx]._is_valid) {
          is_valid = false
          break
        }
      }
      if (is_valid == this._is_valid) return
      this._is_valid = is_valid

      for (const idx in _postreqs) {
        _postreqs[idx].check_is_valid()
      }
      for (const idx in _postxcls) {
        _postxcls[idx].check_is_valid()
      }
    }
    add_listener(
      time, // Float
      description, // String

    )

    kill() {
      if (this._is_dead) return
      const {
        _prereq_paths,_listeners,
        _prereqs,_prexcls,
        _postreqs,_postxcls,
      } = this
      this._is_dead = true; this._is_valid = false
      this._prereq_paths = []; this._listeners = []
      this._prereqs = []; this._prexcls = []
      this._postreqs = []; this._postxcls = []

      for (const idx in _prereq_paths) {
        const [prereq, ...labels] = _prereq_paths[idx]
        prereq.kill(this, ...labels)
      }
      for (const idx in _prereqs) {
        Lib.bin_delete(_prereqs[idx]._postreqs, this, 'time')
      }
      for (const idx in _prexcls) {
        Lib.bin_delete(_prexcls[idx]._postxcls, this, 'time')
      }
      for (const idx in _postreqs) {
        _postreqs[idx].kill()
      }
      for (const idx in _listeners) {
        _listeners[idx].kill()
      }
      for (const idx in _postxcls) {
        const postxcl = _postxcls[idx]
        if (Lib.bin_delete(postxcl._prexcls, this, 'time')) {
          postxcl.check_is_valid()
        }
      }
    }

    get_value(
      time, // Int
    ) {
      return time < this.time ? undefined : this._value
    }
    get_label(
      time, // Float
      ...labels // String
    ) {
      return this._root_node.get_value(time, ...labels)
    }
    get_labels(
      time, // Float
      ...labels // String
    ) {
      return this._root_node.get_values(time, ...labels)
    }
  }
  MazeGame.Effect = Effect

  class Game extends Effect {}
  MazeGame.Game = Game

  class Editor extends Effect {}
  MazeGame.Editor = Editor

  class Level extends Effect {}
  MazeGame.Level = Level

  class Lock extends Effect {}
  MazeGame.Lock = Lock

  class Laser extends Lock {}
  MazeGame.Laser = Laser

  class Wall extends Effect {}
  MazeGame.Wall = Wall

  class Door extends Wall {}
  MazeGame.Door = Door

  class Portal extends Door {}
  MazeGame.Portal = Portal

  class Key extends Effect {}
  MazeGame.Key = Key

  class Jack extends Key {}
  MazeGame.Jack = Jack

  return MazeGame
}
