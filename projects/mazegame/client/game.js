module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  MazeGame = {}

  class Type {
    static Type = this

    static lerp(
      ratio, // Float[0,1]
      src,dst, // Type
    ) {
      return this.copy(src)
    }

    static copy(
      old_type, // Type,Null
      time, // Int,Null
      type_copy, // Type,Null
    ) {
      return old_type && old_type.copy(time, type_copy)
    }

    // returns this.Type
    get Type() {
      return this.constructor
    }

    equals(
      type, // Type,Null
    ) {
      return type == this
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
        this._events = events || []
        this._lerp = true
        this._soft = false
        this._value = undefined
        this._type = Type
      }

      get _idx() {
        let l = 0, r = this._events.length - 1//, m = r
        while (l <= r) {
          let m = Math.floor((l + r) / 2)
          const dif = this._time - this._events[m]._time
          if (dif > 0) l = m + 1
          else if (dif < 0) r = m - 1
          else return m
        }
        return r
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
        const idx = this._idx
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
          const idx = this._idx
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
          const idx = this._idx
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
          const idx = this._idx
          if (idx < 0) return undefined
          const prev_event = this._events[idx]
          const next_event = this._events[idx+1]
          if (prev_event._soft && next_event != undefined) {
            return prev_event._type.lerp(
              (this._time - prev_event._time) /
              (next_event._time - prev_event._time),
              prev_event._value, next_event._value,
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
          const idx = this._idx
          if (idx < 0) {
            this._type = t
            this._lerp = false
            this._events.splice(0, 0, this)
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
          const idx = this._idx
          if (idx < 0) {
            this._soft = !!s
            this._lerp = false
            this._events.splice(0, 0, this)
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
          const idx = this._idx
          const prev_event = this._events[idx] || this
          if (prev_event._time == this._time && prev_event != this) {
            prev_event._value = v
          }
          else {
            this._value = v
            this._lerp = false
            this._events.splice(idx+1, 0, this)
          }
        }
        else this._value = v
      }
    }

    // return _Event
    label_io(
      label, // String,Int
      type, // Type,Null
    ) {
      let event = this._events[label]
      event = (
        event ? event.copy(this._time) :
        (this._events[label] = new this.Type._Event(this._time))
      )
      if (type != undefined) event.type = type
      return event
    }

    /* Get Type: gets map of all events whose type is included in type
      def events as new _Event{}
      for each event at label
        if event.type is a member of types
          set events[label] as event
      return events
      NOTE: return value maps the pointers to instantainious events
        of each timeline. This is a static object and not a dynamic one.
    */
    get_type(
      ...types // Type
    ) {
      const events = {}
      for (const timeline_label in this._events) {
        const event = this.label_io(timeline_label)
        if (types.includes(event.type)) {
          events[timeline_label] = event
        }
      }
      return events
    }

    // returns this.time
    get time() {
      return this._time
    }

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

    equals(
      timeline, // Timeline,Null
    ) {
      return !!timeline && timeline._events == this._events
    }

    constructor(
      time, // Int
    ) {
      super()
      this._time = time
      this._root_time = time
      this._events = {}
    }
  }
  MazeGame.Timeline = Timeline

  class Game extends Timeline {
    constructor(
      time, // Int
    ) {
      super(time)
    }
    set level(
      new_level, // Level,Null
    ) {
      this.label_io('level', Level).value = new_level
      if (new_level == undefined) return
      this.levels.label_io(new_level.root_time, Level).value = new_level
    }
    get level() {
      return this.label_io('level').value
    }
    get levels() {
      const _levels = this.label_io('levels', Timeline)
      let levels = _levels.value
      if (levels == undefined) {
        levels = new Timeline(this.time)
        _levels.value = levels
      }
      return levels
    }
  }
  MazeGame.Game = Game

  class GameObject extends Timeline {

    constructor(
      time, // Int
      game, // Game,Null
    ) {
      super(time)
      this.game = game
    }

    set game(
      game, // Game,Null
    ) {
      this.label_io('game', Game).value = game
    }
    get game() {
      return this.label_io('game').value
    }
    remove() {
      const _game = this.label_io('game')
      const game = _game.value
      if (game == undefined) return
      game.levels.label_io(this.root_time).value = null
      _game.value = null
    }
  }
  class Level extends GameObject {


  }
  MazeGame.Level = Level



  return MazeGame
}
