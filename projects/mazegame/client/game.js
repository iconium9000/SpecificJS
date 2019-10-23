module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  // Lerp: function(
  //   ratio, // Float:[0,1]
  //   src,dst, // Type
  // )

  class Type {
    static Type = Type
    static lerp(
      ratio, // Float:[0,1]
      src,dst, // Type
    ) {
      return src
    }

    // _time: Int
    get Type() {
      return this.constructor
    }
    get time() {
      return this._time
    }

    // return this
    static copy(
      time, // Int
      type, // this
    ) {
      return type && new this(time, type._timelines)
    }

    // return timelines[name].type,Null
    get(
      name, // String,Int
    ) {
      const timeline = this._timelines[name]
      return timeline && timeline.get(this.time)
    }

    // return value.Type,Null (if value overrides a value@time)
    set(
      value, // Type,Null
      name, // Int,String,Null
      type, // value.Type,Null
    ) {
      let idx = name != undefined ? name : this.time
      if (!this._timelines[idx]) {
        if (!type) {
          return null
        }
        this._timelines[idx] = new Timeline(this.time,name,type)
      }
      return this._timelines[idx].set(this.time,value)
    }

    constructor(
      time, // Int
      timelines, // Timeline[],Null
    ) {
      this._timelines = timelines || {}
      this._time = time
    }

    draw(
      ctx, // CanvasRenderingContext2D
    ) {}
  }

  class Int extends Type {
    // return Int
    static lerp(
      ratio, // Float[0,1]
      src,dst, // Int
    ) {
      return Math.floor((dst-src)*ratio + src)
    }
    // return Int
    static copy(
      time, // Int
      int, // Int
    ) {
      return int
    }
    // return Int
    static round(
      int, // Int
      round_to, // Float
    ) {
      return Math.floor(Math.round(int / round_to) * round_to)
    }
  }
  class Float extends Type {
    // return Float
    static lerp(
      ratio, // Float[0,1]
      src,dst, // Int
    ) {
      return (dst-src)*ratio + src
    }
    // return Float
    static copy(
      time, // Float
      float, // Float
    ) {
      return float
    }
    // return Float
    static round(
      float, // Float
      round_to, // Float
    ) {
      return Math.round(float / round_to) * round_to
    }
  }

  // class String extends Type
  {
    String.lerp = Type.lerp
    String.Type = Type
    String.copy = function(
      time, // Int
      string, // String
    ) {
      return string
    }
  }

  class Point extends Type {
    // _x,_y,_scale: Float
    // _short,_long: Float,Null

    static lerp(
      ratio, // Float:[0,1]
      src,dst, // Type
    ) {
      return new Point(
        Float.lerp(ratio, src.x, dst.x),
        Float.lerp(ratio, src.y, dst.y),
        1, this._short, this._long,
      )
    }

    static copy(
      time, // Int
      point, // Point,Null
    ) {
      return point && point.copy()
    }

    set() {}

    // return Point
    get() {
      return new Point(this._x, this._y, this._scale, this._short, this._long,)
    }


    get x() { return this._x * this._scale } // return Float
    get y() { return this._y * this._scale } // return Float
    get scale() { return this._scale } // return Float
    get length() { // return Float
      return this._scale * Math.sqrt(this._x*this._x + this._y*this._y)
    }

    get unit() { // return Point
      const length = Math.sqrt(this._x*this._x + this._y*this._y)
      return (
        length > 0 ?
        new Point(this._x / length, this._y / length, this._scale,) :
        new Point( 0, 0, this._scale, )
      )
    }

    constructor(
      x,y, // Float
      scale,short,long, // Float,Null
    ) {
      super()
      this._x = x; this._y = y; this._scale = scale || 1
      this._short = short; this._long = long
    }

    // return Point
    copy(
      scale,short,long, // Float,Null
    ) {
      return new Point(
        this._x, this._y,
        scale != undefined ? scale : this._scale,
        short > 0 ? short : this._short,
        long > 0 ? long : this._long,
      )
    }

    // return Point
    round(
      round_to, // Float
    ) {
      return new Point(
        Float.round(this.x, round_to),
        Float.round(this.y, round_to),
      )
    }

    // return Point
    sum(
      point, // Point
      scale, // Float,Null
    ) {
      scale = scale != undefined ? scale : point._scale
      return new Point( this.x + point._x * scale, this.y + point._y * scale, )
    }

    // return Point
    sub(
      point, // Point
      scale, // Float,Null
    ) {
      scale = scale != undefined ? scale : point._scale
      return new Point( this.x - point._x * scale, this.y - point._y * scale, )
    }

    // return Point
    get long() {
      const abs_x = Math.abs(this.x), abs_y = Math.abs(this.y)
      return (
        abs_x < abs_y ?
        new Point(
          0, this.y < 0 ? -1 : 1,
          this._short > 0 ? this._short : abs_y
        ) : new Point(
          this.x < 0 ? -1 : 1, 0,
          this._short > 0 ? this._short : abs_x
        )
      )
    }

    // return Point
    get short() {
      const abs_x = Math.abs(this.x), abs_y = Math.abs(this.y)
      return (
        abs_x > abs_y ?
        new Point(
          0, this.y < 0 ? -1 : 1,
          this._short > 0 ? this._short : abs_y
        ) : new Point(
          this.x < 0 ? -1 : 1, 0,
          this._short > 0 ? this._short : abs_x
        )
      )
    }
  }

  class Event extends Type {

    static copy(
      time, // Int
      event, // Event,Null
    ) {
      return new Event( this.time, this._value, this._lerp, )
    }

    constructor(
      time, // Int
      value, // Type
      lerp, // Boolean,Null
    ) {
      super(time)
      this._value = value
      this._lerp = !!lerp
    }

    get value() { // Type
      return this._value
    }
    get lerp() { // Boolean
      return this._lerp
    }
  }

  class Timeline extends Type {
    // _type: Type
    // _name: String,Int,Null
    // _events: Event[]

    get name() { // String
      return this._name
    }
    get type() {
      return this._type
    }

    constructor(
      time, // Int
      type, // Type
      name, // String,Int,Null
    ) {
      super(time)
      this._name = name
      this._type = type
      this._events = []
    }

    // return this.Type
    copy() {
      return this
    }

    _idx(
      time, // Int
    ) {
      time -= this.time

      let l = 0, r = this._events.length - 1
      while (l <= r) {
        let m = Math.floor((l + r) / 2)
        if (this._events[m].time < time) {
          l = m + 1
        }
        else if (this._events[m].time > time) {
          r = m - 1
        }
        else {
          return m
        }
      }
      return r
    }

    // return Type,Null
    set(
      time, // Int
      value, // Type,Object
      lerp, // Boolean,Null
    ) {
      const idx = this._idx(time)
      const this_event = this._events[idx]
      const new_event = new Event(time - this.time,value,lerp)

      if (this_event && this_event.time == new_event.time) {
        this._events[idx] = new_event
        const scrap_value = this_event.value
        return scrap_value && scrap_value.copy(time)
      }
      else {
        this._events.splice(idx + 1, 0, new_event)
        return null
      }
    }

    // return: Type,Null
    get(
      time, // Int
    ) {
      const idx = this._idx(time)
      const this_event = this._events[idx]
      const next_event = this._events[idx+1]
      if (!this_event) {
        return null
      }
      else if (next_event && this_event.lerp) {
        return this.type.lerp(
          (time - this_event.time) / (next_event.time - this_event.time),
          this_event.value, next_event.value
        )
      }
      else {
        return this_event.value
      }
    }
  }

  class Game extends Type {
    // levels: Level{}
  }

  class Level extends Type {


  }

  class Editor extends Type {



  }

  class Wall extends Type {
    // _root,_long: Point,Null
    static root_round = 1
    static long_round = 2
    static long_min = 3
    static short = 1
    static _root = new Point(0,0)
    static _long = new Point(0,1)
    static _short = new Point(1,0)

    set root(
      point, // Point
    ) {
      this._root = point
    }
    get root() {
      return (
        this._root ?
        this._root.round(this.Type.root_round) :
        this.Type._root.copy()
      )
    }
    set long(
      point, // Point
    ) {
      this._long = point
    }
    get long() {
      if (!this._long) {
        return this.Type._long.copy(this.Type.long_min)
      }
      const long = this._long.long
      long._scale = this.Type.long || (
        long._scale < this.Type.long_min ?
        this.Type.long_min :
        Float.round(long._scale, this.Type.long_round)
      )
      return long
    }
    get short() {
      if (!this._long) {
        return this.Type._long.copy(this.Type.short_min)
      }
      const short = this._long.short
      short._scale = this.Type.short || (
        short._scale < this.Type.short_min ?
        this.Type.short_min :
        Float.round(short._scale, this.Type.short_round)
      )
      return short
    }
  }

  class Door extends Type {


  }

  class Portal extends Type {


  }

  class Lock extends Type {


  }

  class Laser extends Type {


  }

  class Key extends Type {


  }

  class Jack extends Type {


  }

  const MazeGame = {}

   {

     const array = [
       Type,Float,Int,String,Point,
       Event,Timeline,
       Game,Level,Editor,
       Wall,Door,Portal,
       Lock,Laser,
       Key,Jack,
     ]

     for (const type_idx in array) {
       const type = array[type_idx]
       type.single_name = type.name.toLowerCase()
       type.plural_name = type.single_name + 's'
       if (type == Type || type == String) {
         type.super_Type = Type
       }
       else {
         type.super_Type = type.__proto__
       }
       MazeGame[type.name] = type
     }
   }

  return MazeGame
}
