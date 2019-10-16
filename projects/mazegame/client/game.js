module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  class State {
    // name;plural_name;single_name: String
    // state: State

    static state = State
    static plural_name = 'states'
    static single_name  = 'state'
    static key_bind = undefined

    static act(
      editor, // Editor
      state, // State,Null
    ) {
      if (!state) {
        state = editor.state
      }

      editor.action = ''

      if (editor.spot != editor.level) {
        editor.spot.editor = null
        editor.spot = editor.level
        editor.is_open = false
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

  class Mouse extends State {
    static plural_name = 'mice'
    static single_name = 'mouse'

    // x,y,prev_x,prev_y: Float
    // width,height,scale: Float
    // right_down,left_down: Boolean

    x = -1
    y = -1

    right_down = false
    left_down = false

    static act() {}
  }

  class Spot extends State {

    static plural_name = 'spots'
    static single_name = 'spot'
    static round_root = 2 // Float
    static sel_color = '#ffff00'
    static stroke_color = '#ffffff'
    static fill_color = '#000000'
    static radius = 1
    static line_width = 1/2

    get State() { return this.constructor } // State

    // super_spot: Spot,Null
    // editor: Editor,Null
    // root_x;root_y: Float
    // is_open;change_open: Boolean
    // level: Level,Null
    // game: Game,Null

    change_open = false

    constructor(
      super_spot, // Spot,Null
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      super()

      const round_root = this.State.round_root
      if (round_root > 0) {
        this.root_x = Math.round(root_x / round_root) * round_root
        this.root_y = Math.round(root_y / round_root) * round_root
      }
      else {
        this.root_x = root_x; this.root_y = root_y
      }
      this.is_open = is_open

      if (super_spot) {
        this.super_spot = super_spot
        this[super_spot.State.single_name] = super_spot
        super_spot[this.State.plural_name].push(this)
      }
    }

    copy(
      super_spot_copy, // Spot,Null
      spot_copy, // Spot,Null
    ) {
      if (!spot_copy) {
        spot_copy = new Spot(
          super_spot_copy, this.root_x, this.root_y, this.is_open,
        )
      }
      if (this.editor) {
        spot_copy.editor = this.editor.copy( super_spot_copy, spot_copy, )
      }
      spot_copy.change_open = spot_copy.is_open != this.is_open
      return spot_copy
    }

    remove() {
      if (this.editor) {
        // TODO this.State == Level or Game
        this.editor.spot = this.editor.level
        delete this.editor
      }
      if (this.super_spot) {
        const spots = this.super_spot[this.State.plural_name]
        const idx = spots.indexOf(this)
        delete spots[idx]
        delete this.super_spot
        return idx >= 0
      }
      return false
    }

    draw() {}

    static get_spot(
      editor, // Editor
      radius, // Float,Null
    ) {
      if (!radius) {
        radius = this.radius
      }
      let min_dist2 = radius*radius
      let ret_spot = editor.level

      const spots = editor.level[this.plural_name]
      for (const spot_idx in spots) {
        const spot = spots[spot_idx]

        const x = editor.spot_x - spot.root_x
        const y = editor.spot_y - spot.root_y
        const dist2 = x*x + y*y
        if (dist2 < min_dist2) {
          min_dist2 = dist2
          ret_spot = spot
        }
      }

      return ret_spot
    }

    static act(
      editor, // Editor
      now_time, // Float
    ) {
      return editor
    }
  }

  class Editor extends Spot {
    static plural_name = 'editors'
    static single_name = 'editor'
    static key_bind = 'e'
    static round_root = 0 // Float

    static scale = 100

    // id: ID
    // name: String
    // spot_x;spot_y;scale;start_time;now_time: Float
    // spot: Spot
    // state: State

    remove() {
      // TODO
    }

    constructor(
      level, // Level
      id, // ID
      name,action, // String
      state, // State
      spot, // Spot,Null
      root_x,root_y,spot_x,spot_y,scale,start_time,now_time, // Float
      is_open, // Boolean
    ) {
      super(level, root_x, root_y, is_open, )

      this.id = id
      this.name = name; this.action = action
      this.state = state
      this.spot = spot || level
      this.spot_x = spot_x; this.spot_y = spot_y; this.scale = scale
      this.start_time = start_time; this.now_time = now_time
      level.game[this.State.plural_name][id] = this
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
    ) {
      this.level.draw(ctx, mouse, this)
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
      editor_copy, // Editor,Null
    ) {
      if (!editor_copy) {
        editor_copy = new Editor(
          level_copy,
          this.id,
          this.name, this.action,
          this.state,
          spot_copy,
          this.root_x,this.root_y,this.spot_x,this.spot_y,this.scale,
          this.start_time,this.now_time,
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
    static plural_name = 'walls'
    static single_name = 'wall'
    static key_bind = 'w'
    static ceil_long = 2
    static short = 1
    static get_abs = true

    // short_x;short_y;long_x;long_y;long: Float
    short_x = 0; short_y = 0
    long_x = 0; long_y = 0

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x,root_y, false, )

      const abs_long_x = Math.abs(long_x)
      const abs_long_y = Math.abs(long_y)
      long_x = long_x < 0 ? -1 : 1
      long_y = long_y < 0 ? -1 : 1

      const ceil_long = this.State.ceil_long
      if ( abs_long_x < abs_long_y ) {
        this.long = abs_long_y
        this.long_y = long_y; this.short_x = long_x
      }
      else {
        this.long = abs_long_x || ceil_long
        this.long_x = long_x; this.short_y = long_y
      }

      this.long = Math.ceil(this.long / ceil_long) * ceil_long
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      const root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      const root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale

      const spot_x = root_x + this.long_x * this.long * mouse.scale
      const spot_y = root_y + this.long_y * this.long * mouse.scale

      ctx.lineWidth = this.State.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
        this.State.sel_color :
        this.State.stroke_color

      ctx.beginPath()
      ctx.moveTo(root_x, root_y)
      ctx.lineTo(spot_x, spot_y)
      ctx.stroke()
    }

    copy(
      level_copy, // Level
      wall_copy, // Wall,Null
    ) {
      if (!wall_copy) {
        wall_copy = new this.State (
          level_copy, this.root_x, this.root_y,
          this.long_x * this.long + this.short_x,
          this.long_y * this.long + this.short_y,
        )
      }

      return super.copy(level_copy, wall_copy)
    }

    static get_spot(
      editor, // Editor
    ) {
      const level = editor.level
      const walls = level[this.plural_name]
      const this_short = this.short

      let min_dist = this_short
      let spot = level
      editor.is_open = false

      for (const wall_idx in walls) {
        const wall = walls[wall_idx]
        const spot_x = editor.spot_x - wall.root_x
        const spot_y = editor.spot_y - wall.root_y
        const long = (spot_x*wall.long_x + spot_y*wall.long_y) / wall.long
        let short = (
          spot_x*wall.short_x + spot_y*wall.short_y
        ) / min_dist

        if (this.get_abs) {
          short = Math.abs(short)
        }

        if ( 0 < long && long < 1 && 0 < short && short < 1 ) {
          min_dist = short
          spot = wall
          editor.is_open = long > 0.5
          spot.idx = wall_idx
        }
      }


      return spot
    }

    static act(
      editor, // Editor
      now_time, // Float
    ) {
      editor.start_time = now_time
      editor.now_time = now_time

      if (editor.spot.State == this) {

        editor.action = ''

        if (!editor.is_open) {
          editor.spot.root_x += editor.spot.long_x * editor.spot.long
          editor.spot.root_y += editor.spot.long_y * editor.spot.long
          editor.is_open = true
          editor.action = `fliped ${this.name}, `
        }

        editor.spot.long_x = (editor.spot_x - editor.spot.root_x)
        editor.spot.long_y = (editor.spot_y - editor.spot.root_y)
        editor.spot.long = 1
        delete editor.spot.editor
        editor.spot = editor.level

        editor.action += `resized and deselected ${this.name}`
      }
      else {
        delete editor.spot.editor
        editor.spot = this.get_spot(editor)
        editor.spot.editor = editor
        editor.action = `selected ${this.name}`

        if (editor.spot == editor.level) {
          delete editor.spot.editor
          editor.spot = new this( editor.level, editor.spot_x, editor.spot_y )
          editor.spot.editor = editor
          editor.is_open = true
          editor.action = `new ${this.name}`
        }
      }

      return editor.deep_copy()
    }
  }

  class Door extends Wall {
    static plural_name = 'doors'
    static single_name = 'door'
    static key_bind = 'd'
    static round_root = 4
    static ceil_long = 12
    static short = 4
    static get_abs = false
    // half_short, half_long, long, lock_short, lock_long
    static lock_names = {
      lock_short_root: [ 1, 0, 0, 0,-1 ],
      lock_long_root:  [ 0, 1, 0,-1, 0 ],
      lock_short_spot: [ 2,-1, 1, 1, 0 ],
      lock_long_spot:  [ 1, 0, 1, 0, 1 ],
    }
    static lock_name_array = [
      'lock_short_root', 'lock_long_root',
      'lock_short_spot', 'lock_long_spot',
    ]

    static door_speed

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x,root_y,long_x,long_y, )
    }

    copy(
      level_copy, // Level
      door_copy, // Door,Null
    ) {
      const half_short = this.State.short / 2
      const lock_names = this.State.lock_names

      door_copy = super.copy(level_copy, door_copy)

      door_copy.is_open = true
      for (const lock_name in lock_names) {
        const this_lock = this[lock_name]
        if (this_lock) {
          const lock_long = this_lock.State.long
          const [ hs, hl, l, ls, ll ] = lock_names[lock_name]

          const short_mul = hs * half_short + ls * lock_long
          const long_mul = hl * half_short + l * door_copy.long + ll * lock_long

          const lock_copy = this_lock.copy(
            level_copy, door_copy, (
              door_copy.root_x +
              door_copy.short_x * short_mul +
              door_copy.long_x * long_mul
            ), (
              door_copy.root_y +
              door_copy.short_y * short_mul +
              door_copy.long_y * long_mul
            ),
            -ls * this.short_x - ll * this.long_x,
            -ls * this.short_y - ll * this.long_y,
          )
          door_copy[lock_name] = lock_copy
          if (!lock_copy.is_open) {
            door_copy.is_open = false
          }
        }
      }
      return door_copy
    }

    remove() {

      const lock_names = this.State.lock_names

      for (const lock_name in lock_names) {
        const this_lock = this[lock_name]
        if (this_lock) {
          this_lock.remove()
        }
      }

      return super.remove()
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      let root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      let root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale
      let short = this.State.short * mouse.scale
      let long = this.long * mouse.scale

      ctx.lineWidth = this.State.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
      this.State.sel_color :
      this.State.stroke_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(root_x,root_y)
      ctx.lineTo(root_x + this.short_x * short,root_y + this.short_y * short)
      ctx.lineTo(root_x + this.long_x * short,root_y + this.long_y * short)
      ctx.closePath()
      ctx.stroke()

      root_x += this.short_x * short + this.long_x * long
      root_y += this.short_y * short + this.long_y * long
      long = -long
      short = -short

      ctx.beginPath()
      ctx.moveTo(root_x,root_y)
      ctx.lineTo(root_x + this.short_x * short,root_y + this.short_y * short)
      ctx.lineTo(root_x + this.long_x * short,root_y + this.long_y * short)
      ctx.closePath()
      ctx.stroke()

      // TODO
    }
  }

  class Portal extends Door {
    static plural_name = 'portals'
    static single_name = 'portal'
    static key_bind = 'p'

    static short = 3
    static ceil_long = 12
    static long = 12
    static mid_short = this.short / 2
    static center_long = this.long / 2

    static center_short = (
      (
        this.short*this.short - this.mid_short*this.mid_short +
        this.long * this.long / 4
      ) / (
        2 * (this.short - this.mid_short)
      )
    )
    static radius = Math.sqrt(
      Math.pow(this.short - this.center_short, 2) +
      Math.pow(this.long - this.center_long, 2)
    )

    // quarterS, halfS, spotS, shortS, longS
    static lock_names = {
      lock_root: [ 0, 2, 0,-1, 0],
      lock_cent: [ 0, 4, 0,-1, 0],
      lock_spot: [ 0, 6, 0,-1, 0],
    }
    static lock_name_array = [ 'lock_root', 'lock_cent', 'lock_spot',  ]


    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x,root_y,long_x,long_y, )
      this.long = this.State.long
    }


    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      let root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      let root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale
      let short = this.State.short * mouse.scale
      let long = this.State.long * mouse.scale

      const center_x = root_x + mouse.scale * (
        this.State.center_short * this.short_x +
        this.State.center_long * this.long_x
      )
      const center_y = root_y + mouse.scale * (
        this.State.center_short * this.short_y +
        this.State.center_long * this.long_y
      )

      ctx.lineWidth = this.State.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
      this.State.sel_color :
      this.State.stroke_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const p_root_x = root_x + this.short_x * short
      const p_root_y = root_y + this.short_y * short
      const p_spot_x = p_root_x + this.long_x * long
      const p_spot_y = p_root_y + this.long_y * long

      const angle_root = Math.atan2( p_root_y - center_y, p_root_x - center_x)
      const angle_spot = Math.atan2( p_spot_y - center_y, p_spot_x - center_x)

      ctx.beginPath()
      if (
        (this.long_x + this.short_x) > 0 ^
        (this.long_y + this.short_y) > 0 ^
        this.long_x == 0
      ) {
        ctx.lineTo( p_root_x, p_root_y )
        ctx.lineTo( root_x, root_y )
        ctx.lineTo( root_x + this.long_x * long, root_y + this.long_y * long )
        ctx.lineTo( p_spot_x, p_spot_y )
        ctx.arc(
          center_x,center_y,
          this.State.radius * mouse.scale,
          angle_spot,
          angle_root,
        )
      }
      else {
        ctx.arc(
          center_x,center_y,
          this.State.radius * mouse.scale,
          angle_root,
          angle_spot,
        )
        ctx.lineTo( p_spot_x, p_spot_y )
        ctx.lineTo( root_x + this.long_x * long, root_y + this.long_y * long )
        ctx.lineTo( root_x, root_y )
        ctx.lineTo( p_root_x, p_root_y )
      }
      ctx.closePath()
      ctx.stroke()

      // TODO
    }
  }

  class Lock extends Spot {
    static plural_name = 'locks'
    static single_name = 'lock'
    static key_bind = 'l'
    static long = 3
    static round_root = 0
    static radius = 0.5

    // key: Key,Null
    // spot: Spot
    // long_x;long_y: Float

    constructor(
      level, // Level
      spot, // Spot,Null
      root_x,root_y,long_x,long_y, // Float
    ) {
      super( level, root_x, root_y, false )
      const long = this.State.long
      this.spot = spot || level

      const length = Math.sqrt(long_x*long_x + long_y*long_y)
      if (length) {
        this.long_x = long_x / length * long
        this.long_y = long_y / length * long
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

    remove() {

      const lock_names = this.spot.State.lock_names

      for (const lock_name in lock_names) {
        const spot_lock = this.spot[lock_name]
        if (spot_lock == this) {
          delete this.spot[lock_name]
          delete this.spot
        }
      }

      if (this.key) {
        this.key.remove()
      }

      return super.remove()
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      let root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      let root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale

      ctx.lineWidth = this.State.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
        this.State.sel_color :
        this.State.stroke_color
      ctx.beginPath()
      ctx.moveTo(root_x, root_y)
      ctx.lineTo(
        root_x + this.long_x * mouse.scale,
        root_y + this.long_y * mouse.scale,
      )
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = this.State.fill_color
      ctx.beginPath()
      ctx.arc(root_x, root_y, this.State.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.arc(root_x, root_y, this.State.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.stroke()
    }

    static act(
      editor, // Editor
      now_time, // Float
    ) {
      editor.start_time = now_time
      editor.now_time = now_time

      const spot = this.get_spot(editor)
      if (spot.State == this) {
        editor.spot.editor = null

        editor.spot = spot
        spot.editor = editor
        return editor.deep_copy()
      }

      const door = Door.get_spot(editor)
      if (door.State == Door) {
        const spot_x = editor.spot_x - door.root_x
        const spot_y = editor.spot_y - door.root_y
        const lock_name = Door.lock_name_array[Math.floor(
          (spot_x*door.long_x + spot_y*door.long_y) *
          Door.lock_name_array.length / door.long
        )]
        if (lock_name && !door[lock_name]) {
          const new_lock = new Lock(editor.level, door)
          door[lock_name] = new_lock
          editor.spot.editor = null
          editor.spot = new_lock
          new_lock.editor = editor
          return editor.deep_copy()
        }
      }

      const portal = Portal.get_spot(editor)
      if (portal.State == Portal) {
        const spot_x = editor.spot_x - portal.root_x
        const spot_y = editor.spot_y - portal.root_y
        const lock_name = Portal.lock_name_array[Math.floor(
          (spot_x*portal.long_x + spot_y*portal.long_y) *
          Portal.lock_name_array.length / portal.long
        )]
        if (lock_name && !portal[lock_name]) {
          const new_lock = new Lock(editor.level, portal)
          portal[lock_name] = new_lock
          editor.spot.editor = null
          editor.spot = new_lock
          new_lock.editor = editor
          return editor.deep_copy()
        }
      }

      return editor
    }
  }

  class Key extends Spot {
    static plural_name = 'keys'
    static single_name = 'key'
    static key_bind = 'k'
    static round_root = 0
    static radius = 2
    static center_radius = Lock.radius

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

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      let root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      let root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale

      ctx.lineWidth = this.State.line_width * mouse.scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.fillStyle = this.State.fill_color
      ctx.beginPath()
      ctx.arc(root_x, root_y, this.State.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = ctx.strokeStyle = this == editor.spot ?
      this.State.sel_color :
      this.State.stroke_color

      ctx.beginPath()
      ctx.arc(root_x, root_y, this.State.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(root_x, root_y, this.State.center_radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()
    }

    remove() {
      if (this.jack) {
        this.jack.remove()
      }
      return super.remove()
    }

    static act(
      editor, // Editor
      now_time, // Float
    ) {

      editor.spot.editor = null

      let lock = Lock.get_spot(editor, 2 * this.radius)
      const key = lock.State == Lock && lock.key || this.get_spot(editor)
      if (key.State == this) {
        editor.spot = key
        editor.spot.editor = editor
        return editor.deep_copy()
      }
      else if (editor.spot.State == this) {
        if (editor.spot.lock) {
          editor.spot.lock.key = null
          editor.spot.lock = null
        }
        if (lock.State == Lock) {
          lock.key = editor.spot
          editor.spot.lock = lock
        }
        editor.spot.root_x = editor.spot_x
        editor.spot.root_y = editor.spot_y
      }
      else if (lock.State == Lock) {
        lock.key = new this(
          editor.level, lock,
          lock.spot_x, lock.spot_y, true,
        )
      }
      else {
        new this(
          editor.level, null,
          editor.spot_x, editor.spot_y, true,
        )
      }

      editor.spot = editor.level
      return editor.deep_copy()
    }
  }

  class Jack extends Spot {
    static plural_name = 'jacks'
    static single_name = 'jack'
    static key_bind = 'j'
    static round_root = 0
    static radius = 1.5

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

        const radius = key_copy.State.radius
        const lock_long = radius + this.lock.State.long
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

    remove() {
      if (this.lock.spot == this) {
        this.lock.remove()
      }
      return super.remove()
    }
  }

  class Level extends Spot {
    static plural_name = 'levels'
    static single_name = 'level'
    static key_bind = 'v'

    walls = [] // Wall[]
    doors = [] // Door[]
    portals = []; open_portals = [] // Portal[]
    locks = [] // Lock[]
    keys = [] // Key[]
    jacks = [] // Jack[]
    editors = [] // Editor[]

    constructor(
      game, // Game
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      super(game, root_x, root_y, is_open, )
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {

      for (const lock_idx in this.locks) {
        const this_lock = this.locks[lock_idx]

        this_lock.draw( ctx, mouse, editor, )
      }

      for (const jack_idx in this.jacks) {
        const this_jack = this.jacks[jack_idx]

        this_jack.draw( ctx, mouse, editor, )
      }

      for (const key_idx in this.keys) {
        const this_key = this.keys[key_idx]

        this_key.draw( ctx, mouse, editor, )
      }

      for (const wall_idx in this.walls) {
        const this_wall = this.walls[wall_idx]

        this_wall.draw( ctx, mouse, editor, )
      }

      for (const door_idx in this.doors) {
        const this_door = this.doors[door_idx]

        this_door.draw( ctx, mouse, editor, )
      }

      for (const portal_idx in this.portals) {
        const this_portal = this.portals[portal_idx]

        this_portal.draw( ctx, mouse, editor, )
      }

      // TODO
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
        level_copy.open_portals = []
      }

      for (const lock_idx in this.locks) {
        const this_lock = this.locks[lock_idx]

        if (this_lock.spot == level_copy) {
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

    remove() {
      // TODO
      return false
    }
  }

  class Game extends Spot {
    static plural_name = 'games'
    static single_name = 'game'
    static key_bind = 'g'

    editors = {} // Editor{ID}
    levels = [] // Level[]

    constructor() { super(null, 0, 0, false) }

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

      delete game_copy.editor
      return game_copy
    }

    remove() {
      // TODO
      return false
    }
  }

  const MazeGame = {
    State: State,
    Mouse: Mouse,
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
