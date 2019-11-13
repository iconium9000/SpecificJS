module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  function table_to_string(
    table, // Object{}
  ) {
    return JSON.stringify(table, null, '  ')
  }
  let sanity = 100
  function object_to_type(
    object, // Object,Type,Null
  ) {
    if (sanity-- < 0) throw `bad sanity`
    if (object == undefined) return null
    const {_time,_type} = object
    if (typeof object != 'object') return object

    let type = object
    if (_type) type = new MazeGame[_type](_time)
    for (const label in object) {
      type[label] = object_to_type(object[label])
    }
    return type
  }
  function string_to_table(
    string, // String
  ) {
    try {
      return object_to_type(JSON.parse(string))
    }
    catch(e) {
      log(e)
      return {}
    }
  }

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

  class Action extends Type {
    get idx() { return this._idx }
    get prev_action() { return this._prev_action }

    static init(
      time, // Float
      table, // Object{}
      holder, // Game,Level
      idx_label, // String
    ) {
      const action = new Action(time)
      let {tally} = holder
      action._idx = ++tally
      action._old = {}; action._new = {}
      action._prev_action = holder.action
      action._table_old = {}; action._table_new = {}
      action.set_table(action.idx, table, action)
      const prev_action = table[holder.action]
      if (prev_action) {
        action.set(prev_action.idx, table, 'prev_action', )
      }
      action.set(holder[idx_label], table, 'action', action.idx)
      action.set(holder[idx_label], table, 'tally', tally)
      return action
    }
    set_table(
      idx, // Int
      table, // Object{}
      object, // Object
    ) {
      const {_table_old} = this
      if (_table_old[idx] !== undefined) return
      _table_old[idx] = table[idx] || null
      table[idx] = object
    }
    // NOTE: assumes that table @ idx is defined
    save(
      idx, // Int
      table, // Object{}
      label, // String
    ) {
      const {_old} = this
      if (!_old[idx]) _old[idx] = {}
      const map = _old[idx]
      if (map[label] === undefined) map[label] = table[idx][label] || null
    }
    // NOTE: assumes that table @ idx is defined
    set(
      idx, // Int
      table, // Object{}
      label, // String
      value, // Object,Null,Undefined
    ) {
      this.save(idx,table,label)
      
      const {_new} = this
      if (!_new[idx]) _new[idx] = {}
      _new[idx][label] = value || null
      Lib.set(table[idx],label,value)
    }
    restore(
      table, // Int
    ) {
      const {_old,_table_old} = this
      for (const idx in _old) {
        const map = _old[idx], object = table[idx]
        for (const label in map) Lib.set(object, label, map[label])
      }
      for (const idx in _table_old) Lib.set(table, idx, _table_old[idx])
    }
  }
  MazeGame.Action = Action

  class Game extends Type {
    get g_idx() { return 0 }
    get root_level() { return this._root_level }
    get editors() { return this._editors }

    static init(
      time, // Float
    ) {
      const game = new Game(time)
      const g_table = {[game.tally = game.g_idx]: game}
      game.prev_action = -1
      const g_action = Action.init(time,g_table,game,'g_idx')
      g_action.set_table(game._editors = ++game.tally, g_table, {})
      game._root_level = -1
      Level.init(time,g_table,game)
      return g_table
    }
  }
  MazeGame.Game = Game

  class Editor extends Type {
    get g_idx() { return this._g_idx }
    get l_idx() { return this._l_idx }
    get game() { return this._game }
    get level() { return this._level }
    get id() { return this._id }
    get name() { return this._name }

    static init(
      time, // Float
      g_table, // Object{}
      game, // Game
      name,id, // String
    ) {

    }
  }
  MazeGame.Editor = Editor

  class Level extends Type {
    get g_idx() { return this._g_idx }
    get l_idx() { return 0 }
    get l_table() { return this._l_table }
    get walls() { return this._map_walls }
    get doors() { return this._map_doors }
    get portals() { return this._map_portals }
    get locks() { return this._map_locks }
    get lasers() { return this._map_lasers }
    get keys() { return this._map_keys }
    get jacks() { return this._map_jacks }

    static init(
      time, // Float
      g_table, // Object{}
      game, // Game
    ) {
      const level = new Level(time)

      const g_action = g_table[game.action]
      g_action.set_table(level._g_idx = ++game.tally, g_table, level)

      const prev_level = g_table[game.root_level]
      if (prev_level) {
        const next_level = g_table[prev_level.next_level]
        if (next_level) {
          g_action.set(next_level.g_idx, g_table, `prev_level`, level.g_idx)
        }
        g_action.set(level.g_idx, g_table, `next_level`, prev_level.next_level)
        g_action.set(prev_level.g_idx, g_table, `next_level`, level.g_idx)
      }
      else g_action.set(level.g_idx, g_table, `next_level`, game.root_level)
      g_action.set(level.g_idx, g_table, `prev_level`, game.root_level)
      g_action.set(game.g_idx, g_table, `root_level`, level.g_idx)

      const l_table = {
        [level.tally = level.l_idx]: level,
        [level._map_walls = ++level.tally]: {},
        [level._map_doors = ++level.tally]: {},
        [level._map_portals = ++level.tally]: {},
        [level._map_locks = ++level.tally]: {},
        [level._map_lasers = ++level.tally]: {},
        [level._map_keys = ++level.tally]: {},
        [level._map_jacks = ++level.tally]: {},
      }
      g_action.set_table(level._l_table = ++game.tally, g_table, l_table)

      level.action = -1
      Action.init(time, l_table, level,'l_idx')
    }
  }
  MazeGame.Level = Level

  {
    const time = Lib.time
    const g_table = Game.init(time)
    const game = g_table[0]
    const txt = table_to_string(g_table)
    // log(txt)
    log(g_table, string_to_table(txt))
  }

  class Lock extends Type {}
  MazeGame.Lock = Lock

  class Laser extends Lock {}
  MazeGame.Laser = Laser

  class Wall extends Type {}
  MazeGame.Wall = Wall

  class Door extends Wall {}
  MazeGame.Door = Door

  class Portal extends Door {}
  MazeGame.Portal = Portal

  class Key extends Type {}
  MazeGame.Key = Key

  class Jack extends Key {}
  MazeGame.Jack = Jack

  return MazeGame
}
