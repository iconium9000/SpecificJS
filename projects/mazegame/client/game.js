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
      time, // Int
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

    static clear_target(
      time, // Int
      level, // Level
      target, // Effect
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      return new Effect(
        time, `clear level target`, null,
        [target], [level], [level, 'target'], ...prereq_paths
      )
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      // const time = spot.time
      // const level = game.get_label(time, 'level')
      // if (!level || time < level.time) return null
      return null
    }

    // Note: if value is undefined, defaults to this
    constructor(
      time, // Int
      description, // String
      value, // Object,Undefined,Null
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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

    get value() { return this._value }
    get description() { return this._description }

    get is_valid() { return this._is_valid }

    _clear_if(
      effect_array, // EffectArray
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
    _get_valid_idx(
      time, // Int
      effect_array, // EffectArray
    ) {
      let idx = Lib.bin_idx_high(effect_array, time, 'time')
      while (idx >= 0 && !effect_array[idx]._is_valid) --idx
      return idx
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
      return undefined
    }

    get_values(
      time, // Int
      ...labels // String,Int
    ) {
      const values = {}
      const _effect_array = this._get_effect_array(...labels)
      if (!_effect_array) return values

      for (const label in _effect_array._map) {
        const effect_array = _effect_array._map[label]
        const idx = this._get_valid_idx(time, effect_array)
        const effect = effect_array[idx]
        if (effect && effect.is_valid) {
          const value = effect.get_value(time)
          if (value != undefined) values[label] = value
        }
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
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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
    static key_bind = 'g'

    static clear_target(
      time, // Int
      level, // Level
      jack, // Jack
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const clear_target = new Effect(
        time, `clear level target`, null,
        [jack], [level], [level, 'target'], ...prereq_paths
      )
      jack.set_is_open( time, true, `set is_open`, [clear_target], )
      return clear_target
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      const time = spot.time
      const level = game.get_label(time, 'level')
      if (!level || time < level.time) return null

      const jack = level.get_label(time, `target`)
      const keys = level.get_values(time, `key`)
      const spot_key = Key.get_closest(spot, keys)
      const locks = level.get_values(time, `lock`)
      const spot_lock = Lock.get_closest(spot, locks)

      if (spot_key && spot_key.nose) {
        if (spot_key == jack) {
          return this.clear_target(time, level, jack,)
        }
        const spot_jack = spot_key
        const set_level_target = new Effect(
          time, `set ${spot_jack.Type.name} as target`, spot_jack,
          [spot_jack], [level], [level, `target`],
        )
        const set_is_open = spot_jack.set_is_open(
          time, false, `set_is_open`, [set_level_target],
        )
        if (jack) jack.set_is_open(
          time, true, `set_is_open`, [set_level_target],
        )
        return set_level_target
      }
      if (!jack) return null

      const nose = jack.nose, nose_key = nose.get_label(time, 'key')
      const jack_lock = jack.get_label(time, 'lock')
      const lock_key = spot_key || (
        spot_lock && spot_lock.get_label(time, 'key')
      )
      if (lock_key && nose_key) return null
      const nose_radius = (
        nose_key || lock_key ?
        2*jack.Type.radius + nose.Type.long_min : 0
      )
      const _root = jack.get_root(time)
      const __long = spot.sub(_root)
      const _dist = __long.length - nose_radius
      if (_dist < 0) return null
      const _long = __long.unit.strip(_dist)
      const _spot = _root.sum(_long)

      const speed = jack.Type.speed
      let max_time = time + _dist / speed
      const paths = [ [ max_time, _root, _spot.at(max_time) ], ]

      const root_portal = level.get_label(time, 'root_portal')
      const spot_portal = level.get_label(time, 'spot_portal')
      if (root_portal && spot_portal) {
        const pr = root_portal.get_center(time)
        const ps = spot_portal.get_center(time)
        const jr_pr = pr.sub(_root), ps_js = _spot.sub(ps)
        const jr_pr_time = time + jr_pr.length / speed
        const ps_js_time = jr_pr_time + ps_js.length / speed
        if (max_time < ps_js_time) max_time = ps_js_time

        const jr_ps = ps.sub(_root), pr_js = _spot.sub(pr)
        const jr_ps_time = time + jr_ps.length / speed
        const pr_js_time = jr_ps_time + pr_js.length / speed
        if (max_time < pr_js_time) max_time = pr_js_time

        paths.push(
          [ps_js_time, _root, pr.at(jr_pr_time), ps.at(ps_js_time), _spot],
          [pr_js_time, _root, ps.at(jr_ps_time), pr.at(pr_js_time), _spot]
        )
      }
      paths.sort(([a],[b])=>a-b)


      // TODO POLYS max_time
      for (const idx in paths) {
        const path = paths[idx]
        const [stop_time] = path

        // check line_through_polys
        if (true) {
          const clear_target = new Effect(
            time, `start new path (clear_target)`, null,
            [jack], [level], [level, `target`],
          )
          jack.set_is_open(time, true, `set is_open`, [clear_target])
          if (jack_lock) {
            const clear_lock_key = new Effect(
              time, `clear jack and lock`, null, [clear_target],
              [jack_lock], [jack, 'lock'], [spot_lock, 'key'],
            )
            jack_lock.set_is_open(time, false, `set is_open`, [clear_lock_key])
          }
          let move_to = clear_target
          for (let path_idx = 2; path_idx < path.length; ++path_idx) {
            const _spot = path[path_idx]
            move_to = jack.lerp_to(
              move_to.time, _spot, `lerp to`,
              [move_to],
            )
          }
          if (lock_key) {
            const set_nose_key = new Effect(
              stop_time, `set nose key`, lock_key,
              [move_to], [lock_key], [nose], [nose, `key`],
            )
            const set_key_lock = new Effect(
              stop_time, `set key lock to nose`, nose,
              [set_nose_key], [lock_key, `lock`],
            )
            if (spot_lock) {
              const clear_lock_key = new Effect(
                stop_time, `clear lock key`, null,
                [set_key_lock], [spot_lock], [spot_lock, `key`],
              )
              spot_lock.set_is_open(
                stop_time, false, `set is_open`,
                [clear_lock_key]
              )
            }
          }
          else if (nose_key) {
            if (spot_lock) {
              const set_key_lock = new Effect(
                stop_time, `set key lock`, spot_lock, [move_to],
                [spot_lock], [nose_key], [nose_key, `lock`]
              )
              new Effect(
                stop_time, `set lock key`, nose_key, [set_key_lock],
                [spot_lock, `key`],
              )
              new Effect(
                stop_time, `clear lock key`, null, [set_key_lock],
                [nose], [nose, `key`],
              )
              const is_open = nose_key.get_is_open(stop_time)
              spot_lock.set_is_open(
                stop_time, is_open, `set is_open`, [set_key_lock],
              )
              nose.set_is_open(
                stop_time, false, `set nose is_open`, [set_key_lock],
              )
            }
            else {
              const clear_lock_key = new Effect(
                stop_time, `clear lock key`, null, [move_to],
                [nose], [nose_key], [nose, `key`], [nose_key, `lock`],
              )
              nose.set_is_open(
                stop_time, false, `set nose is_open`, [clear_lock_key],
              )
            }
          }
          else if (spot_lock) {
            const set_jack_lock = new Effect(
              stop_time, `set jack lock`, spot_lock, [move_to],
              [spot_lock], [jack], [jack, 'lock'],
            )
            const set_lock_jack = new Effect(
              stop_time, `set lock jack`, jack, [set_jack_lock],
              [spot_lock, `key`],
            )
            spot_lock.set_is_open(time, true, `set is_open`, [set_lock_jack])
          }
          return clear_target
        }
      }
    }

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
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, undefined,
        [game], [game, 'level', time], ...prereq_paths
      )
      this._game = game
    }

    set_max_time(
      time,new_max_time, // Int
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const max_time = this.get_label(time, `max_time`)
      return max_time < new_max_time ? new Effect(
        time, description, new_max_time,
        [this, `max_time`], ...prereq_paths
      ) : null
    }
    get_max_time(
      time, // Int
    ) {
      return this.get_label(time, `max_time`)
    }
    get game() { return this._game }

    get_polys(
      start_time,stop_time, // Int
    ) {
      const polys = []
      const wall_array = this._get_effect_array('wall')
      const wall_map = wall_array && wall_array._map
      if (!wall_map) return polys

      for (const label in wall_map) {
        const wall_array = wall_map[label]
        let last_wall = null, last_time = start_time
        for (const idx in wall_array) {
          const {is_valid,time,value} = wall_array[idx]
          if (!is_valid) continue
          else if (time < start_time);
          else if (stop_time < time) break
          else if (last_wall != value) {
            if (last_wall && start_time < time) {
              const wall_time = stop_time < time ? stop_time : time
              const [...wall_polys] = last_wall.get_polys(last_time, wall_time)
              polys.push(...wall_polys)
            }
          }
          last_wall = value; last_time = time < start_time ? start_time : time
        }
        if (last_wall && last_time < stop_time) {
          const [...wall_polys] = last_wall.get_polys(last_time, stop_time)
          polys.push(...wall_polys)
        }
      }
      return polys
    }

    check(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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

      let [root_portal,spot_portal] = open_portals
      if (open_portals.length != 2) {
        const portals = this.get_values(time, 'portal')
        for (const label in portals) {
          const portal = portals[label]
          portal.is_open = false
        }
        root_portal = spot_portal = null
      }

      const _root_portal = this.get_label(time, 'root_portal')
      if (root_portal != _root_portal) new Effect(
        time, `set root_portal`, root_portal,
        [this], [this, 'root_portal'], ...(root_portal ? [[root_portal]] : []),
      )
      const _spot_portal = this.get_label(time, 'spot_portal')
      if (spot_portal != _spot_portal) new Effect(
        time, `set spot_portal`, spot_portal,
        [this], [this, 'spot_portal'], ...(spot_portal ? [[spot_portal]] : []),
      )

      for (const label in doors) {
        const door = doors[label]
        const type = door.Type

        if (door.was_closed == door.is_open) {
          const change_open = new Effect(
            time, `change is_open to ${door.is_open}`, door.is_open,
            [door], [door, 'is_open'], ...prereq_paths
          )
          const long = door.get_long(time).scale
          const long_open = door.get_long_open(time)

          if (door.is_open && 0 < long_open) {
            const next_time = time + long_open * long / type.speed
            door.set_long_open(
              time, next_time, long_open, 0,
              `lerp long_open to 0`, [change_open]
            )
          }
          else if (!door.is_open && long_open < 1) {
            const next_time = time + (1-long_open) * long / type.speed
            door.set_long_open(
              time, next_time, long_open, 1,
              `lerp long_open to 1`, [change_open]
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
      const keys = this.get_values(time,'key')
      for (const label in keys) {
        keys[label].draw(ctx,time,root,center)
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

    static get_closest(
      spot, // Point @ time
      locks, // Lock[],Lock{}
    ) {
      const time = spot.time
      let min_dist = Infinity, return_lock = null
      for (const label in locks) {
        const lock = locks[label], type = lock.Type
        const _spot = lock.get_spot(time)
        const _dist = _spot.sub(spot).length

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
        const {long_min} = lock.Type
        const _root = lock.get_root(time)
        const _long = lock.get_long(time)
        const _key = lock.get_label(time, 'key')
        const _spot = spot.sub(_root)

        let spot_dot = _spot.dot(_long, 1)
        if (spot_dot < long_min) spot_dot = long_min
        const __new_long = _long.strip(spot_dot).at(time)
        const reset_long = lock.set_long(__new_long, `reset long`, [lock])
        if (_key) {
          const _new_long = reset_long.value
          const _new_spot = _root.sum(_new_long)
          _key.set_root(time, _new_spot, [reset_long])
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
        const {lock_names,locks} = door.Type
        const n_names = lock_names.length

        const _root = door.get_root(time)
        const _long = door.get_long(time)

        const long_dot = spot.sub(_root).dot(_long,1) / _long.scale
        const name = lock_names[Math.floor(long_dot * n_names)]

        const old_lock = door.get_label(time, 'lock', name)
        if (locks[name] && !old_lock) {
          const new_lock = new this(
            time, `added new ${single_name}`, name, level, door,
            [level, single_name, time],
          )
          new_lock.set_is_open( time, false, `set is_open`, [new_lock], )
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
      target, // Effect
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, undefined,
        [level], [target], [target, 'lock', name], ...prereq_paths
      )
      this._level = level; this._target = target; this._name = name
      this._is_nose = target.Type == Jack
    }

    get level() { return this._level }
    get target() { return this._target }
    get name() { return this._name }
    get is_nose() { return this._is_nose }
    set_root(
      root, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = root
      const set_root = new Effect(
        time, description, root,
        [this, 'root'], ...prereq_paths,
      )
      const key = this.get_label(time, 'key')
      if (key) {
        const long = this.get_long(time)
        const spot = root.sum(long)
        key.set_root(spot, `set lock key root`, [set_root])
      }
      return set_root
    }
    get_root(
      time, // Int
    ) {
      return this.get_label(time, 'root').at(time)
    }
    set_long(
      long, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = long
      const {long_min,long_max,long_round} = this.Type
      const new_long = long.cramp(long_min,long_max,long_round)
      const set_long = new Effect(
        time, description, new_long,
        [this, 'long'], ...prereq_paths,
      )
      const key = this.get_label(time, 'key')
      if (key) {
        const root = this.get_root(time)
        const spot = root.sum(new_long)
        key.set_root(spot, `set lock key root`, [set_long])
      }
      return set_long
    }
    get_long(
      time, // Int
    ) {
      return this.get_label(time, 'long').at(time)
    }
    get_spot(
      time, // Int
    ) {
      return this.get_root(time).sum(this.get_long(time))
    }
    set_is_open(
      time, // Time
      is_open, // Boolean
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      return new Effect(
        time, `${description} to ${is_open}`, is_open,
        [this, `is_open`], ...prereq_paths
      )
    }
    get_is_open(
      time, // Time
    ) {
      return this.get_label(time, 'is_open') || false
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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
      const {stroke_color,fill_color,line_width,radius} = this.Type
      const __root = this.get_root(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_long(time)
      const _long = __long.mul(center.scale)
      const _spot = _root.sum(_long)

      ctx.lineCap = 'round'
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineWidth = line_width * center.scale
      ctx.beginPath()
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, radius * center.scale, 0, pi2)
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
      target, // Effect
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, name, level, target,
        [level, 'lock', time], ...prereq_paths
      )
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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
      const {
        thin_line_width,thin_stroke_color,
        line_width,stroke_color,radius,
      } = this.Type
      const __root = this.get_root(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_long(time)
      const _long = __long.mul(center.scale)
      const _spot = _root.sum(_long)
      const long_min = Lock.long_min * center.scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = thin_line_width * center.scale
      ctx.strokeStyle = thin_stroke_color

      ctx.beginPath()
      _root.sum(_long, long_min).lineTo = ctx
      _spot.sub(_long, long_min).lineTo = ctx
      ctx.stroke()

      ctx.strokeStyle = stroke_color
      ctx.lineWidth = line_width * center.scale

      ctx.beginPath()
      _root.moveTo = ctx
      _root.sum(_long, long_min).lineTo = ctx
      ctx.stroke()

      ctx.beginPath()
      _spot.sub(_long, long_min).lineTo = ctx
      _spot.lineTo = ctx
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, radius * center.scale, 0, pi2)
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
    static default_long_open = 0
    static short_sign = false
    static locks = {}
    static lock_names = []
    static is_portal = false

    static get default_long() {
      const {long_min,short_min} = this
      return new Point(0,long_min,short_min)
    }
    static get default_root() {
      return new Point(0,0,0)
    }
    static to_short(
      point,  // Point
    ) {
      const {short_min,short_max,short_round} = this
      return point.short.cramp(short_min,short_max,short_round)
    }
    static get_closest(
      spot, // Point @ time
      walls, // Wall[],Wall{}
    ) {
      const time = spot.time
      let min_dist = Infinity, return_wall = null
      for (const label in walls) {
        const wall = walls[label], {short_sign} = wall.Type

        const _root = wall.get_root(time)
        const long = wall.get_long(time)
        const short = wall.get_short(time)
        const root = spot.sub(_root)

        const long_length = long.scale, short_length = short.scale

        let long_dot = root.dot(long,1), short_dot = root.dot(short,1)
        if (!short_sign && short_dot < 0) short_dot = -short_dot

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
      spot, // Point @ time
    ) {
      const time = spot.time
      const level = game.get_label(time, 'level')
      if (!level || time < level.time) return null
      const {single_name,plural_name,default_long_open,default_long} = this

      let wall = level.get_label(time, 'target')
      if (wall) {
        const root = wall.get_root(time)
        const reset_long = wall.set_long(
          spot.sub(root).at(time), `reset long`, [wall],
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
        const {short_sign} = wall.Type
        const _root = wall.get_root(time)
        const _spot = spot.sub(_root)
        const long = wall.get_long(time), short = wall.get_short(time)
        const long_dot = _spot.dot(long,1) / long.scale

        const set_level_target = new Effect(
          time, `set level target`, wall,
          [wall], [level, 'target'],
        )
        if (long_dot < 0.5) {
          const new_root = (
            short_sign ?
            _root.sum(long).sum(short) :
            _root.sum(long)
          ).at(time)
          const new_long = spot.sub(new_root)
          const flip_root_long = wall.set_root_long(
            new_root, new_long, `flipped ${single_name} root and long`,
            [set_level_target],
          )
        }
        else {
          wall.set_long(
            _spot, `flipped ${single_name} long`,
            [set_level_target],
          )
        }
        wall.reroot_locks(time, [set_level_target])
        return set_level_target
      }
      const new_wall = new this(
        time, `added new ${single_name} to level`, level,
        [level], [level, 'target'],
        [level, single_name, time],
      )
      new_wall.set_root_long(
        spot, default_long.at(time), `set root and long`,
        [new_wall]
      )
      new Effect(
        time, 'set long_open', default_long_open,
        [new_wall], [new_wall, `long_open`],
      )
      new_wall.set_is_open(time, true, `set is_open`, [new_wall])
      return new_wall
    }

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super( time, description, undefined, ...prereq_paths )
      this._level = level
    }
    get level() { return this._level }

    set_root_long(
      root,long, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = root, {
        root_round,long_min,long_max,long_round,
        short_min,short_max,short_round,
      } = this.Type
      const new_root_long = {
        time:time, _long:long, root:root.round(root_round),
        long_open: this.get_long_open(time),
        long: long.long.cramp(long_min,long_max,long_round),
        short: long.short.cramp(short_min,short_max,short_round),
      }
      new_root_long.spot = new_root_long.root.sum(new_root_long.long)
      return new Effect(
        time, description, new_root_long,
        [this, `root_long`], ... prereq_paths
      )
    }
    set_root(
      root, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = root, {long_min,short_min,root_round} = this.Type
      const _root = root.round(root_round)
      const _root_long = this.get_label(time, `root_long`)
      const long_open = this.get_long_open(time)
      const new_root_long = _root_long ? {
        time:time, root:_root, long_open:long_open,
        _long:_root_long._long.at(time),
        long:_root_long.long.at(time),
        short:_root_long.short.at(time),
      } : {
        time:time, root:_root, long_open:long_open,
        _long:new Point(time,long_min,short_min),
        long:new Point(time,1,0,long_min),
        short:new Point(time,0,1,short_min),
      }
      new_root_long.spot = new_root_long.root.sum(new_root_long.long)
      return new Effect(
        time, description, new_root_long,
        [this, 'root_long'], ...prereq_paths,
      )
    }
    get_root(
      time, // Int
    ) {
      const _root_long = this.get_label(time, `root_long`)
      return _root_long ? _root_long.root.at(time) : new Point(time,0,0,1)
    }
    set_long(
      long, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = long
      const {
        short_min,short_max,short_round,
        long_min,long_max,long_round
      } = this.Type
      const _root_long = this.get_label(time, `root_long`)
      const long_open = this.get_long_open(time)
      const new_root_long = {
        time:time, _long:long, long_open:long_open,
        long: long.long.cramp(long_min,long_max,long_round),
        short: long.short.cramp(short_min,short_max,short_round),
        root: _root_long ? _root_long.root.at(time) : new Point(time,0,0,1),
      }
      new_root_long.spot = new_root_long.root.sum(new_root_long.long)
      return new Effect(
        time, description, new_root_long,
        [this, 'root_long'], ...prereq_paths,
      )
    }
    get_long(
      time, // Int
    ) {
      const _root_long = this.get_label(time, `root_long`)
      return (
        _root_long ?
        _root_long.long.at(time) : new Point(time,1,0,long_min)
      )
    }
    get_short(
      time, // Int
    ) {
      const {long_min,short_min} = this.Type
      const _root_long = this.get_label(time, `root_long`)
      return (
        _root_long ?
        _root_long.short.at(time) : new Point(time,0,1,short_min)
      )
    }
    get_spot(
      time, // Int
    ) {
      const {short_min,long_min} = this.Type
      const _root_long = this.get_label(time, `root_long`)
      return (
        _root_long ?
        _root_long.spot.at(time) : new Point(time,1,0,long_min)
      )
    }
    set_long_open(
      start_time,stop_time,
      start_open,stop_open,
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {
        short_min,short_max,short_round,
        long_min,long_max,long_round
      } = this.Type
      const set_long_open = new Lerp(
        start_time,stop_time, description, Float,
        start_open,stop_open, [this, 'long_open'], ...prereq_paths,
      )
      const start_root_long = this.get_label(start_time, `root_long`)
      const new_start_root_long = start_root_long ? {
        time: start_time, long_open:start_open,
        root: start_root_long.root.at(start_time),
        _long: start_root_long._long.at(start_time),
        long: start_root_long.long.at(start_time),
        short: start_root_long.short.at(start_time),
      } : {
        time:start_time, long_open:start_open,
        root: new Point(start_time,0,0,1),
        _long:new Point(start_time,long_min,short_min),
        long:new Point(start_time,1,0,long_min),
        short:new Point(start_time,0,1,short_min),
      }
      new_start_root_long.spot = new_start_root_long.root.sum(
        new_start_root_long.long
      )
      new Effect(
        start_time, 'start root_long from long_open', new_start_root_long,
        [set_long_open], [this, 'root_long'],
      )
      const stop_root_long = this.get_label(stop_time, `root_long`)
      const new_stop_root_long = stop_root_long ? {
        time: stop_time, long_open:stop_open,
        root: stop_root_long.root.at(stop_time),
        _long: stop_root_long._long.at(stop_time),
        long: stop_root_long.long.at(stop_time),
        short: stop_root_long.short.at(stop_time),
      } : {
        time:stop_time, long_open:stop_open,
        root: new Point(stop_time,0,0,1),
        _long: new Point(stop_time,long_min,short_min),
        long: new Point(stop_time,1,0,long_min),
        short: new Point(stop_time,0,1,short_min),
      }
      new_stop_root_long.spot = new_stop_root_long.root.sum(
        new_stop_root_long.long
      )
      new Effect(
        stop_time, 'stop root_long from long_open', new_stop_root_long,
        [set_long_open], [this, 'root_long'],
      )
      this.level.set_max_time(
        start_time,stop_time, `set max_time?`,
        [set_long_open]
      )
      return set_long_open
    }
    get_long_open(
      time, // Int
    ) {
      return this.get_label(time, 'long_open')
    }
    set_is_open(
      time, // Time
      is_open, // Boolean
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      return new Effect(
        time, `${description} to ${is_open}`, is_open,
        [this, `is_open`], ...prereq_paths
      )
    }
    get_is_open(
      time, // Time
    ) {
      return this.get_label(time, 'is_open') || false
    }

    reroot_lock(
      time, // Int
      lock_name, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const lock = this.get_label(time, 'lock', lock_name)
      if (lock) {
        const type = this.Type, lock_type = lock.Type
        const _lock_long = lock.get_label(time, 'long')
        const _root = this.get_root(time)
        const _long = this.get_long(time)
        const _short = this.get_short(time)
        const _long_short = _long.strip(_short.scale)
        const _key = lock.get_label(time, 'key')

        const [
          short,long_short,long,
          lock_short,lock_long,
        ] = type.locks[lock_name]

        const _new_root = (
          _root.sum(_short.mul(short) )
          .sum(_long_short.mul(long_short))
          .sum(_long.mul(long))
        ).at(time)
        const __new_long = (
          _short.mul(lock_short)
          .sum(_long.mul(lock_long))
          .unit.strip(_lock_long ? _lock_long.length : lock_type.long_min)
        ).at(time)

        const reset_root = lock.set_root(
          _new_root, `reset root`, [lock], ...prereq_paths,
        )
        const reset_long = lock.set_long(
          __new_long, `reset long`, [reset_root],
        )
        const _new_long = reset_long.value
        if (_key) {
          const _new_spot = _new_root.sum(_new_long)
          _key.set_root(_new_spot, `set key root`, [reset_root])
        }
        return reset_root
      }
      return null
    }

    reroot_locks(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      for (const name in this.Type.locks) {
        this.reroot_lock(time, name, ...prereq_paths)
      }
    }

    _get_root_spot_array(
      start_time,stop_time, // Int
    ) {
      const root_spot_array = []
      const _root_long_array = this._get_effect_array('root_long')
      if (!_root_long_array) return root_spot_array

      const stop_long_open = this.get_long_open(stop_time)
      for (let idx = 0; idx < _root_long_array.length; ++idx) {
        const {
          time,is_valid,value:{root,spot,long_open}
        } = _root_long_array[idx]
        if (!is_valid) continue

        const last_root_spot = root_spot_array.pop()
        if (start_time <= time&&last_root_spot) {
          last_root_spot.stop_root = last_root_spot.start_root.at(time)
          last_root_spot.stop_spot = last_root_spot.start_spot.at(time)
          last_root_spot.stop_long_open = long_open
          root_spot_array.push(last_root_spot)
        }
        if (stop_time <= time) break
        root_spot_array.push({
          start_root:root, start_spot:spot,
          start_long_open:long_open,
          stop_root:root.at(stop_time), stop_spot:spot.at(stop_time),
          stop_long_open:stop_long_open,
        })
      }
      return root_spot_array
    }

    get_polys(
      start_time,stop_time, // Int
    ) {
      const polys = []

      const root_spot_array = this._get_root_spot_array(start_time,stop_time)
      for (const idx in root_spot_array) {
        const {
          start_root,start_spot, stop_root,stop_spot
        } = root_spot_array[idx]
        polys.push(
          [start_root,start_spot,stop_root],
          [stop_root, stop_spot,start_spot],
        )
      }

      return polys
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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
      const __root = this.get_root(time)
      const __long = this.get_long(time)
      const __short = this.get_short(time)
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

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, level,
        [level, 'wall', time], ...prereq_paths
      )
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      return super.remove(
        time, [this.level, 'wall', this.time],
        ...prereq_paths,
      )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const __long_open = this.get_long_open(time)
      const __root = this.get_root(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_long(time)
      const __short = this.get_short(time)
      const _long = __long.mul(center.scale)
      const _short = __short.mul(center.scale)
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
      const {short_mid,center_long} = this.Type
      return root.sum(long, center_long).sum(short, short_mid)
    }

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, level,
        [level, 'door', time], ...prereq_paths
      )
    }

    get_center(
      time, // Int
    ) {
      const {root,short,long} = this.get_label(time, `root_long`)
      return this.Type.to_center(root,short,long).at(time)
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
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
      const __long_open = this.get_long_open(time)
      const __root = this.get_root(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const __long = this.get_long(time)
      const __short = this.get_short(time)
      const _long = __long.mul(center.scale)
      const _short = __short.mul(center.scale)
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

    static get_closest(
      spot, // Point @ time
      keys, // Key[],Key{}
    ) {
      const time = spot.time
      let min_dist = Infinity, return_key = null
      for (const label in keys) {
        const key = keys[label], {radius} = key.Type
        const _dist = key.get_root(time).sub(spot).length
        if (_dist < min_dist && _dist < radius * 2) {
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
      const {single_name,plural_name,default_long} = this

      const locks = level.get_values(time, 'lock') // call before new Jack
      const keys = level.get_values(time, 'key')

      const target_key = level.get_label(time, 'target')
      let key = this.get_closest(spot, keys)
      if (key && key != target_key) {
        const set_level_target = new Effect(
          time, `set level target`, key,
          [level], [key], [level, `target`],
        )
        return set_level_target
      }

      key = target_key
      const new_effect = key ? new Effect(
        time, `clear level target`, null,
        [level], [key], [level, `target`],
      ) : new this(
        time, `added new ${single_name}`, level,
        [level], [level, single_name, time],
      )
      if (!key) {
        key = new_effect
        if (default_long) key.set_long(default_long.at(time))
        key.set_is_open(time, true, `set is_open`, [new_effect])
      }

      const key_lock = key.get_label(time, 'lock')
      if (key_lock) {
        const clear_lock_key = new Effect(
          time, `clear lock and key`, null,
          [new_effect], [key_lock], [key_lock, `key`], [key, `lock`],
        )
        key_lock.set_is_open(time, false, `set_is_open`, [clear_lock_key])
      }

      const lock = Lock.get_closest(spot, locks)
      if (lock && !(lock.is_nose && key.nose)) {
        const _spot = lock.get_spot(time)
        const key_is_open = key.get_is_open(time)
        const set_lock = new Effect(
          time, `set lock`, lock,
          [new_effect], [lock], [key], [key, `lock`],
        )
        new Effect(
          time, `set key`, key,
          [set_lock], [lock, `key`]
        )
        lock.set_is_open(time, key_is_open, `set_is_open`, [set_lock])
        key.set_root(_spot, `set root as lock spot`, [set_lock])
      }
      else {
        key.set_root(spot, `set root`, [new_effect])
      }

      return new_effect
    }

    constructor(
      time, // Int
      description, // String
      level, // Level
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super( time, description, undefined, ...prereq_paths )
      this._level = level
    }

    get_root(
      time, // Int
    ) {
      const root = this.get_label(time, 'root')
      return root ? root.at(time) : new Point(time,0,0,1)
    }
    set_root(
      root, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = root
      return new Effect(
        time, description, root,
        [this, 'root'], ...prereq_paths
      )
    }
    set_long() {}
    set_is_open(
      time, // Int
      is_open, // Boolean
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const set_is_open = new Effect(
        time, `${description} to ${is_open}`, is_open,
        [this, `is_open`], ...prereq_paths
      )
      const lock = this.get_label(time, `lock`)
      if (lock) lock.set_is_open(time, is_open, description, [set_is_open])
      return set_is_open
    }
    get_is_open(
      time, // Int
    ) {
      return this.get_label(time, 'is_open') || false
    }

    get level() { return this._level }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {_level, _target, _name, } = this
      const {single_name} = this.Type

      const remove_key = new Effect(
        time, `remove ${single_name} from level`, null,
        [this], [_level, single_name, this.time],
        ...prereq_paths,
      )
      const lock = this.get_label(time, 'lock')
      if (lock) {
        const clear_lock_key = new Effect(
          time, `remove ${lock.Type.single_name} from ${single_name}`, null,
          [lock], [this, 'lock'], [lock, 'key'], [remove_key],
        )
        lock.set_is_open(time, false, `set is_open`, [clear_lock_key])
      }

      if (this.nose) this.nose.remove(time, [remove_key])
      return remove_key
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const {
        stroke_color,fill_color,line_width,
        radius,center_radius
      } = this.Type
      const __is_open = this.get_label(time, 'is_open')
      const __root = this.get_root(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const _radius = radius * center.scale
      const _center_radius = center_radius * center.scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineWidth = line_width * center.scale

      ctx.beginPath()
      ctx.arc(_root.x, _root.y, _radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      if (__is_open) {
        ctx.fillStyle = stroke_color
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
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super(
        time, description, level,
        [level, 'key', time], ...prereq_paths
      )
      this._nose = new Lock(
        time, `added nose to Jack`, `nose`,
        level, this, [level, 'lock', time],
      )
    }

    get nose() { return this._nose }
    set_root(
      root, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = root, {radius} = this.Type
      const set_root = super.set_root(root,description,...prereq_paths)
      const _root = set_root.value
      const _long = this.get_long(time).mul(radius)
      const _spot = _root.sum(_long)
      this._nose.set_root( _spot, `set nose root`, [set_root], )
      return set_root
    }
    set_long(
      long, // Point @ time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const {time} = long
      const set_long = new Effect(
        time, description, long.unit,
        [this, `long`], ...prereq_paths,
      )
      this._nose.set_long(long, `set nose long`, [set_long])
      return set_long
    }
    get_long(
      time, // Int
    ) {
      const {default_long} = this.Type
      const long = this.get_label(time, 'long')
      return (long || default_long).at(time)
    }

    remove(
      time, // Int
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      super.remove(time, [this.level, 'key', this.time], ...prereq_paths)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const {line_width, stroke_color, leg_radius} = this.Type
      const __root = this.get_root(time)
      const __long = this.get_long(time)
      const _root = __root.sub(root,1).mul(center.scale).sum(center,1)
      const _radius = leg_radius * center.scale
      const i_long = __long.strip(_radius).invert
      const h_long = __long.strip(_radius / 2)

      ctx.lineWidth = line_width * center.scale
      ctx.strokeStyle = stroke_color
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

    lerp_to(
      start_time, // Int
      spot, // Point @ stop_time
      description, // String
      ...prereq_paths // [prereq: Effect, ...labels: String,Int]
    ) {
      const stop_time = spot.time, nose = this.nose
      const root = this.get_root(start_time)
      const long = spot.sub(root).unit.at(start_time)
      const this_radius = this.Type.radius
      const nose_radius = nose.Type.long_min

      const lerp_to = new Lerp(
        start_time, stop_time, `lerp root to spot`, Point, root, spot,
        [this], [this, `root`],
        ...prereq_paths,
      )
      new Effect(
        start_time, `set long`, long,
        [this], [this, `long`], [lerp_to],
      )
      new Effect(
        start_time, `set long`, long.strip(nose_radius),
        [nose], [nose, `long`], [lerp_to],
      )
      const lock_long = long.strip(this_radius)
      const lerp_nose_to = new Lerp(
        start_time, stop_time, `lerp nose root to spot`, Point,
        root.sum(lock_long), spot.sum(lock_long),
        [nose], [nose, `root`], [lerp_to],
      )
      const nose_key = nose.get_label(start_time, 'key')
      if (nose_key) {
        const key_long = long.strip(this_radius + nose_radius)
        new Lerp(
          start_time, stop_time, `lerp nose key root to spot`, Point,
          root.sum(key_long), spot.sum(key_long),
          [nose_key], [nose_key, `root`], [lerp_nose_to],
        )
      }
      return lerp_to
    }
  }
  MazeGame.Jack = Jack

  return MazeGame
}
