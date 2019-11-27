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

    get time() { return this._time } // Number
    get name() { return this._name } // String
    get idxable() { return false }
    get idx() { return this._idx } // String,Number

    get serializable() { return false }
    static serialize(
      object, // Object,Null
    ) {
      return object != null && object.serializable ? object.serialize : object
    }

    static get readable() { return false }
    static read(
      object, // Object,Null
      time, // Number
    ) {
      const con__ = object && MazeGame[object._constructor]
      return con__ && con__.readable ? con__.read(object, time) : object
    }

    get atable() { return false }
    static at(
      object, // Object,Null
      time, // Number
    ) {
      return object != null && object.atable ? object.at(time) : object
    }

    static get syncable() { return false }
    static sync(
      constructor, // Function
      sync, // {state:State, child:Object,Null}
    ) {
      return constructor.syncable ? new constructor(sync) : new constructor
    }

    get expandable() { return false }
    static expand(
      object, // Object,Null
      state, // State
      ...path // String
    ) {
      if (object == null || Type.get(state.child, ...path) != null) return
      else if (object.idxable) {
        if (state.child[object.idx] == null) {
          if (object.expandable) object.expand(state, object.idx)
          else state.set(object, object.idx)
        }
        if (path.length > 1) state.get(object.idx, ...path)
      }
      else if (object.expandable) object.expand(state, ...path)
      else state.set(object, ...path)
    }

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
      ...path // String
    ) {
      let label = 'parent'
      const _parent = parent = {[label]: parent}
      for (const i in path) {
        if (parent[label] == null) parent[label] = {}
        parent = parent[label]
        label = path[i]
      }
      Lib.set(parent, value, label)
      return _parent.parent
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
      _float._sf = sf; _float._tf = tf; _float._time = time
      _float._f = sf + tf*time
      return _float
    }
    get flatten() {
      const {_f} = this
      return Float.simple(_f)
    }
    get serializable() { return true }
    get serialize() {
      const {_sf, _tf, constructor:{name}} = this
      const _serialize = {_constructor:name}
      if (_sf) _serialize.sf = _sf
      if (_tf) _serialize.tf = _tf
      return _serialize
    }
    static readable() { return true}
    static read(
      {sf,tf}, // Object
      time, // Number
    ) {
      return this.init(sf, tf, time, )
    }
    get atable() { return true }
    at(
      time, // Number
    ) {
      const {_sf,_tf} = this
      return Float.init( _sf, _tf, time)
    }
    get expandable() { return true }
    expand(
      state, // State
      ...path // String
    ) {
      return state.set(this, ...path)
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

    get serializable() { return true }
    get serialize() {
      const {_sx,_sy,_scale,_tx,_ty,constructor:{name}} = this
      const _serialize = {_constructor:name}
      if (_sx) _serialize.sx = _sx; if (_sy) _serialize.sy = _sy
      if (_tx) _serialize.tx = _tx; if (_ty) _serialize.ty = _ty
      if (_scale) _serialize.scale = _scale
      return _serialize
    }
    static readable() { return true }
    static read(
      {sx,sy,scale,tx,ty}, // Object
      time, // Time
    ) {
      return this.init( sx||0, sy||0, scale||0, tx||0, ty||0, time, )
    }
    get atable() { return true }
    at(
      time, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,} = this
      return Point.init(_sx,_sy,_scale,_tx,_ty,time)
    }
    get expandable() { return true }
    expand(
      state, // State
      ...path // String
    ) {
      return state.set(this, ...path)
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

    // NOTE: ignores tx,ty,time
    // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
    clamp(
      min,ceil, // Number
    ) {
      const {_sx,_sy,_scale} = this
      return Point.simple(
        _sx,_sy,
        _scale < min ? min : Math.ceil(_scale / ceil) * ceil
      )
    }

    // NOTE: ignores tx,ty,time
    // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
    cramp(
      min,max,round, // Float
    ) {
      const {_sx,_sy,_scale} = this
      return Point.simple(_sx,_sy,
        _scale < min ? min : max < _scale ? max :
        0 < round ? Math.ceil(_scale / round) * round : _scale
      )
    }

  }
  MazeGame.Point = Point

  class State extends Type {

    get serializable() { return true }
    get serialize() {
      const {_time,_array,_parent,constructor:{name}} = this
      if (_array.length) {
        const _serialize = {time:_time,_constructor:name}
        if (_parent) _serialize.parent = _parent.serialize
        _serialize.array = []
        for (const i in _array) {
          const [tok, value, ...path] = _array[i]
          _serialize.array.push([ tok, Type.serialize(value), ...path ])
        }
        return _serialize
      }
      else if (_parent) return _parent.serialize
      else return null
    }
    static readable() { return true }
    static read(
      {time,array,parent}, // Object
    ) {
      const _state = this.init(time, parent ? this.read(parent) : null)
      for (const i in array) {
        const [tok, value, ...path] = _array[i]
        _state[tok](Type.read(value), ...path)
      }
      return _state
    }

    get parent() { return this._parent } // State,Null

    get flatten() {
      const {time,child,constructor} = this
      const _state = constructor.init(time)
      Type.expand(child, _state)
      return _state
    }

    static init(
      time, // Number
      parent, // State,Null
    ) {
      const _state = new this
      _state._time = time
      _state._array = []
      if (parent) parent.build()
      _state.__sync = parent ? parent.__sync : {}
      _state.__sync.state = _state
      return _state
    }

    _set(
      tok, // String
      real_value, // Object,Null
      value, // Object,Null
      ...path // String
    ) {
      Type.set(this.__sync, real_value, 'child', ...path)
      this._array.push([tok, value, ...path])
      return real_value
    }

    set(
      value, // Object,Null
      ...path // String
    ) {
      value = Type.at(value, this.time)
      return this._set('set', value, value, ...path)
    }

    get(
      label, // String
      ...path // String
    ) {
      const {child} = this.__sync
      return this._set(
        'get',
        child == null ? null : child[label],
        label, ...path,
      )
    }

    new(
      constructor, // Function (MazeGame[constructor.name] == constructor)
      ...path
    ) {
      return this._set(
        'new', Type.sync(constructor, this.__sync),
        constructor.name, ...path
      )
    }

    get child() {
      this.build()
      return this.__sync.child
    }

    build() {
      if (this.__sync && this.__sync.state == this) return false

      const {_parent,_array} = this
      if (_parent) _parent.build()
      const sync = this.__sync = _parent ? _parent.__sync : {}
      sync.state = this

      for (const i in _array) {
        const [tok, value, ...path] = _array[i]
        const {child} = sync
        Type.set(
          sync,
          tok == 'new' ? Type.sync(MazeGame[value], this.__sync) :
          tok == 'get' ? child == null ? null : child[value] :
          tok == 'set' ? value : null,
          'child', ...path
        )
      }
      return true
    }

    at(
      time, // Number
    ) {
      const {_time,_parent} = this
      return (
        time < _time ?
        _parent ? _parent.at(time) : State.init(time) :
        State.init(time, this)
      )
    }
  }
  MazeGame.State = State

  class Game extends Type {

    get tally() {
      const {state, _tally} = this
      return state.set(_tally+1, '_tally')
    }
    get editors() { return this._editors }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // LevelNode
    ) {
      const {state,_level_node} = this, {idx} = level_node
      if (_level_node == level_node) return _level_node
      else return state.get(idx, '_level_node')
    }

    static get syncable() { return true }
    constructor(sync) { super(); this.__sync = sync }
    get state() { return this.__sync.state }
    static init(
      time, // Number
    ) {
      const _state = State.init(time)
      const _game = _state.new(this)
      _state.set(0, '_tally')
      Level.init(_game)
      return _game
    }

    get expandable() { return true }
    expand(
      state, // State
    ) {
      const {_tally,_level_node,_editors,constructor} = this
      const _game = state.new(constructor)
      state.set(_tally, '_tally')
      for (const idx in _editors) Type.expand(_editors[idx], state, idx)
      Type.expand(_level_node, state, '_level_node')
      return _game
    }

    at(
      time, // Number
    ) {
      return this.state.at(time).child
    }

    draw(
      ctx, // CanvasRenderingContext2D
      editor_idx, // String
      center,mouse, // Point @ time
    ) {
      const _state = Type.get(this, editor_idx, 'level_node', 'state')
      if (_state) {
        const _level = _state.at(this.state.time).child
        if (_level) _level.draw(ctx, center, mouse)
      }
    }
  }
  MazeGame.Game = Game

  class Editor extends Type {

    get target() { return this._target }
    set_target(
      target, // Target,Null
    ) {
      const {_idx,state,_target} = this
      if (_target == target) return _target
      if (_target) {
        this._target = null // UNRECORDED MODIFICATION: this is ok...
        _target.set_editor(null)
      }
      if (target) {
        state.get(target.idx, _idx, '_target') // ...because of this
        target.set_editor(this)
      }
      else state.set(null, _idx, '_target') // ...or this
    }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // LevelNode,Null
    ) {
      const {_idx,_name,state,_level_node,constructor} = this, {time} = state
      if (_level_node == level_node) return _level_node
      if (_level_node) {
        const _level = _level_node.level_state.at(time).child
        const _editor = _level[_idx]
        if (_editor) {
          _editor.remove()
          _level_node.set_level_state(_level.extend.state)
        }
      }
      if (level_node) {
        state.get(level_node.idx, _idx, '_level_node')
        const _level = level_node.level_state.at(time).child
        constructor.init(_level.state, _idx, _name)
        level_node.set_level_state(_level.extend.state)
      }
      else state.set(null, _idx, '_level_node')
    }

    get idxable() { return true }
    static get syncable() { return true }
    constructor(sync) { super(); this.__sync = sync }
    get state() { return this.__sync.state }
    static init(
      state, // State @ child:Game,Level
      idx,name, // String
    ) {
      const {[idx]:editor,level_node} = state.child
      if (editor) return editor

      const _editor = state.new(this, idx)
      state.set(idx, idx, '_idx')
      state.set(name, idx, '_name')
      state.get(idx, '_editors', idx)
      _editor.set_level_node(level_node)
      return _editor
    }

    get expandable() { return true }
    expand(
      state, // State
    ) {
      const {_idx,_name,_level_node,_target,constructor} = this
      const _editor = state.new(constructor, _idx)
      state.set(_idx, _idx, '_idx')
      state.set(_name, _idx, '_name')
      Type.expand(_level_node, state, _idx, '_level_node')
      Type.expand(_target, state, _idx, '_target')
      Type.expand(_editor, state, '_editors', _idx)
      return _editor
    }

    remove() {
      const {_idx,state} = this
      if (!state.child[_idx]) return false
      this.set_level_node(null)
      this.set_target(null)
      state.set(null,_idx)
      return true
    }

  }
  MazeGame.Editor = Editor

  class LevelNode extends Type {

    get level_state() { return this._level_state }
    set_level_state(
      level_state, // State @ child:Level
    ) {
      const {_idx,state,_level_state} = this
      if (_level_state == level_state) return _level_state
      else return state.set(level_state, _idx, '_level_state')
    }
    set_prev(
      prev, // LevelNode,Null
    ) {
      const {_idx,state,_prev} = this
      if (_prev == prev) return _prev
      else if (prev) {
        state.get(_prev.idx, _idx, '_prev')
        state.get(_idx, _prev.idx, '_next')
      }
      else state.set(null, _idx, '_prev')
    }
    set_next(
      next, // LevelNode,Null
    ) {
      const {_idx,state,_next} = this
      if (_next == next) return _next
      else if (next) {
        state.get(_next.idx, _idx, '_next')
        state.get(_idx, _next.idx, '_prev')
      }
      else state.set(null, _idx, '_next')
    }

    get idxable() { return true }
    static get syncable() { return true }
    constructor(sync) { super(); this.__sync = sync }
    get state() { return this.__sync.state }
    static init(
      game, // Game
      level, // Level
    ) {
      const {state,level_node} = game
      const _idx = this.name + game.tally
      const _level_node = state.new(this, _idx)
      state.set(_idx, _idx, '_idx')
      _level_node.set_level_state(level.extend.state)

      if (level_node) _level_node.set_next(level_node.next_level)
      _level_node.set_prev(level_node)
      game.set_level_node(_level_node)

      return _level_node
    }

    get expandable() { return true }
    expand(
      state, // State
    ) {
      const {_idx,_prev,_next,_level_state,constructor} = this
      const _level_node = state.new(constructor, _idx)
      state.set(_idx, _idx, '_idx')
      state.set(_level_state, _idx, '_level_state')
      Type.expand(_prev, state, _idx, '_prev')
      Type.expand(_next, state, _idx, '_next')
      return _level_node
    }

    remove() {
      const {_idx,state,_level_state,_prev,_next} = this
      const {editors,level_node,[_idx]:_this} = state.child
      if (!_this) return false

      for (const idx in editors) {
        const editor = editors[idx]
        if (editor.level_node == this) editor.set_level_node(level_node)
      }

      state.set(null,_idx)
      if (_prev) _prev.set_next(_next)
      else if (_next) _next.set_prev(_prev)
      return true
    }

  }
  MazeGame.LevelNode = LevelNode

  class Level extends Type {

    get tally() {
      const {state, _tally} = this
      return state.set(_tally+1, '_tally')
    }
    get locks() { return this._locks }
    get lasers() { return this._lasers }
    get walls() { return this._walls }
    get doors() { return this._doors }
    get portals() { return this._portals }
    get keys() { return this._keys }
    get jacks() { return this._jacks }

    static get syncable() { return true }
    constructor(sync) { super(); this.__sync = sync }
    get state() { return this.__sync.state }
    static init(
      game, // Game
    ) {
      const {state} = game, {time} = state
      const _state = State.init(time)
      const _level = _state.new(this)
      _state.set(0, '_tally')
      LevelNode.init(game, _level)
      return _level
    }

    get expandable() { return true }
    expand(
      state, // State
    ) {
      const {_tally,_editors,_locks,_walls,_keys,constructor} = this
      const _level = state.new(constructor)
      state.set(_tally, '_tally')
      for (const idx in _editors) Type.expand(_editors[idx], state, idx)
      for (const idx in _locks) Type.expand(_locks[idx], state, idx)
      for (const idx in _walls) Type.expand(_walls[idx], state, idx)
      for (const idx in _keys) Type.expand(_keys[idx], state, idx)
      return _level
    }

    get extend() {
      return this // TODO extend
    }

    draw(
      ctx, // CanvasRenderingContext2D
      center,mouse, // Point @ time
    ) {

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
      const {_idx,state,_is_open} = this
      if (_is_open == is_open) return
      return state.set(_is_open, _idx, '_is_open')
    }
    get level() { return this.state.child }
    get editor() { return this._editor }
    set_editor(
      editor, // Editor,Null
    ) {
      const {_idx,state,_editor} = this
      if (_editor == editor) return _editor
      if (_editor) {
        state.set(null, _idx, '_editor')
        _editor.set_target(null)
      }
      if (editor) {
        state.get(editor.idx, _idx, '_editor')
        editor.set_target(this)
        return editor
      }
      else return state.set(null, _idx, '_editor')
    }

    get idxable() { return true }
    static get syncable() { return true }
    constructor(sync) { super(); this.__sync = sync }
    get state() { return this.__sync.state }
    static init(
      level, // Level
    ) {
      const {state} = level
      const _idx = this.name + level.tally
      const _target = state.new(this, _idx)
      _target.set(_idx,_idx,'_idx')
      return _target
    }
    get expandable() { return true }
    expand(
      state, // State
    ) {
      const {_idx,constructor} = this
      const _target = state.new(constructor, _idx)
      state.set(_idx,_idx,'_idx')
      return _target
    }

    remove() {
      const {_idx,state} = this
      if (!state.child[_idx]) return false
      state.set(null,_idx)
      return true
    }
  }
  MazeGame.Target = Target

  class Lock extends Target {
    static key_bind = 'l'
    static long_min = 3
    static long_max = 3
    static long_round = 3
    static radius = 0.5
    static search_radius = 3 * this.radius

    get length() { return this._length }
    set length(
      length, // Number
    ) {
      const {long_min,long_max,long_round} = this.constructor
      const {_idx,state,_long,_length} = this
      length = length<long_min ? long_min : length<long_max ? length : long_max
      if (_length == length) return _length
      state.set(length, _idx, '_length')
      if (_long) this.set_long(_long)
      return length
    }

    get root() { return this._root }
    get long() { return this._long }
    get spot() { return this._root.sum(this._long) }

    set_long(
      long, // Point
    ) {
      const {_idx,state,_root,_length,_key} = this
      const _long = state.set(long.unit.strip(_length), _idx, '_long')
      if (_key) _key.set_root(_root.sum(_long))
      return _long
    }

    set_root(
      root, // Point
    ) {
      const {_idx,state,_long,_key} = this
      const _root = state.set(root, _idx, '_root')
      if (_key) _key.set_root(_root.sum(_long))
      return _root
    }

    get key() { return this._key }
    set_key(
      key, // Key,Null
    ) {
      const {_idx,state,_key} = this
      if (_key == key) return _key
      if (_key && _key.lock == this) {
        this._key = null // UNRECORDED MODIFICATION: this is ok...
        _key.set_lock(null)
      }
      if (key) {
        state.get(key.idx, _idx, '_key') // ...because of this
        key.set_lock(this)
      }
      else state.set(null, _idx, '_key') // ...and this
      this.set_is_open()
      return key
    }

    get is_open() {
      const {_key} = this
      return _key ? _key.is_open : false
    }
    set_is_open() {
      const {_parent,is_open} = this
      _parent.set_is_open(is_open)
      return is_open
    }

    static init(
      parent, // Door,Jack
      name, // String
    ) {
      const {level,[name]:lock} = parent, {long_min} = this
      if (lock) lock.remove()
      const _lock = super.init(level), {_idx} = _lock
      state.get(parent.idx, _lock, '_parent')
      state.set(long_min, _idx, '_length')
      state.set(false, '_idx', '_is_open')
      parent.set_lock(_lock, name)
      return state.get(_idx, '_locks', _idx)
    }
    expand(
      state, // State
    ) {
      const {_idx,_length,_root,_long,_is_open,_parent,_key,} = this
      const _lock = super.expand(state, _idx)
      state.set(_length,_idx,'_length')
      state.set(_root,_idx,'_root')
      state.set(_long,_idx,'_long')
      Type.expand(_parent, state, _idx, '_parent')
      Type.expand(_key, state, _idx, '_key')
      Type.expand(_lock, state, '_locks', _idx)
      return _lock
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, _name, state, _key, _parent} = this

      if (_key && _key.lock == this) {
        this._key = null // UNRECORDED MODIFICATION: this is ok...
        _key.remove() // ...because of this
      }
      if (_parent[_name] == this) {
        this._parent = null // UNRECORDED MODIFICATION: this is ok...
        _parent.set_lock(null, _name)
      }
      state.set(null, '_locks', _idx)
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
      const {_idx,state} = _laser
      return state.get(_idx, '_lasers', _idx)
    }
    expand(
      state, // State
    ) {
      const {_idx} = this, _laser = super.expand(state, _idx)
      Type.expand(_laser, state, '_lasers', _idx)
      return _laser
    }

    remove() {
      if (!super.remove()) return false
      const {_idx,state} = this
      state.set(null, '_lasers', _idx)
      return true
    }
  }
  MazeGame.Laser = Laser

  class Wall extends Target {
    static key_bind = 'w'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static long_max = Infinity
    static short_min = 2
    static short_max = 2
    static default_long_open = 0
    static short_sign = false
    static is_portal = false

    get long() { return this._long }
    get short() { return this._short }
    get spot() { return this._spot }

    set_long(
      long, // Point
    ) {
      const {_idx, state, _root} = this, {time} = state
      const {
        short_min,short_max,short_round,
        long_min,long_max,long_round,
        short_sign,
      } = this.constructor

      const _long = long.long.cramp(long_min,long_max,long_round)
      const _short = long.short.cramp(short_min,short_max,short_round)
      let _spot = _root.sum(_long)
      if (short_sign) _spot.sum(_short)
      state.set(_long, _idx, '_long')
      state.set(_short, _idx, '_short')
      state.set(_spot, _idx, '_spot')
      return long
    }

    get root() { return this._root }
    set_root(
      root, // Point
    ) {
      const {_idx, state, _long, _short} = this, {time} = state
      const {short_sign,root_round,long_min,short_min} = this.constructor
      const _root = root.at(time).round(root_round)
      state.set(_root, _idx, '_root')
      if (_long) {
        let _spot = _root.sum(_long)
        if (short_sign) _spot = _spot.sum(_short)
        state.set(_spot, _idx, '_spot')
      }
      else this.set_long(Point.simple(long_min,short_min,1))
      return _root
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _wall = super.init(level)
      const {_idx, state} = _wall
      _wall.set_root(root)
      state.get(_idx, '_walls', _idx)
      return _wall
    }
    expand(
      state, // State
    ) {
      const {_idx,_long,_short,_root,_spot} = this
      _wall = super.expand(state, _idx)
      state.set(_long, _idx, '_long')
      state.set(_short, _idx, '_short')
      state.set(_root, _idx, '_root')
      state.set(_spot, _idx, '_spot')
      Type.expand(_wall, state, '_walls', _idx)
      return _wall
    }

    remove() {
      if (!this.remove()) return false
      const {_idx, state} = this
      state.set(null, '_walls', _idx)
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

    static lock_names = ['_root_short','_root_long','_spot_long','_spot_short']
    reroot_lock(
      name, // String
    ) {
      const {state, [name]:_lock,_root,_spot,_long,_short} = this
      if (!_lock) return
      const {length} = _lock
      let root,long

      switch (name) {
        case '_root_short':
          root = _short.div(2).sum(_root)
          long = _long.strip(-length)
          break
        case '_root_long':
          root = _long.strip(_short.scale/2).sum(_root)
          long = _short.strip(-length)
          break
        case '_spot_long':
          root = _long.strip(-_short.scale/2).sum(_spot)
          long = _short.strip(length)
          break
        case '_spot_short':
          root = _short.div(-2).sum(_spot)
          long = _long.strip(length)
          break
        default: return
      }
      state.set(long, _lock.idx, '_long')
      return _lock.set_root(root)
    }

    set_root(
      root, // Point
    ) {
      const _root = super.set_root(root)
      const {lock_names} = this.constructor
      for (const i in lock_names) this.reroot_lock(lock_names[i])
      return _root
    }

    set_is_open(
      is_open, // Boolean
    ) {
      if (!is_open) return super.set_is_open(false)
      const {lock_names} = this.constructor
      for (const i in lock_names) {
        const lock = this[lock_names[i]]
        if (lock && !lock.is_open) return super.set_is_open(false)
      }
      return super.set_is_open(true)
    }

    set_lock(
      lock, // Lock,Null
      name, // String
    ) {
      const {_idx,state,[name]:_lock} = this
      if (_lock == lock) return _lock
      if (_lock && _lock.parent == this) {
        this[name] = null // UNRECORDED MODIFICATION: this is ok
        _lock.remove()
      }
      if (lock) {
        state.get(lock.idx, _idx, name) // ...because of this
        this.reroot_lock(name)
      }
      else state.set(null, _idx, name) // ...or this
      this.set_is_open(!lock)
      return lock
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _door = super.init(level,root)
      const {_idx, state} = _door
      _door.set_is_open(true)
      state.get(_idx, '_doors', _idx)
      return _door
    }
    expand(
      state, // State
    ) {
      const {_idx,_is_open,constructor:{lock_names}} = this
      _door = super.expand(state, _idx)
      state.set(_is_open,_idx,'_is_open')
      for (const i in lock_names) {
        const name = lock_names[i]
        Type.expand(this[name], state, _idx, name)
      }
      Type.expand(_door, state, '_doors', _idx)
      return _door
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, state, constructor:{lock_names}} = this
      for (const i in lock_names) this.set(null, lock_names[i])
      state.set(null, '_doors', _idx)
      return true
    }
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
    static lock_names = ['_lock_root','_lock_cent','_lock_spot',]

    reroot_lock(
      name, // String
    ) {
      const {state, [name]:_lock,_root,_spot,_long,_short} = this
      if (!_lock) return
      const {length} = _lock
      state.set(_short.strip(-length), _lock.idx, '_long')
      switch (name) {
        case '_lock_root':
          return _lock.set_root(_root.sum(_long.div(4)))
        case '_lock_cent':
          return _lock.set_root(_root.sum(_long.div(2)))
        case '_lock_spot':
          return _lock.set_root(_root.sum(_long.mul(3/4)))
        default: return
      }
    }

    get is_open() {
      const {state,_is_open} = this
      if (!_is_open) return false
      const {portals} = state.child
      let count = 0
      for (const idx in portals) if (portals[idx]._is_open) ++count
      return count == 2
    }

    static init(
      level, // Level
      root, // Point
    ) {
      const _portal = super.init(level,root)
      const {_idx, state} = _portal
      state.get(_idx, '_portals', _idx)
      return _portal
    }
    expand(
      state, // State
    ) {
      const {_idx} = this, _portal = super.expand(state, _idx)
      Type.expand(_portal, state, '_portals', _idx)
      return _portal
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, state} = this
      state.set(null, '_portals', _idx)
      return true
    }
  }
  MazeGame.Portal = Portal

  class Key extends Target {
    static key_bind = 'k'
    static radius = 1.5
    static center_radius = Lock.radius
    static search_radius = this.radius

    get lock() { return this._lock }
    set_lock(
      lock, // Lock,Null
    ) {
      const {_idx,state,_lock} = this
      if (_lock == lock) return _lock
      if (_lock && _lock.key == this) {
        this._lock = null // UNRECORDED MODIFICATION: this is ok...
        _lock.set_key(null)
      }
      if (lock) {
        state.get(lock.idx, _idx, '_key') // ...because of this
        lock.set_lock(this)
      }
      else state.set(null, _idx, '_key') // ...and this
      return lock
    }

    get root() { return this._root }
    set_root(
      root, // Point
    ) {
      const {_idx,state,_root} = this
      return state.set(root, _idx, '_root')
    }

    static init(
      level, // Level
      lock, // Lock,Null
      root, // Null,Point
    ) {
      const _key = super.init(level)
      const {_idx, state} = _key
      _key.set_is_open(true)
      if (lock) _key.set_lock(lock)
      else _key.set_root(root)
      state.get(_idx, '_keys', _idx)
      return _key
    }
    expand(
      state, // State
    ) {
      const {_idx,_is_open,_root,_lock,} = this
      _key = super.expand(state, _idx)
      state.set(_is_open,_idx,'_is_open')
      state.set(_root,_idx,'_root')
      Type.expand(_lock, state, _idx, '_lock')
      Type.expand(_key, state, '_keys', _idx)
      return _key
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, state} = this
      state.set(null, '_keys', _idx)
      return true
    }
  }
  MazeGame.Key = Key

  class Jack extends Key {
    static key_bind = 'j'
    static leg_radius = 2

    reroot_lock() {
      const {_idx,state,_root,_long,_nose} = this
      if (_nose) {
        state.set(_long.strip(_nose.length), _nose.idx, '_long')
        _nose.set_root(_root.sum(_long))
      }
    }

    get long() { return this._long }
    set_long(
      long, // Point
    ) {
      const {_idx,state,constructor:{radius}} = this
      const _long = state.set(long.unit.strip(radius), _idx, '_long')
      this.reroot_lock()
      return _long
    }
    set_root(
      root, // Point
    ) {
      const {_idx,state,_long,_nose} = this
      const _root = super.set_root(root)
      if (_nose) _nose.set_root(_root.sum(_long))
      return _root
    }

    get nose() { return this._nose }
    set_lock(
      nose, // Lock,Null
    ) {
      const {_idx,state,_nose,_root,_long} = this
      if (_nose == nose) return _nose
      if (_nose) {
        this._nose = null // UNRECORDED MODIFICATION: this is ok...
        _nose.remove()
      }
      if (nose) {
        state.get(nose.idx, _idx, '_nose') // ...because of this
      }
      else state.set(null, _idx, '_nose') // ...or this
      this.reroot_lock()
    }

    set_editor(
      editor, // Editor,Null
    ) {
      const _editor = super.set_editor(editor)
      super.set_is_open(!_editor)
      return _editor
    }
    set_is_open() { super.set_is_open(!this.editor) }

    static init(
      level, // Level
      lock, // Lock,Null
      root, // Null,Point
    ) {
      const _jack = super.init(level,lock,root)
      const {_idx, state} = _jack, {radius} = this
      state.set(Point.simple(1,0,radius), _idx, '_long')
      Lock.init(_jack, '_nose')
      state.get(_idx, '_jacks', _idx)
      return _jack
    }
    expand(
      state, // State
    ) {
      const {_idx,_long,_nose} = this
      _jack = super.expand(state, _idx)
      state.set(_long,_idx,'_long')
      Type.expand(_nose, state, _idx, '_nose')
      Type.expand(_jack, state, '_jacks', _idx)
      return _jack
    }

    remove() {
      if (!super.remove()) return false
      const {_idx, state, _nose} = this
      if (_nose) {
        this._nose = null // UNRECORDED MODIFICATION: this is ok...
        _nose.remove()
      }
      state.set(null, '_jacks', _idx)
      return true
    }
  }
  MazeGame.Jack = Jack

  return MazeGame
}
