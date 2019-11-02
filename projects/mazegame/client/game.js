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
      return (dst-src)*(mid_t-src_t)/(dst_t-src_t) + src
    }
  }
  class Int extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Int
    ) {
      return Math.floor((dst-src)*(mid_t-src_t)/(dst_t-src_t) + src)
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

    // Note: if value is undefined, defaults to this
    constructor(
      time, // Int
      description, // String
      value, // Object,Undefined,Null
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(time)
      this._description = description
      this._value = value === undefined ? this : value
      this._prereq_paths = prereq_paths
      this._prereqs = []
      this._prexcls = []
      this._postreqs = []
      this._postxcls = []
      this._effect_array = []
      this._effect_array._map = {}
      this._effect_array._count = 0
      this._effect_array._super = null
      this._is_valid = true
      this._is_dead = false

      for (const idx in prereq_paths) {
        const [prereq, ...labels] = prereq_paths[idx]

        let {_effect_array} = prereq
        for (const idx in labels) {
          const label = labels[idx]
          let effect_array = _effect_array._map[label]
          if (!effect_array) {
            ++_effect_array._count
            effect_array = _effect_array._map[label] = []
            effect_array._count = 0
            effect_array._map = {}
            effect_array._super = _effect_array
            effect_array._label = label
          }
          _effect_array = effect_array
        }

        let insert_idx = Lib.bin_insert(_effect_array, this, 'time')
        for (let idx = insert_idx; idx < _effect_array.length; ++idx) {
          const postxcl = _effect_array[idx]
          Lib.bin_insert(this._postxcls, postxcl, 'time')
          Lib.bin_insert(postxcl._prexcls, this, 'time')
        }
        Lib.bin_insert(this._prereqs, prereq, 'time')
        Lib.bin_insert(prereq._postreqs, this, 'time')
        if (!prereq._is_valid) this._is_valid = false
      }

      for (const idx in this._is_valid && this._postxcls) {
        const postxcl = this._postxcls[idx]
        postxcl._is_valid = false
      }
    }

    get description() { return this._description }

    get is_valid() { return this._is_valid }

    _clear_if(
      effect_array, // TrackerArray
    ) {
      const {length, _count, _super, _label} = effect_array
      if (_super && length == 0 && _count == 0) {
        --_super._count
        delete _super._map[_label]
        this._clear_if(_super)
      }
    }

    _get_effect_array(
      ...labels // String
    ) {
      let {_effect_array} = this
      for (const idx in labels) {
        _effect_array = _effect_array._map[labels[idx]]
        if (!_effect_array) return null
      }
      return _effect_array
    }

    kill() {
      if (this._is_dead) return
      const {_prereq_paths,_prereqs,_prexcls,_postreqs,_postxcls,} = this
      this._is_dead = true; this._is_valid = false
      this._prereq_paths = []; this._prereqs = []; this._prexcls = []
      this._postreqs = []; this._postxcls = []

      for (const idx in _prereq_paths) {
        const [prereq, ...labels] = _prereq_paths[idx]
        const effect_array = prereq._get_effect_array(...labels)
        if (
          effect_array &&
          Lib.bin_delete(effect_array, this, 'time')
        ) prereq._clear_if(effect_array)
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
      for (const idx in _postxcls) {
        const postxcl = _postxcls[idx]
        if (Lib.bin_delete(postxcl._prexcls, this, 'time')) {
          postxcl._is_valid = true
          for (const req_idx in postxcl._prereqs) {
            if (!postxcl._prereqs[req_idx]._is_valid) {
              postxcl._is_valid = false
              break
            }
          }
          for (const xcl_idx in postxcl._is_valid && postxcl._prexcls) {
            if (postxcl._prexcls[xcl_idx]._is_valid) {
              postxcl._is_valid = false
              break
            }
          }
        }
      }
    }

    get_value(
      time, // Int
    ) {
      return time < this.time ? undefined : this._value
    }

    get_label(
      time, // Int
      ...labels // String,Int
    ) {
      const _effect_array = this._get_effect_array(...labels)
      if (!_effect_array) return undefined

      let idx = Lib.bin_idx_high(_effect_array, time, 'time')
      while (idx >= 0) {
        const effect = _effect_array[idx--]
        if (effect._is_valid) return effect.get_value(time)
      }
      return null
    }

    get_values(
      time, // Int
      ...labels // String,Int
    ) {
      const values = {}
      const _effect_array = this._get_effect_array(...labels)
      if (!_effect_array) return values

      for (const label in _effect_array._map) {
        const value = this.get_label(time, ...labels, label)
        if (value != undefined) values[label] = value
      }
      return values
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
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        start_time, `start ${description}`, start_value,
        ...prereq_paths
      )
      this._stop_effect = new Effect(
        stop_time, `stop ${description}`, stop_value,
        [this,], ...prereq_paths
      )
      this._stop_time = stop_time; this._stop_value = stop_value
      this._type = type
    }

    get stop_effect() { return this._stop_effect }

    get_value(
      time, // Int
    ) {
      return (
        time < this.time ? undefined :
        time == this.time ? this._value :
        time < this._stop_time ? this._type.lerp(
          this.time, this._stop_time, time,
          this._value, this._stop_value,
        ) : this._stop_value
      )
    }
  }
  MazeGame.Lerp = Lerp

  class Game extends Effect {

    constructor(
      time, // Int
    ) {
      super(time, `created new game`, undefined)
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
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        time, description, undefined,
        [game], [game, 'level', time], ...prereq_paths
      )
      this._game = game
    }

    get game() { return this._game }

    check(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {

      const doors = this.get_values(time, 'door')
      const open_portals = []

      for (const label in doors) {
        const door = doors[label]
        door.was_closed = !door.get_label(time, 'is_open')
        door.is_open = true
        door.locks = door.get_values(time, 'lock')
        for (const name in door.locks) {
          const lock = door.locks[name]
          const is_open = lock.get_label(time, 'is_open')
          if (!is_open) door.is_open = false
        }
        if (door.is_open && door.Type.is_portal) open_portals.push(door)
      }

      const [root_portal,spot_portal] = open_portals
      if (open_portals.length != 2) {
        const portals = this.get_values(time, 'portal')
        for (const label in portals) {
          const portal = portals[label]
          portal.is_open = false
        }
      }

      for (const label in doors) {
        const door = doors[label]
        const type = door.Type

        if (type.is_portal) {
          const prev_other_portal = this.get_label(time, 'other_portal')
          const other_portal = (
            !door.is_open ? null :
            door == root_portal ? spot_portal :
            door == spot_portal ? root_portal :
            null
          )
          if (prev_other_portal != other_portal) {
            new Effect(
              time, `change other_portal`, other_portal,
              [door], [door, 'other_portal'], ...prereq_paths
            )
          }
        }

        if (door.was_closed == door.is_open) {
          const change_open = new Effect(
            time, `change is_open to ${door.is_open}`, door.is_open,
            [door], [door, 'is_open'], ...prereq_paths
          )
          const _long = door.get_label(time, 'long')
          const long = type.to_long(_long).scale
          const long_open = door.get_label(time, 'long_open')

          if (door.is_open && 0 < long_open) {
            const next_time = time + long_open * long / type.speed
            new Lerp(
              time, next_time, `lerp long_open to 0`, Float,
              long_open, 0,
              [change_open], [door, 'long_open'],
            )
          }
          else if (!door.is_open && long_open < 1) {
            const next_time = time + (1-long_open) * long / type.speed
            new Lerp(
              time, next_time, `lerp long_open to 1`, Float,
              long_open, 1,
              [change_open], [door, 'long_open'],
            )
          }
        }
      }
    }

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
    static search_radius = 3 * this.radius

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

    get level() { return this._level }
    get target() { return this._target }
    get name() { return this._name }

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

        if (_dist < min_dist && _dist < type.search_radius) {
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
        const type = lock.Type
        const __root = lock.get_label(time, 'root')
        const __long = lock.get_label(time, 'long').unit
        const _root = type.to_root(__root)
        const _key = lock.get_label(time, 'key')
        const _spot = spot.sub(_root)

        let spot_dot = _spot.dot(__long, 1)
        if (spot_dot < type.long_min) spot_dot = type.long_min

        const __new_long = __long.strip(spot_dot).at(time)
        const _new_long = type.to_long(__new_long)
        const _new_spot = _root.sum(_new_long)
        const reset_long = new Effect(
          time, `reset long`, _new_long,
          [lock], [lock, 'long'],
        )
        if (_key) {
          _key.reset_root(time, _new_spot, [reset_long])
        }
        new Effect(
          time, `clear target`, null,
          [reset_long], [level, 'target'],
        )
        return reset_long
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
      const door = Door.get_closest(spot, doors)
      if (door) {
        const type = door.Type
        const n_names = type.lock_names.length

        const __root = door.get_label(time, 'root')
        const __long = door.get_label(time, 'long')
        const _root = type.to_root(__root)
        const _long = type.to_long(__long)

        const long_dot = spot.sub(_root).dot(_long,1) / _long.scale
        const name = type.lock_names[Math.floor(long_dot * n_names)]

        const old_lock = door.get_label(time, 'lock', name)
        if (type.locks[name] && !old_lock) {
          const new_lock = new this(
            time, `added new ${single_name}`, name, level, door,
            [level, single_name, time],
          )
          if (this.long_min < this.long_max) {
            new Effect(
              time, `set new target as ${this.name}`, new_lock,
              [new_lock], [level, 'target'],
            )
          }
          door.reroot_lock(time, name, /*[new_lock]*/)
          return new_lock
        }
        else return null
      }

      return null
    }

    constructor(
      time, // Point @ time
      description,name, // String
      level, // Level
      target, // Tracker
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        time, description, undefined,
        [level], [target], [target, 'lock', name], ...prereq_paths
      )
      new Effect(
        time, `set is_open to false`, false,
        [this], [this, 'is_open'],
      )
      this._level = level; this._target = target; this._name = name
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const {_level, _target, _name, } = this
      const {single_name} = this.Type
      const remove_lock = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [_target], [_target, 'lock', _name],
        [_level, single_name, this.time],
        ...prereq_paths
      )
      const key = this.get_label(time, 'key')
      if (key) key.remove(time, [remove_lock])
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

      ctx.lineCap = 'round'
      ctx.strokeStyle = type.stroke_color
      ctx.fillStyle = type.fill_color
      ctx.lineWidth = type.line_width * center.scale
      ctx.beginPath()
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, type.radius * center.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  MazeGame.Lock = Lock

  class Laser extends Lock {
    static key_bind = 's'
    static long_min = 9
    static long_max = Infinity

    constructor(
      time, // Point @ time
      description,name, // String
      level, // Level
      target, // Tracker
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        time, description, name, level, target,
        [level, 'lock', time], ...prereq_paths
      )
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      return super.remove(
        time, [this._level, 'lock', this.time],
        ...prereq_paths
      )
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
      const long_min = Lock.long_min * center.scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = type.thin_line_width * center.scale
      ctx.strokeStyle = type.thin_stroke_color

      ctx.beginPath()
      _root.sum(_long, long_min).lineTo = ctx
      _spot.sub(_long, long_min).lineTo = ctx
      ctx.stroke()

      ctx.strokeStyle = type.stroke_color
      ctx.lineWidth = type.line_width * center.scale

      ctx.beginPath()
      _root.moveTo = ctx
      _root.sum(_long, long_min).lineTo = ctx
      ctx.stroke()

      ctx.beginPath()
      _spot.sub(_long, long_min).lineTo = ctx
      _spot.lineTo = ctx
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, type.radius * center.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  MazeGame.Laser = Laser

  class Wall extends Effect {
    static key_bind = 'w'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static short_min = 2
    static short_max = 2
    static short_sign = false
    static locks = {}
    static lock_names = []
    static is_portal = false

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
        wall.reroot_locks(time, [reset_long])
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
          wall.reroot_locks(time, [set_level_target])
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
        [level], [level, 'target'],
        [level, single_name, time],
      )
      return new_wall
    }

    constructor(
      root, // Point @ time
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const time = root.time
      super( time, description, undefined, ...prereq_paths )
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

    reroot_lock(
      time, // Int
      lock_name, // String
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const lock = this.get_label(time, 'lock', lock_name)
      if (lock) {
        const type = this.Type, lock_type = lock.Type
        const __root = this.get_label(time, 'root')
        const __long = this.get_label(time, 'long')
        const _lock_long = lock.get_label(time, 'long')
        const _root = type.to_root(__root)
        const _long = type.to_long(__long)
        const _short = type.to_short(__long)
        const _long_short = _long.strip(_short.scale)

        const _key = lock.get_label(time, 'key')

        const [
          short,long_short,long,
          lock_short,lock_long,
        ] = type.locks[lock_name]

        const _new_root = lock_type.to_root(
          _root.at(time).sum(_short.mul(short) )
          .sum(_long_short.mul(long_short))
          .sum(_long.mul(long))
        )
        const _new_long = lock_type.to_long(
          _short.at(time).mul(lock_short)
          .sum(_long.mul(lock_long))
          .unit.strip(_lock_long ? _lock_long.length : lock_type.long_min)
        )

        const reset_root = new Effect(
          time, `reset root`, _new_root,
          [this], [lock], [lock, `root`], ...prereq_paths,
        )
        new Effect(
          time, `reset long`, _new_long,
          [reset_root], [lock, `long`]
        )
        if (_key) {
          const _new_spot = _new_root.sum(_new_long)
          _key.reset_root(time, _new_spot, [reset_root])
        }
      }
    }

    reroot_locks(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      for (const name in this.Type.locks) {
        this.reroot_lock(time, name, ...prereq_paths)
      }
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const {locks,plural_name,single_name} = this.Type
      const remove_wall = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [this.level, single_name, this.time], ...prereq_paths
      )
      for (const name in locks) {
        const lock = this.get_label(time, 'lock', name)
        if (lock) lock.remove(time, [remove_wall])
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

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = type.stroke_color
      ctx.lineWidth = type.line_width * center.scale
      ctx.beginPath()
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }
  }
  MazeGame.Wall = Wall

  class Door extends Wall {
    static key_bind = 'd'
    static root_round = 4
    static long_min = 12
    static long_round = 12
    static short_min = 4
    static short_max = 4
    static short_sign = true
    static long_open = 0

    static locks = {
      root_short:[0.5,   0,0, 0,-1],
      root_long: [  0, 0.5,0,-1, 0],
      spot_long: [  1,-0.5,1, 1, 0],
      spot_short:[0.5,   0,1, 0, 1],
    }
    static lock_names = ['root_short','root_long','spot_long','spot_short']

    constructor(
      root, // Point
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(root, description, level, ...prereq_paths)
      new Effect(
        this.time, 'set long_open', this.Type.long_open,
        [this], [this, 'long_open'],
      )
      new Effect(
        this.time, 'set is_open', true,
        [this], [this, 'is_open'],
      )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __long_open = this.get_label(time, 'long_open')
      const __root = type.to_root(this.get_label(time, 'root'))
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_label(time, 'long')
      const _long = type.to_long(__long).mul(center.scale)
      const _short = type.to_short(__long).mul(center.scale)
      const _spot = _root.sum(_long).sum(_short)
      const line_width = type.line_width * center.scale
      const thin_line_width = type.thin_line_width * center.scale
      const line_dash = type.to_line_dash(line_width)

      ctx.lineWidth = line_width
      ctx.strokeStyle = type.stroke_color
      ctx.fillStyle = type.fill_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (1 <= __long_open) {
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
      else if (0 < __long_open) {
        const _long_open = _long.mul(__long_open/2)

        ctx.lineWidth = thin_line_width
        ctx.strokeStyle = type.thin_stroke_color
        ctx.beginPath()
        _root.sum(_long_open).lineTo = ctx
        _spot.sub(_long_open).sub(_short).lineTo = ctx
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _root.sum(_long_open).sum(_short).lineTo = ctx
        _spot.sub(_long_open).lineTo = ctx
        ctx.stroke()

        ctx.lineWidth = line_width
        ctx.strokeStyle = type.stroke_color

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_long_open).lineTo = ctx
        _root.sum(_long_open).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.moveTo = ctx
        _spot.sub(_long_open).lineTo = ctx
        _spot.sub(_long_open).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
      else {
        ctx.lineWidth = thin_line_width
        ctx.strokeStyle = type.thin_stroke_color

        ctx.beginPath()
        _root.lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _root.sum(_short).lineTo = ctx
        _spot.lineTo = ctx
        ctx.stroke()

        ctx.lineWidth = line_width
        ctx.strokeStyle = type.stroke_color
      }

      ctx.beginPath()
      _root.moveTo = ctx
      _root.sum(_short).lineTo = ctx
      _root.sum(_long,_short.scale).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineCap = 'round'
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
    static to_center(
      root,short,long, // Point
    ) {
      const {mid_short,center_long} = this.Type
      return root.sum(long, center_long).sum(short, short_mid)
    }

    constructor(
      root, // Point
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        root, description, level,
        [level, 'door', root.time], ...prereq_paths
      )
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      return super.remove(
        time, [this.level, 'door', this.time],
        ...prereq_paths
      )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __long_open = this.get_label(time, 'long_open')
      const __root = type.to_root(this.get_label(time, 'root'))
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_label(time, 'long')
      const _long = type.to_long(__long).mul(center.scale)
      const _short = type.to_short(__long).mul(center.scale)
      const _spot = _root.sum(_long).sum(_short)
      const _center = (
        _root.sum(_short, center.scale * type.center_short)
        .sum(_long, center.scale * type.center_long)
      )
      const _radius = type.radius * center.scale
      const _angle_root = _center.atan2(_root.sum(_short))
      const _angle_spot = _center.atan2(_spot)

      ctx.lineWidth = type.line_width * center.scale
      ctx.strokeStyle = type.stroke_color
      ctx.fillStyle = type.fill_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (1 <= __long_open) {
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
      else if (0 < __long_open) {
        const _long_open = _long.mul(__long_open/2)

        ctx.beginPath()
        _root.moveTo = ctx
        _root.sum(_long_open).lineTo = ctx
        _root.sum(_long_open).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.moveTo = ctx
        _spot.sub(_long_open).lineTo = ctx
        _spot.sub(_long_open).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      ctx.beginPath()
      if (
        (_long._x + _short._x) > 0 ^
        (_long._y + _short._y) > 0 ^
        _long._x == 0
      ) {
        _root.sum(_short).lineTo = ctx
        _root.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        ctx.arc( _center.x, _center.y, _radius, _angle_spot, _angle_root, )
      }
      else {
        ctx.arc( _center.x, _center.y, _radius, _angle_root, _angle_spot, )
        _spot.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _root.lineTo = ctx
        _root.sum(_short).lineTo = ctx
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  MazeGame.Portal = Portal

  class Key extends Effect {
    static key_bind = 'k'
    static radius = 1.5
    static center_radius = Lock.radius

    static to_root(
      point, // Point
    ) {
      return point
    }

    static get_closest(
      spot, // Point
      keys, // Key[],Key{}
    ) {
      let min_dist = Infinity, return_key = null
      for (const label in keys) {
        const key = keys[label], type = key.Type

        const _root = type.to_root(key.get_label(spot.time, 'root'))
        const _dist = _root.sub(spot).length

        if (_dist < min_dist && _dist < type.radius * 2) {
          return_key = key
          min_dist = _dist
        }
      }
      return return_key
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      const time = spot.time
      const level = game.get_label(time, 'level')
      if (!level || time < level.time) return null
      const {single_name,plural_name} = this

      const keys = level.get_values(time, 'key')
      let key = this.get_closest(spot, keys)
      if (key) {
        const set_level_target = new Effect(
          time, `set level target`, key,
          [level], [key], [level, `target`],
        )
        return set_level_target
      }

      key = level.get_label(time, 'target')

      const locks = level.get_values(time, 'lock')
      const lock = Lock.get_closest(spot, locks)
      let lock_spot = null
      if (lock) {
        const type = lock.Type
        const _root = lock.get_label(time, 'root')
        const _long = lock.get_label(time, 'long')
        const root = type.to_root(_root), long = type.to_long(_long)
        lock_spot = root.sum(long).at(time)
      }

      const effect = (
        key ? new Effect(
          time, `clear target`, null,
          [key], [level], [level, 'target'],
        ) : (
          key = new this(
            time, `added new ${single_name}`, level,
            [level], [level, single_name, time],
          )
        )
      )
      const key_type = key.Type
      const key_lock = key.get_label(time, 'lock')
      if (key_lock) {
        const unlink_key_lock = new Effect(
          time, `unlink ${key_lock.Type.name} and ${key.Type.name}`, null,
          [effect], [key_lock], [key_lock, 'key'], [key, 'lock'],
        )
        new Effect(
          time, `set is_open to false`, false,
          [unlink_key_lock], [lock, 'is_open'],
        )
      }

      const _key_is_open = key.get_label(time, 'is_open')
      if (lock && lock != key.nose) {
        const set_lock = new Effect(
          time, `set lock`, lock,
          [effect], [lock], [key, 'lock'],
        )
        new Effect(
          time, `set key`, key,
          [set_lock], [lock, 'key'],
        )
        new Effect(
          time, `set is_open to ${_key_is_open}`, _key_is_open,
          [set_lock], [lock, 'is_open'],
        )
        key.reset_root(time, lock_spot, [set_lock])
      }
      else {
        key.reset_root(time, spot, [effect])
      }
      return effect
    }

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super( time, description, undefined, ...prereq_paths )
      new Effect(
        time, `set is_open`, true,
        [this], [this, 'is_open'],
      )
      this._level = level
    }

    get level() { return this._level }

    reset_root(
      time, // Int
      point, // Point
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const reset_root = new Effect(
        time, `reset root`, point,
        [this], [this, 'root'], ...prereq_paths
      )
      return reset_root
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const {_level, _target, _name, } = this
      const {single_name} = this.Type

      const _lock = this.get_label(time, 'lock')
      const remove_key = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [_level, single_name, this.time],
        ...(_lock ? [[_lock], [_lock, 'key'], [this, 'lock']] : []),
        ...prereq_paths,
      )
      if (this.nose) this.nose.remove(time, [remove_key])
      return remove_key
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const ___is_open = this.get_label(time, 'is_open')
      const ___root = this.get_label(time, 'root')
      const __root = type.to_root(___root)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const _radius = type.radius * center.scale
      const _center_radius = type.center_radius * center.scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = type.stroke_color
      ctx.fillStyle = type.fill_color
      ctx.lineWidth = type.line_width * center.scale

      ctx.beginPath()
      ctx.arc(_root.x, _root.y, _radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      if (___is_open) {
        ctx.fillStyle = type.stroke_color
        ctx.beginPath()
        ctx.arc(_root.x, _root.y, _center_radius, 0, pi2)
        ctx.closePath()
        ctx.fill()
      }
      else {
        ctx.beginPath()
        ctx.lineTo(_root.x+_center_radius, _root.y+_center_radius)
        ctx.lineTo(_root.x-_center_radius, _root.y-_center_radius)
        ctx.closePath()
        ctx.stroke()

        ctx.beginPath()
        ctx.lineTo(_root.x-_center_radius, _root.y+_center_radius)
        ctx.lineTo(_root.x+_center_radius, _root.y-_center_radius)
        ctx.closePath()
        ctx.stroke()
      }
    }
  }
  MazeGame.Key = Key

  class Jack extends Key {
    static key_bind = 'j'
    static leg_radius = 2
    static default_long = new Point(0,1,0)

    static to_long(
      point, // Point
    ) {
      return point.unit
    }

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      super(
        time, description, level,
        [level, 'key', time], ...prereq_paths
      )
      const {default_long} = this.Type
      this._nose = new Lock(
        time, `added nose to Jack`, 'nose', level, this,
        [level, 'lock', time],
      )
      new Effect(
        time, `set long`, default_long.at(time),
        [this], [this, 'long'], [this._nose], [this._nose, 'long'],
      )
    }

    get nose() { return this._nose }

    reset_root(
      time, // Int
      __root, // Point @ time
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const type = this.Type, {radius} = type
      const {_nose} = this, nose_type = _nose.Type
      const reset_root = super.reset_root(time, __root, ...prereq_paths)
      const __long = this.get_label(time, 'long')
      const _root = type.to_root(__root)
      const _long = type.to_long(__long)
      const _nose_root = _root.sum(_long, radius)
      const reset_nose_root = new Effect(
        time, `reset root`, _nose_root,
        [reset_root], [_nose], [_nose, 'root'],
      )
      const nose_key = _nose.get_label(time, 'key')
      if (nose_key) {
        const _spot = _nose_root.sum(_long, nose_type.long_min)
        nose_key.reset_root(time, _spot, [reset_nose_root])
      }
      return reset_root
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Tracker, ...labels: String,Int]
    ) {
      const {level} = this
      super.remove(time, [level, 'key', this.time], ...prereq_paths)
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
      const __long = type.to_long(___long)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const _radius = type.leg_radius * center.scale
      const i_long = __long.strip(_radius).invert
      const h_long = __long.strip(_radius / 2)

      ctx.lineWidth = type.line_width * center.scale
      ctx.strokeStyle = type.stroke_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      _root.sum(i_long).sum(h_long).lineTo = ctx
      _root.sub(i_long).sum(h_long).lineTo = ctx
      ctx.stroke()
      ctx.beginPath()
      _root.sum(i_long).sub(h_long).lineTo = ctx
      _root.sub(i_long).sub(h_long).lineTo = ctx
      ctx.stroke()

      super.draw(ctx, time, root, center)
    }
  }
  MazeGame.Jack = Jack

  return MazeGame
}
