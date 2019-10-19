module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error

  class Type {
    // name;plural_name;single_name: String
    // type: Type

    static Type = Type
    static plural_name = 'types'
    static single_name  = 'type'
    static key_bind = undefined

    static act(
      editor, // Editor
      type, // Type,Null
    ) {
      if (!type) {
        type = editor.type
      }

      editor.action = ''

      if (editor.spot != editor.level) {
        editor.spot.editor = null
        editor.spot = editor.level
        editor.is_open = false
        editor.action += `changed Editor spot to level, `
      }

      if (editor.type != type) {
        editor.type = type
        editor.action += `changed Editor type to ${type.name}, `
      }

      if (!editor.action) {
        editor.action = `no action`
      }
    }
  }

  class Mouse extends Type {
    static plural_name = 'mice'
    static single_name = 'mouse'

    // x,y,prev_x,prev_y,now_time: Float
    // width,height,scale: Float
    // right_down,left_down: Boolean

    x = -1
    y = -1

    right_down = false
    left_down = false
    static act(
      editor, // Editor
    ) {
      // TODO
      editor.action = `TODO action`
    }
  }

  class Spot extends Type {

    static plural_name = 'spots'
    static single_name = 'spot'
    static round_root = 2 // Float
    static sel_color = '#ffff00'
    static stroke_color = '#ffffff'
    static fill_color = '#000000'
    static radius = 1
    static line_width = 1/2
    static speed = 1.7e2

    get Type() { return this.constructor } // Type

    // super_spot: Spot,Null
    // editor: Editor,Null
    // root_x;root_y;change_time: Float
    // is_open;change_open: Boolean
    // level: Level,Null
    // game: Game,Null
    // path: Path,Null

    change_open = false

    constructor(
      super_spot, // Spot,Null
      is_open, // Boolean
      change_time, // Float,Null
    ) {
      super()

      this.is_open = is_open

      if (super_spot) {
        this.super_spot = super_spot
        this.change_time = super_spot.change_time
        this[super_spot.Type.single_name] = super_spot
        super_spot[this.Type.plural_name].push(this)
      }
      else {
        this.change_time = change_time > 0 ? change_time : 0
      }
    }

    set_root(
      root_x,root_y, // Float,Null
    ) {
      root_x = root_x || 0; root_y = root_y || 0

      const round_root = this.Type.round_root
      if (round_root > 0) {
        this.root_x = Math.round(root_x / round_root) * round_root
        this.root_y = Math.round(root_y / round_root) * round_root
      }
      else {
        this.root_x = root_x; this.root_y = root_y
      }
    }

    copy(
      super_spot_copy, // Spot,Null
      spot_copy, // Spot,Null
    ) {
      if (!spot_copy) {
        spot_copy = new this.Type(
          super_spot_copy, this.root_x, this.root_y, this.is_open,
        )
      }
      if (this.editor) {
        spot_copy.editor = this.editor.copy(
          super_spot_copy, spot_copy, spot_copy.editor
        )
      }
      spot_copy.change_open = spot_copy.is_open != this.is_open
      return spot_copy
    }

    remove(
      this_Type, // Type
    ) {

      if (this.editor) {
        // TODO this.Type == Level or Game
        this.editor.spot = this.editor.level
        delete this.editor
      }
      if (this.super_spot) {
        const spot1s = this.super_spot[this.Type.plural_name]
        const idx1 = spot1s.indexOf(this)
        delete spot1s[idx1]

        let idx2 = -1
        if (this_Type) {
          const spot2s = this.super_spot[this_Type.plural_name]
          idx2 = spot2s.indexOf(this)
          delete spot2s[idx2]
        }

        delete this.super_spot
        return idx1 >= 0 || idx2 >= 0
      }
      return false
    }

    draw() {}

    get lines() {
      return []
    }

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
    ) {
      // TODO
      editor.action = `TODO action`
    }
  }

  class Editor extends Spot {
    static plural_name = 'editors'
    static single_name = 'editor'
    static key_bind = 'e'
    static round_root = 0 // Float

    static scale = 90

    // id: ID
    // name: String
    // spot_x;spot_y;scale: Float
    // spot: Spot
    // type: Type

    remove() {
      // TODO
    }

    constructor(
      level, // Level
      id, // ID
      name,action, // String
      type, // Type
      spot, // Spot,Null
      root_x,root_y,spot_x,spot_y,scale, // Float
      is_open, // Boolean
    ) {
      super(level, is_open, )

      this.set_root(root_x, root_y, spot_x, spot_y, )

      this.id = id
      this.name = name; this.action = action
      this.type = type
      this.spot = spot || level
      this.scale = scale
      level.game[this.Type.plural_name][id] = this
    }

    set_root(
      root_x,root_y,spot_x,spot_y, // Float
    ) {
      super.set_root(root_x, root_y,)
      this.spot_x = spot_x; this.spot_y = spot_y
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
        editor_copy = new this.Type(
          level_copy,
          this.id,
          this.name, this.action,
          this.type,
          spot_copy,
          this.root_x,this.root_y,this.spot_x,this.spot_y,this.scale,
          this.is_open,
        )
      }
      return editor_copy
    }

    deep_copy(
      change_time, // Float
      game_copy, // Game,Null
      editor_copy, // Editor,Null
    ) {
      if (!game_copy) {
        game_copy = this.level.game.copy(change_time)
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
    static short = 2
    static get_abs = true

    // short_x;short_y;long_x;long_y;long: Float

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super( level, false, )
      this.set_root(root_x,root_y,long_x,long_y,)
    }

    set_root(
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super.set_root(root_x,root_y,)

      const abs_long_x = Math.abs(long_x)
      const abs_long_y = Math.abs(long_y)
      long_x = long_x < 0 ? -1 : 1
      long_y = long_y < 0 ? -1 : 1

      const ceil_long = this.Type.ceil_long
      if ( abs_long_x < abs_long_y ) {
        this.long = abs_long_y
        this.long_y = long_y; this.short_x = long_x
        this.long_x = this.short_y = 0
      }
      else {
        this.long = abs_long_x || ceil_long
        this.long_x = long_x; this.short_y = long_y
        this.short_x = this.long_y = 0
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

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color

      ctx.beginPath()
      ctx.lineTo(root_x, root_y)
      ctx.lineTo(spot_x, spot_y)
      ctx.stroke()
    }

    copy(
      level_copy, // Level
      wall_copy, // Wall,Null
    ) {
      if (!wall_copy) {
        wall_copy = new this.Type(
          level_copy, this.root_x, this.root_y,
          this.long_x * this.long + this.short_x,
          this.long_y * this.long + this.short_y,
        )
      }

      return super.copy(level_copy, wall_copy)
    }

    get lines() {
      const {root_x,root_y,long_x,long_y,long,} = this
      const p0 = { x: root_x, y: root_y, }
      const p1 = {
        x: p0.x + long_x * long,
        y: p0.y + long_y * long,
      }
      return [ p0, p1 ]
    }

    static get_spot(
      editor, // Editor
    ) {
      const level = editor.level
      const walls = level[this.plural_name]

      let min_dist = this.short
      let spot = level
      editor.is_open = false

      for (const wall_idx in walls) {
        const wall = walls[wall_idx]
        const spot_x = editor.spot_x - wall.root_x
        const spot_y = editor.spot_y - wall.root_y
        const long = (spot_x*wall.long_x + spot_y*wall.long_y) / wall.long
        let short = (
          spot_x*wall.short_x + spot_y*wall.short_y
        )

        if (this.get_abs) {
          short = Math.abs(short)
        }

        if ( 0 < long && long < 1 && 0 < short && short < min_dist ) {
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
    ) {
      if (editor.spot.Type == this) {

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

    // open_long: Float

    constructor(
      level, // Level
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super( level, root_x,root_y,long_x,long_y, )

    }

    set_root(
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super.set_root(root_x,root_y,long_x,long_y,)
      this.is_open = true
      this.open_long = this.long / 2
    }

    copy(
      level_copy, // Level
      door_copy, // Door,Null
    ) {
      const half_short = this.Type.short / 2
      const lock_names = this.Type.lock_names

      door_copy = super.copy(level_copy, door_copy)

      for (const lock_name in lock_names) {
        const this_lock = this[lock_name]
        if (this_lock) {
          const [ hs, hl, l, ls, ll ] = lock_names[lock_name]

          const short_mul = hs * half_short
          const long_mul = hl * half_short + l * door_copy.long

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
            ls * this.short_x + ll * this.long_x,
            ls * this.short_y + ll * this.long_y,
            door_copy[lock_name],
          )
          door_copy[lock_name] = lock_copy
          if (!lock_copy.is_open) {
            door_copy.is_open = false
          }
        }
      }

      return door_copy
    }

    calc_open_long(door_copy) {
      door_copy.change_open = this.is_open != door_copy.is_open

      if (door_copy.change_open) {
        door_copy.open_long = this.open_long
      } else {
        const dif = this.Type.speed * (door_copy.change_time - this.change_time)
        if (door_copy.is_open) {
          door_copy.open_long = this.open_long - dif
        }
        else {
          door_copy.open_long = this.open_long + dif
        }
      }

      if (door_copy.open_long < 0) {
        door_copy.open_long = 0
      }
      else if (door_copy.long / 2 < door_copy.open_long) {
        door_copy.open_long = door_copy.long / 2
      }
    }

    remove() {

      const lock_names = this.Type.lock_names

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
      let short = this.Type.short * mouse.scale
      let long = this.long * mouse.scale

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.strokeStyle = this == editor.spot ?
      this.Type.sel_color :
      this.Type.stroke_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      let open_long = this.open_long * mouse.scale
      ctx.beginPath()
      ctx.lineTo(
        root_x + this.long_x * short,
        root_y + this.long_y * short,
      )
      ctx.lineTo(
        root_x + this.long_x * open_long,
        root_y + this.long_y * open_long,
      )
      ctx.lineTo(
        root_x + this.long_x * open_long + this.short_x * short,
        root_y + this.long_y * open_long + this.short_y * short,
      )
      ctx.lineTo(
        root_x + this.short_x * short,
        root_y + this.short_y * short,
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineTo(root_x,root_y)
      ctx.lineTo(root_x + this.short_x * short,root_y + this.short_y * short)
      ctx.lineTo(root_x + this.long_x * short,root_y + this.long_y * short)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      root_x += this.short_x * short + this.long_x * long
      root_y += this.short_y * short + this.long_y * long
      long = -long
      short = -short
      open_long = -open_long

      ctx.beginPath()
      ctx.lineTo(
        root_x + this.long_x * short,
        root_y + this.long_y * short,
      )
      ctx.lineTo(
        root_x + this.long_x * open_long,
        root_y + this.long_y * open_long,
      )
      ctx.lineTo(
        root_x + this.long_x * open_long + this.short_x * short,
        root_y + this.long_y * open_long + this.short_y * short,
      )
      ctx.lineTo(
        root_x + this.short_x * short,
        root_y + this.short_y * short,
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineTo(root_x,root_y)
      ctx.lineTo(root_x + this.short_x * short,root_y + this.short_y * short)
      ctx.lineTo(root_x + this.long_x * short,root_y + this.long_y * short)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // TODO
    }

    /*
      9   8 7  65
       ___   ___
      |\__| |__\|
      01  2 3   4
    */
    get lines() {
      const {short} = this.Type
      const {
        root_x,root_y,
        short_x,short_y,
        long_x,long_y,
        long,open_long,
      } = this

      const p0 = {x: root_x, y: root_y}
      const p1 = {
        x: p0.x + long_x * short,
        y: p0.y + long_y * short,
      }
      const p2 = {
        x: p0.x + long_x * open_long,
        y: p0.y + long_y * open_long,
      }
      const p4 = {
        x: p0.x + long_x * long,
        y: p0.y + long_y * long,
      }
      const p3 = {
        x: p4.x - long_x * open_long,
        y: p4.y - long_y * open_long,
      }
      const p5 = {
        x: p4.x + short_x * short,
        y: p4.y + short_y * short,
      }
      const p6 = {
        x: p5.x - long_x * short,
        y: p5.y - long_y * short,
      }
      const p7 = {
        x: p5.x - long_x * open_long,
        y: p5.y - long_y * open_long,
      }
      const p9 = {
        x: p0.x + short_x * short,
        y: p0.y + short_y * short,
      }
      const p8 = {
        x: p9.x + long_x * open_long,
        y: p9.y + long_y * open_long,
      }

      if (open_long <= 0) {
        return [
          p0,p9, p0,p1, p1,p9,
          p4,p5, p5,p6, p6,p4,
        ]
      }
      else if (open_long < short) {
        return [
          p9,p0, p0,p1, p1,p9, p9,p8, p8,p2,
          p4,p5, p5,p6, p6,p4, p4,p3, p3,p7,
        ]
      }
      else if (open_long < long/2) {
        return [
          p0,p2, p2,p8, p8,p9, p9,p0,
          p5,p7, p7,p3, p3,p4, p4,p5,
        ]
      }
      else {
        return [
          p0,p4, p4,p5, p5,p9, p9,p0
        ]
      }
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
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super( level, root_x,root_y,long_x,long_y, )
    }

    set_root(
      root_x,root_y,long_x,long_y, // Float,Null
    ) {
      super.set_root(root_x,root_y,long_x,long_y,)
      this.long = this.Type.long
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      let root_x = mouse.width/2 + (this.root_x - editor.root_x) * mouse.scale
      let root_y = mouse.height/2+ (this.root_y - editor.root_y) * mouse.scale
      let short = this.Type.short * mouse.scale
      let long = this.Type.long * mouse.scale

      const center_x = root_x + mouse.scale * (
        this.Type.center_short * this.short_x +
        this.Type.center_long * this.long_x
      )
      const center_y = root_y + mouse.scale * (
        this.Type.center_short * this.short_y +
        this.Type.center_long * this.long_y
      )

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.strokeStyle = (
        this == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      const p_root_x = root_x + this.short_x * short
      const p_root_y = root_y + this.short_y * short
      const p_spot_x = p_root_x + this.long_x * long
      const p_spot_y = p_root_y + this.long_y * long

      const angle_root = Math.atan2( p_root_y - center_y, p_root_x - center_x)
      const angle_spot = Math.atan2( p_spot_y - center_y, p_spot_x - center_x)

      let open_long = this.open_long * mouse.scale

      ctx.beginPath()
      ctx.lineTo( root_x, root_y )
      ctx.lineTo( p_root_x, p_root_y )
      ctx.lineTo(
        p_root_x + this.long_x * open_long,
        p_root_y + this.long_y * open_long,
      )
      ctx.lineTo(
        root_x + this.long_x * open_long,
        root_y + this.long_y * open_long,
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineTo(
        root_x + this.long_x * long,
        root_y + this.long_y * long,
      )
      ctx.lineTo( p_spot_x, p_spot_y )
      ctx.lineTo(
        p_spot_x - this.long_x * open_long,
        p_spot_y - this.long_y * open_long,
      )
      ctx.lineTo(
        root_x + this.long_x * (long - open_long),
        root_y + this.long_y * (long - open_long),
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

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
          this.Type.radius * mouse.scale,
          angle_spot,
          angle_root,
        )
      }
      else {
        ctx.arc(
          center_x,center_y,
          this.Type.radius * mouse.scale,
          angle_root,
          angle_spot,
        )
        ctx.lineTo( p_spot_x, p_spot_y, )
        ctx.lineTo( root_x + this.long_x * long, root_y + this.long_y * long )
        ctx.lineTo( root_x, root_y )
        ctx.lineTo( p_root_x, p_root_y, )
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // TODO
    }

    /*
      7 6  5 4
       _    _
      |_|__|_|
      0 1  2 3
    */
    get lines() {

      const {short,long} = this.Type
      const {
        root_x,root_y,
        short_x,short_y,
        long_x,long_y,
        open_long,
      } = this

      const p0 = { x: root_x, y: root_y, }
      const p1 = {
        x: p0.x + long_x * open_long,
        y: p0.y + long_y * open_long,
      }
      const p3 = {
        x: p0.x + long_x * long,
        y: p0.y + long_y * long,
      }
      const p2 = {
        x: p3.x - long_x * open_long,
        y: p3.y - long_y * open_long,
      }
      const p4 = {
        x: p3.x + short_x * short,
        y: p3.y + short_y * short,
      }
      const p5 = {
        x: p4.x - long_x * open_long,
        y: p4.y - long_y * open_long,
      }
      const p7 = {
        x: p0.x + short_x * short,
        y: p0.y + short_y * short,
      }
      const p6 = {
        x: p7.x + long_x * open_long,
        y: p7.y + long_y * open_long,
      }


      if (open_long <= 0) {
        return [
          p7,p0, p0,p3, p3,p4,
        ]
      }
      else if (open_long < long/2) {
        return [
          p0,p1, p1,p6, p6,p7, p7,p0,
          p3,p2, p2,p5, p5,p4, p4,p3,
          p0,p3,
        ]
      }
      else {
        return [
          p0,p3, p3,p4, p4,p7, p7,p0,
        ]
      }
    }
  }

  class Lock extends Spot {
    static plural_name = 'locks'
    static single_name = 'lock'
    static key_bind = 'l'
    static min_long = 3
    static ceil_long = 3
    static round_root = 0
    static radius = 0.5

    // key: Key,Null
    // spot: Spot
    // long_x;long_y;long: Float

    constructor(
      level, // Level
      spot, // Spot,Null
      root_x,root_y,long_x,long_y, // Float,Null
      long, // Float,Null
    ) {
      super( level, false, )
      this.spot = spot || level
      this.set_root(
        root_x,root_y,long_x,long_y,long,
      )
    }

    set_root(
      root_x,root_y,long_x,long_y, // Float,Null
      long, // Float,Null
    ) {

      this.long = (
        long > this.Type.min_long ?
        Math.ceil(long / this.Type.ceil_long) * this.Type.ceil_long :
        this.Type.min_long
      )

      long_x = long_x || 0; long_y = long_y || 0
      const length = Math.sqrt(long_x*long_x + long_y*long_y)
      if (length) {
        this.long_x = -long_x / length
        this.long_y = -long_y / length
      }
      else {
        this.long_x = 1
        this.long_y = 0
      }


      super.set_root( root_x, root_y, )
      this.root_x -= this.long_x * this.long
      this.root_y -= this.long_y * this.long

      if (this.key) {
        this.key.set_root( this.root_x, this.root_y, )
      }
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
      root_x,root_y,long_x,long_y, // Float,Null
      lock_copy, // Lock,Null
    ) {

      if (!spot_copy) {
        throw `TODO game lock`
      }

      if (lock_copy) {
        lock_copy.set_root(
          root_x, root_y, long_x, long_y,
          this.long,
        )
      }
      else {
        lock_copy = new this.Type(
          level_copy, spot_copy,
          root_x, root_y, long_x, long_y,
          this.long,
        )
      }

      if (this.key) {
        const key_copy = this.key.copy(
          level_copy, lock_copy,
          lock_copy.root_x, lock_copy.root_y,
          lock_copy.key,
        )
        if (key_copy.lock) {
          lock_copy.key = key_copy
          lock_copy.is_open = key_copy.is_open
        }
      }

      return super.copy(level_copy, lock_copy, )
    }

    remove() {

      if (this.spot) {
        const lock_names = this.spot.Type.lock_names
        for (const lock_name in lock_names) {
          const spot_lock = this.spot[lock_name]
          if (spot_lock == this) {
            delete this.spot[lock_name]
            delete this.spot
            break
          }
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

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.strokeStyle = (
        this == editor.spot || this.spot == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.beginPath()
      ctx.lineTo(root_x, root_y)
      ctx.lineTo(
        root_x + this.long_x * this.long * mouse.scale,
        root_y + this.long_y * this.long * mouse.scale,
      )
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = this.Type.fill_color
      ctx.beginPath()
      ctx.arc(root_x, root_y, this.Type.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.arc(root_x, root_y, this.Type.radius * mouse.scale, 0, pi2)
      ctx.closePath()
      ctx.stroke()
    }

    get lines() {
      const {root_x,root_y,long_x,long_y,long,} = this
      const p0 = { x: root_x, y: root_y, }
      const p1 = {
        x: p0.x + long_x * long,
        y: p0.y + long_y * long,
      }
      return [ p0,p1 ]
    }

    static act(
      editor, // Editor
    ) {

      const spot = this.get_spot(editor, 2 * this.radius)
      if (spot.Type == this) {
        editor.spot = spot
        spot.editor = editor
        editor.action = `selected ${this.name}`
        return
      }

      const door = Door.get_spot(editor)
      if (door.Type == Door) {
        const spot_x = editor.spot_x - door.root_x
        const spot_y = editor.spot_y - door.root_y
        const lock_name = Door.lock_name_array[Math.floor(
          (spot_x*door.long_x + spot_y*door.long_y) *
          Door.lock_name_array.length / door.long
        )]
        if (lock_name && !door[lock_name]) {
          const new_lock = new this(editor.level, door)
          door[lock_name] = new_lock

          editor.spot.editor = null
          editor.spot = editor.level
          editor.action = `added ${this.name} as ${lock_name} to Door`
          return
        }
      }

      const portal = Portal.get_spot(editor)
      if (portal.Type == Portal) {
        const spot_x = editor.spot_x - portal.root_x
        const spot_y = editor.spot_y - portal.root_y
        const lock_name = Portal.lock_name_array[Math.floor(
          (spot_x*portal.long_x + spot_y*portal.long_y) *
          Portal.lock_name_array.length / portal.long
        )]
        if (lock_name && !portal[lock_name]) {
          const new_lock = new this(editor.level, portal)
          portal[lock_name] = new_lock

          editor.spot.editor = null
          editor.spot = editor.level
          editor.action = `added ${this.name} as ${lock_name} to Portal`
          return
        }
      }

      editor.action = `no action`
    }
  }

  class Laser extends Lock {
    static plural_name = 'lasers'
    static single_name = 'laser'
    static key_bind = 'z'
    static ceil_long = 3
    static min_long = 9

    constructor(
      level, // Level
      spot, // Spot,Null
      root_x,root_y,long_x,long_y, // Float,Null
      long, // Float,Null
    ) {
      super(level,spot,root_x,root_y,long_x,long_y,long)
      level[Lock.plural_name].push(this)
    }

    remove() {
      return super.remove(Lock)
    }

    get lines() {
      const {min_long,ceil_long} = this.Type
      const {root_x,root_y,long_x,long_y,long,} = this
      const p0 = { x: root_x, y: root_y, }
      const p1 = {
        x: p0.x + long_x * ceil_long,
        y: p0.y + long_y * ceil_long,
      }
      const p2 = {
        x: p0.x + long_x * long,
        y: p0.y + long_y * long,
      }
      const p3 = {
        x: p2.x - long_x * ceil_long,
        y: p2.y - long_y * ceil_long,
      }
      return [ p0,p1, p2,p3 ]
    }

    static act(
      editor, // Editor
    ) {

      const editor_laser = editor.spot

      super.act(editor)

      if (editor.spot == editor_laser && editor_laser.Type == this) {

        const spot_x = (
          editor.spot_x - editor_laser.root_x -
          editor_laser.long_x * editor_laser.long
        )
        const spot_y = (
          editor.spot_y - editor_laser.root_y -
          editor_laser.long_y * editor_laser.long
        )
        editor_laser.long = -(
          spot_x * editor_laser.long_x +
          spot_y * editor_laser.long_y
        )

        delete editor_laser.editor
        editor.spot = editor.level

        editor.action = `resized and deselected ${this.name}`
      }

    }
  }

  class Key extends Spot {
    static plural_name = 'keys'
    static single_name = 'key'
    static key_bind = 'k'
    static round_root = 0
    static radius = 1.5
    static center_radius = Lock.radius

    // lock: Lock,Null
    // jack: Jack,Null

    constructor(
      level, // Level
      lock, // Lock,Null
      root_x, root_y, // Null,Float
      is_open, // Boolean
    ) {
      super( level, is_open, )
      this.lock = lock
      this.set_root( root_x, root_y, )
    }

    set_root(
      root_x,root_y, // Float,Null
    ) {
      if (this.lock) {
        root_x = this.lock.root_x; root_y = this.lock.root_y
      }
      super.set_root(root_x, root_y)
      if (this.jack) {
        this.jack.set_root(this.jack.long_x, this.jack.long_y,)
      }
    }

    copy(
      level_copy, // Level
      lock_copy, // Lock,Null
      root_x, root_y, // Null,Float
      key_copy, // Key,Null
    ) {

      if (!key_copy) {
        key_copy = new this.Type(
          level_copy, lock_copy, root_x, root_y, this.is_open,
        )
      }

      if (this.jack) {
        key_copy.jack = this.jack.copy(
          level_copy, key_copy, lock_copy, key_copy.jack,
        )
        key_copy.is_open = !key_copy.jack.editor
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

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      let radius = this.Type.radius * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.beginPath()
      ctx.arc(root_x, root_y, radius, 0, pi2)
      ctx.closePath()
      ctx.fill()

      ctx.fillStyle = ctx.strokeStyle = (
        this == editor.spot || this.jack == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.stroke()

      radius = this.Type.center_radius * mouse.scale

      if (this.is_open) {
        ctx.beginPath()
        ctx.arc(root_x, root_y, radius, 0, pi2)
        ctx.closePath()
        ctx.fill()
      }
      else {
        ctx.beginPath()
        ctx.lineTo(root_x + radius, root_y + radius)
        ctx.lineTo(root_x - radius, root_y - radius)
        ctx.closePath()
        ctx.stroke()

        ctx.beginPath()
        ctx.lineTo(root_x - radius, root_y + radius)
        ctx.lineTo(root_x + radius, root_y - radius)
        ctx.closePath()
        ctx.stroke()
      }
    }

    remove() {
      if (this.jack) {
        this.jack.remove()
      }
      return super.remove()
    }

    static act(
      editor, // Editor
      jack_Type, // Jack.Type,Null
    ) {

      let lock = Lock.get_spot(editor, 2 * this.radius)

      const key = (
        lock.Type != Level && lock.key || this.get_spot(editor, 2*this.radius)
      )
      const jack = key.Type == this && key.jack || editor.level

      const editor_key = editor.spot
      editor_key.editor = null

      const editor_lock = (
        editor_key.Type == Key && editor_key.lock || editor.level
      )
      const editor_jack = (
        editor_key.Type == Key && editor_key.jack || editor.level
      )

      if (key.Type == this) {
        editor.spot = key
        editor.spot.editor = editor
        editor.action = `selected ${this.name}`
        return
      }
      else if (editor_key.Type == this) {

        if (editor_jack.Type == Jack) {
          if (lock.Type != Level) {
            if (editor_jack.lock != editor_lock) {
              editor_jack.lock.remove()
            }
            editor_jack.lock = lock
          }
          else if (editor_jack.lock == editor_lock) {
            editor_jack.lock = new Lock(editor.level, editor_jack)
          }
        }

        if (editor_lock) {
          editor_lock.key = null
          editor_key.lock = null
        }
        if (lock.Type != Level) {
          lock.key = editor_key
          editor_key.lock = lock
        }
        editor_key.root_x = editor.spot_x
        editor_key.root_y = editor.spot_y

        editor.action = `moved ${this.name}`
      }
      else {
        lock = lock.Type != Level ? lock : null

        const new_key = new this(
          editor.level, lock,
          editor.spot_x, editor.spot_y, true,
        )
        if (lock) {
          lock.key = new_key
        }

        editor.action = `created new ${this.name}`

        if (jack_Type) {
          new_key.jack = new jack_Type( editor.level, new_key, lock, )
          editor.action += ` and ${jack_Type.name}`
        }

      }

      editor.spot = editor.level
    }
  }

  class Path extends Spot {
    static plural_name = 'paths'
    static single_name = 'path'
    static key_bind = 'g'
    static radius = 2 * Key.radius

    // jack: Jack
    // spot: Spot,Null

    constructor(
      level, // Level
      jack, // Jack
      spot_x,spot_y, // Float
    ) {
      super(level, false, )
      this.jack = jack
      this.set_root(spot_x, spot_y,)
    }

    set_root(
      spot_x, spot_y, // Float
    ) {
      super.set_root(this.jack.root_x, this.jack.root_y,)
      this.spot_x = spot_x; this.spot_y = spot_y
    }

    copy(
      level_copy, // Level
      jack_copy, // Jack
      path_copy, // Path,Null
    ) {

      if (!path_copy) {
        path_copy = new this.Type(
          level_copy, jack_copy,
          this.spot_x, this.spot_y,
        )
      }

      return super.copy(level_copy, path_copy,)
    }

    do_path() {

    }

    static act(
      editor, // Editor
    ) {
      const key = Key.get_spot(editor, this.radius)
      const lock = Lock.get_spot(editor, this.radius)

      if (editor.spot.Type != Level && editor.spot.path) {
        editor.action = `no action (${editor.spot.Type.name} already has path)`
        return
      }

      if (key.Type != Level) {
        if (key.jack) {
          if (key.editor) {
            editor.spot.editor = null
            editor.spot = editor.level
            editor.action = `deselected ${key.jack.Type.name}`
            return
          }
          else {
            editor.spot.editor = null
            key.jack.editor = editor
            editor.spot = key.jack
            editor.action = `selected ${key.jack.Type.name}`
            return
          }
        }
        else {
          editor.spot_x = key.root_x
          editor.spot_y = key.root_y
        }
      }
      else if (lock.Type != Level) {
        editor.spot_x = lock.root_x
        editor.spot_y = lock.root_y
      }

      if (editor.spot.Type != Level && !editor.spot.path) {
        editor.spot.path = new Path(
          editor.level, editor.spot,
          editor.spot_x, editor.spot_y,
        )
        editor.action = `set new path for ${editor.spot.Type.name}`
        return
      }
    }
  }

  class Jack extends Spot {
    static plural_name = 'jacks'
    static single_name = 'jack'
    static key_bind = 'j'
    static round_root = 0
    static radius = 2
    static wheel_radius = 1

    // lock: Lock
    // key: Key
    // long_x;long_y: Float
    // path: Path,Null

    constructor(
      level, // Level
      key, // Key
      lock, // Lock,Null
      long_x, long_y, // Float,Null
    ) {
      super(level, false, )
      this.key = key
      this.lock = lock
      this.set_root(long_x, long_y,)
    }

    set_root(
      long_x, long_y, // Float,Null
    ) {
      super.set_root(this.key.root_x, this.key.root_y)
      long_x = long_x || 0; long_y = long_y || 0

      const long = Math.sqrt(long_x*long_x + long_y*long_y)
      if (long) {
        this.long_x = long_x / long
        this.long_y = long_y / long
      }
      else {
        this.long_x = 0
        this.long_y = 1
      }

      const lock_root_x = this.key.root_x + this.long_x * this.key.Type.radius
      const lock_root_y = this.key.root_y + this.long_y * this.key.Type.radius

      if (!this.lock) {
        this.lock = new Lock(
          this.level, this,
          lock_root_x, lock_root_y, this.long_x, this.long_y,
        )
      }
      else if (this.lock.spot == this) {
        this.lock.set_root(
          lock_root_x, lock_root_y, this.long_x, this.long_y,
        )
      }
    }

    copy(
      level_copy, // Level
      key_copy, // Key
      lock_copy, // Lock,Null
      jack_copy, // Jack,Null
    ) {

      let long_x = this.long_x, long_y = this.long_y
      const editor = this.editor

      if (editor) {
        long_x = editor.spot_x - key_copy.root_x
        long_y = editor.spot_y - key_copy.root_y
      }

      if (!jack_copy) {
        jack_copy = new this.Type(
          level_copy, key_copy, lock_copy,
          long_x, long_y,
        )
      }

      if (this.path) {
        jack_copy.path = this.path.copy(level_copy, jack_copy, jack_copy.path,)
      }

      const radius = key_copy.Type.radius
      const lock_root_x = jack_copy.root_x + jack_copy.long_x * radius
      const lock_root_y = jack_copy.root_y + jack_copy.long_y * radius

      if (!lock_copy) {
        jack_copy.lock = this.lock.copy(
          level_copy, jack_copy,
          lock_root_x, lock_root_y,
          jack_copy.long_x, jack_copy.long_y,
          jack_copy.lock,
        )
      }

      return super.copy(level_copy, jack_copy)
    }

    remove() {
      if (this.lock.spot == this) {
        this.lock.remove()
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

      const scale = mouse.scale * this.Type.radius

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.strokeStyle = (
        this == editor.spot || this.key == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )

      ctx.beginPath()
      ctx.lineTo(
        root_x + (-this.long_y + this.long_x/2) * scale,
        root_y + ( this.long_x + this.long_y/2) * scale,
      )
      ctx.lineTo(
        root_x + ( this.long_y + this.long_x/2) * scale,
        root_y + (-this.long_x + this.long_y/2) * scale,
      )
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineTo(
        root_x + (-this.long_y - this.long_x/2) * scale,
        root_y + ( this.long_x - this.long_y/2) * scale,
      )
      ctx.lineTo(
        root_x + ( this.long_y - this.long_x/2) * scale,
        root_y + (-this.long_x - this.long_y/2) * scale,
      )
      ctx.closePath()
      ctx.stroke()
    }

    get lines() {
      const {radius,} = this.Type
      const {root_x,root_y,long_x,long_y,} = this
      const p0 = {
        x: root_x + (-long_y - long_x/2) * radius,
        y: root_y + ( long_x - long_y/2) * radius,
      }
      const p1 = {
        x: root_x + ( long_y - long_x/2) * radius,
        y: root_y + (-long_x - long_y/2) * radius,
      }
      return [ p0,p1, ]
    }

    static act(
      editor, // Editor
    ) {
      Key.act(editor, this, )
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
    lasers = [] // Laser[]
    keys = [] // Key[]
    jacks = [] // Jack[]
    paths = [] // Path[]
    editors = [] // Editor[]

    constructor(
      game, // Game
      root_x,root_y, // Float
      is_open, // Boolean
    ) {
      super(game, is_open, )
      this.set_root( root_x, root_y, )
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

      for (const laser_idx in this.lasers) {
        const this_laser = this.lasers[laser_idx]

        this_laser.draw( ctx, mouse, editor, )
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
        level_copy = new this.Type(game_copy, this.root_x, this.root_y)
      }

      for (const wall_idx in this.walls) {
        const this_wall = this.walls[wall_idx]
        this_wall.copy(level_copy,)
      }

      for (const door_idx in this.doors) {
        const this_door = this.doors[door_idx]
        const door_copy = this_door.copy(level_copy,)
        this_door.calc_open_long(door_copy)
      }

      // Copy Portals
      {
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
          }
          level_copy.open_portals = []
        }
        for (const portal_idx in this.portals) {
          const this_portal = this.portals[portal_idx]
          const portal_copy = level_copy.portals[portal_idx]
          this_portal.calc_open_long(portal_copy)
        }
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

      for (const path_idx in level_copy.paths) {
        const path_copy = level_copy.paths[path_idx]
        path_copy.do_path()
      }

      for (const editor_idx in this.editors) {
        const this_editor = this.editors[editor_idx]

        if (this_editor.spot == this) {
          this_editor.copy(level_copy)
        }
      }

      return super.copy(game_copy, level_copy)
    }

    get lines() {
  		let lines = []

  		for (const wall_idx in this.walls) {
  			const this_wall = this.walls[wall_idx]
  			lines = lines.concat(this_wall.lines)
  		}
  		for (const door_idx in this.doors) {
  			const this_door = this.doors[door_idx]
  			lines = lines.concat(this_door.lines)
  		}
  		for (const portal_idx in this.portals) {
  			const this_portal = this.portals[portal_idx]
  			lines = lines.concat(this_portal.lines)
  		}
  		for (const lock_idx in this.locks) {
  			const this_lock = this.locks[lock_idx]
  			lines = lines.concat(this_lock.lines)
  		}
  		for (const laser_idx in this.lasers) {
  			const this_laser = this.lasers[laser_idx]
  			lines = lines.concat(this_laser.lines)
  		}
      for (const jack_idx in this.jacks) {
  			const this_jack = this.jacks[jack_idx]
  			lines = lines.concat(this_jack.lines)
  		}

      return lines
    }

    remove() {
      // TODO
      return false
    }
  }

  class Game extends Spot {
    static plural_name = 'games'
    static single_name = 'game'

    editors = {} // Editor{ID}
    levels = [] // Level[]

    constructor(
      change_time, // Float
    ) {
      super(null, false, change_time)
      this.set_root( 0, 0, )
    }

    copy(
      change_time, // Float
      game_copy, // Game,Null
    ) {
      if (!game_copy) {
        game_copy = new this.Type(change_time,)
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
    Type: Type,
    Mouse: Mouse,
    Spot: Spot,
    Editor: Editor,
    Wall: Wall,
    Jack: Jack,
    Path: Path,
    Key: Key,
    Lock: Lock,
    Laser: Laser,
    Door: Door,
    Portal: Portal,
    Level: Level,
    Game: Game,
  }

  return MazeGame
}
