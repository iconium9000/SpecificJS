module.exports = (project_name, Lib) => {

  const log = (...msg) => console.log(project_name, ...msg)
  const err = console.error
  const pi = Math.PI, pi2 = pi*2

  let sanity = 1000

  MazeGame = {
    Array: Array,
    Object: Object,
  }

  class Type {
    static key_bind = null

    static get(
      parent, // Object
      ...path // String
    ) {
      for (const i in path) {
        if (parent == null) return
        parent = parent[path[i]]
      }
      return parent
    }

    static set(
      parent, // Object,Null
      value, // Object,Null
      action, // Action
      ...path // String
    ) {
      let label = 'parent'
      const _parent = parent = {[label]: parent}
      for (const i in path) {
        if (parent[label] == null) {
          parent[label] = Object.assign(new Object, {__action:action})
        }
        parent = parent[label]
        label = path[i]
      }
      Lib.set(parent, value, label)
      return _parent.parent
    }

    get time() { return this._time } // Number
    get name() { return this._name } // String
    get idx() { return this._idx } // String,Number

    get tally() {
      const {__action, _tally} = this
      return __action.top((_tally || 0) + 1, '_tally')
    }
  }
  MazeGame.Type = Type

  class Float extends Type {
    get f() { return this._f }
    get sf() { return this._sf}
    get tf() { return this._tf}
    get abs() { return Math.abs(this._f) }

    static simple(
      f, // Number
    ) {
      const _float = new this
      _float._f = _float._sf = sf
      _float._tf = 0; _float._time = 0
      return _float
    }
    static init(
      sf,tf,time, // Number
    ) {
      const _float = new this
      _float._sf = sf
      _float._tf = tf; _float._time = time
      _float._f = sf + tf*time
      return _float
    }
    get flatten() {
      const {_f} = this
      return Float.simple(_f)
    }

    sum(
      {sf,tf,time}, // Float
    ) {
      const {_sf,_tf,_time} = this
      return Float.init( _sf+sf, _tf+tf, _time )
    }
    sub(
      {sf,tf,time}, // Float
    ) {
      const {_sf,_tf,_time} = this
      return Float.init( _sf-sf, _tf-tf, _time )
    }
    mul(
      mul, // Number
    ) {
      const {_sf,_tf,_time} = this
      return Float.init( _sf*mul, _tf*mul, _time)
    }
    div(
      div, // Number
    ) {
      const {_sf,_tf,_time} = this
      return Float.init( _sf/div, _tf/div, _time)
    }
    at(
      time, // Number
    ) {
      const {_sf,_tf} = this
      return Float.init( _sf, _tf, time)
    }
    lerp(
      {f,time}, // Float
    ) {
      const {_f,_time} = this, t = (f-_f) / (time - _time)
      // f: _f + (f - _f) ( TIME - _time) / (time - _time)
      // f: _f - (f-_f) _time / (time-_time) + TIME (f-_f) / (time - _time)
      return Float.init( _f - _time*t, t, _time )
    }
  }
  MazeGame.Float = Float

  class Point extends Type {

    get x() { return this._x }
    get y() { return this._y }
    get sx() { return this._sx }
    get sy() { return this._sy }
    get scale() { return this._scale }
    get tx() { return this._tx }
    get ty() { return this._ty }
    get time() { return this._time }
    get abs_x () { return Math.abs(this._x) }
    get abs_y () { return Math.abs(this._y) }

    static get zero() {
      const _point = new this
      _point._sx = _point._sy = _point._scale = 0
      _point._tx = _point._ty = _point._time = 0
      _point._x = _point._y = 0
      return _point
    }

    static simple(
      sx,sy,scale, // Number
    ) {
      const _point = new this
      _point._sx = sx; _point._sy = sy; _point._scale = scale
      _point._tx = _point._ty = _point._time = 0
      _point._x = sx*scale; _point._y = sy*scale
      return _point
    }

    static init(
      sx,sy,scale, // Number
      tx,ty,time, // Number
    ) {
      const _point = new this
      _point._sx = sx; _point._sy = sy; _point._scale = scale
      _point._tx = tx; _point._ty = ty; _point._time = time
      _point._x = (sx + tx*time)*scale; _point._y = (sy + ty*time)*scale
      return _point
    }
    get length() {
      const {_x,_y} = this
      return Math.sqrt(_x*_x + _y*_y)
    }
    get unit() {
      const {_x,_y,length} = this
      return length > 0 ? Point.simple(_x/length,_y/length,length) : Point.zero
    }
    get invert() {
      const {_x,_y} = this
      return Point.simple(-_y, _x, 1)
    }
    get flatten() {
      const {_x,_y} = this
      return Point.simple(_x, _y, 1)
    }
    get long() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        Point.simple(0, y < -1 ? -1 : 1, abs_y) :
        Point.simple(x < -1 ? -1 : 1, 0, abs_x)
      )
    }
    get short() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        Point.simple(x < -1 ? -1 : 1, 0, abs_x) :
        Point.simple(0, y < -1 ? -1 : 1, abs_y)
      )
    }

    lerp(
      {x,y,time:t} // Point
    ) {
      const {_x,_y,_time:_t} = this, __t = t-_t, __x = x-_x, __y = y-_y
      return Point.init(_x*__t-_t*__x,_y*__t-_t*__y,1/__t,__x,__y,_t)
    }

    set(
      scale, // Number
    ) {
      const {_x, _y} = this
      return Point.simple(_x, _y, scale)
    }
    strip(
      scale, // Number
    ) {
      const {_sx,_sy} = this
      return Point.simple(_sx, _sy, scale)
    }
    atan2(
      {x,y}, // Point
    ) {
      const {_x,_y} = this
      return Math.atan2( y-_y, x-_x )
    }
    dot(
      {sx,sy,scale,tx,ty,}, // Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this, s = _scale*scale
      return Float.init( (_sx*sx + _sy*sy)*s, (_tx*tx + _ty*ty)*s, _time, )
    }

    sum(
      {sx,sy,scale,tx,ty,}, // Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this
      return Point.init(
        _sx*_scale+sx*scale, _sy*_scale+sy*scale, 1,
        _tx*_scale+tx*scale, _ty*_scale+ty*scale, _time,
      )
    }
    sub(
      {sx,sy,scale,tx,ty,}, // Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this
      return Point.init(
        _sx*_scale-sx*scale, _sy*_scale-sy*scale, 1,
        _tx*_scale-tx*scale, _ty*_scale-ty*scale, _time,
      )
    }

    at(
      time, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,} = this
      return Point.init(_sx,_sy,_scale,_tx,_ty,time)
    }

    mul(
      mul, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time} = this
      return Point.init(
        _sx, _sy, _scale * mul,
        _tx, _ty, _time,
      )
    }
    div(
      mul, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time} = this
      return Point.init(
        _sx,_sy, _scale/mul,
        _tx, _ty, _time,
      )
    }

    round(
      round, // Number,Null
    ) {
      const {_x,_y} = this
      return (
        round > 0 ?
        Point.simple(Math.round(_x/round), Math.round(_y/round), round) :
        Point.simple(_x, _y, 1)
      )
    }

  }
  MazeGame.Point = Point

  class Action extends Type {

    /*
      sync is only true iff child == build (when sync is false)
      if changes are made to any parent or grandparent
      sync will NOT be updated.
    */

    get sync() { return this._sync } // Boolean,Null
    get child() { return this._child } // Object,Null
    get parent() { return this._parent } // Action,Null

    static init(
      time, // Number
      parent, // Action,Null
    ) {
      const _action = new this
      _action._time = time
      _action._array = []
      _action._sync = true
      if (parent) {
        _action._parent = parent
        _action._child = parent.build
        parent._sync = false
      }
      return _action
    }

    _set(
      tok, // String
      real_value, // Object,Null
      value, // Object,Null
      ...path // String
    ) {
      Type.set(this, real_value, this, '_child', ...path)
      this._array.push([tok, value, ...path])
      return real_value
    }

    top(
      value, // Object,Null
      label, // String
    ) {
      const {_child} = this
      if (_child && _child[label] != value) this.set(value, label)
      return value
    }

    set(
      value, // Object,Null
      ...path // String
    ) {
      return this._set('set', value, value, ...path)
    }

    get(
      label, // String
      ...path // String
    ) {
      const {_child} = this
      return this._set(
        'get',
        _child == null ? null : _child[label],
        label, ...path,
      )
    }

    new(
      constructor, // Function (MazeGame[constructor.name] == constructor)
      ...path
    ) {
      return this._set(
        'new', Object.assign(new constructor, {__action:this}),
        constructor.name, ...path
      )
    }

    get build() {
      if (this._sync) return this._child
      const {_parent,_array} = this
      if (_parent) {
        this._child = _parent.build
        _parent._sync = false
      }
      else this._child = null

      for (const i in _array) {
        const [tok, value, ...path] = _array[i]
        const {_child} = this
        Type.set(
          this,
          tok == 'new' ? Object.assign(new MazeGame[value], {__action:this}) :
          tok == 'get' ? _child == null ? null : _child[value] :
          tok == 'set' ? value : null,
          this, '_child', ...path
        )
      }

      this._sync = true
      return this._child
    }

    at(
      time, // Number
    ) {
      const {_time,_parent} = this
      return (
        _time == time ? this :
        _time < time ? Action.init(time, this) :
        _parent ? _parent.at(time) : Action.init(time)
      )
    }
  }
  MazeGame.Action = Action

  class Game extends Type {

    get editors() { return this._editors }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // LevelNode
    ) {
      const {__action,_level_node} = this, {idx} = level_node
      if (_level_node == level_node) return _level_node
      else return __action.get(idx, '_level_node')
    }


    static init(
      time, // Number
    ) {
      const _action = Action.init(time)
      const _game = _action.new(this)
      Level.init(_game)
      return _game
    }

    at(
      time, // Number
    ) {
      return this.__action.at(time).build
    }

  }
  MazeGame.Game = Game

  class Editor extends Type {

    get target() { return this._target }
    set_target(
      target, // Target,Null
    ) {
      const {_idx,__action,_target} = this
      if (_target == target) return _target
      if (_target) {
        this._target = null // DANGER: this is ok...
        _target.set_editor(null)
      }
      if (target) {
        __action.get(target.idx, _idx, '_target') // ...because of this
        target.set_editor(this)
      }
      else __action.set(null, _idx, '_target') // ...and this
    }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // LevelNode,Null
    ) {
      const {_idx,_name,__action,_level_node,constructor} = this
      if (_level_node == level_node) return _level_node
      if (_level_node) {
        const _level = _level_node.at_time.build
        const _editor = _level[_idx]
        if (_editor) _editor.remove()
      }
      if (level_node) {
        __action.get(level_node.idx, _idx, '_level_node')
        const _level = level_node.at_time.build
        constructor.init(_level, _idx, _name)
      }
      else __action.set(null, _idx, '_level_node')
    }

    static init(
      game_level, // Game,Level
      idx,name, // String
    ) {
      const {__action,[idx]:editor,level_node} = game_level
      if (editor) return editor

      const _editor = __action.new(this, idx)
      __action.set(idx, idx, '_idx')
      __action.set(name, idx, '_name')
      _editor.set_level_node(level_node)
      return _editor
    }

  }
  MazeGame.Editor = Editor

  class LevelNode extends Type {

    get action() { return this._action }
    set_action(
      action, // Action w/ child:Level
    ) {
      const {_idx,__action,_action} = this
      if (_action == action) return _action
      else return __action.set(action, _idx, '_action')
    }
    set_prev(
      prev, // LevelNode,Null
    ) {
      const {_idx,__action,_prev} = this
      if (_prev == prev) return _prev
      else if (prev) {
        __action.get(_prev.idx, _idx, '_prev')
        __action.get(_idx, _prev.idx, '_next')
      }
      else __action.set(null, _idx, '_prev')
    }
    set_next(
      next, // LevelNode,Null
    ) {
      const {_idx,__action,_next} = this
      if (_next == next) return _next
      else if (next) {
        __action.get(_next.idx, _idx, '_next')
        __action.get(_idx, _next.idx, '_prev')
      }
      else __action.set(null, _idx, '_next')
    }
    get at_time() {
      const {__action:{time},_action,} = this
      return this.set_action(_action.at(time))
    }

    static init(
      game, // Game
      level, // Level
    ) {
      const game_action = game.__action
      const level_action = level.__action
      const _idx = game.tally
      const _level_node = game_action.new(this, _idx)
      game_action.set(_idx, _idx, '_idx')
      _level_node.set_action(level_action)

      const {level_node} = game
      if (level_node) _level_node.set_next(level_node.next_level)
      _level_node.set_prev(level_node)
      game.set_level_node(_level_node)

      return _level_node
    }

    remove() {
      const {_idx,__action,_action,_prev,_next} = this
      // NOTE: __action w/ child:Game (child in sync)
      // NOTE: child w/ editors:Editor{},Null
      // NOTE: child w/ level_node:LevelNode
      // NOTE: child w/ [_idx]:LevelNode,Null
      const {editors,level_node,[_idx]:_this} = __action.child
      if (!_this) return false

      for (const idx in editors) {
        const editor = editors[idx]
        if (editor.level_node == this) editor.set_level_node(level_node)
      }

      __action.set(null,_idx)
      if (_prev) _prev.set_next(_next)
      else if (_next) _next.set_prev(_prev)
      return true
    }

  }
  MazeGame.LevelNode = LevelNode
  class Level extends Type {

    get locks() { return this._locks }
    get lasers() { return this._lasers }
    get walls() { return this._walls }
    get doors() { return this._doors }
    get portals() { return this._portals }
    get keys() { return this._keys }
    get jacks() { return this._jacks }

    static init(
      game, // Game
    ) {
      const {__action} = game, {time} = __action
      const _action = Action.init(time)
      const _level = _action.new(this)
      LevelNode.init(game, _level)
      return _level
    }
  }
  MazeGame.Level = Level

  class Target extends Type {
    static fill_color = 'black'
    static stroke_color = 'white'
    static thin_stroke_color = '#505050'
    static line_width = 0.5
    static scale = 60
    static get thin_line_width() { return this.line_width / 3 }
    static speed = 2e-2 // dist / time = speed

    get is_open() { return this.__is_open }
    set_is_open(
      is_open, // Boolean
    ) {
      const {_idx,__action,_is_open} = this
      if (_is_open == is_open) return
      return __action.set(_is_open, _idx, '_is_open')
    }
    get level() { return this.__action.child }
    get editor() { return this._editor }
    set_editor(
      editor, // Editor,Null
    ) {
      const {_idx,__action,_editor} = this
      if (_editor == editor) return _editor
      if (_editor) {
        __action.set(null, _idx, '_editor')
        _editor.set_target(null)
      }
      if (editor) {
        __action.get(editor.idx, _idx, '_editor')
        editor.set_target(this)
        return editor
      }
      else return __action.set(null, _idx, '_editor')
    }

    static init(
      level, // Level
    ) {
      const {__action} = level
      const _idx = level.tally
      const _target = __action.new(this, _idx)
      _target.set(_idx,_idx,'_idx')
      return _target
    }

    remove() {
      const {_idx,__action} = level
      if (!level[_idx]) return false
      __action.set(null,_idx)
      return true
    }
  }

  class Lock extends Target {
    static key_bind = 'l'
    static long_min = 3
    static long_max = 3
    static long_round = 3
    static radius = 0.5
    static search_radius = 3 * this.radius

    static init(
      parent, // Door,Jack
      name, // String
    ) {
      const {level,[name]:lock} = parent
      if (lock) lock.remove()

      const _lock = super.init(level), {_idx} = _lock
      __action.get(parent.idx, _lock, '_parent')
      parent.set_lock(_lock, name)
      return __action.get(_idx, '_locks', _idx)
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, _name, __action, _key, _parent} = this

      if (_key) {
        this._key = null // DANGER: this is ok...
        _key.remove() // ...because of this
      }
      if (_parent) {
        __action.set(null, _idx, '_parent')
        _parent.set_lock(null, _name)
      }
      __action.set(null, '_locks', _idx)
      return true
    }
  }
  MazeGame.Lock = Lock

  class Laser extends Lock {
    static key_bind = 's'
    static long_min = 9
    static long_max = Infinity

    static init(
      parent, // Door,Jack
      name, // String
    ) {
      const _laser = super.init(parent, name)
      const {_idx,__action} = _laser
      return __action.get(_idx, '_lasers', _idx)
    }

    remove() {
      if (!super.remove()) return false
      const {_idx,__action} = this
      __action.set(null, '_lasers', _idx)
      return true
    }
  }
  MazeGame.Laser = Laser

  class Wall extends Target {
    static key_bind = 'w'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static short_min = 2
    static short_max = 2
    static default_long_open = 0
    static short_sign = false
    static is_portal = false


    get root() { return this._root }
    set_root(
      root, // Point
    ) {
      const {_idx, __action, _root, constructor:{root_round}} = this
      const {time} = __action
      root = root.at(time).round(root_round)
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _wall = super.init(level)
      const {_idx, __action} = _wall
      _wall.set_root(root)
      __action.get(_idx, '_walls', _idx)
      return _wall
    }

    remove() {
      if (!this.remove()) return false
      const {_idx, __action} = this
      __action.set(null, '_walls', _idx)
      return true
    }
  }
  MazeGame.Wall = Wall

  class Door extends Wall {
    static key_bind = 'd'
    static root_round = 4
    static long_min = 16
    static long_round = 4
    static short_min = 4
    static short_max = 4
    static short_sign = true

    static lock_names = ['root_short','root_long','spot_long','spot_short',]


  }
  MazeGame.Door = Door

  class Portal extends Door {
    static key_bind = 'p'
    static short_min = 3
    static short_max = this.short_min
    static long_min = 12
    static long_max = this.long_min
    static short_midx = this.short_max / 2
    static center_long = this.long_max / 2
    static center_short = (
      this.short_max*this.short_max - this.short_midx*this.short_midx +
      this.long_max * this.long_max / 4
    ) / 2 / (this.short_max - this.short_midx)
    static radius = Math.sqrt(
      Math.pow(this.short_max - this.center_short, 2) +
      Math.pow(this.long_max - this.center_long, 2)
    )
    static lock_names = ['lock_root','lock_cent','lock_spot',]
    static is_portal = true


  }
  MazeGame.Portal = Portal

  class Key extends Target {
    static key_bind = 'k'
    static radius = 1.5
    static center_radius = Lock.radius
    static search_radius = this.radius
  }
  MazeGame.Key = Key

  class Jack extends Key {
    static key_bind = 'j'
    static leg_radius = 2
  }
  MazeGame.Jack = Jack

  return MazeGame
}
