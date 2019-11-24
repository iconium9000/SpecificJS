module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  let sanity = 1000

  MazeGame = {
    Array: Array,
    Object: Object,
  }

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

    static get_type(
      object, // Object,Type,Null
    ) {
      return !object || typeof object != 'object' ? null : object.constructor
    }

    static get(
      object, // Object,Null
      ...path // String
    ) {
      if (!object || !path.length) return object
      return this.get(object[path[0]], ...path.slice(1))
    }
    static set(
      action, // Object
      object, // Object
      value, // Object,Null
      label,...path // String
    ) {
      if (!path.length) return Lib.set(object, value, label)
      if (!object[label]) object[label] = {__action:action}
      this.set(action, object[label], value, ...path)
    }

    static init(
      time, // Float
    ) {
      const _type = new this
      _type._time = time
      return _type
    }

    get time() { return this._time }
    get Type() { return this.constructor }

    at(
      time, // Float
    ) {
      return this
    }

    get tally() { return this._tally || 0 }
    set tally(
      tally, // Int
    ) {
      const {__action, _tally} = this
      if (_tally == tally) return
      else __action.set(tally,'_tally')
    }

    get name() { return this._name }
    get idx() { return this._idx }
    get editor() { return this._editor }
    set editor(
      editor, // Editor,Null
    ) {
      const {idx,_editor,__action} = this
      if (_editor != editor) return

      if (editor) __action.get(_editor.idx, idx, '_editor')
      else __action.set(null, idx, '_editor')
    }

    get is_open() { return this._is_open }
    set is_open(
      is_open, // Boolean
    ) {
      const {idx,_is_open,__action} = this
      if (_is_open == is_open) return
      __action.set(is_open, idx, '_is_open')
    }
  }
  MazeGame.Type = Type
  Array.Type = Type
  Object.Type = Type

  class FloatType extends Type {

    static init(
      time, // Float
      float, // Float
    ) {
      const _float = super.init(time)
      _float._float = float
      return _float
    }

    at(
      time, // Float
    ) {
      return this._float
    }
  }
  MazeGame.FloatType = FloatType
  class FloatLerp extends FloatType {

    static init(
      time, // Float
      start_float,stop_float,
    ) {
      const _float_lerp = super.init(start_time,start_float)
      _float_lerp._stop_time = stop_time
      _float_lerp._stop_float = stop_float
      return _float_lerp
    }

    at(
      time, // Float
    ) {
      const {_time,_stop_time, _float,_stop_float} = this
      const ratio = (time - _time) / (_stop_time - _time)
      return (_stop_float - _float) * ratio + _float
    }
  }
  MazeGame.FloatLerp = FloatLerp
  class Point extends Type {

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
      for (const label in polys) {
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
        Point.init(this.time, -_x/_length, -_y/_length, _length * -_scale) :
        Point.init(this.time, _x/_length, _y/_length, _length * _scale)
      )
    }
    get long() {
      const {time,x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        Point.init(time, 0, y < -1 ? -1 : 1, abs_y) :
        Point.init(time, x < -1 ? -1 : 1, 0, abs_x)
      )
    }
    get short() {
      const {time,x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        Point.init(time, x < -1 ? -1 : 1, 0, abs_x) :
        Point.init(time, 0, y < -1 ? -1 : 1, abs_y)
      )
    }
    get invert() {
      const {time,x,y} = this
      return Point.init(time,-y,x)
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

    static init(
      time, // Float
      x,y,scale, // Float,Null
    ) {
      const _point = super.init(time)
      _point._x = x != undefined ? x : 0
      _point._y = y != undefined ? y : 0
      _point._scale = scale != undefined ? scale : 1
      return _point
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
      return Point.init(time, x,y, scale)
    }
    strip(
      scale, // Float,Null
    ) {
      const {time,_x,_y} = this
      return Point.init(time, _x,_y, scale)
    }
    at(
      time, // Float
    ) {
      const {_x,_y,_scale} = this
      return Point.init(time, _x,_y,_scale)
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
        return Point.init(time, x + point.x, y + point.y, scale )
      }
      const {_x,_y} = point
      return Point.init(
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
        return Point.init(time, x - point.x, y - point.y, scale )
      }
      const {_x,_y} = point
      return Point.init(time,x - _x * point_scale, y - _y * point_scale, scale)
    }

    mul(
      mul, // Float
    ) {
      const {time,_x,_y,_scale} = this
      return Point.init(time,_x,_y,_scale*mul)
    }
    div(
      div, // Float
    ) {
      const {time,_x,_y,_scale} = this
      return Point.init(time,_x,_y,_scale/div)
    }

    // NOTE: assumes that this._length == 1
    // NOTE: assumes that this._scale > 0
    clamp(
      min,ceil, // Float
      scale, // Float,Null
    ) {
      const {time,_x,_y,_scale} = this
      return Point.init(time,_x,_y,
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
      return Point.init(time, _x,_y,
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
        Point.init(time, Math.round(x/round), Math.round(y/round), round) :
        Point.init(time, x, y, 1)
      )
    }
  }
  MazeGame.Point = Point

  class PointLerp extends Point {

    static init(
      start_point,stop_point, // Point
    ) {
      const {time,x,y} = start_point
      const _point_lerp = super.init(time,x,y)
      _point_lerp._stop_point = stop_point
      return _point_lerp
    }

    at(
      time, // Float
    ) {
      const {_time:at,x:ax,y:ay,_stop_point:{_time:bt,x:bx,y:by}} = this
      const r = (time - at) / (bt - at)
      return Point.init(time, (bx-ax)*r+ax, (by-ay)*r+ay)
    }
  }
  MazeGame.PointLerp = PointLerp

  class Action extends Type {

    get child() { return this.__child }

    static init(
      time, // Float
      prev_action, // Action,Null
    ) {
      const _action = super.init(time)
      _action._array = []
      if (prev_action) {
        _action._prev_action = prev_action
        _action.__child = prev_action.build
      }
      return _action
    }

    get build() {
      const {time,_prev_action,_array} = this
      this.__child = _prev_action ? _prev_action.build : null

      for (const idx in _array) {
        const [tok, value, ...path] = _array[idx]
        Type.set(
          this, this,
          tok == 'set' ? value :
          tok == 'new' ? Object.assign(new MazeGame[value], {__action:this}) :
          tok == 'get' ? Type.get(this, '__child', value) : null,
          '__child', ...path,
        )
      }
      return this.__child
    }

    set(
      value, // Object,Null
      ...path // String
    ) {
      this._array.push([ 'set', value, ...path ])
      Type.set(this, this, value, '__child', ...path)
      return value
    }

    new(
      type, // Type
      ...path // String
    ) {
      this._array.push([ 'new', type.name, ...path ])
      const _value = Object.assign(new type, {__action:this})
      Type.set(this, this, _value, '__child', ...path)
      return _value
    }

    get(
      label, // String
      ...path // String
    ) {
      this._array.push([ 'get', label, ...path ])
      const _value = Type.get(this, '__child', label)
      Type.set(this, this, _value, '__child', ...path)
      return _value
    }

    at(
      time, // Float
    ) {
      const {_time,_prev_action} = this
      return (
        _time == time ? this :
        _time < time ? Action.init(time, this) :
        _prev_action ? _prev_action.at(time) : Action.init(time)
      )
    }
  }
  MazeGame.Action = Action

  class Game extends Type {

    static init(
      time, // Float
    ) {
      const _action = Action.init(time)
      _action.new(this)
      Level.init(_action)
      return _action
    }

    get level_node() { return this._level_node }
    set level_node(
      level_node, // LevelNode
    ) {
      const {idx,__action,_level_node} = this
      if (_level_node == level_node) return
      else __action.get(level_node.idx, '_level_node')
    }
  }
  MazeGame.Game = Game

  class Editor extends Type {

    get target() { return this._target }
    set target(
      target, // Object,Null
    ) {
      const {Type,_target,idx,__action} = this

      if (_target) {
        _target.editor = null
      }

    }

    get level_node() { return this._level_node }
    set level_node(
      level_node, // {action:Action @ child:Level}, Null
    ) {
      const {idx,name,__action,_level_node,Type} = this
      const {time} = __action
      if (_level_node == level_node) return
      if (_level_node) {
        _level_node.action = _level_node.action.at(time)
        _level_node.action.child[idx].remove()
      }
      const _action = level_node.action = level_node.action.at(time)
      Type.init(_action, idx, name)
    }

    static init(
      action, // Action @ child:Game,Level
      idx,name, // String
    ) {
      const _editor = action.new(this, idx)
      action.get(idx, '_editors', idx)
      action.set(idx, idx, '_idx')
      action.set(name, idx, '_name')
      _editor.level_node = action.child.level_node
      return _editor
    }

    remove() {
      const {idx,__action} = this
      this.target = null
      __action.set(null, idx)
      __action.set(null, '_editors', idx)
    }

  }
  MazeGame.Editor = Editor

  class LevelNode extends Type {

    static init(
      game_action, // Action @ child:Game
      level_action, // Action @ child:Level
    ) {
      const game = game_action.child

      const _idx = ++game.tally
      const _level_node = game_action.new(this, _idx)
      game_action.set(_idx, _idx, '_idx')
      _level_node.action = level_action

      const {level_node} = game
      if (level_node) {
        const {next_level} = level_node
        _level_node.next_level = _level_node
        if (next_level) next_level.prev_level = _level_node
      }
      game.level_node = _level_node
    }

    get prev_level() { return this._prev_level }
    get next_level() { return this._next_level }
    set prev_level(
      prev_level, // LevelNode
    ) {
      const {idx,__action,_prev_level} = this
      if (_prev_level == prev_level) return
      else if (prev_level) {
        __action.get(prev_level.idx, idx, '_prev_level')
        __action.get(idx, prev_level.idx, '_next_level')
      }
      else __action.set(null, idx, '_prev_level')
    }
    set next_level(
      next_level, // LevelNode
    ) {
      const {idx,__action,_next_level} = this
      if (_next_level == next_level) return
      else if (next_level) {
        __action.get(idx, next_level.idx, '_prev_level')
        __action.get(next_level.idx, idx, '_next_level')
      }
      else __action.set(null, idx, '_next_level')
    }

    get action() { return this._action }
    set action(
      action, // Action
    ) {
      const {idx,__action,_action} = this
      if (_action == action) return
      else __action.set(action, idx, '_action')
    }
  }
  class Level extends Type {

    static init(
      game_action, // Action @ time:Float, child:Game
    ) {
      const {time} = game_action
      const _action = Action.init(time)
      _action.new(this)
      LevelNode.init(game_action, _action)
      return _action
    }
  }
  MazeGame.Level = Level
  MazeGame.LevelNode = LevelNode

  class Lock extends Type {
    static key_bind = 'l'
    static long_min = 3
    static long_max = 3
    static long_round = 3
    static radius = 0.5
    static search_radius = 3 * this.radius

    static get_closest(
      spot, // Point
      locks, // Lock[],Lock{},Null
    ) {
      let min_dist = Infinity, return_lock = null

      for (const label in locks) {
        const lock = locks[label], {search_radius} = lock.Type
        const _dist = lock.spot.sub(spot).length
        if (_dist < min_dist && _dist < search_radius) {
          return_lock = lock
          min_dist = _dist
        }
      }
      return return_lock
    }

    set is_open(
      is_open, // Boolean
    ) {
      const {idx, __action, _parent } = this
      super.is_open = is_open
      _parent.is_open = is_open
    }

    get root() { return this._root }
    get long() { return this._long }
    get spot() { return this._root.sum(this._long) }
    set root(
      root, // Point
    ) {
      const {idx,_long,__action,_key} = this
      __action.set(root.unit, idx, '_root')
      if (_key) _key.root = root.sum(_long)
    }
    set long(
      long, // Point
    ) {
      const {idx,_root,__action,_key,Type:{long_min,long_max,long_round}} = this
      const _long = long.unit.cramp(long_min,long_max,long_round)
      __action.set(_long, idx, '_long')
      if (_key) _key.root = _long.sum(_root)
    }
    set spot(
      spot, // Point
    ) {
      if (this._key) this._key.root = spot
    }

    get key() { return this._key }
    set key(
      key, // Key,Null
    ) {
      const {idx, __action, _key} = this

      if (_key == key) return

      if (key) {
        __action.get(key.idx, idx, '_key')
        this.is_open = key.is_open
      }
      else {
        __action.set(null, idx, '_key')
        this.is_open = false
      }
    }

    static init(
      parent, // Door,Jack
      name, // String
    ) {
      const {idx,__action} = parent
      const level = __action.child
      const _idx = ++level.tally
      const _lock = __action.new(this, _idx)
      __action.set(_idx, _idx, '_idx')
      __action.set(name, _idx, '_name')
      __action.get(_idx, '_locks', _idx)
      __action.get(parent.idx, _idx, '_parent')
      parent[name] = _lock
      return _lock
    }

    remove() {
      const {idx, __action, _parent, _name, _key} = this
      __action.set(null, idx)
      __action.set(null, '_locks', idx)
      __action.set(null, _parent.idx, '_locks', _name)
      if (_key) _key.remove()
    }
  }
  MazeGame.Lock = Lock

  class Laser extends Lock {
    static key_bind = 's'
    static long_min = 9
    static long_max = Infinity

    static init(
      parent, // Door,Jack
      name, // String
    ) {
      const _laser = super.init(parent,name)
      const {idx,__action} = _laser
      __action.get(idx, '_lasers', idx)
      return _laser
    }

    remove() {
      const {idx, __action} = this
      __action.set(null, '_lasers', idx)
      super.remove()
    }
  }
  MazeGame.Laser = Laser

  class Wall extends Type {
    static key_bind = 'w'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static short_min = 2
    static short_max = 2
    static default_long_open = 0
    static short_sign = false
    static locks = {}
    static lock_names = []
    static is_portal = false

    get root() { return this._root }
    get spot() { return this._spot }
    get long() { return this._long }
    get short() { return this._short }
    set long(
      long, // Point
    ) {
      const {idx,__action,_root} = this
      const {
        short_sign,
        short_min,short_max,short_round,
        long_min,long_max,long_round,
      } = this.Type
      const _long = long.long.cramp(long_min, long_max, long_round)
      __action.set(_long, idx, '_long')
      const _short = long.short.cramp(short_min, short_max, short_round)
      __action.set(_short, idx, '_short')
      let _spot = _root.sum(_long)
      if (short_sign) _spot = _spot.sum(_short)
      __action.set(_spot, idx, '_spot')
    }
    set root(
      root, // Point
    ) {
      const {root_round,short_sign,_long,_short} = this.Type, {time} = root
      this._root = root.round(root_round)
      if (!_long) this.long = Point.init(time,1,1)
      else {
        this._spot = _root.sum(_long)
        if (short_sign) this._spot = _spot.sum(_short)
      }
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const {idx,__action} = level
      const _idx = ++level.tally
      const _wall = __action.new(this, _idx)
      __action.set(_idx, _idx, '_idx')
      __action.get(_idx, 'walls', _idx)
      _wall.root = root
      return _wall
    }

    remove() {
      const {idx, __action, } = this
    }
  }
  MazeGame.Wall = Wall

  class Door extends Wall {
    static key_bind = 'd'
    static root_round = 4
    static long_min = 16
    static long_round = 4
    static short_min = 4
    static short_max = 4
    static short_sign = true

    static lock_names = ['root_short','root_long','spot_long','spot_short',]

    set is_open(
      is_open, // Boolean
    ) {
      const {idx,__action,locks} = this

      for (const idx in locks) {
        const lock = locks[idx]
        if (lock && !lock.is_open) is_open = false
      }
      super.is_open = is_open
    }

    get locks() { return this._locks = this._locks || {} }
    get root_short() { return this.locks._root_short }
    get root_long() { return this.locks._root_long }
    get spot_long() { return this.locks._spot_long }
    get spot_short() { return this.locks._spot_short }

    set_lock(
      lock, // Lock,Null
      name, // String
    ) {
      const {idx,__action, [name]:_lock} = this
      if (_lock == lock) return
      if (_lock) _lock.remove()
      if (lock) __action.get(lock.idx, idx, '_locks', name)
      this.is_open = true
    }
    set root_short(
      lock, // Lock,Null
    ) {
      const {root,short,long} = this
      if (lock) {
        lock.root = short.div(2).sum(root)
        lock.long = long.strip(-lock.long.length)
      }
      this.set_lock(lock,'_root_short')
    }
    set root_long(
      lock, // Lock,Null
    ) {
      const {root,short,long} = this
      if (lock) {
        lock.root = long.strip(short.length/2).sum(root)
        lock.long = short.strip(-lock.short.length)
      }
      this.set_lock(lock,'_root_long')
    }
    set spot_long(
      lock, // Lock,Null
    ) {
      const {spot,short,long} = this
      if (lock) {
        lock.root = long.strip(-short.length/2).sum(spot)
        lock.long = short.strip(lock.short.length)
      }
      this.set_lock(lock,'_spot_long')
    }
    set spot_short(
      lock, // Lock,Null
    ) {
      const {spot,short,long} = this
      if (lock) {
        lock.root = short.div(-2).sum(spot)
        lock.long = short.strip(-lock.long.length)
      }
      this.set_lock(lock,'_spot_short')
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _door = super.init(level,root)
      const {idx,__action} = _door
      __action.get(idx, '_doors', idx)
      return _door
    }

    remove() {
      const {idx, __action, _locks} = this
      __action.set(null, '_doors', idx)
      for (const names in _locks) this[names] = null
      super.remove()
    }
  }
  MazeGame.Door = Door

  class Portal extends Door {
    static key_bind = 'p'
    static short_min = 3
    static short_max = this.short_min
    static long_min = 12
    static long_max = this.long_min
    static short_midx = this.short_max / 2
    static center_long = this.long_max / 2
    static center_short = (
      this.short_max*this.short_max - this.short_midx*this.short_midx +
      this.long_max * this.long_max / 4
    ) / 2 / (this.short_max - this.short_midx)
    static radius = Math.sqrt(
      Math.pow(this.short_max - this.center_short, 2) +
      Math.pow(this.long_max - this.center_long, 2)
    )
    static lock_names = ['lock_root','lock_cent','lock_spot',]
    static is_portal = true

    set_lock(
      lock, // Lock,Null
      name, // String
    ) {
      const {short} = this
      if (lock) lock.long = short.strip(-lock.long.length)
      super.set_lock(lock,name)
    }
    get lock_root() { return this._lock_root }
    get lock_cent() { return this._lock_cent }
    get lock_spot() { return this._lock_spot }
    set lock_root(
      lock, // Lock,Null
    ) {
      const {root,long} = this
      if (lock) lock.root = long.div(4).sum(root)
      this.set_lock(lock,'_lock_root')
    }
    set lock_cent(
      lock, // Lock,Null
    ) {
      const {root,long} = this
      if (lock) lock.root = long.div(2).sum(root)
      this.set_lock(lock,'_lock_cent')
    }
    set lock_spot(
      lock, // Lock,Null
    ) {
      const {root,long} = this
      if (lock) lock.root = long.div(4/3).sum(root)
      this.set_lock(lock,'_lock_spot')
    }
    get is_open() {
      if (!this._is_open) return false

      const portals = this.__action.child.portals
      let count = 0
      for (const idx in portals) if (portals[idx]._is_open) ++count
      return count == 2
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _portal = super.init(level,root)
      const {idx,__action} = _portal
      __action.get(idx, '_portals', idx)
      return _portal
    }

    remove() {
      const {idx, __action} = this
      __action.set(null, '_portals', idx)
      super.remove()
    }
  }
  MazeGame.Portal = Portal

  class Key extends Type {
    static key_bind = 'k'
    static radius = 1.5
    static center_radius = Lock.radius
    static search_radius = this.radius

    static get_closest(
      spot, // Point
      keys, // Lock[],Lock{},Null
    ) {
      let min_dist = Infinity, return_key = null

      for (const label in keys) {
        const key = keys[label], {search_radius} = key.Type
        const _dist = key.root.sub(spot).length
        if (_dist < min_dist && _dist < search_radius) {
          return_key = key
          min_dist = _dist
        }
      }
      return return_key
    }

    set root(
      _root, // Point
    ) {
      const {idx, __action} = this
      __action.set(_root, idx, '_root')
    }

    get lock() { return this._lock }
    set lock(
      lock, // Lock,Null
    ) {
      const {idx, _lock, __action} = this
      if (_lock == lock) return

      if (_lock) _lock.key = null
      if (lock) {
        __action.get(lock.idx, idx, '_lock')
        lock.key = this
      }
      else __action.set(null, idx, '_lock')
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const {idx,__action,_locks} = level
      const closest_lock = Lock.get_closest(root, _locks)
      if (closest_lock && closest_lock.key) return closest_lock.key

      const _idx = ++level.tally
      const _key = __action.new(this, _idx)
      __action.set(_idx, _idx, '_idx')
      __action.get(_idx, '_keys', _idx)

      if (closest_lock) closest_lock.key = _key
      else _key.root = root
      return _key
    }

    remove() {
      const {idx,__action,_lock} = this
      __action.set(null, _idx)
      __action.set(null, '_keys', _idx)
      if (_lock) __action.set(null, _lock.idx, '_key')
    }
  }
  MazeGame.Key = Key

  class Jack extends Key {
    static key_bind = 'j'
    static leg_radius = 2

    set nose(
      nose, // Lock
    ) {
      const {idx, __action, _nose, _root, _long} = this
      if (nose && _nose != nose) {
        if (_nose) _nose.remove()

        const {long_min} = nose.Type
        __action.set(nose.idx, idx, '_nose')
        __action.set(_long.strip(long_min), nose.idx, '_long')
        nose.root = _root.sum(_long)
      }
    }

    set long(
      long, // Point
    ) {
      const {idx, __action, _nose, _root, Type:{radius}} = this
      const _long = long.unit.strip(radius)
      __action.set(_long, idx, '_long')

      const {long_min} = _nose.Type
      __action.set(_long.strip(long_min), _nose.idx, '_long')
      _nose.root = _root.sum(_long)
    }
    set root(
      _root, // Point
    ) {
      const {idx, __action, _nose, Type:{long_min}} = this
      const {time} = __action
      __action.set(_root, idx, '_root')

      let {_long} = this
      if (!_long) {
        _long = Point.init(time,1,0,long_min)
        __action.set(_long, idx, '_long')
      }

      _nose.root = _root.sum(_long)
    }

    set editor(
      editor, // Editor,Null
    ) {
      super.editor = editor
      this.is_open = !!editor
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _jack = super.init(level,root)
      const {idx,__action, _nose} = _jack
      if (!_nose) Lock.init(_jack, 'nose')
      __action.get(idx, '_jacks', idx)
      return _jack
    }

    remove() {
      const {idx, __action} = this
      __action.set(null, '_jacks', idx)
      super.remove()
    }
  }
  MazeGame.Jack = Jack

  return MazeGame
}
