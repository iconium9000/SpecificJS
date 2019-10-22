module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error


  // Lerp: function(
  //   ratio, // Float:[0,1]
  //   src,dst, // Type
  // )

  class Type {
    static Type = Type

    get Type() {
      return this.constructor
    }
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

    event_array = []

    constructor(
      lerp, // Lerp,Null
    ) {
      super()
      this.lerp = lerp || ( (src,dst) => src )
    }

    get_event_idx(
      time, // Int
    ) {
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
      value, // Type
      lerp, // Boolean,Null
    ) {
      const new_event = new Event(time,value,lerp)
      const idx = this.get_event_idx(new_event.time)
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
      const idx = this.get_event_idx(time)
      const this_event = this.event_array[idx]
      const next_event = this.event_array[idx+1]
      if (!this_event) {
        return null
      }
      else if (next_event && this_event.lerp) {
        return this.lerp(
          (time - this_event.time) / (next_event.time - this_event.time),
          this_event.value, next_event.value
        )
      }
      else {
        return this_event.value
      }
    }
  }

  class Game extends Timeline {


  }

  class Level extends Type {


  }

  class Editor extends Type {



  }

  class Wall extends Type {


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
       Type,
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
       type.super_Type = type.__proto__
       MazeGame[type.name] = type
     }
     Type.super_Type = Type
   }

  return MazeGame
}
