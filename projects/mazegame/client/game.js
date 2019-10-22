module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  // Lerp: function(
  //   ratio, // Float:[0,1]
  //   src,dst, // Type
  // )

  let sanity = 0

  class Type {
    static Type = Type
    static plurals = []
    static lerp(
      ratio, // Float:[0,1]
      src,dst, // Type
    ) {
      return src
    }

    get Type() {
      return this.constructor
    }

    timelines = {} // Timeline{.name}
    versions = {} // this_Type{.time}

    // constructor() {
    //   super()
    // }

    // return Type,Null
    set(
      time, // Int
      value, // Type,Null
      type, // Type
      name, // String,Int,Null
    ) {
      name = name != undefined && name || time
      this.timelines[name] = (
        this.timelines[name] || new Timeline(time,type,name)
      )
      return this.timelines[name].set(time,value)
    }

    get(
      time, // Int
      name, // Int,String,Null
    ) {

      if (name != undefined) {
        const timeline = this.timelines[name]
        return timeline && timeline.get(time)
      }

      const new_type = new this.Type
      for (const timeline_name in this.timelines) {
        const this_timeline = this.timelines[timeline_name]
        const value = this_timeline.get(time)
        const plural_name = this_timeline.type.plural_name
        // log(value, timeline_name, new_timeline.type)
        if (value != undefined) {
          if (new_type[plural_name]) {
            new_type[plural_name][this_timeline.name] = value.get(time)
          }
          else {
            new_type[plural_name] = {[this_timeline.name]: value.get(time)}
          }
        }
      }
      return new_type
    }
  }

  class Int extends Type {
    static lerp(
      ratio, // Float[0,1]
      src,dst, // Int
    ) {
      return Math.floor((dst-src)*ratio + src)
    }
  }
  class Float extends Type {
    static lerp(
      ratio, // Float[0,1]
      src,dst, // Int
    ) {
      return (dst-src)*ratio + src
    }
  }

  // class String extends Type
  {
    String.lerp = Type.lerp
    String.Type = Type
    String.plurals = []
  }

  class Event extends Type {

    constructor(
      time, // Int
      value, // Object
      lerp, // Boolean,Null
    ) {
      super()
      this.time = time
      this.value = value
      this.lerp = lerp
    }
  }

  class Timeline extends Type {
    // lerp: Lerp
    // time: Int
    // name: String,Int

    event_array = []

    constructor(
      time, // Int
      type, // Type
      name, // Int,String
    ) {
      super()
      this.time = time
      this.name = name
      this.type = type
    }

    _idx(
      time, // Int
    ) {
      time -= this.time

      let l = 0, r = this.event_array.length - 1
      while (l <= r) {
        let m = Math.floor((l + r) / 2)
        if (this.event_array[m].time < time) {
          l = m + 1
        }
        else if (this.event_array[m].time > time) {
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
      const new_event = new Event(time - this.time,value,lerp)
      const idx = this._idx(new_event.time)
      const this_event = this.event_array[idx]

      if (this_event && this_event.time == new_event.time) {
        this.event_array[idx] = new_event
        return this_event.value
      }
      else {
        this.event_array.splice(idx + 1, 0, new_event)
        return null
      }
    }


    // return: Type,Null
    get(
      time, // Int
    ) {
      const idx = this._idx(time)
      const this_event = this.event_array[idx]
      const next_event = this.event_array[idx+1]
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
    static plurals = [`Level`]

    // levels: Level{}

  }

  class Level extends Type {
    static plurals = [
      `Editor`,
      `Wall`, `Door`, `Portal`,
      `Lock`, `Laser`,
      `Key`, `Jack`,
    ]


  }

  class Editor extends Type {



  }

  class Wall extends Type {
    static plurals = [
      `Lock`,`Laser`,
    ]

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
       Type,Float,Int,String,
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
         type.plurals = type.super_Type.plurals.concat(type.plurals)
       }
       MazeGame[type.name] = type
     }
     for (const type_idx in array) {
       const type = array[type_idx]
       for (const idx in type.plurals) {
         type.plurals[idx] = MazeGame[type.plurals[idx]].plural_name
       }
     }
   }

  return MazeGame
}
