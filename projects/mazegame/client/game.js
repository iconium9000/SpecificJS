module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2



  MazeGame = {}

  class Type {
    static Type = this
    static fill_color = 'black'
    static stroke_color = 'white'
    static line_width = 0.3

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
    ) {
      const {time,_x,_y,_scale} = this
      return new Point(time, _x,_y,
        _scale < min ? min : max < _scale ? max :
        0 < round ? Math.round(_scale / round) * round : _scale
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

  class ChangeTracker extends Type {
    constructor(
      time, // Int
    ) {
      super(time)
      this._timeline_map = {} // Effect[]{.label}
    }

    remove_flag(flag) {
      for (const label in this._timeline_map) {
        const timeline = this._timeline_map[label]
        let idx = 0
        while (idx < timeline.length) {
          const effect = timeline[idx]
          if (effect != this) effect.remove_flag(flag)
          if (effect.flag == flag) timeline.splice(idx,1)
          else ++idx
        }
      }
    }

    add_label(
      effect, // Effect
      deep, // Boolean,Null
    ) {
      const {_timeline_map: _ltls} = this, {time,_label} = effect
      const timeline = _ltls[_label] || (_ltls[_label] = [])
      timeline.splice(1+Lib.bin_idx_high(timeline, time, 'time'), 0, effect)
    }

    valid_at(
      time, // Int
      effect, // Effect,Null
    ) {
      return (
        time < this.time ? false :
        effect == this && this._label == 'stop_time' ? time <= this._value :
        time <= this.label_at(time, 'stop_time', Infinity)
      )
    }

    label_at(
      time, // Int
      label, // String
      null_value, // Object,Null
    ) {
      const timeline = this._timeline_map[label]
      if (!timeline) return null_value
      let idx = Lib.bin_idx_high(timeline, time, 'time')
      while ( idx >= 0 ) {
        const effect = timeline[idx--]
        if (effect.valid_at(time, this)) {
          return effect.value_at(time)
        }
      }
      return null_value
    }

    // gets Object[] with all valid values that this[label] has had
    //   between start_time and stop_time
    // if include_null, Object[] may contain null values
    range_at(
      start_time,stop_time, // Int
      label, // String
      include_null, // Boolean,Null
    ) {
      const timeline = this._timeline_map[label]
      if (!timeline) return []
      const range = []

      let last_effect = null
      for (let idx = 0; idx < timeline.length; ++idx) {
        const effect = timeline[idx]
        if (effect.valid_at(stop_time)) {
          if (effect.time < start_time);
          else if (effect.time <= stop_time) {
            if (last_effect && last_effect.time < start_time) {
              const value = last_effect.value_at(start_time)
              if (value != undefined || include_null) range.push(value)
            }
            const value = effect.value_at(effect.time)
            if (value != undefined || include_null) range.push(value)
          }
          last_effect = effect
        }
      }
      if (
        last_effect &&
        stop_time < last_effect.time &&
        start_time < stop_time
      ) {
        const value = last_effect.value_at(stop_time)
        if (value != undefined || include_null) range.push(value)
      }
      return range
    }

    values_at(
      time, // Int
    ) {
      const values = {}
      for (const label in this._timeline_map) {
        const value = this.label_at(time, label)
        if (value != undefined) values[label] = value
      }
      return values
    }
  }

  class Effect extends ChangeTracker {

    // NOTE: if dst is null, dst defaults to this
    // NODE: if value is undefined, value defaults to this
    constructor(
      time, // Int
      description, // String
      dst, // ChangeTracker,Null
      label, // String,Int
      value, // Object,Undefined,Null
      deep, // Boolean,Null
    ) {
      super(time); dst = dst || this
      this._description = description
      this._value = value === undefined ? this : value
      this._label = label
      dst.add_label(this, deep)
    }

    get description() { return this._description }
    get value() { return this._value }
    get label() { return this._label }

    value_at(
      time, // Int
    ) {
      if (this.time > time) return undefined
      else return this._value
    }
  }
  MazeGame.Effect = Effect

  // class that's value lerps between start and stop values
  class Lerp extends Effect {

    constructor(
      start_time,stop_time, // Int
      description, // String
      dst, // ChangeTracker,Null
      label, // String,Int
      start_value,stop_value, // Type
      type, // Type.Type (type of start_value and stop_value)
    ) {
      super(start_time, description, dst, label, start_value)
      this._stop_value; this._type = type; this._stop_time = stop_time
    }

    value_at(
      time, // Int
    ) {
      return (
        time < this.time ? undefined :
        time == this.time ? this._value :
        time < this._stop_time ? this._type.lerp(
          this.time, this._stop_time, time,
          this._value, this._stop_value,
        ) : this_.stop_value
      )
    }
  }
  MazeGame.Lerp = Lerp

  class Cause extends Effect {

    constructor(
      time, // Int
      description, // String
      dst, // ChangeTracker,Null
      label, // String,Int
      value, // Object,Null
      deep, // Boolean,Null
    ) {
      super(time,description,dst,label,value,deep)
      this._effects = []
      this._min_time = time
    }

    get min_time() { return this._min_time }

    set flag(flag) {
      super.flag = flag
      for (const idx in this._effects) this._effects[idx].flag = flag
    }
    remove_flag(flag) {
      super.remove_flag(flag)
      let idx = 0
      while (idx < this._effects.length) {
        const effect = this._effects[idx]
        effect.remove_flag(flag)
        if (effect.flag == flag) this._effects.splice(idx,1)
        else ++idx
      }
    }

    add_label(
      effect, // Effect
      deep, // Boolean,Null
    ) {
      super.add_label(effect, deep)
      if (deep) for (const idx in this._effects) {
        this._effects[idx].add_label(effect, true)
      }
    }

    // return true iff successful
    push(
      effect, // Effect
    ) {
      if ( this._min_time <= effect.time ) {
        this._effects.push(effect)
        this._min_time = effect.time
        return true
      }
      return false
    }
  }
  MazeGame.Cause = Cause

  class Game extends Cause {

    constructor(
      time, // Int
      description, // String
      editor_id, // String
    ) {
      super(time, description, null, 'editor', editor_id)
      this._levels = new ChangeTracker(time)
    }
    get levels() { return this._levels }
    remove_flag(flag) {
      super.remove_flag(flag)
      this._levels.remove_flag(flag)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const level = this.label_at(time, 'level')
      if (level) level.draw(ctx,time,root,center)
    }
  }
  MazeGame.Game = Game

  class Level extends Cause {

    constructor(
      time, // Int
      description, // String
      game, // Game
      levels, // ChangeTracker
    ) {
      super(time, description, levels, time)
      this._game = game
      this._walls = new ChangeTracker(time)
    }
    get game() { return this._game }
    get walls() { return this._walls }

    remove_flag(flag) {
      super.remove_flag(flag)
      this._walls.remove_flag(flag)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {

      const walls = this._walls.values_at(time)
      for (const label in walls) {
        walls[label].draw(ctx,time,root,center)
      }
    }
  }
  MazeGame.Level = Level

  class Wall extends Cause {
    static single_name = 'wall'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static short_min = 1
    static short_max = 1
    static short_sign = false

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

        const _root = wall.label_at(spot.time, 'root')
        const _long = wall.label_at(spot.time, 'long')

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
        return return_wall
      }
    }

    static act_at(
      game, // Game
      spot, // Point
    ) {
      const level = game.label_at(spot.time, 'level')
      if (!level || spot.time < level.min_time) return null
      const {single_name} = this

      // let wall = level.label_at(spot.time, single_name)
      // if (wall && wall.min_time <= spot.time) {
      //   const root = wall.label_at(spot.time, 'root')
      //   const cause = new Cause(spot.time, wall, 'long', spot.sub(root))
      //   cause.push(new Effect(spot.time, level, single_name, null))
      //   wall.push(cause)
      //   return cause
      // }
      //
      // const walls = level.label_map_at(spot.time, single_name, 'time')
      // wall = this.get_closest(spot, walls)
      // if (wall && wall.min_time <= spot.time) {
      //   const type = wall
      //   const _root = wall.label_at(spot.time, 'root')
      //   const _long = wall.label_at(spot.time, 'long')
      //   const root = spot.sub(type.to_root(_root)), long = type.to_long(_long)
      //   const long_dot = root.dot(long,1) / long.scale
      //
      //   const cause = new Cause(spot.time, level, single_name, wall)
      //   if (long_dot < 0.5) {
      //     const new_root = _root.sum(long).at(spot.time)
      //     cause.push(new Effect(spot.time, wall, 'root', new_root))
      //   }
      //   wall.push(cause)
      //   return cause
      // }

      let wall = new Wall(spot, 'added new wall', level.walls,)
      wall.push(new Effect(spot.time, 'set wall', level, 'wall', wall))
      level.push(wall)
      return wall
    }

    constructor(
      root, // Point
      description, // String
      walls, // ChangeTracker
    ) {
      const time = root.time
      super(time, description, walls, time)
      const {single_name,default_long} = this.Type
      this.push(new Effect(time, 'set root', this, 'root', root))
      this.push(new Effect(
        time, 'set long', this, 'long', default_long.at(time)
      ))
    }

    draw(
      ctx, // CanvasRenderingContext2D
      time, // Int
      root,center, // Point
    ) {
      const type = this.Type
      const _root = (
        type.to_root(this.label_at(time, 'root'))
        .sub(root,1).mul(center.scale).sum(center,1)
      )
      const _spot = _root.sum(
        type.to_long(this.label_at(time, 'long'))
        .mul(center.scale)
      )

      ctx.strokeStyle = type.stroke_color
      ctx.lineWidth = type.line_width * center.scale
      ctx.beginPath()
      ctx.lineCap = "round"
      _root.moveTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }
  }
  MazeGame.Wall = Wall

  return MazeGame
}
