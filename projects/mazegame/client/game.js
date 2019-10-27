module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  MazeGame = {}

  class Type {
    static Type = this

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
        abs_x > abs_y ?
        new Point(time, 0, y < -1 ? -1 : 1, abs_y) :
        new Point(time, x < -1 ? -1 : 1, 0, abs_x)
      )
    }

    set lineTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.lineTo(this.x, this.y)
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
    ) {
      const {x:tx,y:ty} = this, {x:px,y:py} = point
      return tx*px + ty*py
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
    ) {
      const {time,_x,_y,_scale} = this
      return new Point(time,_x,_y,
        _scale < min ? min :
        max < _scale ? max :
        0 < round ? Math.round(_scale / round) * round :
        _scale
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

    effect(
      object, // Object
      label, // String
    ) {
      return new Effect(this.time, object, label, this)
    }
  }
  MazeGame.Point = Point

  class Effect extends Type {

    constructor(
      time, // Int
      dst, // Object,Null
      label, // String
      value, // Object,Null
      value_is_this, // Boolean,Null
    ) {
      super(time)
      this._dst = dst || this
      this._label = label;
      this._value = value_is_this ? this : value
    }

    get stop_time() { return Infinity }

    get dst() { return this._dst }
    get label() { return this._label }
    get value() { return this._dst[this._label] }

    get_times(
      time_map, // Boolean{}
    ) {
      time_map[this.time] = true
    }

    set value(
      value, // Object,Null
    ) {
      this._dst[this._label] = value
    }

    build_at(
      time,stop_time, // Int
    ) {
      if (this.time == time) this.value = this._value
    }

    // build at each times <= max_time given by get_times
    build_to(
      stop_time // Int
    ) {
      const times = [], time_map = {[stop_time]: true};
      this.get_times(time_map)
      for (let time in time_map) time <= stop_time && times.push(time)
      times.sort()
      for (const idx in times) this.build_at(times[idx],stop_time)
    }
  }
  class Cause extends Effect {

    constructor(
      time, // Int
      dst, // Object
      label, // String
      value, // Object,Null
      value_is_this, // Boolean,Null
    ) {
      super(time,dst,label,value,value_is_this)
      this._max_effect_time = time
      this._effects = []
      this._spec = null // Effect,Null
    }

    get stop_time() { return this._stop_time }
    set stop_time(stop_time) { this._stop_time = stop_time }

    // assign add to the map as a key any time which is touched by this effect
    get_times(
      time_map, // Boolean{}
    ) {
      super.get_times(time_map)
      this.stop_time = Infinity
      for (const idx in this._effects) this._effects[idx].get_times(time_map)
      if (this._spec) this._spec.get_times(time_map)
    }

    // if this effect
    //   has not been stopped before time
    //   and does not start before time
    // if the cause occurs at time, set dst@label as src
    // build each effect in reverse order at time
    build_at(
      time,stop_time, // Int
    ) {
      if (this.stop_time < stop_time) {
        stop_time = this.stop_time
        if (stop_time < time) return
      }
      if (time < this.time) return
      super.build_at(time, stop_time)
      for (const idx in this._effects) {
        this._effects[idx].build_at(time, stop_time)
      }
      if (this._spec) this._spec.build_at(time, stop_time)
    }

    push(
      effect, // Effect,Null
    ) {
      if (effect == undefined && this._spec) effect = this._spec
      if (effect && effect.time >= this._max_effect_time) {
        this._effects.push(effect)
        this._max_effect_time = effect.time
        this._spec = null
      }
    }

    set_spec(
      effect, // Effect,Null
    ) {
      if (!effect) this._spec = null
      else if (effect.time >= this._max_effect_time) {
        this._spec = effect
      }
    }

    // return Effect[] each with label E labels
    get_labels(
      time, // Int
      ...labels // String
    ) {
      const effects = []
      for (const idx in this._effects) {
        const effect = this._effects[idx]
        if (effect.time >= time && time <= effect.stop_time &&
          labels.includes(effect.label)
        ) {
          effects.push(effect)
        }
      }
      return effects
    }

    // return Effect[] each with Type E types
    get_types(
      time,
      ...types // String
    ) {
      const effects = []
      const {_effects,_spec} = this
      for (const idx in _effects) {
        const effect = _effects[idx]
        if (time <= effect.stop_time && types.includes(effect.Type)) {
          effects.push(effect)
        }
      }
      if (_spec && time <= _spec.stop_time && types.includes(_spec.Type) ) {
        effects.push(_spec)
      }
      return effects
    }
  }
  class Lerp extends Effect {
    constructor(
      start_time, stop_time, // Int
      dst, // Object
      label, // String
      start_value, stop_value, // Object
      type, // Type
    ) {
      super(start_time, dst, label, start_value)
      this._stop_time = stop_time; this._type = type
      this._stop_value = stop_value
    }

    get stop_time() { return this._stop_time }
    set stop_time(stop_time) {}

    // gets super.get_time and this.stop_time
    get_times(
      time_map, // Boolean{}
    ) {
      time_map[this._stop_time] = true
    }

    // builds lerp between value and stop_value at time
    build_at(
      time,stop_time, // Int
    ) {
      if (time <= this.time) super.build_at(time, stop_time)
      else if (time < this._stop_time) {
        this.value = this._type.lerp(
          this.time, this.stop_time, time,
          this.value, this._stop_value,
        )
      }
      else this.value = this._stop_value
    }
  }

  class Game extends Cause {

    constructor(
      time, // Int
    ) {
      super(time, null, 'name', 'Game' )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      center,root, // Point
    ) {
      this.build_to(center.time)
      this.level && this.level.draw( ctx, center, root)
    }
  }
  MazeGame.Game = Game

  class Level extends Cause {

    constructor(
      time, // Int
      game, // Game
    ) {
      super(time, game, 'level', null, true)
      this.push(new Effect(time, this, 'wall'))
      this._game = game
    }
    get game() { return this._game }

    draw(
      ctx, // CanvasRenderingContext2D
      center, root, // Point
    ) {
      const time = center.time
      const walls = this.get_types(time, Wall)
      for (const wall_idx in walls) {
        const wall = walls[wall_idx]
        wall.draw(ctx,center,root)
      }
    }
  }
  MazeGame.Level = Level

  class Wall extends Cause {
    static root_round = 2
    static long_min = 2
    static long_round = 2
    static short_max = 1
    static short_sign = false

    static get_spec(
      game, // Game
      spot, // Spot
    ) {
      const {short_max,short_sign} = this

      const {time} = spot, {level} = game
      if (!level) {
        game.set_spec(new Level(time, game))
        return game
      }

      let {wall} = level
      if (!wall) {
        let min_long_dot, min_dist = short_max
        const walls = level.get_types(time, this)
        for (const idx in walls) {
          const level_wall = walls[idx], {root,long,short} = level_wall
          const _root = spot.sub(root)
          const long_dot = long.dot(_root) / long.dot(long)
          let short_dot = short.dot(_root) / min_dist
          if (!short_sign && short_dot < 0) short_dot = -short_dot
          if (0 < long_dot && long_dot < 1 && 0 < short_dot && short_dot < 1) {
            wall = level_wall; min_long_dot = long_dot
          }
        }
        if (wall) {
          const cause = new Cause(time, level, 'wall', wall)
          if (min_long_dot < 0.5) {
            cause.push(wall.spot.at(time).effect(wall,'root'))
            cause.push(wall._long.set(-1).at(time).effect(wall,'long'))
          }
          wall.set_spec(cause)
          return wall
        }
        else level.set_spec(new Wall( level, spot ))
        return level
      }
      const cause = new Cause(time, wall, 'long', spot.sub(wall.root))
      cause.push(new Effect(time, level, 'wall'))
      wall.set_spec(cause)
      return wall
    }

    constructor(
      level, // Level
      root, // Point
      label, // String,Null
    ) {
      super(root.time, level, label || 'wall', null, true)
      this.push(new Effect( root.time, this, 'reset', root ))
      this._level = level
    }
    get level() { return this._level }
    set reset(point) {
      const {long_min,short_max} = this.Type
      this._root = point
      this._long = new Point(point.time, long_min, short_max)
      this.states = [{ time: point.time, root: this._root, long: this._long, }]
    }
    set root(
      point, // Point
    ) {
      const top = this.states[this.states.length-1]
      if (top.time == point.time) top.root = point
      else if (top.time < point.time) {
        this.states.push({time: point.time, root: point, long: top.long})
      } else return
      this._root = point
    }
    set long(
      point, // Point
    ) {
      const top = this.states[this.states.length-1]
      if (top.time == point.time) top.long = point
      else if (top.time < point.time) {
        this.states.push({time: point.time, long: point, root: top.root})
      } else return
      this._long = point
    }
    get root() { return this._root.round(this.Type.root_round) }
    get long() {
      const {long_round,long_min,long_max} = this.Type
      return this._long.long.cramp(long_round,long_min,long_max)
    }
    get short() {
      const {long_round,short_min,short_max} = this.Type
      return this._long.short.cramp(long_round,short_min,short_max)
    }
    get spot() { return this.long.sum(this._root) }

    draw(
      ctx, // CanvasRenderingContext2D
      center,root, // Point
    ) {
      const _root = this.root.sub(root,1).mul(center.scale).sum(center,1)
      const _spot = this.spot.sub(root,1).mul(center.scale).sum(center,1)
      ctx.beginPath()
      _root.lineTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.strokeStyle = 'white'
      ctx.stroke()
    }
  }
  MazeGame.Wall = Wall

  return MazeGame
}
