module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  class Type {
    static Type = Type

    get Type() {
      return this.constructor
    }
  }

  class Event extends Type {

    // return Event
    constructor([
      time, // Int
      type_name,method_name, // String
      ...args, // Type
    ]) {
      this.time = time
      this.type_name = type_name; this.method_name = method_name
      this.args = args
    }
  }

  class Timeline extends Type {

    events = []

    // return Timeline
    constructor([
      time, // Int
    ]) {
      super()
      this.time = time
    }

    // return Null
    add_event([
      ...new_events, // Event[]
    ]) {

      for (const event_idx in new_events) {
        const new_event = new_events[event_idx]
        for (const event_idx in this.events) {
          const [this_event] = this.events[event_idx]
          if (this_event.time == new_event.time) {
            this.events[event_idx].push(new_event)
            break
          }
          else if (new_event.time < this_event.time) {
            this.events.splice(event_idx, 0, [new_event])
            break
          }
        }
        this.events.push([new_event])
      }
    }

    // return Timeline
    get flatten() {
      // TODO
      return this
    }
  }

  class Game extends Type {


  }

  class Level extends Type {


  }

  class Editor extends Type {


    constructor([

    ]) {
      super()
    }
  }

  class Wall extends Type {


  }

  class Door extends Wall {


  }

  class Portal extends Door {


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
