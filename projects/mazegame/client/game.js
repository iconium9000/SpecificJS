module.exports = (project_name, Lib) => {

  class State {
    static names = 'states'
    static state = 'state'
    static key_bind = undefined
    get Class() { return this.constructor } // Class

    copy(
      state_copy,
    ) {
      if (!state_copy) {
        state_copy = new this.Class()
      }
      return state_copy
    }
    is_valid() {
      return null
    }

    static get_spot(
      editor, // Editor
    ) {
      return editor.level
    }

    static act(
      editor, // Editor
      state, // Class,Null
    ) {
      if (!state) {
        state = editor.state
      }

      editor.action = ''

      if (editor.spot != editor.level) {
        editor.spot = editor.level
        editor.action += `changed Editor spot to level, `
      }

      if (editor.state != state) {
        editor.state = state
        editor.action += `changed Editor state to ${state.name}, `
      }

      if (!editor.action) {
        editor.action = `no action`
      }
      return editor
    }
  }

  class Spot extends State {
    static names = 'spots'
    static state = 'spot'
    static round_root = 2 // Float

    // editor: Editor,Null
    // root_x;root_y: Float
    // is_open;change_open: Boolean
    // level: Level,Null
    // game: Game,Null

    change_open = false

    constructor(
      state, // State
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      super()

      const round_root = this.Class.round_root
      if (round_root > 0) {
        this.root_x = Math.round(root_x / round_root) * round_root
        this.root_y = Math.round(root_y / round_root) * round_root
      }
      else {
        this.root_x = root_x; this.root_y = root_y
      }
      this.is_open = is_open
      this[state.Class.state] = state
      state[this.Class.names].push(this)
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
    ) {
      if (!spot_copy) {
        spot_copy = new Spot(
          level_copy, this.root_x, this.root_y, this.is_open,
        )
      }
      if (this.editor) {
        spot_copy.editor = this.editor.copy( level_copy, spot_copy, )
      }
      spot_copy.change_open = spot_copy.is_open != this.is_open
      return spot_copy
    }
  }

  class Editor extends Spot {
    static names = 'editors'
    static state = 'editor'
    static key_bind = 'e'
    static round_root = 0 // Float

    // id: ID
    // name: String
    // spot_x;spot_y: Float
    // spot: Spot
    // state: Class

    constructor(
      level, // Level
      id, // ID
      name,action, // String
      state, // Class
      spot, // Spot,Null
      root_x,root_y,spot_x,spot_y, // Float
      is_open, // Boolean
    ) {
      super(level, root_x, root_y, is_open, )

      this.id = id
      this.name = name; this.action = action
      this.state = state
      this.spot = spot || level
      this.spot_x = spot_x; this.spot_y = spot_y
      level.game[this.Class.names][id] = this
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
      editor_copy, // Editor,Null
    ) {
      if (!editor_copy) {
        editor_copy = new Editor(
          level_copy, this.id, this.name,
          this.action, this.state, spot_copy,
          this.root_x,this.root_y,this.spot_x,this.spot_y,
          this.is_open,
        )
      }
      return editor_copy
    }

    deep_copy(
      game_copy, // Game,Null
      editor_copy, // Editor,Null
    ) {
      if (!game_copy) {
        game_copy = this.level.game.copy()
      }
      if (!editor_copy) {
        editor_copy = game_copy.editors[this.id]
      }
      return editor_copy
    }
  }

  class Wall extends Spot {
    static names = 'walls'
    static state = 'wall'
    static key_bind = 'w'
    static ceil_long = 2
    static short = 1

    // short_x;short_y;long_x;long_y;long: Float
    short_x = 0; short_y = 0
    long_x = 0; long_y = 0

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float
      long, // Float,Null
    ) {
      super( level, root_x,root_y, false, )

      const abs_long_x = Math.abs(long_x)
      const abs_long_y = Math.abs(long_y)
      long_x = long_x < 0 ? -1 : 1
      long_y = long_y < 0 ? -1 : 1

      const ceil_long = this.Class.ceil_long
      if ( abs_long_x < abs_long_y ) {
        this.long = abs_long_y
        this.long_y = long_y; this.short_x = long_x
      }
      else {
        this.long = abs_long_x || ceil_long
        this.long_x = long_x; this.short_y = long_y
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
        wall_copy = new this.Class (
          level_copy, this.root_x, this.root_y,
          this.long_x * this.long + this.short_x,
          this.long_y * this.long + this.short_y,
          this.long,
        )
      }
      return super.copy(level_copy, wall_copy)
    }

    static get_spot(
      editor, // Editor
    ) {
      const level = editor.level
      const walls = level[this.names]
      const this_short = this.short

      let min_dist = 1
      let spot = level
      editor.is_open = false

      for (const wall_idx in walls) {
        const wall = walls[wall_idx]
        const spot_x = editor.spot_x - wall.root_x
        const spot_y = editor.spot_y - wall.root_y
        const long = (spot_x*wall.long_x + spot_y*wall.long_y) / wall.long
        const short = (spot_x*wall.short_x + spot_y*wall.short_x) / this_short

        if ( 0 < long && long < 1 && 0 < short && short < min_dist ) {
          min_dist = short
          spot = wall
          editor.is_open = long > 0.5
        }
      }

      return spot
    }

    static act(
      editor, // Editor
    ) {
      if (editor.spot.Class == this) {

      }
      else {
        editor.spot = this.get_spot(editor)
        if (editor.spot == editor.level) {
          editor.action = `no action`
          return editor
        }

        
      }

      return editor
    }
  }

  class Jack extends Spot {
    static names = 'jacks'
    static state = 'jack'
    static key_bind = 'j'
    static round_root = 0

    // lock: Lock
    // key: Key
    // long_x;long_y: Float

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
      let long_x = this.long_x, long_y = this.long_y
      let root_x = key_copy.root_x, root_y = key_copy.root_y


      if (lock_copy) {
        long_x = lock_copy.long_x
        long_y = lock_copy.long_y
      }
      else {

        if (this.editor) {
          long_x = this.editor.spot_x - root_x
          long_y = this.editor.spot_y - root_y
        }

        const radius = key_copy.Class.radius
        const lock_long = radius + this.lock.Class.long
        const long = Math.sqrt(long_x * long_x + long_y * long_y)

        if (long) {
          long_x *= lock_long / long
          long_y *= lock_long / long
        }
        else {
          long_x = lock_long
          long_y = 0
        }

        lock_copy = this.lock.copy(
          level_copy,
          true, // temp spot for lock (so spot doesn't default to null)
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

      // fix temp lock spoot
      if (lock_copy.spot == true) {
        lock_copy.spot = jack_copy
      }

      return super.copy(level_copy, jack_copy)
    }
  }

  class Key extends Spot {
    static names = 'keys'
    static state = 'key'
    static key_bind = 'k'
    static round_root = 0
    static radius = 0.9

    // lock: Lock,Null
    // jack: Jack,Null

    constructor(
      level, // Level
      lock, // Lock,Null
      root_x, root_y, // Null,Float
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
      root_x, root_y, // Null,Float
      key_copy, // Key,Null
    ) {

      if (!key_copy) {
        key_copy = new Key(
          level_copy, lock_copy, root_x, root_y, this.is_open,
        )
      }

      if (this.jack) {
        key_copy.jack = this.jack.copy( level_copy, key_copy, lock_copy, )
      }

      return super.copy(level_copy, key_copy)
    }
  }

  class Lock extends Spot {
    static names = 'locks'
    static state = 'lock'
    static key_bind = 'l'
    static long = 2
    static round_root = 0

    // key: Key,Null
    // spot: Spot
    // long_x;long_y: Float

    constructor(
      level, // Level
      spot, // Spot,Null
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x, root_y, false )
      const long = this.Class.long
      this.spot = spot || level

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
      root_x,root_y,long_x,long_y, // Float,Null
      lock_copy, // Lock,Null
    ) {

      if (!spot_copy) {
        spot_copy = level_copy
        root_x = this.root_x; root_y = this.root_y
        long_x = this.long_x; long_y = this.long_y
      }

      if (!lock_copy) {
        lock_copy = new Lock (
          level_copy, spot_copy,
          root_x, root_y, long_x, long_y,
        )
      }

      if (this.key) {
        lock_copy.key = this.key.copy( level_copy, lock_copy, )
      }

      return super.copy(level_copy, lock_copy, )
    }
  }

  class Door extends Wall {
    static names = 'doors'
    static state = 'door'
    static key_bind = 'd'
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
      root_x,root_y,long_x,long_y, // Float
      long, // Float,Null
    ) {
      super( level, root_x,root_y,long_x,long_y, long, )
    }

    copy(
      level_copy, // Level
      door_copy, // Door,Null
    ) {
      const half_short = this.Class.short / 2
      const lock_names = this.Class.lock_names

      if (!door_copy) {
        door_copy = super.copy(level_copy)
      }

      door_copy.is_open = true
      for (const lock_name in lock_names) {
        const this_lock = this[lock_name]
        if (this_lock) {
          const lock_long = this_lock.Class.long
          const [ hs, hl, l, ls, ll ] = lock_names[lock_name]

          const short_mul = hs * half_short + ls * lock_long
          const long_mul = hl * half_short + l * long + ll * lock_long

          const lock_copy = this_lock.copy(
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
      return door_copy
    }
  }

  class Portal extends Door {
    static names = 'portals'
    static state = 'portal'
    static key_bind = 'p'

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
      super( level, root_x, root_y, long_x, long_y, )
      this.long = this.Class.long
    }
  }

  class Level extends Spot {
    static names = 'levels'
    static state = 'level'
    static key_bind = 'v'

    walls = [] // Wall[]
    doors = [] // Door[]
    portals = []; open_portals = [] // Portal[]
    locks = [] // Lock[]
    keys = [] // Key[]
    jacks = [] // Jack[]
    editors = [] // Editor[]

    constructor(
      state, // State
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      super(state, root_x, root_y, is_open, )
    }

    is_valid() {

    }

    copy(
      game_copy, // Game
      level_copy, // Level,Null
    ) {

      if (!level_copy) {
        level_copy = new Level(game_copy, this.root_x, this.root_y)
      }

      for (const wall_idx in this.walls) {
        const this_wall = this.walls[wall_idx]
        this_wall.copy(level_copy,)
      }

      for (const door_idx in this.doors) {
        const this_door = this.doors[door_idx]
        this_door.copy(level_copy,)
      }

      for (const portal_idx in this.portals) {
        const this_portal = this.portals[portal_idx]
        const portal_copy = this_portal.copy(level_copy,)

        if (portal_copy.is_open) {
          level_copy.open_portals.push(portal_copy)
        }
      }
      if (level_copy.open_portals.length != 2) {
        for (const portal_idx in level_copy.open_portals) {
          const portal_copy = level_copy.open_portals[portal_idx]
          portal_copy.is_open = false
          portal_copy.change_open = !portal_copy.change_open
        }
      }

      for (const lock_idx in this.locks) {
        const this_lock = this.locks[lock_idx]

        if (this_lock.spot == level) {
          const lock_copy = this_lock.copy( level_copy )
          if (!lock_copy.key) {
            level_copy.is_open = false
          }
        }
      }

      for (const key_idx in this.keys) {
        const this_key = this.keys[key_idx]

        if (!this_key.lock) {
          this_key.copy(level_copy, null, this_key.root_x, this_key.root_y)
        }
      }

      for (const editor_idx in this.editors) {
        const this_editor = this.editors[editor_idx]

        if (this_editor.spot == this) {
          this_editor.copy(level_copy)
        }
      }

      return super.copy(game_copy, level_copy)
    }
  }

  class Game extends State {
    static names = 'games'
    static state = 'game'
    static key_bind = 'g'

    editors = {} // Editor{ID}
    levels = [] // Level[]

    copy(
      game_copy, // Game,Null
    ) {
      if (!game_copy) {
        game_copy = new Game()
      }

      for (const level_idx in this.levels) {
        const this_level = this.levels[level_idx]
        this_level.copy(game_copy, )
      }

      return game_copy
    }

    is_valid() {

      for (const level_idx in this.levels) {
        const this_level = this.levels[level_idx]
        const invalid = this_level.is_valid()
        if (invalid) {
          return invalid
        }
      }

      return null
    }
  }

  const MazeGame = {
    State: State,
    Spot: Spot,
    Editor: Editor,
    Wall: Wall,
    Jack: Jack,
    Key: Key,
    Lock: Lock,
    Door: Door,
    Portal: Portal,
    Level: Level,
    Game: Game,
  }


  return MazeGame
}
