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

    static to_type(
      object, // Object,Type,Null
    ) {
      if (object == undefined) return null
      const {_time,_type} = object
      if (typeof object != 'object') return object

      let type = object
      if (_type) type = new MazeGame[_type](_time)
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

  // Like a scope
  class Table extends Type {
    // Path: (String,Int)[]
    get path() { return this._path } // Table.Path (from table)
    get table() { return this._table } // Table.Path (from root table to this table)

    tally = 0

    static to_string(
      table, // Table
    ) {
      return JSON.stringify(table, null, '  ')
    }

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
      label, // String,Null
      ...labels // String
    ) {
      return (
        !table || !label ? table :
        labels.length ? this.get(table[label], labels) : table[label]
      )
    }

    static set(
      table, // Table
      value, // Object,Null
      label, // String
      ...labels // String
    ) {
      if (labels.length) this.set(table[label], value, ...labels)
      else Lib.set(table, label, value)
    }

    static fill(
      table, // Table
      value, // Object,Null
      label, // String
      ...labels // String
    ) {
      if (labels.length) {
        if (!table[label]) table[label] = {}
        this.fill(table[label], value, ...labels)
      }
      else table[label] = value
    }

    static init(
      time, // Float
      table, // Table,Null
      ...path // String
    ) {
      const _table = super.init(time)
      _table._path = path
      _table._table = table ? table.path : []
      return _table
    }
  }
  MazeGame.Table = Table

  class Action extends Table {
    // Idx: Int (action = this table @ idx)

    get idx() { return this._path[0] } // Int
    get prev_action() { return this._prev_action } // Action.Idx
    get editor() { return this._editor } // Editor.Path,Null

    static init(
      time, // Float
      table, // Table
      editor, // Editor,Null
    ) {
      let {tally} = table
      const _action_idx = ++tally
      const _action = super.init(time, table, _action_idx)
      _action._prev_action = table.action
      _action._editor = editor ? editor.path : null
      table[_action_idx] = _action
      _action.set(table, _action_idx, 'action')
      _action.set(table, tally, 'tally')
      return _action
    }

    set(
      table, // Table
      value, // Object,Null,Undefined
      label, // String
      ...labels // String
    ) {
      const {_map} = this
      const old_value = Table.get(table, label, ...labels)
      this[++this.tally] = [old_value, value, label, ...labels]
      Table.set(table, value, label, ...labels)
    }

    clear() {
      let tally = 0
      while (tally < this.tally) this[++tally][0] = 0
    }

    static apply(
      time, // Float
      table, // Table
      action, // Action
    ) {
      table = Table.get(table, ...action.table)
      
    }

    apply(
      table, // Table
    ) {
      let tally = 0
      while (tally < this.tally) {
        const _this = this[++tally]
        const [ _, new_value, label, ...labels] = _this
        const old_value = Table.get(table, label, ...labels)
        _this[0] = old_value
        Table.set(table, new_value, label, ...labels)
      }
    }

    reset(
      table, // Table
    ) {
      let {tally} = this
      while (tally > 0) {
        const [old_value, new_value, label, ...labels] = this[tally--]
        Table.set(table, old_value, label, ...labels)
      }
    }
  }
  MazeGame.Action = Action

  class Game extends Table {
    get editors() { return this._editors }

    action = 0
    root_level = 0
    _editors = {}

    static init(
      time, // Float
    ) {
      const _game = super.init(time)
      Action.init(time, _game)
      Level.init(time, _game)
      return _game
    }

  }
  MazeGame.Game = Game

  class Editor extends Table {

  }
  MazeGame.Editor = Editor

  class Level extends Table {
    get editors() { return this._editors }

    _editors = {}
    next_level = 0
    action = 0

    static init(
      time, // Float
      game, // Game
    ) {
      const action = game[game.action]
      let {tally} = game
      const _level_idx = ++tally
      const _level = super.init(time, game, _level_idx)

      Action.init(time, _level)

      _level.prev_level = game.root_level
      const prev_level = game[game.root_level]
      if (prev_level) {
        _level.next_level = prev_level.next_level
        const next_level = game[prev_level.next_level]
        if (next_level) {
          action.set(game, _level_idx, ...next_level.path, 'prev_level')
        }
        action.set(game, _level_idx, ...prev_level.path, 'next_level')
      }
      else _level.next_level = 0

      action.set(game, _level_idx, 'root_level')
      action.set(game, tally, 'tally')

      action.set(game, Type.to_type(_level), _level_idx)
      Table.set(game, _level, _level_idx)

      return _level
    }
  }
  MazeGame.Level = Level

  {
    const time = Lib.time
    const game = Game.init(time)
    const txt = Table.to_string(game)
    log(Table.to_table(txt))
  }

  class Lock extends Table {}
  MazeGame.Lock = Lock

  class Laser extends Lock {}
  MazeGame.Laser = Laser

  class Wall extends Table {}
  MazeGame.Wall = Wall

  class Door extends Wall {}
  MazeGame.Door = Door

  class Portal extends Door {}
  MazeGame.Portal = Portal

  class Key extends Table {}
  MazeGame.Key = Key

  class Jack extends Key {}
  MazeGame.Jack = Jack

  return MazeGame
}
