module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  MazeGame = {}

  class Type {
    static Type = this

    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Object
    ) {
      return this.copy(mid_t,src)
    }

    static copy(
      old_type, // Type,Null
      time, // Int,Null
      type_copy, // Type,Null
    ) {
      return old_type && old_type.copy(time, type_copy)
    }

    static temp(
      object, // Object,Null
    ) {
      return object
    }

    // returns this.Type
    get Type() {
      return this.constructor
    }

    copy(
      time, // Int
      type_copy, // Type,Null
    ) {
      if (!type_copy) {
        type_copy = new Type
      }
      return type_copy
    }

  }
  class Float extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Float
    ) {
      return (dst-src)*(mid_t-src_t)/(dst_t-src_t) + dst
    }
    static copy(
      old_float, // Float,Null
      time, // Int
      float_copy, //
    ) {
      return float_copy != undefined ? float_copy : old_float
    }
  }
  class Int extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Int
    ) {
      return Math.floor((dst-src)*(mid_t-src_t)/(dst_t-src_t) + dst)
    }
    static copy(
      old_int, // Int,Null
      time, // Int
      int_copy, // Int,Null
    ) {
      return int_copy != undefined ? int_copy : old_int
    }
  }

  class Point extends Type {
    static lerp(
      src_t,dst_t,mid_t, // Int
      src,dst, // Point
    ) {
      const ratio = (mid_t-src_t)/(dst_t-src_t)
      const {x,y} = src
      return new Point( (dst.x-x)*ratio + x, (dst.y-y)*ratio + y, 1, )
    }
    static copy(
      old_point, // Point,Null
      time,
      point_copy, // Point,Null
    ) {
      return old_point && old_point.copy(old_point.scale, point_copy)
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
    get length() {
      const {_scale,_length} = this
      return _scale * _length
    }
    get unit() {
      const {_x,_y,_scale,_length} = this
      return (
        _scale < 0 ?
        new Point(-_x/_length, -_y/_length, _length * -_scale) :
        new Point(_x/_length, _y/_length, _length * _scale)
      )
    }
    get set() {
      const {x,y} = this
      return new Point(x,y)
    }
    get long() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        new Point( 0, y < -1 ? -1 : 1, abs_y) :
        new Point( x < -1 ? -1 : 1, abs_x)
      )
    }
    get short() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x > abs_y ?
        new Point( 0, y < -1 ? -1 : 1, abs_y) :
        new Point( x < -1 ? -1 : 1, abs_x)
      )
    }

    set lineTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.lineTo(this.x, this.y)
    }

    constructor(
      x,y,scale, // Float,Null
    ) {
      super()
      this._x = x != undefined ? x : 0
      this._y = y != undefined ? y : 0
      this._scale = scale != undefined ? scale : 1
    }

    copy(
      scale, // Float,Null
      point_copy, // Point,Null
    ) {
      const {_x,_y,_scale} = this

      if (scale == undefined) {
        scale = _scale
      }

      if (point_copy == undefined) {
        point_copy = new Point(_x, _y, scale)
      }
      else {
        point_copy._x = _x; point_copy._y = y;
        point_copy._scale = scale
      }
      return point_copy
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
      const {x,y} = this
      if (scale == undefined) scale = 1
      if (point_scale == undefined) {
        return new Point( x + point.x, y + point.y, scale )
      }
      const {_x,_y} = point
      return new Point(x + _x * point_scale, y + _y * point_scale, scale)
    }

    sub(
      point, // Point
      point_scale,scale, // Float,Null
    ) {
      const {x,y} = this
      if (scale == undefined) scale = 1
      if (point_scale == undefined) {
        return new Point( x - point.x, y - point.y, scale )
      }
      const {_x,_y} = point
      return new Point(x - _x * point_scale, y - _y * point_scale, scale)
    }

    mul(
      mul, // Float
    ) {
      const {_x,_y,_scale} = this
      return new Point(_x,_y,_scale*mul)
    }
    div(
      div, // Float
    ) {
      const {_x,_y,_scale} = this
      return new Point(_x,_y,_scale/div)
    }

    // NOTE: assumes that this._length == 1
    // NOTE: assumes that this._scale > 0
    clamp(
      min,ceil, // Float
      scale, // Float,Null
    ) {
      const {_x,_y,_scale} = this
      return (
        scale != undefined ? new Point(_x,_y,scale) :
        _scale < min ? new Point(_x,_y,min) :
        new Point(_x,_y,Math.ceil(_scale / ceil) * ceil)
      )
    }

    round(
      round, // Float
    ) {
      const {x,y} = this
      return new Point(
        Math.round(x/round) * round,
        Math.round(y/round) * round, 1
      )
    }
  }
  MazeGame.Point = Point

  class TimeState extends Type {

    constructor(
      time, // Int
      type, // Type
      value, // Object,Null
      soft, // Boolean,Null
    ) {
      super()
      this._time = time; this._temp = false
      this._events = []
      this._events._root_time = time
      this._events._type = type
      this._events.push({ time: time, value: value, soft: !!soft })
    }

    get time() {
      return this._time
    }
    get type() {
      return this._events._type
    }
    get root_time() {
      return this._events._root_time
    }

    get _idx() {
      let l = 0, r = this._events.length - 1
      while (l <= r) {
        let m = Math.floor((l + r) / 2)
        const dif = this._time - this._events[m].time
        if (dif > 0) l = m + 1
        else if (dif < 0) r = m - 1
        else return m
      }
      return r
    }
    set soft(soft) {
      let idx = this._idx+1
      const prev_event = this._events[idx-1]
      const new_event = {
        time: this._time, soft: soft,
        value: prev_event && prev_event.value
      }

      if (!prev_event);
      if (prev_event.time == new_event.time) --idx
      else if (prev_event.value != undefined) {
        const next_event = this._events[idx]
        const next_value = next_event && next_event.value

        if (next_value != undefined) {
          new_event.value = this.type.lerp(
            prev_event.time, next_event.time, new_event.time,
            prev_event.value, next_value,
          )
        }
      }

      this._events.splice(idx, this._events.length - idx, new_event)
    }
    set value(value) {
      let idx = this._idx+1
      const event = this._events[idx-1]
      const new_event = { time: this._time, value: value, soft: false }
      if (event && event.time == new_event.time) {
        new_event.soft = event.soft
        --idx
      }
      this._events.splice(idx, this._events.length - idx, new_event)
    }
    get value() {
      const idx = this._idx
      const prev_event = this._events[idx]

      let value = prev_event && prev_event.value
      if (value != undefined && prev_event.time != this._time) {
        const next_event = this._events[idx+1]
        const next_value = next_event && next_event.value
        if (next_value != undefined) {
          value = this.type.lerp(
            prev_event.time, next_event.time, this._time,
            value, next_value,
          )
        }
      }
      else value = this.type.copy(value, this._time)

      if (value != undefined && this._temp) {
        const new_event = {
          time: this._time, value: value,
          soft: prev_event && prev_event.soft,
        }
        if (prev_event && prev_event.time == this._time) {
          this._events[idx] = new_event
        }
        else {
          this._events[idx].splice(idx+1,0,new_event)
        }
        value = this.type.temp(value)
      }
      return value
    }

    copy(
      time, // Int,Null
      timestate_copy, // TimeState,Null
    ) {
      if (time == undefined) time = this._time
      if (!timestate_copy) timestate_copy = new this.Type(time)
      else timestate_copy._time = time

      timestate_copy._events = this._events
      timestate_copy._temp = this._temp
      return timestate_copy
    }

    static temp(
      timestate, // TimeState,Null
    ) {
      return timestate && timestate.temp
    }

    get temp() {
      const events = this._events.slice(0)
      events._root_time = this.root_time
      events._type = this.type

      const temp_timestate = new this.Type(this._time)
      temp_timestate._events = events
      temp_timestate._temp = true
      return temp_timestate
    }

  }

  class TimeStateMap extends Type {

    constructor(
      time, // Int
      type, // Type
    ) {
      super()
      this._root_time = time
      this._time = time
      this._timestates = [{}]
      this._default_type = type
    }

    get time() {
      return this._time
    }
    get type() {
      return this._default_type
    }
    get root_time() {
      return this._root_time
    }

    copy(
      time, // Int,Null
      timestatemap_copy, // TimeStateMap
    ) {
      if (time == undefined) time = this._time
      if (!timestatemap_copy) {
        timestatemap_copy = new this.Type(time, this._default_type)
      }
      else timestatemap_copy._time = time
      timestatemap_copy._root_time = this._root_time
      timestatemap_copy._timestates = this._timestates
      return timestatemap_copy
    }

    get temp() {
      const temp_timestatemap = new this.Type(this._time)
      const [...timestates] = this._timestates
      temp_timestatemap._timestates = [{}, ...timestates]
      return temp_timestatemap
    }

    get(
      label, // String,Int
      type, // Type,Null
      state_type, // Type[TimeState,TimeStateMap],Null
    ) {
      const temp = this._timestates.length > 1
      for (const idx in this._timestates) {
        const timestate = this._timestates[idx][label]
        if (timestate != undefined) {
          const timestate_copy = timestate.copy(this._time)
          return temp ? timestate_copy.temp : timestate_copy
        }
      }
      const new_timestate = new (state_type || TimeState)(
        this._time, type || this._default_type
      )
      this._timestates[0][label] = new_timestate
      return new_timestate
    }

    get values() {
      const values = {}
      let idx = this._timestates.length
      const temp = idx > 1
      while (idx-- > 0) {
        const timestates = this._timestates[idx]
        for (const label in timestates) {
          const timestate = timestates[label].copy(this._time)
          values[label] = temp ? timestate.temp : timestate
        }
      }
      return values
    }

    add(
      timestate, // TimeState,TimeStateMap
    ) {
      this.get(timestate.root_time, timestate.Type).value = timestate
    }
  }

  class Timeline extends Type {

    static _Event = class {

      // _time, // Int
      // _events, // _Event[]
      // _lerp,soft, // Boolean
      // _value, // Type,Null
      // _type, // Type

      constructor(
        time, // Int
        events, // _Event[],Null
      ) {
        this._time = time
        if (events == undefined) {
          events = []
          events._flag = 1
        }
        this._events = events
        this._event_flag = 0

        this._lerp = true
        this._soft = false
        this._value = undefined
        this._type = Type
      }

      get idx() {
        if (this._event_flag == this._events._flag) return this._idx
        this._event_flag = this._event_flag

        let l = 0, r = this._events.length - 1//, m = r
        while (l <= r) {
          let m = Math.floor((l + r) / 2)
          const dif = this._time - this._events[m]._time
          if (dif > 0) l = m + 1
          else if (dif < 0) r = m - 1
          else return this._idx = m
        }
        return this._idx = r
      }

      // def event[time] as this_event
      // get this_event.time
      get time() {
        return this._time
      }

      copy(
        time, // Int,Null
      ) {
        if (time == undefined) {
          return this
        }
        const idx = this.idx
        const this_event = this._events[idx]
        if (this_event == undefined || this_event._time != time) {
          return new this.constructor(time, this._events)
        }
        else return this_event
      }

      // def event[idx(time)] as prev_event
      // if prev_event is undefined, get Type
      // else get prev_event.type
      get type() {
        if (this._lerp) {
          const idx = this.idx
          const prev_event = this._events[idx] || this
          return prev_event._type
        }
        return this._type
      }

      // def event[idx(time)] as prev_event
      // if prev_event is undefined, get false
      // else get prev_event.soft
      get soft() {
        if (this._lerp) {
          const idx = this.idx
          const prev_event = this._events[idx] || this
          return prev_event._soft
        }
        return this._soft
      }

      // def event[time] as this_event
      // def event[idx(time)] as prev_event
      // def event[idx(time)+1] as next_event
      // get this_event.value if this_event is defined
      // else if prev_event is undefined, get undefined
      // else if !prev_event.spot or next_event is undefined, get undefined
      // else get prev_event.lerp(prev_event, next_event)
      get value() {
        if (this._lerp) {
          const idx = this.idx
          if (idx < 0) return undefined
          const prev_event = this._events[idx]
          const next_event = this._events[idx+1]
          if (prev_event._soft && next_event != undefined) {
            return prev_event._type.lerp(
              prev_event.time, next_event.time, this._time,
              next_event._type,
            )
          }
          return prev_event._type.copy(prev_event._value, this._time)
        }
        return this._type.copy(this._value, this._time)
      }

      // def event[idx(time)] as prev_event
      // NOTE: it is assumed t:Type
      // if prev_event is undefined, define prev_event with .type as t
      // else set prev_event.type as t
      set type(t) {
        if (this._lerp) {
          const idx = this.idx
          if (idx < 0) {
            this._type = t
            this._lerp = false
            this._event_flag = ++this._events._flag
            this._idx = 0
            this._events.splice(this._idx, 0, this)
            return
          }
          this._events[idx]._type = t
        }
        else this._type = t
      }

      // def event[idx(time)] as prev_event
      // if prev_event is undefined, set prev_event with .spot as !!s
      // else set prev_event.spot as !!spot
      set soft(s) {
        if (this._lerp) {
          const idx = this.idx
          if (idx < 0) {
            this._soft = !!s
            this._lerp = false
            this._event_flag = ++this._events._flag
            this._idx = 0
            this._events.splice(this._idx, 0, this)
            return
          }
          this._events[idx]._soft = !!s
        }
        else this._soft = !!s
      }

      // def event[time] as this_event
      // event[idx(time)] as prev_event
      // if prev_event == this_event, set prev_event.value as v
      // else define new_event with .value as v
      set value(v) {
        if (this._lerp) {
          const idx = this.idx
          const prev_event = this._events[idx] || this
          if (prev_event._time == this._time && prev_event != this) {
            prev_event._value = v
          }
          else {
            this._value = v
            this._lerp = false
            this._event_flag = ++this._events._flag
            this._idx = idx+1
            this._events.splice(this._idx, 0, this)
          }
        }
        else this._value = v
      }
    }

    // return _Event
    // _Event has get,set for value and
    get_label(
      label, // String,Int
      type, // Type,Null
    ) {
      let event = this._events[label]
      event = (
        event ? event.copy(this._time) :
        (this._events[label] = new this.Type._Event(this._time))
      )
      event.type = type || this._default_type
      return event
    }

    get_timeline(
      label, // String,Int
      type, // Type,Null
    ) {
      const _timeline = this.get_label(label, Timeline)
      let timeline = _timeline.value
      if (timeline == undefined) {
        timeline = new Timeline(this.time, type)
        _timeline.value = timeline
      }
      return timeline
    }

    // returns this._time
    get time() {
      return this._time
    }

    // returns this._root_time
    get root_time() {
      return this._root_time
    }

    // NOTE: return value maps the pointers to instantainious TODO
    //   of each timeline. This is a static object and not a dynamic one.
    get values() {
      const values = {}
      for (const label in this._events) {
        const this_value = this._events[label].copy(this._time).value
        if (this_value != undefined) values[label] = this_value
      }
      return values
    }

    // makes new type_copy if no type_copy is provided
    // sets type_copy.time as this.time
    // sets type_copy.[timeline map] as this[timeline map]
    copy(
      time, // Int,Null
      type_copy, // Type,Null
    ) {
      if (time == undefined) {
        time = this._time
      }
      if (type_copy == undefined) type_copy = new this.Type(time)
      else type_copy._time = time

      type_copy._root_time = this._root_time
      type_copy._events = this._events

      return super.copy(time, type_copy)
    }

    constructor(
      time, // Int
      default_type, // Type,Null
    ) {
      super()
      this._time = time
      this._root_time = time
      this._events = {}
      this._default_type = default_type || Type
    }
  }
  MazeGame.Timeline = Timeline

  class Game extends TimeStateMap {
    constructor(
      time, // Int
    ) {
      super(time,Level)
    }
    set level(
      new_level, // Level,Null
    ) {
      this.get('level').value = new_level
    }
    get level() {
      return this.get('level').value
    }
    get levels() {
      return this.get('levels',Level,TimeStateMap)
    }
  }
  MazeGame.Game = Game

  class Level extends TimeStateMap {
    constructor(
      time, // Int
      game, // Game,Null
    ) {
      super(time,TimeState)
      this.game = game
    }
    set game(
      game, // Game,Null
    ) {
      this.get('game', Game).value = game
    }
    get game() {
      return this.get('game', Game).value
    }
    get walls() {
      return this.get('walls', Wall, TimeStateMap).value
    }
  }
  MazeGame.Level = Level

  class LevelObject extends Timeline {
    static root_default = new Point(0,0,1)
    static root_round = 1
    static root_radius = 3
    static fill_color = 'black'
    static line_color = 'white'
    static line_width = 0.1

    constructor(
      time, // Int
      level, // Level,Null
      root, // Point,Null
    ) {
      super(time,Point)
      this.level = level; this.root = root
    }
    set level(
      level, // Game,Null
    ) {
      this.get_label('level', Level).value = level
    }
    get level() {
      return this.get_label('level').value
    }

    set root(
      root, // Point,Null
    ) {
      this.get_label('root').value = root
    }
    get root() {
      return this.get_label('root').value || this.Type.root_default
    }

    static get_spot(
      level_objects, // LevelObject{},LevelObject[]
      spot, // Point
    ) {
      let closest_level_object = null
      let min_dist = this.root_radius
      for (const level_object_idx in level_objects) {
        const level_object = level_objects[level_object_idx]
        const {root} = level_object
        const dist = root.sub(spot).length
        if (dist < min_dist) {
          min_dist = dist
          closest_level_object = level_object
        }
      }
      return closest_level_object
    }

    draw(
      ctx, // CanvasRenderingContext2D
      root,center, // Point
      preview, // Boolean,Null
    ) {
      const {x,y} = this.root.sub(center,1).div(center.scale).sum(root,1)
      const {line_width, line_color, radius} = this.Type
      ctx.beginPath();
      ctx.arc(x,y,radius*center.scale, 0,pi2);
      ctx.closePath()
      ctx.lineWidth = line_width * scale; ctx.strokeStyle = line_color
      ctx.stroke()
    }
  }

  class Wall extends LevelObject {
    static long_min = 3
    static long_ceil = 1
    static long_default = new Point(1,0,1)
    static short = 3
    static short_sign = false

    constructor(
      time, // Int
      level, // Level,Null
      root,long, // Point,Null
    ) {
      super(time, level, root)
      this.root = root; this._long = long
    }
    set _long(
      long, // Point,Null
    ) {
      return this.get_label('long').value = long
    }
    get _long() {
      return this.get_label('long').value || this.Type.long_default
    }
    get long() {
      const {long_min,long_ceil,long} = this.Type
      return this._long.long.clamp(long_min,long_ceil,long)
    }
    get short() {
      const {short_min,short_ceil,short} = this.Type
      return this._long.short.clamp(short_min,short_ceil,short)
    }

    draw(
      ctx, // CanvasRenderingContext2D
      root,center, // Point
    ) {
      const scale = root.scale*center.scale
      const _root = this.root.sub(root,1,root.scale).sum(center,1,center.scale)
      const _spot = this.long.mul(scale).sum(_root)
      const {line_width, line_color} = this.Type
      ctx.lineWidth = line_width * scale
      ctx.strokeStyle = line_color
      ctx.beginPath()
      _root.lineTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()
    }

    static get_spot(
      walls, // Wall{},Wall[]
      spot, // Point
    ) {
      let closest_wall = null
      let min_dist = 1
      for (const wall_idx in walls) {
        const wall = walls[wall_idx]
        const {root,_long: {long, short}} = wall
        const _spot = root.sub(spot)
        let _short = _spot.dot(short) / short.scale/short.scale
        let _long = _spot.dot(long) / long.scale/long.scale
        if (this.short_sign && _short < 0) _short = -_short
        if (_short < min_dist && 0 < _long && _long < 1) {
          min_dist = _short
          closest_wall = wall
        }
      }
      return closest_wall
    }
  }
  MazeGame.Wall = Wall

  return MazeGame
}
