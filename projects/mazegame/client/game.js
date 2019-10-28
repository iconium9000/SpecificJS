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

    // NOTE: if dst is null, dst defaults to this
    constructor(
      time, // Int
      dst, // Effect,Null
      label, // String,Int
      value, // Object,Null
      deep, // Boolean,Null
    ) {
      super(time)
      this._label = label; this._value = value
      this._label_timelines = {}
      ;(dst || this).add_effect(this, deep)
    }

    get value() { return this._value }
    get label() { return this._label }
    remove_flag(flag) {
      for (const label in this._label_timelines) {
        const timeline = this._label_timelines[label]
        let idx = 0
        while (idx < timeline.length) {
          const effect = timeline[idx]
          effect.remove_flag(flag)
          if (effect.flag == flag) timeline.splice(idx,1)
          else ++idx
        }
      }
    }

    add_effect(
      effect, // Effect
      deep, // Boolean,Null
    ) {
      const {_label_timelines: _ltls} = this, {time,_label} = effect
      const timeline = _ltls[_label] || (_ltls[_label] = [])
      timeline.splice(1+Lib.bin_idx_high(timeline, time, 'time'), 0, effect)
    }

    value_at(
      time, // Int
    ) {
      if (this.time > time) return undefined
      else return this._value
    }

    valid_at(
      time, // Int
      effect, // Effect,Null
    ) {
      if (this.time > time) return false
      if (effect == this && this._label == 'stop_time') {
        return time <= this._value
      }
      else return time <= this.get_label(time, 'stop_time', Infinity)
  
    }

    get_label(
      time, // Int
      label, // String
      null_value, // Object,Null
    ) {
      const timeline = this._label_timelines[label]
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

    get_range(
      start_time,stop_time // Int
      label, // String
      include_null, // Boolean,Null
    ) {
      const timeline = this._label_timelines[label]
      if (!timeline) return []
      const range = []

      let last_effect
      while (let idx = 0; idx < timeline.length; ++idx) {
        const effect = timeline[idx]
        if (this.valid_at(effect, stop_time)) {

        }
      }
    }

    get_label_map(
      time, // Int
      label, // String
      index_label, // String
    ) {
      const label_map = {}, timeline = this._label_timelines[label]
      if (!timeline) return label_map
      for (let idx = 0; idx < timeline.length; ++idx) {
        const effect = timeline[idx]
        if (this.valid_at(effect, time)) {
          const value = effect.value_at(time)
          if (value != undefined) {
            label_map[value[index_label]] = value
          }
        }
      }
      return label_map
    }
  }
  MazeGame.Effect = Effect

  class Lerp extends Effect {

    constructor(
      start_time,stop_time, // Int
      dst, // Effect,Null
      label, // String,Int
      start_value,stop_value, // Type
      type, // Type.Type (type of start_value and stop_value)
    ) {
      super(start_time, dst, label, start_value)
      this._stop_effect = new Effect(stop_time, dst || this, label, stop_value)
      this._stop_effect._label_timelines = this._label_timelines
      this._type = type
    }

    get type() { return this._type}
    set flag(flag) {
      this.flag = flag
      this._stop_effect.flag = flag
    }

    value_at(
      time, // Int
    ) {
      return (
        time < this.time ? undefined :
        time == this.time ? this._value :
        this._type.lerp(
          this.time, this._stop_effect.time, time,
          this._value, this._stop_effect._value,
        )
      )
    }
  }
  MazeGame.Lerp = Lerp

  class Cause extends Effect {

    constructor(
      time, // Int
      dst, // Effect,Null
      label, // String,Int
      value, // Object,Null
      deep, // Boolean,Null
    ) {
      super(time,dst,label,value,deep)
      this._effects = []
      this._min_time = time
    }

    set flag(flag) {
      this.flag = flag
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

    add_effect(
      effect, // Effect
      deep, // Boolean,Null
    ) {
      super.add_effect(effect, deep)
      if (deep) for (const idx in this._effects) {
        this._effects[idx].add_effect(effect, true)
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
      editor_id, // String
    ) {
      super(time, null, 'editor', editor_id)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      root,center, // Point
    ) {
      const level = this.get_label(center.time, 'level')
      if (level) level.draw(ctx,root,center)
    }
  }
  MazeGame.Game = Game

  class Level extends Cause {
    constructor(
      time, // Int
      game, // Game
    ) {
      super(time, null, 'game', game)
      this.push(new Effect(time, game, 'level', this))
    }

    draw(
      ctx, // CanvasRenderingContext2D
      root,center, // Point
    ) {

    }
  }
  MazeGame.Level = Level
  class Wall extends Cause {

  }
  MazeGame.Wall = Wall

  return MazeGame
}
