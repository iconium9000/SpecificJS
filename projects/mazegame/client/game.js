module.exports = (project_name, Lib) => {

  const MazeGame = {}

  const door_speed = 1
  const jack_speed = 1

  const min_wall_long = 1
  const door_short = 2
  const half_door_short = door_short / 2
  const min_door_long = 3
  const lock_long = 2

  const portal_long = 4
  const half_portal_long = portal_long / 2
  const quarter_portal_long = portal_long / 4
  const portal_short = 1

  const jack_size = 0.9
  const jack_lock_long = jack_size + lock_long
  const door_lock_long = half_door_short + lock_long

  // half, spot, short, long
  const door_lock_names = {
    short_root_lock: [ 1, 0, 1, 0 ],
    long_root_lock:  [ 1, 0, 0, 1 ],
    short_spot_lock: [-1, 1,-1, 0 ],
    long_spot_lock:  [-1, 1, 0,-1 ],
  }

  class State {
    // ['wall','door','portal','lock','key','jack','level']
  }

  class Spot {
    static names = 'spots'
    static state = 'spot'

    editor // Editor,Null
    root_x;root_y // Float
    is_open;change_open = false // Boolean

    static round_root = 2 // Float

    constructor(
      level, // Game,Level
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      const round_root = this.constructor.round_root
      if (round_root) {
        this.root_x = Math.round(root_x / round_root) * round_root
        this.root_y = Math.round(root_y / round_root) * round_root
      }
      else {
        this.root_x = root_x; this.root_y = root_y
      }
      this.is_open = is_open
      level[this.constructor.names].push(this)
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot
    ) {
      if (editor) {
        spot_copy.editor = editor.copy( level_copy, spot_copy, )
      }
      spot_copy.change_open = this.is_open != spot_copy.is_open
      return spot_copy
    }
  }

  class Editor {
    static names = 'editors'
    static state = 'editor'

    id // ID
    name // String
    spot_x;spot_y // Float
    spot // Spot,Null
    state // String

    constructor(
      level, // Level
      id, // ID
      name, // String
      state, // State
      spot_x,spot_y, // Float
      spot, // Spot,Null
    ) {
      this.id = id
      this.name = name
      this.state = state
      this.spot_x = spot_x
      this.spot_y = spot_y
      this.spot = spot
      level[this.constructor.names][id] = this
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
    ) {
      const editor_copy = new Editor(
        level_copy,
        id, name, state, spot_x,spot_y,
        spot_copy,
      )
      return editor_copy
    }
  }

  class Wall extends Spot {
    static names = 'walls'
    static state = 'wall'

    long_x;long_y;long // Float

    static ceil_long = 2

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float
      long, // Float,Null
    ) {
      super( level, root_x,root_y, false, )

      const abs_long_x = Math.abs(long_x)
      const abs_long_y = Math.abs(long_y)

      const ceil_long = this.constructor.ceil_long
      if ( abs_long_x < abs_long_y ) {
        this.long = abs_long_y
        this.long_y = 1; this.long_x = 0
      }
      else {
        this.long = abs_long_x || ceil_long
        this.long_x = 1; this.long_y = 0
      }

      if (long > 0) {
        this.long = long
      }
      this.long = Math.ceil(this.long / ceil_long) * ceil_long
    }

    copy(
      level_copy, // Level
      wall_copy, // Wall,Null
    ) {
      if (!wall_copy) {
        wall_copy = new Wall (
          level_copy, root_x, root_y, long_x, long_y, long
        )
      }
      return super.copy(level_copy, wall_copy)
    }
  }

  class Jack extends Spot {
    static names = 'jacks'
    static state = 'jack'

    lock // Lock
    key // Key
    long_x; long_y // Float

    static round_root = 0

    constructor(
      level, // Level
      key, // Key
      lock, // Lock
      root_x, root_y, long_x, long_y, // Float
    ) {
      super(level, root_x, root_y, false)
      this.key = key; this.lock = lock
      this.long_x = long_x; this.long_y = long_y
    }

    copy(
      level_copy, // Level
      key_copy, // Key
      lock_copy, // Lock,Null
      jack_copy, // Jack,Null
    ) {
      let long_x = this.long_x, long_y = this.long_y, long = this.long
      let root_x = this.root_x, root_y = this.root_y

      if (lock_copy) {
        long_x = lock_copy.long_x
        long_y = lock_copy.long_y
      }
      else {
        const radius = key_copy.constructor.radius
        const lock_long = radius + this.lock.constructor.long

        long = Math.sqrt(long_x * long_x + long_y * long_y)
        if (long) {
          long_x *= lock_long / long
          long_y *= lock_long / long
        }
        else {
          long_x = lock_long
          long_y = 0
        }

        lock_copy = this.lock.copy(
          level_copy, null,
          root_x + long_x, root_y + long_y,
          -long_x, -long_y,
        )
      }

      if (!jack_copy) {
        jack_copy = new Jack(
          level_copy, key_copy, lock_copy,
          root_x, root_y, long_x, long_y,
        )
      }

      lock_copy.spot = jack_copy
      return super.copy(level_copy, jack_copy)
    }
  }

  class Key extends Spot {
    static names = 'keys'
    static state = 'key'

    lock // Lock,Null
    jack // Jack,Null

    static round_root = 0
    static radius = 0.9

    constructor(
      level, // Level
      lock, // Lock,Null
      root_x, root_y, // Float
      is_open, // Boolean
    ) {
      super(
        level,
        lock ? lock.root_x : root_x,
        lock ? lock.root_y : root_y,
        is_open
      )
      this.lock = lock
    }

    copy(
      level_copy, // Level
      lock_copy, // Lock,Null
      key_copy, // Key,Null
    ) {

      if (!key_copy) {
        key_copy = new Key( level_copy, lock_copy, root_x, root_y )
      }

      if (this.jack) {
        const spot = this.jack.editor && {
          long_x: this.jack.editor.spot_x - key_copy.root_x,
          long_y: this.jack.editor.spot_y - key_copy.root_y,
        } || lock_copy || this.jack

        key_copy.jack = this.jack.copy(
          level_copy, this, lock_copy,
          spot.long_x, spot.long_y,
        )
      }

      return super.copy(level_copy, key_copy)
    }
  }

  class Lock extends Spot {
    static names = 'locks'
    static state = 'lock'

    key // Key,Null
    spot // Spot,Null
    long_x;long_y // Float

    static long = 2
    static round_root = 0

    constructor(
      level, // Level
      spot, // Spot,Null
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x, root_y, false )
      const long = this.constructor.long
      this.spot = spot

      const length = Math.sqrt(long_x*long_x + long_y*long_y)
      if (length) {
        this.long_x *= long / length
        this.long_y *= long / length
      }
      else {
        this.long_x = long
        this.long_y = 0
      }
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
      lock_copy, // Lock,Null
    ) {

      if (!lock_copy) {
        lock_copy = new Lock (
          level_copy, spot_copy,
          root_x, root_y, long_x, long_y,
        )
      }

      if (this.key) {
        lock_copy.key = this.key.copy( level_copy, this, )
      }

      return super.copy(level_copy, lock_copy)
    }
  }

  class Door extends Wall {
    static names = 'doors'
    static state = 'door'


    short_x = 0;short_y = 0 // Float

    static ceil_long = 6
    static short = 2

    // half_short, half_long, long, lock_short, lock_long
    static lock_names = {
      lock_short_root: [ 1, 0, 0, 0,-1 ],
      lock_long_root:  [ 0, 1, 0,-1, 0 ],
      lock_short_spot: [ 2,-1, 1, 1, 0 ],
      lock_long_spot:  [ 1, 0, 1, 0, 1 ],
    }

    constructor(
      level, // Level
      root_x,root_y,short_x,short_y,long_x,long_y, // Float
      long, // Float,Null
    ) {
      super( level, root_x,root_y,long_x,long_y, long )

      if (this.long_x) {
        this.short_y = short_y < 0 ? -1 : 1
      }
      else {
        this.short_x = short_x < 0 ? -1 : 1
      }

      const lock_names = this.constructor.lock_names
      for (const lock_name in lock_names) {
        this[lock_name] = undefined
      }
    }

    copy(
      level_copy, // Level
      door_copy, // Door,Null
    ) {
      const short = this.constructor.short
      const half_short = short / 2
      const lock_names = this.constructor.lock_names

      if (!door_copy) {
        door_copy = new this.constructor(
          level_copy,
          root_x,root_y,short_x, short_x, long_x, long_y, long,
        )
      }

      door_copy.is_open = true
      for (const lock_name in lock_names) {
        const old_lock = this[lock_name]
        if (old_lock) {
          const lock_long = old_lock.constructor.long
          const [ hs, hl, l, ls, ll ] = lock_names[lock_name]

          const short_mul = hs * half_short + ls * lock_long
          const long_mul = hl * half_short + l * long + ll * lock_long

          const lock_copy = old_lock.copy(
            level_copy, door_copy, (
              root_x +
              door_copy.short_x * short_mul + door_copy.long_x * long_mul
            ), (
              root_y +
              door_copy.short_y * short_mul + door_copy.long_y * long_mul
            ),
            -ls, -ll,
          )
          door_copy[lock_name] = lock_copy
          if (!lock_copy.is_open) {
            door_copy.is_open = false
          }
        }
      }
      return super.copy(level_copy, door_copy)
    }
  }

  class Portal extends Door {
    static names = 'portals'
    static state = 'portal'

    static short = 1
    static ceil_long = 4
    static long = 4

    // quarterS, halfS, spotS, shortS, longS
    static lock_names = {
      lock_root: [ 0, 2, 0,-1, 0],
      lock_cent: [ 0, 4, 0,-1, 0],
      lock_spot: [ 0, 6, 0,-1, 0],
    }

    constructor(
      level, // Level
      root_x,root_y,short_x,short_y,long_x,long_y, // Float
    ) {
      super(
        level,
        root_x, root_y, short_x, short_y, long_x, long_y,
      )
      this.long = this.constructor.long
    }
  }

  class Level extends Spot {
    static names = 'levels'
    static state = 'level'

    walls = [] // Wall[]
    doors = [] // Door[]
    portals = []; active_portals = [] // Portal[]
    locks = [] // Lock
    keys = [] // Key
    jacks = [] // Jack
    editors = {} // Editor{ID}

    constructor(
      game, // Game
      root_x,root_y, // Float
    ) {
      super( game, root_x, root_y, true )
    }

    copy(
      game_copy, // Game
      level_copy, // Level,Null
    ) {

      if (!level_copy) {
        level_copy = new Level(game_copy, root_x, root_y)
      }

      for (const wall_idx in walls) {
        const old_wall = walls[wall_idx]
        old_wall.copy(level_copy,)
      }

      for (const door_idx in doors) {
        const old_door = doors[door_idx]
        old_door.copy(level_copy,)
      }

      for (const portal_idx in portals) {
        const old_portal = portals[portal_idx]
        old_portal.copy(level_copy,)
      }

      for (const key_idx in keys) {
        const old_key = keys[key_idx]

        if (!old_key.lock) {
          old_key.copy(level_copy,)
        }

      }

      return super.copy(game_copy, level_copy)
    }
  }

  class Game {
    static names = 'games'
    static state = 'game'

    levels = [] // Level

    copy(
      game_copy, // Game,Null
    ) {
      if (!game_copy) {
        game_copy = new Game()
      }

      for (const level_idx in levels) {
        const old_level = levels[level_idx]
        old_level.copy(game_copy, old_level.x, old_level.y, )
      }

      return game_copy
    }
  }

  MazeGame.classes = [
    State,Spot,Editor,Wall,Jack,Key,Lock,Door,Portal,Level,Game,
  ]


  const log = console.log

  const game = new Game()
  const level = new Level(game, 0, 0, )
  const key = new Key(level, null, 1,3, true)

  return MazeGame
}
