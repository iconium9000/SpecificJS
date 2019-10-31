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
    static line_width = 0.2
    static get single_name() { return this.name.toLowerCase() }
    static get plural_name() { return this.single_name + 's' }

    constructor(
      time, // Int
    ) {
      return this._time = time
    }

    get time() { return this._time }

    static lerp(
      src_t,dst_t,mid_t, // Int
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
      src_t,dst_t,mid_t, // Int
      src,dst, // Float
    ) {
      return (dst-src)*(mid_t-src_t)/(dst_t-src_t) + dst
    }
  }
  class Int extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Int
    ) {
      return Math.floor((dst-src)*(mid_t-src_t)/(dst_t-src_t) + dst)
    }
  }
  class Point extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Point
    ) {
      const ratio = (mid_t-src_t)/(dst_t-src_t)
      const {x,y} = src
      return new Point( mid_t, (dst.x-x)*ratio+x, (dst.y-y)*ratio+y, 1, )
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
      time, // Int
      x,y,scale, // Float,Null
    ) {
      super(time)
      this._x = x != undefined ? x : 0
      this._y = y != undefined ? y : 0
      this._scale = scale != undefined ? scale : 1
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
      time, // Int
    ) {
      const {_x,_y,_scale} = this
      return new Point(time, _x,_y,_scale)
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

  class Tracker extends Type {

    // NOTE: if flag is null, defaults to this
    constructor(
      time, // Int
    ) {
      super(time)
      this._prerequisites = []
      this._exclusions = []
      this._tracker_map = {}
      this._tracker_array = []
    }
    get is_valid() {
      const {_prerequisites,_exclusions} = this
      let idx = _prerequisites.length
      while (idx > 0) if (!_prerequisites[--idx].is_valid) return false
      idx = _exclusions.length
      while (idx > 0) if (_exclusions[--idx].is_valid) return false
      return true
    }

    is_prerequisite(
      prerequisite, // Tracker
    ) {
      if (prerequisite == this) return true
      const {_prerequisites} = this
      for (const idx in _prerequisites) {
        if (_prerequisites[idx].is_prerequisite(prerequisite)) return true
      }
      return false
    }
    is_exclusion(
      exclusion, // Tracker
    ) {
      if (exclusion == this) return true
      const {_exclusions} = this
      for (const idx in _exclusions) {
        if (_exclusions[idx].is_exclusion(exclusion)) return true
      }
      return false
    }
    add_prerequisite(
      prerequisite, // Tracker
    ) {
      if (prerequisite.is_prerequisite(this)) return
      const {_prerequisites} = this
      for (const idx in _prerequisites) {
        if (_prerequisites[idx].is_prerequisite(prerequisite)) return
      }
      _prerequisites.push(prerequisite)
    }
    add_exclusion(
      exclusion, // Tracker
    ) {
      if (exclusion.is_exclusion(this)) return
      const {_exclusions} = this
      for (const idx in _exclusions) {
        if (_exclusions[idx].is_exclusion(exclusion)) return
      }
      _exclusions.push(exclusion)
    }

    remove_prerequisite_effects(prerequisite) {
      const {Type,_tracker_array, _tracker_map, _exclusions} = this
      return Type.remove_prerequisite_effects(
        _tracker_array, _tracker_map, _exclusions, prerequisite
      )
    }
    static remove_prerequisite_effects(
      _tracker_array, _tracker_map, _exclusions,
      prerequisite, // Tracker
    ) {

      if (_exclusions) {
        let idx = 0
        while (idx < _exclusions.length) {
          const exclusion = _exclusions[idx]
          if (exclusion.is_prerequisite(prerequisite)) {
            _exclusions.splice(idx,1)
          }
          else ++idx
        }
      }

      let idx = 0
      while (idx < _tracker_array.length) {
        const tracker = _tracker_array[idx]
        if (tracker.is_prerequisite(prerequisite)) {
          _tracker_array.splice(idx,1)
        }
        else {
          ++idx
          const {_tracker_array,_tracker_map,_exclusions} = tracker
          this.remove_prerequisite_effects(
            _tracker_array,_tracker_map,_exclusions,
            prerequisite,
          )
        }
      }

      let empty = idx == 0
      for (const label in _tracker_map) {
        const [tracker_array, tracker_map] = _tracker_map[label]
        if (this.remove_prerequisite_effects(
          tracker_array, tracker_map, null, prerequisite,
        )) delete _tracker_map[label]
        else empty = false
      }
      return empty
    }

    get_label(
      time, // Int
      ...labels // String,Int
    ) {
      let {_tracker_array,_tracker_map} = this
      for (const idx in labels) {
        const label = labels[idx]
        if (!_tracker_map[label]) return null;
        [_tracker_array,_tracker_map] = _tracker_map[label]
      }
      let idx = Lib.bin_idx_high(_tracker_array, time, 'time')
      while (idx >= 0) {
        const effect = _tracker_array[idx--]
        if (effect.is_valid) return effect.get_value(time)
      }
      return null
    }

    get_values(
      time, // Int
      ...labels // String,Int
    ) {
      const values = {}
      let {_tracker_array,_tracker_map} = this
      for (const idx in labels) {
        const label = labels[idx]
        if (!_tracker_map[label]) return values;
        [_tracker_array,_tracker_map] = _tracker_map[label]
      }

      for (const label in _tracker_map) {
        const value = this.get_label(time, ...labels, label)
        if (value != undefined) values[label] = value
      }
      return values
    }
  }
  MazeGame.Tracker = Tracker
  class Effect extends Tracker {

    // Note: if value is undefined, defaults to this
    // NOTE: if any prerequisite is null, defaults to this
    constructor(
      time, // Int
      description, // String
      value, // Object,Undefined,Null
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      super(time)
      this._description = description
      this._value = value === undefined ? this : value

      for (const idx in prerequisites) {
        const [prerequisite, ...labels] = prerequisites[idx]
        let {_tracker_array,_tracker_map} = prerequisite || this
        for (const idx in labels) {
          const label = labels[idx]
          if (!_tracker_map[label]) _tracker_map[label] = [[],{}];
          [_tracker_array,_tracker_map] = _tracker_map[label]
        }
        const insert_idx = 1 + Lib.bin_idx_high(_tracker_array, time, 'time')
        for (let idx = insert_idx; idx < _tracker_array.length; ++idx) {
          _tracker_array[idx].add_exclusion(this)
        }
        _tracker_array.splice(insert_idx, 0, this)
        if (prerequisite) this.add_prerequisite(prerequisite)
      }
    }

    get description() { return this._description }

    get_value(
      time, // Int
    ) {
      return time < this.time ? undefined : this._value
    }
  }
  MazeGame.Effect = Effect
  class Lerp extends Effect {

    // NOTE: if destination is null, defaults to this
    constructor(
      start_time,stop_time, // Int
      description, // String
      type, // Type (~start_value.Type, ~stop_value.Type)
      start_value,stop_value, // Type
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      super(
        start_time, `start ${description}`, start_value,
        ...prerequisites
      )
      new Effect(
        stop_time, `stop ${description}`, stop_value,
        [this,], ...prerequisites
      )
      this._stop_time = stop_time; this._stop_value = stop_value
      this._type = type
    }

    get_value(
      time, // Int
    ) {
      return (
        time < this.time ? undefined :
        time == this.time ? this._value :
        this._stop_time < time ? this._type.lerp(
          this.time, this._stop_time, time,
          this._value, this._stop_value,
        ) : this._stop_value
      )
    }
  }
  MazeGame.Lerp = Lerp

  class Game extends Tracker {

    constructor(
      time, // Int
    ) {
      super(time)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const level = this.get_label(time, 'level')
      if (level) level.draw(ctx,time,root,center)
    }
  }
  MazeGame.Game = Game
  class Level extends Effect {

    constructor(
      time, // Int
      description, // String
      game, // Game
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      super(
        time, description, undefined,
        [game, 'level', time], ...prerequisites
      )
      this._game = game
    }

    get game() { return this._game }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const locks = this.get_values(time,'lock')
      for (const label in locks) {
        locks[label].draw(ctx,time,root,center)
      }
      const jacks = this.get_values(time,'jack')
      for (const label in jacks) {
        jacks[label].draw(ctx,time,root,center)
      }
      const keys = this.get_values(time,'key')
      for (const label in keys) {
        keys[label].draw(ctx,time,root,center)
      }
      const portals = this.get_values(time,'portal')
      for (const label in portals) {
        portals[label].draw(ctx,time,root,center)
      }
      const doors = this.get_values(time,'door')
      for (const label in doors) {
        doors[label].draw(ctx,time,root,center)
      }
      const walls = this.get_values(time,'wall')
      for (const label in walls) {
        walls[label].draw(ctx,time,root,center)
      }
    }
  }
  MazeGame.Level = Level

  class Lock extends Effect {
    static key_bind = 'l'
    static long_min = 3
    static long_max = 3
    static long_round = 3
    static radius = 0.5

    static to_root(
      point
    ) {
      return point
    }
    static to_long(
      point
    ) {
      const {long_min,long_max,long_round} = this
      return point.cramp(long_min,long_max,long_round)
    }

    constructor(
      root,long, // Point @ time
      description, // String
      level, // Level
      target, // Tracker
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      const time = root.time
      super(time, description, undefined, ...prerequisites)
      this._target = target; this._level = level
      new Effect(time, 'set root', root, [this], [this, 'root'])
      new Effect(time, 'set long', long, [this], [this, 'long'])
    }
    get level() { return this._level }
    get target() { return this._target }

    static get_closest(
      spot, // Point
      locks, // Lock[],Lock{}
    ) {
      let min_dist = Infinity, return_lock = null
      for (const label in locks) {
        const lock = locks[label], type = lock.Type

        const _root = type.to_root(lock.get_label(spot.time, 'root'))
        const _long = type.to_long(lock.get_label(spot.time, 'long'))
        const _dist = _root.sum(_long).sub(spot).length

        if (_dist < min_dist && _dist < type.radius) {
          return_lock = lock
          min_dist = _dist
        }
      }
      return return_lock
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      const time = spot.time
      const level = game.get_label(time, 'level')
      if (!level || time < level.time) return null
      const {single_name,plural_name,long_min,long_max,long_round} = this


      let lock = level.get_label(time, 'target')
      if (lock) {
        const _root = lock.get_label(time, 'root')
        const _long = lock.get_label(time, 'long').unit
        const _spot = spot.sub(_root)
        const spot_dot = _spot.dot(_long, 1)

        let reset_long = null
        if (spot_dot > 0) {
          const new_long = type.to_long(_long.strip(spot_dot))
          reset_long = new Effect(
            time, `reset long`, new_long.at(time),
            [lock], [lock, 'long'],
          )
        }
        const clear_target = new Effect(
          time, `clear target`, null,
          [reset_long || lock], [level, 'target'],
        )
        return reset_long || clear_target
      }

      const locks = level.get_values(time, 'lock')
      lock = this.get_closest(spot, locks)
      if (lock) {
        const type = lock.Type
        const set_level_target = new Effect(
          time, `set level target`, lock,
          [lock], [level, 'target'],
        )
        return set_level_target
      }

      const doors = level.get_values(time, 'door')
    }

    remove(
      time, // Int
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      const {level, Type: {single_name}} = this
      const remove_lock = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [level, single_name, this.time], ...prerequisites
      )
      const key = this.get_label(time, 'key')
      if (key) key.remove(time, [remove_lock], [this, 'key'])
      return remove_lock
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __root = type.to_root(this.get_label(time, 'root'))
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = type.to_long(this.get_label(time, 'long'))
      const _long = __long.mul(center.scale)
      const _spot = _root.sum(_long)

      ctx.strokeStyle = type.stroke_color
      ctx.fill_color = type.fill_color
      ctx.lineWidth = type.line_width * center.scale
      ctx.beginPath()
      ctx.lineCap = "round"
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(ctx, _root.x, _root.y, type.radius * center.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  MazeGame.Lock = Lock

  class Wall extends Effect {
    static key_bind = 'w'
    static root_round = 1
    static long_round = 2
    static long_min = 2
    static short_min = 1
    static short_max = 1
    static short_sign = false
    static locks = []

    static get default_long() {
      const {long_min,short_min} = this
      return new Point(0,long_min,short_min)
    }
    static to_root(
      point,  // Point
    ) {
      return point.round(this.root_round)
    }
    static to_long(
      point,  // Point
    ) {
      const {long_min,long_max,long_round} = this
      return point.long.cramp(long_min,long_max,long_round)
    }
    static to_short(
      point,  // Point
    ) {
      const {short_min,short_max,short_round} = this
      return point.short.cramp(short_min,short_max,short_round)
    }
    static get_closest(
      spot, // Point
      walls, // Wall[],Wall{}
    ) {
      let min_dist = Infinity, return_wall = null
      for (const label in walls) {
        const wall = walls[label], type = wall.Type

        const _root = wall.get_label(spot.time, 'root')
        const _long = wall.get_label(spot.time, 'long')

        const root = spot.sub(type.to_root(_root))
        const long = type.to_long(_long), short = type.to_short(_long)

        const long_length = long.scale, short_length = short.scale

        let long_dot = root.dot(long,1), short_dot = root.dot(short,1)
        if (!type.short_sign && short_dot < 0) short_dot = -short_dot

        if (
          0 < long_dot && long_dot < long.scale &&
          0 < short_dot && short_dot < short.scale && short_dot < min_dist
        ) {
          return_wall = wall
          min_dist = short_dot
        }
      }
      return return_wall
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      const time = spot.time
      const level = game.get_label(time, 'level')
      if (!level || time < level.time) return null
      const {single_name,plural_name} = this

      let wall = level.get_label(time, 'target')
      if (wall) {
        const type = wall.Type
        const root = wall.get_label(time, 'root')
        const reset_long = new Effect(
          time, `reset long`, spot.sub(root).at(time),
          [wall], [wall, 'long'],
        )
        new Effect(
          time, `clear target`, null,
          [reset_long], [level, 'target'],
        )
        wall.reroot_locks(time, reset_long)
        return reset_long
      }

      const walls = level.get_values(time, single_name)
      wall = this.get_closest(spot, walls)
      if (wall) {
        const type = wall.Type
        const _root = wall.get_label(time, 'root')
        const _long = wall.get_label(time, 'long')
        const _spot = spot.sub(type.to_root(_root))
        const long = type.to_long(_long), short = type.to_short(_long)
        const long_dot = _spot.dot(long,1) / long.scale

        const set_level_target = new Effect(
          time, `set level target`, wall,
          [wall], [level, 'target'],
        )

        if (long_dot < 0.5) {
          const new_root = (
            type.short_sign ?
            _root.sum(long).sum(short).at(time) :
            _root.sum(long).at(time)
          )
          new Effect(
            time, `flipped ${single_name} root`, new_root,
            [set_level_target], [wall, 'root'],
          )
          new Effect(
            time, `flipped ${single_name} long`, spot.sub(new_root),
            [set_level_target], [wall, 'long'],
          )
          wall.reroot_locks(time, set_level_target)
        }
        else {
          new Effect(
            time, `flipped ${single_name} long`, _spot,
            [set_level_target], [wall, 'long'],
          )
        }
        return set_level_target
      }

      const new_wall = new this(
        spot, `added new ${single_name} to level`, level,
        [level], [level, 'target'], [level, single_name, time],
      )
      return new_wall
    }

    constructor(
      root, // Point @ time
      description, // String
      level, // Level
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      const time = root.time
      super( time, description, undefined, ...prerequisites )
      this._level = level
      new Effect(
        time, 'set root', this.Type.to_root(root),
        [this, 'root'],
      )
      new Effect(
        time, 'set long', this.Type.default_long.at(time),
        [this, 'long'],
      )
    }
    get level() { return this._level }

    reroot_locks(
      time, // Int
      flag, // Tracker
    ) {
      const {locks} = this.Type
      for (const lock_name in locks) {
        const lock = this.get_label(time, lock_name)
        if (lock) {
          // TODO REROOT LOCK
        }
      }
    }

    remove(
      time, // Int
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      const {locks,plural_name,single_name} = this.Type
      const remove_wall = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [this.level, single_name, this.time], ...prerequisites
      )
      for (const lock_name in locks) {
        const lock = this.get_label(time, lock_name)
        if (lock) lock.remove(time, [remove_wall], [this, lock_name])
      }
      return remove_wall
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const ___root = this.get_label(time, 'root')
      const ___long = this.get_label(time, 'long')
      const __root = type.to_root(___root)
      const __long = type.to_long(___long), __short = type.to_short(___long)
      const __spot = __long.sum(__short)

      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const _spot = _root.sum(__long.mul(center.scale))

      ctx.strokeStyle = type.stroke_color
      ctx.lineWidth = type.line_width * center.scale
      ctx.beginPath()
      ctx.lineJoin = 'round'
      ctx.lineCap = "round"
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }
  }
  MazeGame.Wall = Wall

  class Door extends Wall {
    static key_bind = 'd'
    static long_min = 4
    static short_sign = true

    static locks = {
      'root_short': [],
      'root_long': [],
      'spot_short': [],
      'spot_long': [],
    }

    constructor(
      root, // Point
      description, // String
      level, // Level
      ...prerequisites // [prerequisite: Tracker,Null, ...labels: String,Int]
    ) {
      super(root, description, level, ...prerequisites)
      new Effect(
        this.time, 'set open_long', 0,
        [this], [this, 'open_long'],
      )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __open_long = this.get_label(time, 'open_long')
      const __root = type.to_root(this.get_label(time, 'root'))
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_label(time, 'long')
      const _long = type.to_long(__long).mul(center.scale)
      const _short = type.to_short(__long).mul(center.scale)
      const _spot = _root.sum(_long).sum(_short)

      ctx.lineWidth = type.line_width * center.scale
      ctx.strokeStyle = type.stroke_color
      ctx.fill_color = type.fill_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (1 <= __open_long) {
        const mid_root = _long.div(2).sum(_root)
        const mid_spot = mid_root.sum(_short)

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        mid_root.moveTo = ctx
        mid_spot.lineTo = ctx
        ctx.closePath()
        ctx.stroke()
      }
      else if (0 < __open_long) {
        const _open_long = _long.mul(__open_long/2)

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_open_long).lineTo = ctx
        _root.sum(_open_long).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.moveTo = ctx
        _spot.sub(_open_long).lineTo = ctx
        _spot.sub(_open_long).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      ctx.beginPath()
      _root.moveTo = ctx
      _root.sum(_short).lineTo = ctx
      _root.sum(_long,_short.scale).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineCap = "round"
      _spot.moveTo = ctx
      _spot.sub(_short).lineTo = ctx
      _spot.sub(_long,_short.scale).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
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
    ) / 2 * (this.short_max - this.short_mid)
    static radius = Math.sqrt(
      Math.pow(this.short_max - this.center_short, 2) +
      Math.pow(this.long_max - this.center_long, 2)
    )
    static locks = {
      lock_root: [ 0, 2, 0,-1, 0],
      lock_cent: [ 0, 4, 0,-1, 0],
      lock_spot: [ 0, 6, 0,-1, 0],
    }

    static to_center(
      root,short,long, // Point
    ) {
      const {mid_short,center_long} = this.Type
      return root.sum(long, center_long).sum(short, short_mid)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __open_long = this.get_label(time, 'open_long')
      const __root = type.to_root(this.get_label(time, 'root'))
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_label(time, 'long')
      const _long = type.to_long(__long).mul(center.scale)
      const _short = type.to_short(__long).mul(center.scale)
      const _spot = _root.sum(_long).sum(_short)

      ctx.lineWidth = type.line_width * center.scale
      ctx.strokeStyle = type.stroke_color
      ctx.fill_color = type.fill_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (1 <= __open_long) {
        const mid_root = _long.div(2).sum(_root)
        const mid_spot = mid_root.sum(_short)

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        mid_root.moveTo = ctx
        mid_spot.lineTo = ctx
        ctx.closePath()
        ctx.stroke()
      }
      else if (0 < __open_long) {
        const _open_long = _long.mul(__open_long/2)

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_open_long).lineTo = ctx
        _root.sum(_open_long).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.moveTo = ctx
        _spot.sub(_open_long).lineTo = ctx
        _spot.sub(_open_long).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      ctx.beginPath()
      _root.moveTo = ctx
      _root.sum(_short).lineTo = ctx
      _root.sum(_long,_short.scale).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineCap = "round"
      _spot.moveTo = ctx
      _spot.sub(_short).lineTo = ctx
      _spot.sub(_long,_short.scale).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }


  return MazeGame
}
