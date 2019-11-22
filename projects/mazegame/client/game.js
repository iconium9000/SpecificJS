module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  let sanity = 100

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

    static serialize(
      object, // Object,Type,Null
    ) {
      if (!object || typeof object != 'object') return object
      else if (MazeGame[object._type]) return object.serialize
      const serialize = Array.isArray(object) ? [] : {}
      for (const label in object) {
        serialize[label] = this.serialize(object[label])
      }
      return serialize
    }

    get serialize() {
      const {Type} = this, serialize = {}
      for (const label in this) serialize[label] = Type.serialize(this[label])
      return serialize
    }

    get to_string() { return JSON.stringify(this.serialize, null, '  ') }

    static to_type(
      object, // Object,Type,Null
    ) {
      if (!object || typeof object != 'object') return object
      const {_time,_type} = object

      let type = object
      if (MazeGame[_type]) type = new MazeGame[_type](_time)
      for (const label in object) type[label] = this.to_type(object[label])
      return type
    }

    static init(
      time, // Float
    ) {
      return new this(time)
    }

    constructor(
      time, // Float
    ) {
      this._type = this.Type.name
      this._time = time
    }

    get time() { return this._time }

    // returns this.Type
    get Type() {
      return this.constructor
    }

    at(
      time, // Float
    ) {
      return this
    }
  }
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

  // Like a scope
  class Table extends Type {
    // Path: (String)[]
    get build() { return this } // Table

    static to_table(
      string, // String
    ) {
      try {
        return this.to_type(JSON.parse(string))
      }
      catch(e) {
        log(e)
        return {}
      }
    }

    static get(
      table, // Table
      ...labels // String
    ) {
      if (labels.length && table) {
        const [_label, ..._labels] = labels
        return this.get(table[_label], ..._labels)
      }
      else return table
    }

    static set(
      table, // Table
      value, // Object,Null
      label,...labels // String
    ) {
      if (labels.length) {
        if (!table[label]) table[label] = {}
        this.set(table[label], value, ...labels)
      }
      else Lib.set(table, value, label)
    }

    static _init(
      table, // Table @ idx
      idx, // String
    ) {
      const action = table[table.action]
      const _table = action.new(table, this, idx)
      return _table
    }

    static init(
      time, // Float
      ...labels // String
    ) {
      const _table = super.init(time)
      _table.tally = 0
      return _table
    }

    at(
      time, // Float
    ) {
      while (time < this[this.action].time && this[this.action].revert(this));
    }
  }
  MazeGame.Table = Table

  class Action extends Table {

    get idx() { return this._idx }
    get table() { return this._table }
    get prev_action() { return this._prev_action }

    static init(
      time, // Float
      table, // Table @ ...labels
      root_action, // Action,Null
      action_idx, // String
      ...labels // String
    ) {
      const _action = super.init(time)
      const _table = Table.get(table, ...labels)

      _action._table = labels
      _action._idx = action_idx

      _action._prev_action = _table.action
      _action.set(_table, action_idx, 'action')
      Table.set(_table, _action, action_idx)

      return _action
    }

    set(
      table, // Table
      value, // Object,Null
      label,...labels // String
    ) {
      const {_table} = this
      const _old_value = Table.get(table, label, ...labels)
      this[++this.tally] = ['set', _old_value, value, label, ...labels]
      Table.set(table, value, label, ...labels)
      return value
    }

    new(
      table, // Table
      type, // Type
      label,...labels // String
    ) {
      const {_table,time} = this
      const _old_value = Table.get(table, label, ...labels)
      this[++this.tally] = ['new', _old_value, type.name, label, ...labels]
      const _new_value = new MazeGame[type.name](time)
      Table.set(table, _new_value, label, ...labels)
      return _new_value
    }

    get serialize() {
      const serialize = super.serialize

      const {tally} = this
      let idx = 0
      while (idx < tally) serialize[++idx][1] = 0

      return serialize
    }

    apply(
      table, // Table
    ) {
      const {tally, _table, _idx, time, } = this
      Table.set(table, this, _idx)
      let idx = 0
      while (idx < tally) {
        const setter = this[++idx]
        const [tok, old_value, new_value, ...labels] = setter
        setter[1] = Table.get(table, ...labels)
        if (tok == 'new') {
          Table.set(table, new MazeGame[new_value](time), ..._labels)
        }
        else if (tok == 'set') Table.set(table, new_value, ..._labels)
      }
    }

    revert(
      table, // Table
    ) {
      const {tally, _table, _idx, _prev_action} = this
      if (!_prev_action) return false

      let idx = tally
      while (idx > 0) {
        const setter = this[--idx]
        const [tok, old_value, new_value, ...labels] = setter
        Table.set(table, old_value, ..._labels)
      }

      return true
    }
  }
  MazeGame.Action = Action

  class Game extends Table {

    static init(
      time, // Float
    ) {
      const _game = super.init(time)

      _game.action = 0
      const _action_idx = ++_game.tally
      const _action = Action.init(time, _game, null, _action_idx)

      _game.level = 0
      const _level_idx = ++_game.tally
      const _level = Level.init(_game, _level_idx)

      return _game
    }


  }
  MazeGame.Game = Game

  class Editor extends Table {

    static _init(
      game, // Game
      id, // String
    ) {
      const _editor = super._init(game, id)
      const action = game[game.action]
      action.set(game, game.level, id, 'level')
      action.set(game, id, id, 'id')
      action.set(game, true, 'editors', id)
      return _editor
    }
    static init(
      game, // Game
      id,name, // String
    ) {
      const _editor = this._init(game, id)
      const action = game[game.action]
      action.set(game, name, id, 'name')
      return _editor
    }
  }
  MazeGame.Editor = Editor

  class Level extends Table {

    static init(
      game, // Game
      level_idx, // String
    ) {
      const action = game[game.action]
      const {time} = action
      const _level = action.new(game, Level, level_idx)

      _level.tally = _level.action = 0
      const _action_idx = ++_level.tally
      const _action = Action.init(time, game, null, _action_idx, level_idx)

      const prev_level = game.level
      action.set(game, level_idx, 'level')
      action.set(game, prev_level, level_idx, 'prev_level')
      if (game[prev_level]) {
        const {next_level} = game[prev_level]
        if (game[next_level]) {
          action.set(game, level_idx, next_level, 'prev_level')
        }
        action.set(game, level_idx, prev_level, 'next_level')
        action.set(game, next_level, level_idx, 'next_level')
      }
      else action.set(game, 0, level_idx, 'next_level')

      _action.set(_level, _level.tally, 'tally')
      return _level
    }

  }
  MazeGame.Level = Level

  class Lock extends Table {}
  MazeGame.Lock = Lock

  class Laser extends Lock {}
  MazeGame.Laser = Laser

  class Wall extends Table {
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
      point, // Point
    ) {
      const {
        short_sign,
        short_min,short_max,short_round,
        long_min,long_max,long_round,
      } = this.Type
      this._long = point.long.cramp(long_min, long_max, long_round)
      this._short = point.short.cramp(short_min, short_max, short_round)
      this._spot = this._root.sum(this._long)
      if (short_sign) this._spot = this._spot.sum(this._short)
    }
    set root(
      point, // Point
    ) {
      const {root_round,short_sign} = this.Type, {time} = point
      this._root = point.round(root_round)
      if (!this._long) this.long = Point.init(time,1,1)
      else {
        this._spot = this._root.sum(this._long)
        if (short_sign) this._spot = this._spot.sum(this._short)
      }
    }

    static _init(
      level, // Level
      wall_idx, // Wall
    ) {
      const _wall = super._init(level, wall_idx)
      const action = level[level.action]
      action.set(level, true, 'walls', wall_idx)
      return _wall
    }
    static init(
      root, // Point @ time:action.time
      level, // Level
      wall_idx, // String
    ) {
      const _wall = this._init(level, wall_idx)
      const action = level[level.action]
      action.set(level, root, wall_idx, 'root')
      action.set(level, true, wall_idx, 'is_open')
      action.set(level, 1, wall_idx, 'open')
      return _wall
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

    static locks = {
      root_short:[0.5,   0,0, 0,-1],
      root_long: [  0, 0.5,0,-1, 0],
      spot_long: [  1,-0.5,1, 1, 0],
      spot_short:[0.5,   0,1, 0, 1],
    }
    static lock_names = ['root_short','root_long','spot_long','spot_short']

    static _init(
      level, // Level
      door_idx, // Door
    ) {
      const _door = super._init(level, door_idx)
      const action = level[level.action]
      action.set(level, true, 'doors', door_idx)
      return _door
    }
  }
  MazeGame.Door = Door

  class Portal extends Door {
    static key_bind = 'p'
    static short_min = 3
    static short_max = this.short_min
    static long_min = 12
    static long_max = this.long_min
    static short_mid = this.short_max / 2
    static center_long = this.long_max / 2
    static center_short = (
      this.short_max*this.short_max - this.short_mid*this.short_mid +
      this.long_max * this.long_max / 4
    ) / 2 / (this.short_max - this.short_mid)
    static radius = Math.sqrt(
      Math.pow(this.short_max - this.center_short, 2) +
      Math.pow(this.long_max - this.center_long, 2)
    )
    static locks = {
      root: [0,0,1/4,-1,0],
      cent: [0,0,1/2,-1,0],
      spot: [0,0,3/4,-1,0],
    }
    static lock_names = ['root','cent','spot',]
    static is_portal = true

    static _init(
      level, // Level
      portal_idx, // Portal
    ) {
      const _portal = super._init(level, portal_idx)
      const action = level[level.action]
      action.set(level, true, 'portals', portal_idx)
      return _portal
    }
  }
  MazeGame.Portal = Portal

  class Key extends Table {}
  MazeGame.Key = Key

  class Jack extends Key {}
  MazeGame.Jack = Jack

  return MazeGame
}
