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

  class Point extends Type {
    static plural_name = 'points'
    static single_name = 'point'

    constructor(
      x,y,scale, // Float
    ) {
      super()
      // this.x = x * scale; this.y = y * scale
      if (scale < 0) {
        x = -x; y = -y; scale = -scale
      }

      this._x = x || 0; this._y = y || 0
      this.scale = scale
    }

    get x() { return this._x * this.scale }
    get y() { return this._y * this.scale }

    set x(x) { this._x = x / this.scale }
    set y(y) { this._y = y / this.scale }

    round(
      round, // Float,Null
    ) {
      return (
        round > 0 ?
        new Point(
          Math.round(this.x / round) * round,
          Math.round(this.y / round) * round,
          1
        ) : this.copy(this.scale)
      )
    }

    copy(
      scale // Float
    ) {
      return new Point(this._x, this._y, scale)
    }

    long_short(
      short,ceil_long, // Float
    ) {
      const abs_x = Math.abs(this.x)
      const abs_y = Math.abs(this.y)
      const x = this.x < 0 ? -1 : 1
      const y = this.y < 0 ? -1 : 1

      let long = abs_x < abs_y ? abs_y : abs_x || ceil_long
      long = Math.ceil(long / ceil_long) * ceil_long

      return abs_x < abs_y ? {
        short: new Point(x, 0, short),
        long:  new Point(0, y, long ),
      } : {
        short: new Point(0, y, short),
        long:  new Point(x, 0, long ),
      }
    }

    sum(
      point, // Point
      scale, // Float
    ) {
      return new Point( this.x + point.x * scale, this.y + point.y * scale, 1)
    }

    usum(
      point, // Point
      scale, // Float
    ) {
      return new Point( this.x + point._x * scale, this.y + point._y * scale, 1)
    }

    sub(
      point, // Point
      scale, // Float
    ) {
      return new Point( this.x - point.x * scale, this.y - point.y * scale, 1)
    }

    dot(
      point, // Point
    ) {
      return this._x * point._x + this._y * point._y
    }

    mul(
      scale, // Float
    ) {
      return new Point(this._x, this._y, this.scale * scale, )
    }

    unit(
      scale, // Float
      x,y, // Float
    ) {
      const length = Math.sqrt(this._x*this._x + this._y*this._y)
      if (length) {
        x = this._x / length; y = this._y / length
      }
      return new Point(x, y, scale)
    }

    invert(
      scale // Float
    ) {
      return new Point(-this._y, this._x, scale)
    }

    atan2(
      point
    ) {
      return Math.atan2( point.y - this.y, point.x - this.x, )
    }

    lineTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.lineTo(this.x, this.y)
    }

    arc(
      ctx, // CanvasRenderingContext2D
      radius,angle_root,angle_spot, // Float
    ) {
      ctx.arc( this.x, this.y, radius, angle_root, angle_spot )
    }
  }

  class Mouse extends Point {
    static plural_name = 'mice'
    static single_name = 'mouse'

    // x,y,prev_x,prev_y,now_time: Float
    // width,height,scale: Float
    // right_down,left_down: Boolean

    constructor() {
      super(-1,-1,1)
    }

    get center() {
      return new Point( this.width, this.height, 1/2, )
    }

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
      _root, // Point
    ) {
      this._root = _root ? _root.round(this.Type.round_root) : new Point(0,0,1)
    }

    copy(
      super_spot_copy, // Spot,Null
      spot_copy, // Spot,Null
    ) {
      if (!spot_copy) {
        spot_copy = new this.Type( super_spot_copy, this.is_open, )
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

        const sub = editor._spot.sum(spot._root, -1)
        const dist2 = sub.dot(sub) * sub.scale * sub.scale
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
    // _spot: Point
    // scale: Float
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
      scale, // Float
      is_open, // Boolean
      _root,_spot, // Point,Null
    ) {
      super(level, is_open, )

      this.set_root(_root, _spot)

      this.id = id
      this.name = name; this.action = action
      this.type = type
      this.spot = spot || level
      this.scale = scale
      level.game[this.Type.plural_name][id] = this
    }

    set_root(
      _root,_spot, // Point,Null
    ) {
      super.set_root(_root || new Point(0,0,1))
      this._spot = _spot && _spot.copy(1) || new Point(0,0,1)
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
          this.scale,
          this.is_open,
          this._root,
          this._spot,
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

    // get short_x() { return this._short._x }
    // get short_y() { return this._short._y }
    // get short() { return this._short.scale }
    // set short_x(x) { this._short._x = x }
    // set short_y(y) { this._short._y = y }
    // set short(short) { this._short.scale = short }

    // short_x;short_y: Float
    // long_x;long_y;long: Float

    constructor(
      level, // Level
      _root,_long, // Point,Null
    ) {
      super( level, false, )
      this.set_root(_root,_long,)
    }

    set_root(
      _root,_long, // Point,Null
    ) {
      super.set_root(_root || new Point(0,0,1))
      _long = _long || new Point(0, 0, 1)

      const {long,short} = _long.long_short(
        this.Type.short, this.Type.ceil_long
      )
      this._long = long; this._short = short
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {

      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)
      const spot = root.usum(this._long, this._long.scale * mouse.scale)

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.strokeStyle = this == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color

      ctx.beginPath()
      root.lineTo(ctx)
      spot.lineTo(ctx)
      ctx.stroke()
    }

    copy(
      level_copy, // Level
      wall_copy, // Wall,Null
    ) {
      if (!wall_copy) {
        const long = this._long.usum(this._short, 1)
        wall_copy = new this.Type(
          level_copy,
          this._root,
          long,
        )
      }

      return super.copy(level_copy, wall_copy)
    }

    get lines() {
      return [ this._root, this._root.usum(this._long, this._long.scale) ]
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
        const p_spot = editor._spot.sum(wall._root, -1)

        const long = p_spot.dot(wall._long) * p_spot.scale / wall._long.scale
        let short = p_spot.dot(wall._short) * p_spot.scale
        if (this.get_abs && short < 0) {
          short = -short
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
          editor.spot._root = editor.spot._root.sum( editor.spot._long, 1)
          editor.is_open = true
          editor.action = `fliped ${this.name}, `
        }

        editor.spot._long = editor._spot.sum(editor.spot._root, -1)
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
          editor.spot = new this(
            editor.level,
            editor._spot,
          )
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

    get short() { return this.Type.short }
    set short(short) { this._short.scale = this.short }

    // open_long: Float

    constructor(
      level, // Level
      _root,_long, // Point,Null
    ) {
      super( level, _root,_long, )
    }

    set_root(
      _root,_long, // Point,Null
    ) {
      super.set_root(_root,_long,)
      this.is_open = true
      this.open_long = this._long.scale / 2
    }

    copy(
      level_copy, // Level
      door_copy, // Door,Null
    ) {
      const half_short = this.Type.short / 2
      const lock_names = this.Type.lock_names

      door_copy = super.copy(level_copy, door_copy)

      const {_root,_short,_long} = door_copy
      for (const lock_name in lock_names) {
        const this_lock = this[lock_name]
        if (this_lock) {
          const [ hs, hl, l, ls, ll ] = lock_names[lock_name]

          const lock_long = _short.copy(ls).usum(_long, ll)
          const lock_root = (
            _root.usum(_short, hs * half_short)
            .usum(_long, hl * half_short + l * _long.scale)
          )

          const lock_copy = this_lock.copy(
            level_copy, door_copy, lock_root, lock_long,
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
      else if (door_copy._long.scale / 2 < door_copy.open_long) {
        door_copy.open_long = door_copy._long.scale / 2
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
      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)

      const open_long = this.open_long * mouse.scale
      const short = this.Type.short * mouse.scale
      const long = this._long.scale * mouse.scale

      const spot = root.usum(this._long, long).usum(this._short,short)

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.strokeStyle = (
        this == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      root.usum(this._long, short).lineTo(ctx)
      root.usum(this._long, open_long).lineTo(ctx)
      root.usum(this._long, open_long).usum(this._short,short).lineTo(ctx)
      root.usum(this._short, short).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      root.lineTo(ctx)
      root.usum(this._short, short).lineTo(ctx)
      root.usum(this._long,short).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      spot.usum(this._long, -short).lineTo(ctx)
      spot.usum(this._long, -open_long).lineTo(ctx)
      spot.usum(this._long, -open_long).usum(this._short, -short).lineTo(ctx)
      spot.usum(this._short, -short).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      spot.lineTo(ctx)
      spot.usum(this._short, -short).lineTo(ctx)
      spot.usum(this._long, -short).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

    /*
      9   8 7  65
       ___   ___
      |\__| |__\|
      01  2 3   4
    */
    get lines() {


      const p0 = this._root
      const p1 = p0.usum(this._long, this._short.scale)
      const p2 = p0.usum(this._long, this.open_long)
      const p4 = p0.usum(this._long, this._long.scale)
      const p3 = p4.usum(this._long, -this.open_long)
      const p5 = p4.usum(this._short, this._short.scale)
      const p6 = p5.usum(this._long, -this._short.scale)
      const p7 = p5.usum(this._long, -this.open_long)
      const p9 = p0.usum(this._short, this._short.scale)
      const p8 = p9.usum(this._long, this.open_long)

      if (this.open_long <= 0) {
        return [
          p0,p9, p0,p1, p1,p9,
          p4,p5, p5,p6, p6,p4,
        ]
      }
      else if (this.open_long < this._short.scale) {
        return [
          p9,p0, p0,p1, p1,p9, p9,p8, p8,p2,
          p4,p5, p5,p6, p6,p4, p4,p3, p3,p7,
        ]
      }
      else if (this.open_long < this._long.scale/2) {
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
      _root,_long, // Point,Null
    ) {
      super( level, _root,_long, )
    }

    set_root(
      _root,_long, // Point,Null
    ) {
      super.set_root(_root,_long,)
      this._long.scale = this.Type.long
    }

    draw(
      ctx, // CanvasRenderingContext2D
      mouse, // Mouse
      editor, // Editor
    ) {
      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)

      const long = this._long.scale * mouse.scale
      const short = this._short.scale * mouse.scale
      const open_long = this.open_long * mouse.scale
      const radius = this.Type.radius * mouse.scale

      const center = (
        root
        .usum(this._short, mouse.scale * this.Type.center_short)
        .usum(this._long, mouse.scale * this.Type.center_long)
      )
      const p_root = root.usum(this._short, short)
      const p_spot = p_root.usum(this._long, long)

      const angle_root = center.atan2(p_root)
      const angle_spot = center.atan2(p_spot)

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.strokeStyle = (
        this == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      root.lineTo(ctx)
      p_root.lineTo(ctx)
      p_root.usum(this._long, open_long).lineTo(ctx)
      root.usum(this._long, open_long).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      root.usum(this._long, long).lineTo(ctx)
      p_spot.lineTo(ctx)
      const open_spot = p_spot.usum(this._long, -open_long)
      open_spot.lineTo(ctx)
      open_spot.usum(this._short, -short).lineTo(ctx)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      if (
        (this._long._x + this._short._x) > 0 ^
        (this._long._y + this._short._y) > 0 ^
        this._long._x == 0
      ) {
        p_root.lineTo(ctx)
        root.lineTo(ctx)
        root.usum(this._long, long).lineTo(ctx)
        p_spot.lineTo(ctx)
        center.arc( ctx, radius, angle_spot, angle_root, )
      }
      else {
        center.arc( ctx, radius, angle_root, angle_spot, )
        p_spot.lineTo(ctx)
        root.usum(this._long, long).lineTo(ctx)
        root.lineTo(ctx)
        p_root.lineTo(ctx)
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

      const p0 = this._root
      const p1 = p0.usum(this._long, this.open_long)
      const p3 = p0.usum(this._long, this._long.scale)
      const p2 = p3.usum(this._long,-this.open_long)
      const p4 = p3.usum(this._short, this._short.scale)
      const p5 = p4.usum(this._long,-this.open_long)
      const p7 = p0.usum(this._short, this._short.scale)
      const p6 = p7.usum(this._long, this.open_long)

      if (this.open_long <= 0) {
        return [
          p7,p0, p0,p3, p3,p4,
        ]
      }
      else if (this.open_long < this._long.scale/2) {
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
    // long: Point

    constructor(
      level, // Level
      spot, // Spot,Null
      _root,_long, // Point,Null
      long, // Float
    ) {
      super( level, false, )
      this.spot = spot || level
      this.set_root( _root, _long, long, )
    }

    set_root(
      _root,_long, // Point,Null
      long, // Float,Null
    ) {
      _long = _long || new Point(0,0,1)
      long = long > 0 ? long : _long.scale

      this._long = _long.unit(-(
        long > this.Type.min_long ?
        Math.ceil(long / this.Type.ceil_long) * this.Type.ceil_long :
        this.Type.min_long
      ), 0, 1)

      super.set_root( _root )
      this._root = this._root.sum(this._long, -1)

      if (this.key) {
        this.key.set_root( this._root, )
      }
    }

    copy(
      level_copy, // Level
      spot_copy, // Spot,Null
      _root,_long, // Point,Null
      lock_copy, // Lock,Null
    ) {

      if (!spot_copy) {
        throw `TODO game lock`
      }


      if (lock_copy) {
        lock_copy.set_root(
          _root, _long,
          this._long.scale,
        )
      }
      else {
        lock_copy = new this.Type(
          level_copy, spot_copy,
          _root, _long,
          this._long.scale,
        )
      }

      if (this.key) {
        const key_copy = this.key.copy(
          level_copy, lock_copy,
          lock_copy._root,
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
      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)
      const long = this._long.scale * mouse.scale
      const radius = this.Type.radius * mouse.scale

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.strokeStyle = (
        this == editor.spot || this.spot == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )
      ctx.beginPath()
      root.lineTo(ctx)
      root.usum(this._long, long).lineTo(ctx)
      ctx.closePath()
      ctx.stroke()

      ctx.fillStyle = this.Type.fill_color
      ctx.beginPath()
      root.arc(ctx, radius, 0, pi2)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      root.arc(ctx, radius, 0, pi2)
      ctx.closePath()
      ctx.stroke()
    }

    get lines() {
      return [ this._root, this._root.sum(this._long, 1) ]
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
        const spot = editor._spot.sum(door._root, -1)
        const lock_name = Door.lock_name_array[Math.floor(
          spot.dot(door._long) * spot.scale / door._long.scale *
          Door.lock_name_array.length
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
        const spot = editor._spot.sum(portal._root, -1)
        const lock_name = Portal.lock_name_array[Math.floor(
          spot.dot(portal._long) * spot.scale / portal._long.scale *
          Portal.lock_name_array.length
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
      _root,_long, // Point,Null
      long, // Float,Null
    ) {
      super(level,spot,_root,_long,long)
      level[Lock.plural_name].push(this)
    }

    remove() {
      return super.remove(Lock)
    }

    get lines() {
      const {min_long,ceil_long} = this.Type

      const p0 = this._root
      const p1 = this._root.usum(this._long, ceil_long)
      const p2 = this._root.sum(this._long, 1)
      const p3 = p2.usum(this._long, -ceil_long)
      return [ p0,p1, p2,p3 ]
    }

    static act(
      editor, // Editor
    ) {

      const editor_laser = editor.spot

      super.act(editor)

      if (editor.spot == editor_laser && editor_laser.Type == this) {

        const spot = (
          editor._spot
          .sum(editor_laser._root, -1)
          .sum(editor_laser._long, -1)
        )
        editor_laser._long.scale = -spot.dot(editor_laser._long) * spot.scale

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
      _root, // Null,Point
      is_open, // Boolean
    ) {
      super( level, is_open, )
      this.lock = lock
      this.set_root( _root, )
    }

    set_root(
      _root, // Point,Null
    ) {
      _root = this.lock ? this.lock._root : _root
      super.set_root( _root )
      if (this.jack) {
        this.jack.set_root( this.jack._long, )
      }
    }

    copy(
      level_copy, // Level
      lock_copy, // Lock,Null
      _root, // Null,Point
      key_copy, // Key,Null
    ) {

      if (!key_copy) {
        key_copy = new this.Type(
          level_copy, lock_copy,
          _root,
          this.is_open,
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
      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      let radius = this.Type.radius * mouse.scale
      ctx.fillStyle = this.Type.fill_color
      ctx.beginPath()
      root.arc(ctx, radius, 0, pi2)
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
        root.arc(ctx, radius, 0, pi2)
        ctx.closePath()
        ctx.fill()
      }
      else {
        ctx.beginPath()
        ctx.lineTo(root.x + radius, root.y + radius)
        ctx.lineTo(root.x - radius, root.y - radius)
        ctx.closePath()
        ctx.stroke()

        ctx.beginPath()
        ctx.lineTo(root.x - radius, root.y + radius)
        ctx.lineTo(root.x + radius, root.y - radius)
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
        editor_key._root = editor._spot.copy(editor._spot.scale)

        editor.action = `moved ${this.name}`
      }
      else {
        lock = lock.Type != Level ? lock : null

        const new_key = new this(
          editor.level, lock,
          editor._spot,
          true,
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
      _spot, // Point
    ) {
      super(level, false, )
      this.jack = jack
      this.set_root(_spot)
    }

    set_root(
      _spot, // Point
    ) {
      super.set_root(this.jack._root,)
      this._spot = _spot.copy(1)
    }

    copy(
      level_copy, // Level
      jack_copy, // Jack
      path_copy, // Path,Null
    ) {

      if (!path_copy) {
        path_copy = new this.Type(
          level_copy, jack_copy,
          this._spot,
        )
      }

      return super.copy(level_copy, path_copy,)
    }

    do_path(lines) {



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
          editor._spot = key._root
        }
      }
      else if (lock.Type != Level) {
        editor._spot = lock._root
      }

      if (editor.spot.Type != Level && !editor.spot.path) {
        editor.spot.path = new Path(
          editor.level, editor.spot,
          editor._spot,
        )
        editor.action = `set new path for ${editor.spot.Type.name}`
        return
      }
    }


    static valid_sub_path(
      root,spot, // Point
      lines, // [Point,Point, Point,Point, ...]
    ) {
      const { x:point_root_x, y:point_root_y } = root
      const { x:point_spot_x, y:point_spot_y } = spot

      for (let idx = 0; idx < lines.length; idx += 2) {
        const { x:line_root_x, y:line_root_y } = lines[idx]
        const { x:line_spot_x, y:line_spot_y } = lines[idx+1]

        if (Lib.line_cross(
          point_root_x, point_root_y, point_spot_x, point_spot_y,
          line_root_x, line_root_y, line_spot_x, line_spot_y,
        )) {
          return false
        }
      }

      return true
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
    // _long: Point
    // path: Path,Null

    constructor(
      level, // Level
      key, // Key
      lock, // Lock,Null
      _long, // Point,Null
    ) {
      super(level, false, )
      this.key = key
      this.lock = lock
      this.set_root(_long,)
    }

    set_root(
      _long, // Point,Null
    ) {
      super.set_root(this.key._root)
      this._long = _long ? _long.unit(1,0,1) : new Point(0,1,1)
      const lock_root = this.key._root.usum(this._long, this.key.Type.radius)

      if (!this.lock) {
        this.lock = new Lock(
          this.level, this,
          lock_root,
          this._long,
        )
      }
      else if (this.lock.spot == this) {
        this.lock.set_root(
          lock_root,
          this._long,
        )
      }
    }

    copy(
      level_copy, // Level
      key_copy, // Key
      lock_copy, // Lock,Null
      jack_copy, // Jack,Null
    ) {

      const editor = this.editor
      const _long = editor ? editor._spot.sum(key_copy._root, -1) : this._long

      if (jack_copy) {
        jack_copy.set_root(_long,)
      }
      else {
        jack_copy = new this.Type(
          level_copy, key_copy, lock_copy,
          _long
        )
      }

      if (this.path) {
        jack_copy.path = this.path.copy(level_copy, jack_copy, jack_copy.path,)
      }


      if (!lock_copy) {
        const radius = key_copy.Type.radius
        const lock_root = jack_copy._root.usum(jack_copy._long, radius)

        jack_copy.lock = this.lock.copy(
          level_copy, jack_copy,
          lock_root,
          jack_copy._long,
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
      const root = mouse.center.sum(this._root.sum(editor._root,-1), mouse.scale)
      const scale = mouse.scale * this.Type.radius
      const i_long = this._long.invert( scale )
      const h_long = this._long.copy(scale * this._long.scale / 2)

      ctx.lineWidth = this.Type.line_width * mouse.scale
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.strokeStyle = (
        this == editor.spot || this.key == editor.spot ?
        this.Type.sel_color :
        this.Type.stroke_color
      )

      ctx.beginPath()
      root.sum(i_long, 1).sum(h_long, 1).lineTo(ctx)
      root.sum(i_long,-1).sum(h_long, 1).lineTo(ctx)
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      root.sum(i_long, 1).sum(h_long,-1).lineTo(ctx)
      root.sum(i_long,-1).sum(h_long,-1).lineTo(ctx)
      ctx.closePath()
      ctx.stroke()
    }

    get lines() {
      const {radius,} = this.Type
      const i_long = this._long.invert( radius )
      const h_long = this._long.copy(radius * this._long.scale / 2)
      return [
        this._root.sum(i_long, 1).sum(h_long,-1),
        this._root.sum(i_long,-1).sum(h_long,-1),
      ]
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
      is_open, // Boolean
      _root, // Point,Null
    ) {
      super(game, is_open, )
      this.set_root( _root || new Point(0,0,1) )
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
        level_copy = new this.Type(game_copy, this._root )
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
          this_key.copy(level_copy, null, this_key._root)
        }
      }

      const lines = level_copy.lines
      for (const path_idx in level_copy.paths) {
        const path_copy = level_copy.paths[path_idx]
        path_copy.do_path(lines)
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
      this.set_root()
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
    Point: Point,
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
