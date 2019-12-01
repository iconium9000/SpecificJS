module.exports = (project_name, Lib) => class MazeGame {
  static get MazeGame() { return this }

  static Float = class extends MazeGame {

    get _time() {
      const {__sync,__time} = this
      return __sync ? __sync.temp_state.time : __time
    }
    get _f() { return this._tf * this._time + this._sf }
    get f() { return this._f }
    get sf() { return this._sf}
    get tf() { return this._tf}
    get abs() { return Math.abs(this._f) }

    equals(
      {sf,tf}, // MazeGame.Float
    ) {
      const {_sf,_tf} = this
      return sf == _sf && tf == _tf
    }

    static get zero() {
      const _float = new this
      _float._sf = _float._tf = _float.__time = 0
      return _float
    }

    static simple(
      f, // Number
    ) {
      const _float = new this
      _float._sf = f; _float._tf = _float.__time = 0
      return _float
    }
    static init(
      sf,tf,time, // Number
    ) {
      const _float = new this
      _float._sf = sf; _float._tf = tf; _float.__time = time
      return _float
    }
    at(
      time, // Number
    ) {
      const {_sf,_tf,constructor} = this
      return constructor.init( _sf, _tf, time)
    }
    get flatten() {
      const {_f} = this
      return MazeGame.Float.simple(_f)
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
      state, // MazeGame.State,Null
    ) {
      return this.init(sf||0,tf||0,state?state.time:0)
    }
    get syncable() { return true }
    sync(
      sync, // MazeGame.State.Sync
    ) {
      const {_sf,_tf,constructor} = this
      const _float = new constructor
      _float._sf = _sf; _float._tf = _tf; _float.__sync = sync
      return _float
    }
    get expandable() { return true }
    expand(
      state, // MazeGame.State
      ...path // String
    ) {
      return state.set(this, ...path)
    }

    sum(
      {sf,tf,time}, // MazeGame.Float
    ) {
      const {_sf,_tf,_time} = this
      return MazeGame.Float.init( _sf+sf, _tf+tf, _time )
    }
    sub(
      {sf,tf,time}, // MazeGame.Float
    ) {
      const {_sf,_tf,_time} = this
      return MazeGame.Float.init( _sf-sf, _tf-tf, _time )
    }
    mul(
      mul, // Number
    ) {
      const {_sf,_tf,_time} = this
      return MazeGame.Float.init( _sf*mul, _tf*mul, _time)
    }
    div(
      div, // Number
    ) {
      const {_sf,_tf,_time} = this
      return MazeGame.Float.init( _sf/div, _tf/div, _time)
    }
    lerp(
      {f,time}, // MazeGame.Float
    ) {
      const {_f,_time} = this, t = (f-_f) / (time - _time)
      // f: _f + (f - _f) ( TIME - _time) / (time - _time)
      // f: _f - (f-_f) _time / (time-_time) + TIME (f-_f) / (time - _time)
      return MazeGame.Float.init( _f - _time*t, t, _time )
    }
  }

  static Point = class extends MazeGame {

    get _time() {
      const {__sync,__time} = this
      return __sync ? __sync.temp_state.time : __time
    }
    get _x() { return (this._sx + this._tx*this._time)*this._scale }
    get _y() { return (this._sy + this._ty*this._time)*this._scale }

    get x() { return this._x }
    get y() { return this._y }
    get sx() { return this._sx }
    get sy() { return this._sy }
    get scale() { return this._scale }
    get tx() { return this._tx }
    get ty() { return this._ty }
    get abs_x () { return Math.abs(this._x) }
    get abs_y () { return Math.abs(this._y) }

    set moveTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.moveTo(this._x, this._y)
    }
    set lineTo(
      ctx, // CanvasRenderingContext2D
    ) {
      ctx.lineTo(this._x, this._y)
    }

    equals(
      {sx,sy,scale,tx,ty}, // MazeGame.Float
    ) {
      const {_sx,_sy,_scale,_tx,_ty} = this
      return sx==_sx && sy==_sy && scale==_scale && tx==_tx && ty==_ty
    }

    // returns the time of intersection after time
    // lines: [p1,p2], [p3,p4]
    static intersect(
      p1,p2,p3,p4, // MazeGame.Point
      time, // Number
    ) {
      const s1=p1.scale,t11=p1.tx*s1,t12=p1.ty*s1,s11=p1.sx*s1,s12=p1.sy*s1
      const s2=p2.scale,t21=p2.tx*s2,t22=p2.ty*s2,s21=p2.sx*s2,s22=p2.sy*s2
      const s3=p3.scale,t31=p3.tx*s3,t32=p3.ty*s3,s31=p3.sx*s3,s32=p3.sy*s3
      const s4=p4.scale,t41=p4.tx*s4,t42=p4.ty*s4,s41=p4.sx*s4,s42=p4.sy*s4
      const t51=t21-t11,t52=t22-t12,s51=s21-s11,s52=s22-s12
      const t61=t41-t31,t62=t42-t32,s61=s41-s31,s62=s42-s32
      const w12=t12*t61+t31*t62-t32*t61-t11*t62
      const w11=t12*s61+t61*s12+t31*s62+t62*s31-t61*s32-t32*s61-t11*s62-t62*s11
      const w10=s12*s61+s31*s62-s32*s61-s11*s62
      const w22=t12*t51+t31*t52-t32*t51-t11*t52
      const w21=t12*s51+t51*s12+t31*s52+t52*s31-t32*s51-t51*s32-t11*s52-t52*s11
      const w20=s12*s51+s31*s52-s32*s51-s11*s52
      const w32=t51*t62-t52*t61
      const w31=t51*s62+t62*s51-t52*s61-t61*s52
      const w30=s51*s62-s52*s61
      const w42=w32-w12,w41=w31-w11,w40=w30-w10
      const w52=w32-w22,w51=w31-w21,w50=w30-w20
      const w = [w12,w11,w10,w22,w21,w20,w32,w31,w30,w42,w41,w40,w52,w51,w50]

      const e = [[time,0]]
      for (let i = 0; i < w.length; i += 3) {
        const q0 = 1 + Math.floor(i/3) % 3
        const [w2,w1,w0] = w.slice(i)
        if (w2 == 0) { if (w1 != 0) e.push([-w0/w1, q0]) }
        else {
          const q1 = w1*w1 - 4*w2*w0
          if (q1 > 0) {
            const q2 = Math.sqrt(q1), q3 = w2*2
            e.push([(q2-w1)/q3,q0],[-(q2+w1)/q3,q0])
          }
        }
      }

      e.sort(([a],[b])=>a-b); const l = e.length; e.push([e[l-1][0]+1, 0])

      const f1 = t => w12*t*t + w11*t + w10
      const f2 = t => w22*t*t + w21*t + w20
      const f3 = t => w32*t*t + w31*t + w30
      let t0 = e[0][0], n3 = f3(t0), n1 = f1(t0)/n3, n2 = f2(t0)/n3
      for (let i = 0; i < l; ++i) {
        const [t0,q] = e[i], [t2] = e[i+1]
        if (t0 == t2) continue;
        if (q>0) {
          const t1 = (t0+t2)/2, n3 = f3(t1)
          if (q==1 || q==3) n1 = f1(t1)/n3
          if (q==2 || q==3) n2 = f2(t2)/n3
        }
        if (time<=t0 && 0<n1 && n1<1 && 0<n2 && n2<1) return t0
      }
      return Infinity
    }

    static get zero() {
      const _point = new this
      _point._sx = _point._sy = _point._scale = 0
      _point._tx = _point._ty = _point.__time = 0
      return _point
    }

    static simple(
      sx,sy,scale, // Number
    ) {
      const _point = new this
      _point._sx = sx; _point._sy = sy; _point._scale = scale
      _point._tx = _point._ty = _point.__time = 0
      return _point
    }

    static init(
      sx,sy,scale, // Number
      tx,ty,time, // Number
    ) {
      const _point = new this
      _point._sx = sx; _point._sy = sy; _point._scale = scale
      _point._tx = tx; _point._ty = ty; _point.__time = time
      return _point
    }

    at(
      time, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,constructor} = this
      return constructor.init(_sx,_sy,_scale,_tx,_ty,time)
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
      state, // MazeGame.State,Null
    ) {
      return this.init(sx||0,sy||0,scale||0,tx||0,ty||0,state?state.time:0)
    }
    get syncable() { return true }
    sync(
      sync, // MazeGame.State.Sync
    ) {
      const {_sx,_sy,_scale,_tx,_ty,constructor} = this
      const _point = new constructor
      _point._sx = _sx; _point._sy = _sy; _point._scale = _scale
      _point._tx = _tx; _point._ty = _ty; _point.__sync = sync
      return _point
    }
    get expandable() { return true }
    expand(
      state, // MazeGame.State
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
      return (
        length > 0 ?
        MazeGame.Point.simple(_x/length,_y/length,length) :
        MazeGame.Point.zero
      )
    }
    get invert() {
      const {_x,_y} = this
      return MazeGame.Point.simple(-_y, _x, 1)
    }
    get flatten() {
      const {_x,_y} = this
      return MazeGame.Point.simple(_x, _y, 1)
    }
    get long() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        MazeGame.Point.simple(0, y < -1 ? -1 : 1, abs_y) :
        MazeGame.Point.simple(x < -1 ? -1 : 1, 0, abs_x)
      )
    }
    get short() {
      const {x,y,abs_x,abs_y} = this
      return (
        abs_x < abs_y ?
        MazeGame.Point.simple(x < -1 ? -1 : 1, 0, abs_x) :
        MazeGame.Point.simple(0, y < -1 ? -1 : 1, abs_y)
      )
    }

    lerp(
      {x,y,time:t} // MazeGame.Point
    ) {
      const {_x,_y,_time:_t} = this, __t = t-_t, __x = x-_x, __y = y-_y
      return MazeGame.Point.init(_x*__t-_t*__x,_y*__t-_t*__y,1/__t,__x,__y,_t)
    }

    set(
      scale, // Number
    ) {
      const {_x, _y} = this
      return MazeGame.Point.simple(_x, _y, scale)
    }
    strip(
      scale, // Number
    ) {
      const {_sx,_sy} = this
      return MazeGame.Point.simple(_sx, _sy, scale)
    }
    atan2(
      {x,y}, // MazeGame.Point
    ) {
      const {_x,_y} = this
      return Math.atan2( y-_y, x-_x )
    }
    dot(
      {sx,sy,scale,tx,ty,}, // MazeGame.Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this, s = _scale*scale
      return MazeGame.Float.init(
        (_sx*sx + _sy*sy)*s, (_tx*tx + _ty*ty)*s, _time,
      )
    }

    sum(
      {sx,sy,scale,tx,ty,}, // MazeGame.Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this
      return MazeGame.Point.init(
        _sx*_scale+sx*scale, _sy*_scale+sy*scale, 1,
        _tx*_scale+tx*scale, _ty*_scale+ty*scale, _time,
      )
    }
    sub(
      {sx,sy,scale,tx,ty,}, // MazeGame.Point
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time,} = this
      return MazeGame.Point.init(
        _sx*_scale-sx*scale, _sy*_scale-sy*scale, 1,
        _tx*_scale-tx*scale, _ty*_scale-ty*scale, _time,
      )
    }
    // NOTE: assumes that this is flattened
    mul_float(
      {sf,tf,time}, // Float
    ) {
      const {_sx,_sy,_scale,constructor} = this
      return constructor.init(sf*_sx, sf*_sy, _scale, tf*_sx, tf*_sy, time)
    }
    mul(
      mul, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time} = this
      return MazeGame.Point.init(
        _sx, _sy, _scale * mul,
        _tx, _ty, _time,
      )
    }
    div(
      mul, // Number
    ) {
      const {_sx,_sy,_scale,_tx,_ty,_time} = this
      return MazeGame.Point.init(
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
        MazeGame.Point.simple(Math.round(_x/round), Math.round(_y/round), round) :
        MazeGame.Point.simple(_x, _y, 1)
      )
    }

    // NOTE: ignores tx,ty,time
    // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
    clamp(
      min,ceil, // Number
    ) {
      const {_sx,_sy,_scale} = this
      return MazeGame.Point.simple(
        _sx,_sy,
        _scale < min ? min : Math.ceil(_scale / ceil) * ceil
      )
    }

    // NOTE: ignores tx,ty,time
    // NOTE: assumes that sx*sx+sy*sy == 1 && _scale > 0
    cramp(
      min,max,round, // MazeGame.Float
    ) {
      const {_sx,_sy,_scale} = this
      return MazeGame.Point.simple(_sx,_sy,
        _scale < min ? min : max < _scale ? max :
        0 < round ? Math.ceil(_scale / round) * round : _scale
      )
    }

  }

  static State = class extends MazeGame {
    // __sync: MazeGame.State.Sync
    // _array: [{'get','new','set'}, {Object,Null}, ...String][]
    // _length: Number
    // _parent: MazeGame.State,Null

    static Sync = class {
      // state: MazeGame.State,Null
      // length: Number,Null
      // child: Object,Null
      // temp_state: MazeGame.State
    }

    get serializable() { return true }
    _serialize(
      length, // Number
    ) {
      const {_id,_length,_time,_array,_parent,constructor:{name}} = this
      if (_array.length) {
        const _serialize = {time:_time,_constructor:name}
        if (_parent) _serialize.parent = (
          _id == null ? _parent._serialize(_length) : _parent._id
        )
        if (_id != null) _serialize.id = _id
        if (_length >= 0) _serialize.length = _length

        _serialize.array = []
        for (const i in _array) {
          const [tok, value, ...path] = _array[i]
          _serialize.array.push([ tok, MazeGame.serialize(value), ...path ])
        }
        return _serialize
      }
      else if (_parent) return _parent._serialize(_length)
      else return null
    }
    get serialize() {
      return this._serialize(this._array._length)
    }
    get to_string() {
      return JSON.stringify(this._serialize(this._array.length), null, '  ')
    }
    static readable() { return true }
    static read(
      {time,array,parent,length,id}, // Object
      state, // MazeGame.State,Null
    ) {

      const _state = this.init(
        time, state ? state._child[parent] :
        parent ? this.read(parent) : null
      )
      _state._id = id
      _state._length = length

      const {__sync,_array} = _state
      __sync.temp_state = _state

      let idx = 0
      if (idx < array.length) {
        __sync.state = _state
        __sync.length = array.length
        do {
          const {child} = __sync, [tok, value, ...path] = array[idx]
          const _value = MazeGame.set(__sync, MazeGame.sync(
            tok == 'new' ? new MazeGame[value] :
            tok == 'get' ? child == null ? null : child[value] :
            tok == 'set' ? MazeGame.read(value, _state) : null, __sync
          ),'child', ...path)
          _array.push([ tok, tok == 'set' ? _value : value, ...path ])
        }
        while (++idx < array.length)
      }
      return _state
    }

    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_parent} = this
      if (_parent) _parent.expand(state)
      state.set(this, _id)
      return this
    }

    static init(
      time, // Number
      parent, // MazeGame.State,Null
    ) {
      const _state = new this
      _state._time = time
      _state._array = []
      if (parent) {
        _state._parent = parent
        _state._length = parent._array.length
      }
      _state._build(0)
      return _state
    }

    // DANGER: assumes that this is in sync
    get _child() {
      return this.__sync.child
    }
    get child() {
      this._build(this._array.length)
      return this.__sync.child
    }

    static build_count = 0
    _build(
      length, // Number
    ) {
      const {_parent,_array,_length} = this
      ++MazeGame.State.build_count

      let idx = 0, sync = this.__sync
      if (!sync || sync.state != this || sync.length > length) {
        sync = _parent ? _parent._build(_length) : new MazeGame.State.Sync
      }
      else idx = sync.length == length ? length : sync.length
      this.__sync = sync
      sync.temp_state = this

      if (idx < length) {
        sync.state = this
        sync.length = length
        do {
          const {child} = sync, [tok, value, ...path] = _array[idx]
          MazeGame.set(sync, MazeGame.sync(
            tok == 'new' ? new MazeGame[value] :
            tok == 'get' ? child == null ? null : child[value] :
            tok == 'set' ? value : null, sync
          ), 'child', ...path)
        }
        while (++idx < length)
      }
      return sync
    }

    at(
      time, // Number
    ) {
      const {_time,_parent} = this
      return (
        time < _time ?
        _parent ? _parent.at(time) : MazeGame.State.init(time) :
        MazeGame.State.init(time, this)
      )
    }

    get parent() { return this._parent } // MazeGame.State,Null

    get flatten() {
      const {time,child,constructor} = this
      const _state = constructor.init(time)
      MazeGame.expand(child, _state)
      return _state
    }

    // DANGER: assumes that this is in sync
    _set(
      tok, // String
      real_value, // Object,Null
      value, // Object,Null
      ...path // String
    ) {
      const {__sync,_array} = this; __sync.state = this
      const _real_value = MazeGame.sync(real_value,__sync)
      MazeGame.set(__sync, _real_value, 'child', ...path)
      __sync.length = _array.push([tok, value, ...path])
      return _real_value
    }

    // DANGER: assumes that this is in sync
    set(
      value, // Object,Null
      ...path // String
    ) {
      return this._set('set', value, value, ...path)
    }

    // DANGER: assumes that this is in sync
    get(
      label, // String
      ...path // String
    ) {
      const {child} = this.__sync
      return this._set(
        'get', child == null ? null : child[label], label, ...path,
      )
    }

    // DANGER: assumes that this is in sync
    // DANGER: assumes that MazeGame[constructor.name] == constructor
    new(
      constructor, // Function
      ...path
    ) {
      return this._set( 'new', new constructor, constructor.name, ...path )
    }
  }

  static Game = class extends MazeGame {

    get tally() {
      const {state, _tally} = this
      return state.set(_tally+1, '_tally')
    }
    get editors() { return this._editors }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // MazeGame.LevelNode
    ) {
      const {state,_level_node} = this, {id} = level_node
      if (_level_node == level_node) return _level_node
      else return state.get(id, '_level_node')
    }

    get syncable() { return true }
    get state() { return this.__sync.temp_state }
    static init(
      time, // Number
    ) {
      const _state = MazeGame.State.init(time)
      const _game = _state.new(this)
      _state.set(0, '_tally')
      MazeGame.Level.init(_game)
      return _game
    }

    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_tally,_level_node,_editors,constructor} = this
      const _game = state.new(constructor)
      state.set(_tally, '_tally')
      for (const id in _editors) MazeGame.expand(_editors[id], state, id)
      MazeGame.expand(_level_node, state, '_level_node')
      return _game
    }

    at(
      time, // Number
    ) {
      return this.state.at(time)._child
    }

    _id_state(
      state, // MazeGame.State
    ) {
      if (state._id != null) return state._id
      state._id = state.constructor.name + this.tally
      if (state._parent) this._id_state(state._parent)
      this.state.set(state, state._id)
      return state._id
    }
  }

  static Editor = class extends MazeGame {

    get mode() { return MazeGame[this._mode] || MazeGame.Wall }
    set_mode(
      mode, // String
    ) {
      const {_id,state,_mode,_level_node} = this
      if (_level_node) {
        const _level = _level_node.level
        _level[_id].set_mode(mode)
        _level_node.set_level_state(_level.extend.state)
        return mode
      }
      else if (_mode == mode) return _mode
      else {
        this.set_target(null)
        return state.set(mode, _id, '_mode')
      }
    }

    get target() { return this._target }
    set_target(
      target, // MazeGame.Target,Null
    ) {
      const {_id,state,_target} = this
      if (_target == target) return _target
      if (_target) {
        this._target = null // UNRECORDED MODIFICATION: this is ok...
        _target.set_editor(null)
      }
      if (target) {
        state.get(target.id, _id, '_target') // ...because of this
        target.set_editor(this)
      }
      else state.set(null, _id, '_target') // ...or this
    }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // MazeGame.LevelNode,Null
    ) {
      const {_id,_name,state,_level_node,constructor} = this
      if (_level_node == level_node) return _level_node
      if (_level_node) {
        const _level = _level_node.level
        const _editor = _level[_id]
        if (_editor) {
          _editor.remove()
          _level_node.set_level_state(_level.extend.state)
        }
      }
      if (level_node) {
        state.get(level_node.id, _id, '_level_node')
        const _level = level_node.level
        constructor.init(_level.state, _id, _name)
        level_node.set_level_state(_level.extend.state)
      }
      else state.set(null, _id, '_level_node')
    }

    get idable() { return true }
    get syncable() { return true }
    get state() { return this.__sync.temp_state }
    static init(
      state, // MazeGame.State @ child:MazeGame.Game,MazeGame.Level
      id,name, // String
    ) {
      const {[id]:editor,level_node} = state.child
      if (editor) return editor

      const _editor = state.new(this, id)
      state.set(id, id, '_id')
      state.set(name, id, '_name')
      state.get(id, '_editors', id)
      _editor.set_level_node(level_node)
      return _editor
    }

    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_name,_level_node,_target,constructor} = this
      const _editor = state.new(constructor, _id)
      state.set(_id, _id, '_id')
      state.set(_name, _id, '_name')
      MazeGame.expand(_level_node, state, _id, '_level_node')
      MazeGame.expand(_target, state, _id, '_target')
      MazeGame.expand(_editor, state, '_editors', _id)
      return _editor
    }

    remove() {
      const {_id,state} = this
      if (!state.child[_id]) return false
      this.set_level_node(null)
      this.set_target(null)
      state.set(null,_id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      center,root,mouse, // MazeGame.Point (in drawspace)
    ) {
      const {_id,state,level_node} = this
      // in Game
      if (level_node) {
        const _level = level_node.level
        const _editor = _level[_id]
        _editor.draw(ctx,center,root,mouse)
      }
      // in Level
      else {
        const _scale = center.short.scale
        const _offset = center.sub(root)
        const {scale,stroke_color} = MazeGame.Target
        this.act_at(mouse.sub(_offset).div(_scale/scale))
        state._child.draw(ctx,_offset,_scale/scale)
      }
    }

    act_at(
      spot, // MazeGame.Point (in gamespace)
    ) {
      const {_id,mode,state,level_node} = this
      // in Game
      if (level_node) {
        const _level = level_node.level
        const _editor = _level[_id]
        if (_editor.act_at(spot)) {
          level_node.set_level_state(_level.extend.state)
          return true
        }
        else return false
      }
      // in Level
      else {
        return mode.act_at(this, spot)
      }
    }
  }

  static LevelNode = class extends MazeGame {

    get level() { return this._level_state.at(this.state.time)._child }
    get level_state() { return this._level_state.at(this.state.time) }

    set_level_state(
      level_state, // MazeGame.State @ child:MazeGame.Level
    ) {
      const {_id,state,_level_state} = this
      if (_level_state == level_state) return _level_state
      state._child._id_state(level_state)
      return state.get(level_state.id, _id, '_level_state')
    }
    set_prev(
      prev, // MazeGame.LevelNode,Null
    ) {
      const {_id,state,_prev} = this
      if (_prev == prev) return _prev
      else if (prev) {
        state.get(_prev.id, _id, '_prev')
        state.get(_id, _prev.id, '_next')
      }
      else state.set(null, _id, '_prev')
    }
    set_next(
      next, // MazeGame.LevelNode,Null
    ) {
      const {_id,state,_next} = this
      if (_next == next) return _next
      else if (next) {
        state.get(_next.id, _id, '_next')
        state.get(_id, _next.id, '_prev')
      }
      else state.set(null, _id, '_next')
    }

    get idable() { return true }
    get syncable() { return true }
    get state() { return this.__sync.temp_state }
    static init(
      game, // MazeGame.Game
      level, // MazeGame.Level
    ) {
      const {state,level_node} = game
      const _id = this.name + game.tally
      const _level_node = state.new(this, _id)
      state.set(_id, _id, '_id')
      _level_node.set_level_state(level.extend.state)

      if (level_node) _level_node.set_next(level_node.next_level)
      _level_node.set_prev(level_node)
      game.set_level_node(_level_node)

      return _level_node
    }

    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_prev,_next,_level_state,constructor} = this
      const _level_node = state.new(constructor, _id)
      state.set(_id, _id, '_id')
      MazeGame.expand(_level_state, state, _id, '_level_state')
      MazeGame.expand(_prev, state, _id, '_prev')
      MazeGame.expand(_next, state, _id, '_next')
      return _level_node
    }

    remove() {
      const {_id,state,_level_state,_prev,_next} = this
      const {editors,level_node,[_id]:_this} = state.child
      if (!_this) return false

      for (const id in editors) {
        const editor = editors[id]
        if (editor.level_node == this) editor.set_level_node(level_node)
      }

      state.set(null,_id)
      if (_prev) _prev.set_next(_next)
      else if (_next) _next.set_prev(_prev)
      return true
    }

  }

  static Level = class extends MazeGame {

    get open_portals() {
      const {_portals} = this, open_portals = []
      for (const i in _portals) {
        const portal = _portals[i]
        if (portal._is_open) open_portals.push(portals)
      }
      return open_portals.length == 2 ? open_portals : []
    }

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

    get syncable() { return true }
    get state() { return this.__sync.temp_state }
    static init(
      game, // MazeGame.Game
    ) {
      const {state} = game, {time} = state
      const _state = MazeGame.State.init(time)
      const _level = _state.new(this)
      _state.set(0, '_tally')
      MazeGame.LevelNode.init(game, _level)
      return _level
    }

    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_tally,_editors,_locks,_walls,_keys,constructor} = this
      const _level = state.new(constructor)
      state.set(_tally, '_tally')
      for (const id in _editors) MazeGame.expand(_editors[id], state, id)
      for (const id in _locks) MazeGame.expand(_locks[id], state, id)
      for (const id in _walls) MazeGame.expand(_walls[id], state, id)
      for (const id in _keys) MazeGame.expand(_keys[id], state, id)
      return _level
    }

    get extend() {
      const {state,_doors,_walls,_jacks} = this
      let min_time = Infinity

      for (const id in _doors) {
        const {extend,lines} = _doors[id]
        if (extend < min_time) min_time = extend
      }

      this.__lines = []
      for (const id in _walls) this.__lines.push(..._walls[id].lines)

      this.__open_portals = this.open_portals
      for (const id in _jacks) {
        const {extend} = _jacks[id]
        if (extend < min_time) min_time = extend
      }

      return min_time < Infinity ? state.at(min_time)._child.extend : this
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      const {_locks,_walls,_keys} = this
      for (const id in _locks) _locks[id].draw(ctx,offset,scale)
      for (const id in _keys) _keys[id].draw(ctx,offset,scale)

      const {thin_line_width,thin_stroke_color} = MazeGame.Target
      for (const id in _walls) {
        _walls[id].draw(ctx,offset,scale)

        ctx.lineWidth = thin_line_width * scale
        ctx.strokeStyle = thin_stroke_color
        const {lines} = _walls[id]
        for (const i in lines) {
          const [...sub] = lines[i]
          ctx.beginPath()
          for (const j in sub) sub[j].mul(scale).sum(offset).lineTo = ctx
          ctx.closePath()
          ctx.stroke()
        }
      }
    }
  }

  static Target = class extends MazeGame {
    static get key_bind() { return 'g' }
    static get fill_color() { return 'black' }
    static get stroke_color() { return 'white' }
    static get thin_stroke_color() { return '#505050' }
    static get line_width() { return 0.5 }
    static get scale() { return 40 }
    static get thin_line_width() { return this.line_width / 3 }
    static get speed() { return 2e-2 } // dist / time = speed

    is_parent(
      target, // Target
    ) {
      return target == this
    }

    get is_open() { return this._is_open }
    set_is_open(
      is_open, // Boolean
    ) {
      const {_id,state,_is_open} = this
      if (_is_open == is_open) return _is_open
      return state.set(is_open, _id, '_is_open')
    }
    get level() { return this.state.child }
    get editor() { return this._editor }
    set_editor(
      editor, // MazeGame.Editor,Null
    ) {
      const {_id,state,_editor} = this
      if (_editor == editor) return _editor
      if (_editor) {
        state.set(null, _id, '_editor')
        _editor.set_target(null)
      }
      if (editor) {
        state.get(editor.id, _id, '_editor')
        editor.set_target(this)
        return editor
      }
      else return state.set(null, _id, '_editor')
    }

    static act_at(
      editor, // MazeGame.Editor
      spot, // MazeGame.Point
    ) {
      const level = editor.state._child
      const closest_lock = MazeGame.Lock.get_closest(level.locks, spot)
      const closest_key = (closest_lock && closest_lock.key) || (
        MazeGame.Key.get_closest(level.keys, spot)
      )

      if (closest_key && closest_key.is_jack) {
        const jack = closest_key
        editor.set_target(jack)
        jack.set_long(spot.sub(jack.root))
        return true
      }

      const jack = editor.target
      if (!jack) return false

      const _spot = (
        closest_key ? closest_key.root :
        closest_lock ? closest_lock.spot : spot
      )

      const sub = spot.sub(jack.root)
      jack.set_long(sub)

      if (jack.nose.key && sub.length < jack.nose_length) {
        jack.nose.set_key(null)
      }
      else jack.set_spot(_spot)

      return true
    }

    get idable() { return true }
    get syncable() { return true }
    get state() { return this.__sync.temp_state }
    static init(
      level, // MazeGame.Level
      name, // String,Null
    ) {
      const {state} = level
      const _id = (name || this.name) + level.tally
      const _target = state.new(this, _id)
      state.set(_id,_id,'_id')
      return _target
    }
    get expandable() { return true }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,constructor} = this
      const _target = state.new(constructor, _id)
      state.set(_id,_id,'_id')
      return _target
    }

    remove() {
      const {_id,state} = this
      if (!state.child[_id]) return false
      state.set(null,_id)
      return true
    }
  }

  static Lock = class extends MazeGame.Target {
    static get key_bind() { return 'l' }
    static get long_min() { return 3 }
    static get long_max() { return 3 }
    static get long_round() { return 3 }
    static get radius() { return 0.5 }
    static get search_radius() { return 3 * this.radius }

    get length() { return this.long.scale + (this.key ? this.key.length : 0)}

    static get_closest(
      locks, // MazeGame.Lock{}
      spot, // MazeGame.Point
    ) {
      let min_dist = Infinity, return_lock = null
      for (const label in locks) {
        const lock = locks[label], {search_radius} = lock.constructor
        const _dist = lock.spot.sub(spot).length
        if (_dist < min_dist && _dist < search_radius) {
          return_lock = lock
          min_dist = _dist
        }
      }
      return return_lock
    }

    get parent() { return this._parent }
    is_parent(
      target, // Target
    ) {
      const {_parent} = this
      return target == this || (_parent && _parent.is_parent(target))
    }

    get length() { return this._length }
    set_length(
      length, // Number
    ) {
      const {long_min,long_max,long_round} = this.constructor
      const {_id,state,_long,_length} = this
      length = (
        length<long_min ? long_min :
        length<long_max ? Math.round(length/long_round)*long_round :
        long_max
      )
      if (_length == length) return _length
      state.set(length, _id, '_length')
      if (_long) this.set_long(_long)
      return length
    }

    get root() { return this._root }
    get long() { return this._long }
    get spot() { return this._root.sum(this._long) }

    set_long(
      long, // MazeGame.Point
    ) {
      const {_id,state,_root,_length,_key} = this
      const _long = state.set(long.unit.strip(_length).unit, _id, '_long')
      if (_key) _key.set_root(_root.sum(_long))
      return _long
    }

    set_root(
      root, // MazeGame.Point
    ) {
      const {_id,state,_root,_long,_key} = this
      if (_root && root.equals(_root)) return _root
      root = state.set(root, _id, '_root')
      if (_key) _key.set_root(root.sum(_long))
      return root
    }

    get key() { return this._key }
    set_key(
      key, // MazeGame.Key,Null
    ) {
      const {_id,state,_key} = this
      if (_key == key) return _key
      if (_key && _key.lock == this) {
        this._key = null // UNRECORDED MODIFICATION: this is ok...
        _key.set_lock(null)
      }
      if (key) {
        state.get(key.id, _id, '_key') // ...because of this
        key.set_lock(this)
      }
      else state.set(null, _id, '_key') // ...and this
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

    static act_at(
      editor, // MazeGame.Editor
      spot, // MazeGame.Point (in gamespace)
    ) {
      const level = editor.state._child

      if (editor.target) {
        const lock = editor.target, {_root,_long} = lock
        editor.set_target(null)
        lock.set_length(spot.sub(_root).dot(_long.strip(1)).f)
        return true
      }

      const closest_lock = this.get_closest(level.locks, spot)
      if (closest_lock) {
        editor.set_target(closest_lock)
        return true
      }

      const closest_door = MazeGame.Door.get_closest(level.doors, spot)
      if (closest_door) {
        const {lock_names} = closest_door.constructor
        const lock_name = lock_names[
          Math.floor(closest_door.__long_dot * lock_names.length)
        ]
        if (!lock_name) return false
        else if (closest_door[lock_name]) {
          editor.set_target(closest_door[lock_name])
          return true
        }

        const _lock = this.init(closest_door, lock_name)
        if (this.long_max > this.long_min) editor.set_target(_lock)
        return true
      }

    }

    static init(
      parent, // MazeGame.Door,MazeGame.Jack
      name, // String
    ) {
      const {id,level,[name]:lock} = parent, {long_min} = this
      if (lock) lock.remove()
      const _lock = super.init(level,id + name), {_id,state} = _lock
      state.get(id, _id, '_parent')
      state.set(long_min, _id, '_length')
      state.set(false, _id, '_is_open')
      parent.set_lock(_lock, name)
      return state.get(_id, '_locks', _id)
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_length,_root,_long,_is_open,_parent,_key,} = this
      const _lock = super.expand(state, _id)
      state.set(_length,_id,'_length')
      state.set(_root,_id,'_root')
      state.set(_long,_id,'_long')
      MazeGame.expand(_parent, state, _id, '_parent')
      MazeGame.expand(_key, state, _id, '_key')
      MazeGame.expand(_lock, state, '_locks', _id)
      return _lock
    }

    remove() {
      if (!super.remove()) return false
      const {_id, _name, state, _key, _parent} = this

      if (_key && _key.lock == this) {
        this._key = null // UNRECORDED MODIFICATION: this is ok...
        _key.remove() // ...because of this
      }
      if (_parent[_name] == this) {
        this._parent = null // UNRECORDED MODIFICATION: this is ok...
        _parent.set_lock(null, _name)
      }
      state.set(null, '_locks', _id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        stroke_color,fill_color,line_width,
        radius,
      } = this.constructor
      const {root,spot} = this, {pi2} = Lib
      const _root = root.mul(scale).sum(offset)
      const _spot = spot.mul(scale).sum(offset)
      const _radius = radius * scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineWidth = line_width * scale

      ctx.beginPath()
      _root.lineTo = ctx
      _spot.lineTo = ctx
      ctx.closePath()
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, _radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  static Laser = class extends MazeGame.Lock {
    static get key_bind() { return 's' }
    static get long_min() { return 9 }
    static get long_max() { return Infinity }

    static init(
      parent, // MazeGame.Door,MazeGame.Jack
      name, // String
    ) {
      const _laser = super.init(parent, name)
      const {_id,state} = _laser
      return state.get(_id, '_lasers', _id)
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id} = this, _laser = super.expand(state, _id)
      MazeGame.expand(_laser, state, '_lasers', _id)
      return _laser
    }

    remove() {
      if (!super.remove()) return false
      const {_id,state} = this
      state.set(null, '_lasers', _id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        stroke_color,fill_color,line_width,
        thin_line_width,thin_stroke_color,
        radius,
      } = this.constructor
      const {root,spot,long} = this, {pi2} = Lib
      const _root = root.mul(scale).sum(offset)
      const _spot = spot.mul(scale).sum(offset)
      const _radius = radius * scale
      const _long = long.strip(MazeGame.Lock.long_min * scale)
      const _root_long = _root.sum(_long)
      const _spot_long = _spot.sub(_long)

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.lineWidth = thin_line_width * scale
      ctx.strokeStyle = thin_stroke_color

      ctx.beginPath()
      _root_long.lineTo = ctx
      _spot_long.lineTo = ctx
      ctx.stroke()

      ctx.strokeStyle = stroke_color
      ctx.lineWidth = line_width * scale

      ctx.beginPath()
      _root.lineTo = ctx
      _root_long.lineTo = ctx
      ctx.stroke()

      ctx.beginPath()
      _spot_long.lineTo = ctx
      _spot.lineTo = ctx
      ctx.stroke()

      ctx.fillStyle = fill_color
      ctx.beginPath()
      ctx.arc(_spot.x, _spot.y, _radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  static Wall = class extends MazeGame.Target {
    static get key_bind() { return 'w' }
    static get root_round() { return 2 }
    static get long_round() { return 2 }
    static get long_min() { return 2 }
    static get long_max() { return Infinity }
    static get short_min() { return 2 }
    static get short_max() { return 2 }
    static get default_length() { return 0 }
    static get short_sign() { return false }
    static get is_portal() { return false }

    static get_closest(
      walls, // MazeGame.Wall{}
      spot, // MazeGame.Point
    ) {
      let min_dist = Infinity, return_wall = null
      for (const label in walls) {
        const wall = walls[label], {short_sign} = wall.constructor
        const {root,long,short} = wall, _sub = spot.sub(root)

        wall.__long_dot = long.strip(1).dot(_sub).f / long.scale
        let _short_dot = short.strip(1).dot(_sub).f
        if (!short_sign && _short_dot < 0) _short_dot = -_short_dot

        if (
          0 < wall.__long_dot && wall.__long_dot < 1 &&
          0 < _short_dot && _short_dot < short.scale && _short_dot < min_dist
        ) {
          return_wall = wall
          min_dist = _short_dot
        }
      }
      return return_wall
    }

    reroot_locks() {}

    get long() { return this._long }
    get short() { return this._short }
    get spot() { return this._spot }

    set_long(
      long, // MazeGame.Point
    ) {
      const {_id, state, _root} = this, {time} = state
      const {
        short_min,short_max,short_round,
        long_min,long_max,long_round,
        short_sign,
      } = this.constructor

      const _long = long.long.cramp(long_min,long_max,long_round)
      const _short = long.short.cramp(short_min,short_max,short_round)
      let _spot = _root.sum(_long)
      if (short_sign) _spot = _spot.sum(_short)
      state.set(_long, _id, '_long')
      state.set(_short, _id, '_short')
      state.set(_spot, _id, '_spot')
      return long
    }

    get root() { return this._root }
    set_root(
      root, // MazeGame.Point
    ) {
      const {_id, state, _root, _long, _short} = this, {time} = state
      const {short_sign,root_round,long_min,short_min} = this.constructor
      root = root.at(time).round(root_round)
      if (_root && root.equals(_root)) return _root
      state.set(root, _id, '_root')
      if (_long) {
        let spot = root.sum(_long)
        if (short_sign) spot = spot.sum(_short)
        state.set(spot, _id, '_spot')
      }
      else this.set_long(MazeGame.Point.simple(long_min,short_min,1))
      return root
    }

    static act_at(
      editor, // MazeGame.Editor
      spot, // MazeGame.Point (in gamespace)
    ) {
      const level = editor.state._child
      const closest_wall = this.get_closest(level.walls, spot)

      if (editor.target) {
        const wall = editor.target
        editor.set_target(null)
        wall.set_long(spot.sub(wall.root))
        wall.reroot_locks()
        return true
      }
      else if (closest_wall) {
        const {_root,_long,_spot,_short,__long_dot} = closest_wall

        if (__long_dot < 0.5) {
          const {_id, state} = closest_wall
          state.set(_spot,_id,'_root')
          state.set(_root,_id,'_spot')
          state.set(_long.mul(-1).long, _id, '_long')
          state.set(_short.mul(-1).long,_id,'_short')
          closest_wall.reroot_locks()
        }

        editor.set_target(closest_wall)
        return true
      }
      else {
        const _wall = this.init(level, spot)
        editor.set_target(_wall)
        return true
      }
    }

    static init(
      level, // MazeGame.Level
      root, // MazeGame.Point
    ) {
      const _wall = super.init(level)
      const {_id, state} = _wall
      _wall.set_root(root)
      state.get(_id, '_walls', _id)
      return _wall
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_long,_short,_root,_spot} = this
      const _wall = super.expand(state, _id)
      state.set(_long, _id, '_long')
      state.set(_short, _id, '_short')
      state.set(_root, _id, '_root')
      state.set(_spot, _id, '_spot')
      MazeGame.expand(_wall, state, '_walls', _id)
      return _wall
    }

    remove() {
      if (!this.remove()) return false
      const {_id, state} = this
      state.set(null, '_walls', _id)
      return true
    }

    // return (root,spot:MazeGame.Point)[]
    get lines() { return [[this.root, this.spot]] }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {line_width,stroke_color,} = this.constructor
      const {root,spot} = this
      const _root = root.mul(scale).sum(offset)
      const _spot = spot.mul(scale).sum(offset)

      ctx.lineWidth = line_width * scale
      ctx.strokeStyle = stroke_color

      ctx.beginPath()
      ctx.lineTo(_root.x, _root.y)
      ctx.lineTo(_spot.x, _spot.y)
      ctx.closePath()
      ctx.stroke()
    }

  }

  static Door = class extends MazeGame.Wall {
    static get key_bind() { return 'd' }
    static get root_round() { return 4 }
    static get long_min() { return 16 }
    static get long_round() { return 4 }
    static get short_min() { return 4 }
    static get short_max() { return 4 }
    static get short_sign() { return true }

    static get lock_names() {
      return ['_root_short','_root_long','_spot_long','_spot_short']
    }
    reroot_locks() {
      const {lock_names} = this.constructor
      for (const i in lock_names) this.reroot_lock(lock_names[i])
    }

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
          long = _long.strip(-length).unit
          break
        case '_root_long':
          root = _long.strip(_short.scale/2).sum(_root)
          long = _short.strip(-length).unit
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
      state.set(long, _lock.id, '_long')
      return _lock.set_root(root)
    }

    get length() { return this._length }
    set_length(
      length, // MazeGame.Float
    ) {
      const {_id,state,_length} = this
      if (_length && length.equals(_length)) return _length
      return state.set(length,_id,'_length')
    }

    set_root(
      root, // MazeGame.Point
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
      lock, // MazeGame.Lock,Null
      name, // String
    ) {
      const {_id,state,[name]:_lock} = this
      if (_lock == lock) return _lock
      if (_lock && _lock.parent == this) {
        this[name] = null // UNRECORDED MODIFICATION: this is ok
        _lock.remove()
      }
      if (lock) {
        state.get(lock.id, _id, name) // ...because of this
        this.reroot_lock(name)
      }
      else state.set(null, _id, name) // ...or this
      this.set_is_open(!lock)
      return lock
    }

    static init(
      level, // MazeGame.Level
      root, // MazeGame.Point
    ) {
      const _door = super.init(level,root)
      const {_id, state} = _door
      _door.set_is_open(true)
      _door.set_length(MazeGame.Float.zero)
      state.get(_id, '_doors', _id)
      return _door
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_is_open,_length,constructor:{lock_names}} = this
      _door = super.expand(state, _id)
      state.set(_is_open,_id,'_is_open')
      state.set(_length,_id,'_length')
      for (const i in lock_names) {
        const name = lock_names[i]
        MazeGame.expand(this[name], state, _id, name)
      }
      MazeGame.expand(_door, state, '_doors', _id)
      return _door
    }

    // return Number
    get extend() {
      const {state, is_open, length, long} = this
      const {speed} = this.constructor

      const target = is_open ? 0 : 1
      const _now = is_open ? length.f : 1 - length.f

      if (_now > 0) {
        const _time = _now * long.scale / speed + state.time
        const _lerp = length.lerp(MazeGame.Float.init(target,0,_time))
        this.set_length(_lerp)
        // console.log(_time-state.time)
        return _time
      }
      else if (length.tf) this.set_length(MazeGame.Float.simple(target))

      return Infinity
    }

    remove() {
      if (!super.remove()) return false
      const {_id, state, constructor:{lock_names}} = this
      for (const i in lock_names) this.set(null, lock_names[i])
      state.set(null, '_doors', _id)
      return true
    }

    // return MazeGame.Point[][]
    // return MazeGame.Point[][]
    get lines() {

      const {_root,_spot,_short,_long,_length} = this

      const _long_length = _long.mul_float(_length).div(2)
      const _long_short = _long.strip(_short.scale)
      const _root_short = _root.sum(_short)
      const _root_long = _root.sum(_long_short)
      const _spot_short = _spot.sub(_short)
      const _spot_long = _spot.sub(_long_short)

      return [
        [_root, _root_short, _root_long, _root],
        [_spot, _spot_short, _spot_long, _spot], [
          _root, _root.sum(_long_length), _root_short.sum(_long_length),
          _root_short,
        ], [
          _spot, _spot.sub(_long_length), _spot_short.sub(_long_length),
          _spot_short,
        ],
      ]
    }


    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        line_width,thin_line_width,
        stroke_color,fill_color,thin_stroke_color,
      } = this.constructor
      const {root,spot,long,short,length:{f:length}} = this

      const _root = root.mul(scale).sum(offset)
      const _spot = spot.mul(scale).sum(offset)
      const _long = long.mul(scale)
      const _short = short.mul(scale)

      const _line_width = line_width * scale
      const _thin_line_width = thin_line_width * scale

      ctx.lineWidth = _line_width
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color

      if (1 <= length) {
        const _mid_root = _long.div(2).sum(_root)
        const _mid_spot = _mid_root.sum(_short)

        ctx.beginPath()
        _root.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _mid_root.lineTo = ctx
        _mid_spot.lineTo = ctx
        ctx.closePath()
        ctx.stroke()
      }
      else if (0 < length) {
        const _length = _long.mul(length/2)

        ctx.lineWidth = _thin_line_width
        ctx.strokeStyle = thin_stroke_color
        ctx.beginPath()
        _root.sum(_length).lineTo = ctx
        _spot.sub(_length).sub(_short).lineTo = ctx
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _root.sum(_length).sum(_short).lineTo = ctx
        _spot.sub(_length).lineTo = ctx
        ctx.stroke()

        ctx.lineWidth = _line_width
        ctx.strokeStyle = stroke_color

        ctx.beginPath()
        _root.lineTo = ctx
        _root.sum(_length).lineTo = ctx
        _root.sum(_length).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.lineTo = ctx
        _spot.sub(_length).lineTo = ctx
        _spot.sub(_length).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
      else {
        ctx.lineWidth = _thin_line_width
        ctx.strokeStyle = thin_stroke_color

        ctx.beginPath()
        _root.lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _root.sum(_short).lineTo = ctx
        _spot.lineTo = ctx
        ctx.stroke()

        ctx.lineWidth = _line_width
        ctx.strokeStyle = stroke_color
      }

      ctx.beginPath()
      _root.lineTo = ctx
      _root.sum(_short).lineTo = ctx
      _root.sum(_long.strip(_short.scale)).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.lineCap = 'round'
      _spot.lineTo = ctx
      _spot.sub(_short).lineTo = ctx
      _spot.sub(_long.strip(_short.scale)).lineTo = ctx
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }

  }

  static Portal = class extends MazeGame.Door {
    static get key_bind() { return 'p' }
    static get short_min() { return 3 }
    static get short_max() { return this.short_min }
    static get long_min() { return 12 }
    static get long_max() { return this.long_min }
    static get short_mid() { return this.short_max / 2 }
    static get center_long() { return this.long_max / 2 }
    static get center_short() { return (
      this.short_max*this.short_max - this.short_mid*this.short_mid +
      this.long_max * this.long_max / 4
    ) / 2 / (this.short_max - this.short_mid)}
    static get radius() { return Math.sqrt(
      Math.pow(this.short_max - this.center_short, 2) +
      Math.pow(this.long_max - this.center_long, 2)
    )}
    static get lock_names() { return ['_lock_root','_lock_cent','_lock_spot',] }

    reroot_lock(
      name, // String
    ) {
      const {state, [name]:_lock,_root,_spot,_long,_short} = this
      if (!_lock) return
      const {length} = _lock
      state.set(_short.strip(-length).unit, _lock.id, '_long')
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
      for (const id in portals) if (portals[id]._is_open) ++count
      return count == 2
    }

    static init(
      level, // MazeGame.Level
      root, // MazeGame.Point
    ) {
      const _portal = super.init(level,root)
      const {_id, state} = _portal
      state.get(_id, '_portals', _id)
      return _portal
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id} = this, _portal = super.expand(state, _id)
      MazeGame.expand(_portal, state, '_portals', _id)
      return _portal
    }

    remove() {
      if (!super.remove()) return false
      const {_id, state} = this
      state.set(null, '_portals', _id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        line_width,thin_line_width,
        stroke_color,fill_color,thin_stroke_color,
        center_short, center_long, radius,
      } = this.constructor
      const {root,spot,long,short,length:{f:length}} = this
      const _root = root.mul(scale).sum(offset)
      const _spot = spot.mul(scale).sum(offset)
      const _long = long.mul(scale)
      const _short = short.mul(scale)

      const _radius = radius * scale
      const _center_short = center_short * scale
      const _center_long = center_long * scale
      const _center = (
        _root.sum(_short.strip(_center_short)).sum(_long.strip(_center_long))
      )
      const _angle_root = _center.atan2(_root.sum(_short))
      const _angle_spot = _center.atan2(_spot)

      const _line_width = line_width * scale
      const _thin_line_width = thin_line_width * scale

      ctx.lineWidth = _line_width
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      if (1 <= length) {
        const _mid_root = _long.div(2).sum(_root)
        const _mid_spot = _mid_root.sum(_short)

        ctx.beginPath()
        _root.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _mid_root.lineTo = ctx
        _mid_spot.lineTo = ctx
        ctx.closePath()
        ctx.stroke()
      }
      else if (0 < length) {
        const _length = _long.mul(length / 2)

        ctx.beginPath()
        _root.lineTo = ctx
        _root.sum(_length).lineTo = ctx
        _root.sum(_length).sum(_short).lineTo = ctx
        _root.sum(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.beginPath()
        _spot.lineTo = ctx
        _spot.sub(_length).lineTo = ctx
        _spot.sub(_length).sub(_short).lineTo = ctx
        _spot.sub(_short).lineTo = ctx
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      ctx.beginPath()
      if (
        (_long._sx + _short._sx) > 0 ^
        (_long._sy + _short._sy) > 0 ^
        _long._sx == 0
      ) {
        _root.sum(_short).lineTo = ctx
        _root.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _spot.lineTo = ctx
        ctx.arc( _center.x, _center.y, _radius, _angle_spot, _angle_root, )
      }
      else {
        ctx.arc( _center.x, _center.y, _radius, _angle_root, _angle_spot, )
        _spot.lineTo = ctx
        _root.sum(_long).lineTo = ctx
        _root.lineTo = ctx
        _root.sum(_short).lineTo = ctx
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }

  static Key = class extends MazeGame.Target {
    static get key_bind() { return 'k' }
    static get radius() { return 1.5 }
    static get center_radius() { return MazeGame.Lock.radius }
    static get search_radius() { return this.radius * 2 }

    get length() { return this.constructor.radius }

    static get_closest(
      keys, // MazeGame.Key{}
      spot, // MazeGame.Point
    ) {
      let min_dist = Infinity, return_key = null
      for (const label in keys) {
        const key = keys[label], {search_radius} = key.constructor
        const _dist = key.root.sub(spot).length
        if (_dist < min_dist && _dist < search_radius) {
          return_key = key
          min_dist = _dist
        }
      }
      return return_key
    }

    get lock() { return this._lock }
    set_lock(
      lock, // MazeGame.Lock,Null
    ) {
      const {_id,state,_lock} = this
      if (_lock == lock) return _lock
      if (_lock && _lock.key == this) {
        this._lock = null // UNRECORDED MODIFICATION: this is ok...
        _lock.set_key(null)
      }
      if (lock) {
        state.get(lock.id, _id, '_lock') // ...because of this
        this.set_root(lock.spot)
        lock.set_key(this)
      }
      else state.set(null, _id, '_lock') // ...and this
      return lock
    }

    get root() { return this._root }
    set_root(
      root, // MazeGame.Point
    ) {
      const {_id,state,_root} = this
      if (_root && root.equals(_root)) return _root
      return state.set(root, _id, '_root')
    }

    static act_at(
      editor, // MazeGame.Editor
      spot, // MazeGame.Point (in gamespace)
    ) {
      const level = editor.state._child
      const closest_lock = MazeGame.Lock.get_closest(level.locks, spot)

      const closest_key = (
        (closest_lock && closest_lock.key) ||
        this.get_closest(level.keys, spot)
      )
      if (closest_key && closest_key != editor.target) {
        editor.set_target(closest_key)
        closest_key.set_lock(null)
        return true
      }
      else if (editor.target) {
        const key = editor.target
        editor.set_target(null)
        if (closest_lock && !closest_lock.is_parent(key)){
           closest_lock.set_key(key)
        }
        else key.set_root(spot)
        return true
      }
      else {
        const _key = this.init(level, closest_lock, spot)
        return true
      }
    }

    static init(
      level, // MazeGame.Level
      lock, // MazeGame.Lock,Null
      root, // Null,MazeGame.Point
    ) {
      const _key = super.init(level)
      const {_id, state} = _key
      _key.set_is_open(true)
      if (lock) _key.set_lock(lock)
      else _key.set_root(root)
      state.get(_id, '_keys', _id)
      return _key
    }
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_is_open,_root,_lock,} = this
      const _key = super.expand(state, _id)
      state.set(_is_open,_id,'_is_open')
      state.set(_root,_id,'_root')
      MazeGame.expand(_lock, state, _id, '_lock')
      MazeGame.expand(_key, state, '_keys', _id)
      return _key
    }

    remove() {
      if (!super.remove()) return false
      const {_id, state} = this
      state.set(null, '_keys', _id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        stroke_color,fill_color,line_width,
        radius,center_radius,
      } = this.constructor
      const {root,is_open} = this, {pi2} = Lib
      const _root = root.mul(scale).sum(offset)
      const _radius = radius * scale
      const _center_radius = center_radius * scale

      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineWidth = line_width * scale

      ctx.beginPath()
      ctx.arc(_root.x, _root.y, _radius, 0, pi2)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      if (is_open) {
        ctx.fillStyle = stroke_color
        ctx.beginPath()
        ctx.arc(_root.x, _root.y, _center_radius, 0, pi2)
        ctx.closePath()
        ctx.fill()
      }
      else {
        ctx.beginPath()
        ctx.lineTo(_root.x+_center_radius, _root.y+_center_radius)
        ctx.lineTo(_root.x-_center_radius, _root.y-_center_radius)
        ctx.closePath()
        ctx.stroke()

        ctx.beginPath()
        ctx.lineTo(_root.x-_center_radius, _root.y+_center_radius)
        ctx.lineTo(_root.x+_center_radius, _root.y-_center_radius)
        ctx.closePath()
        ctx.stroke()
      }
    }
  }

  static Jack = class extends MazeGame.Key {
    static get key_bind() { return 'j' }
    static get leg_radius() { return 2 }
    get is_jack() { return true }

    get nose_length() {
      return this.long.scale + this.nose.length
    }

    is_parent(
      target, // Target
    ) {
      return target == this || (this._lock && this._lock.is_parent(target))
    }

    reroot_lock() {
      const {_id,state,_root,_long,_nose} = this
      if (_nose) {
        state.set(_long.strip(_nose.length), _nose.id, '_long')
        _nose.set_root(_root.sum(_long))
      }
    }

    get long() { return this._long }
    set_long(
      long, // MazeGame.Point
    ) {
      const {_id,state,constructor:{radius}} = this
      const _long = state.set(long.unit.strip(radius), _id, '_long')
      this.reroot_lock()
      return _long
    }
    set_root(
      root, // MazeGame.Point
    ) {
      const {_id,state,_long,_nose} = this
      const _root = super.set_root(root)
      if (_nose) _nose.set_root(_root.sum(_long))
      return _root
    }

    set_spot(
      spot, // MazeGame.Point
    ) {
      const {_id,state,_spot,_root} = this; spot = spot.flatten
      if (_spot && _spot.equals(spot)) return _spot
      return state.set(spot, _id, '_spot')
    }

    get nose() { return this._nose }
    set_lock(
      nose, // MazeGame.Lock,Null
      name, // String
    ) {
      if (name == undefined) return super.set_lock(nose)
      const {_id,state,_nose,_root,_long} = this
      if (_nose == nose) return _nose
      if (_nose) {
        this._nose = null // UNRECORDED MODIFICATION: this is ok...
        _nose.remove()
      }
      if (nose) {
        state.get(nose.id, _id, '_nose') // ...because of this
      }
      else state.set(null, _id, '_nose') // ...or this
      this.reroot_lock()
    }

    set_editor(
      editor, // MazeGame.Editor,Null
    ) {
      const _editor = super.set_editor(editor)
      super.set_is_open(!_editor)
      return _editor
    }
    set_is_open() { super.set_is_open(!this.editor) }

    static init(
      level, // MazeGame.Level
      lock, // MazeGame.Lock,Null
      root, // Null,MazeGame.Point
    ) {
      const _jack = super.init(level,lock,root)
      const {_id, state} = _jack, {radius} = this
      state.set(MazeGame.Point.simple(1,0,radius), _id, '_long')
      MazeGame.Lock.init(_jack, '_nose')
      state.get(_id, '_jacks', _id)
      return _jack
    }

    // return Number (closest time)
    expand(
      state, // MazeGame.State
    ) {
      const {_id,_long,_spot,_nose} = this
      _jack = super.expand(state, _id)
      state.set(_long,_id,'_long')
      if (_spot) state.set(_spot,_id,'_spot')
      MazeGame.expand(_nose, state, _id, '_nose')
      MazeGame.expand(_jack, state, '_jacks', _id)
      return _jack
    }
    get extend() {
      const {_id,state,_root,_long,_spot,_nose} = this
      if (!_spot || !_nose) return Infinity
      const {speed,search_radius} = this.constructor
      const {__lines,__open_portals,locks,keys} = state._child

      const closest_lock = MazeGame.Lock.get_closest(locks, _spot)
      const closest_key = (closest_lock && closest_lock.key) || (
        MazeGame.Key.get_closest(keys, _spot)
      )

      // TODO check door overlap
      if (closest_key && _nose.key) {
        state.set(null, _id, '_spot')
        this.set_root(_root.flatten)
        return Infinity
      }

      let root = _root.flatten, offset = MazeGame.Point.zero

      const _sub = _spot.sub(root), _dist = _sub.length
      if (_dist < search_radius) {
        if (closest_lock && !closest_lock.is_parent(_nose)) {
          if (_nose.key) closest_lock.set_key(_nose.key)
          else {
            this.set_lock(closest_lock)
            return Infinity
          }
        }
        else if (closest_key != this) closest_key.set_lock(_nose)

        this.set_root(_spot.sub(offset))
        state.set(null, _id, '_spot')

        return Infinity
      }

      const _time = state.time + _dist / speed
      this.set_root(_spot.at(_time).lerp(_root))
      this.set_long(_sub)
      return _time
    }

    remove() {
      if (!super.remove()) return false
      const {_id, state, _nose} = this
      if (_nose) {
        this._nose = null // UNRECORDED MODIFICATION: this is ok...
        _nose.remove()
      }
      state.set(null, '_jacks', _id)
      return true
    }

    draw(
      ctx, // CanvasRenderingContext2D
      offset, // MazeGame.Point (in drawspace)
      scale, // Number
    ) {
      const {
        stroke_color,fill_color,line_width,
        leg_radius,
      } = this.constructor
      const {root,long} = this, {pi2} = Lib
      const _root = root.mul(scale).sum(offset)
      const _long = long.mul(scale)
      const _radius = leg_radius * scale
      const _i_long = _long.strip(_radius).invert
      const _h_long = _long.strip(_radius / 2)

      ctx.strokeStyle = stroke_color
      ctx.fillStyle = fill_color
      ctx.lineWidth = line_width * scale
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      ctx.beginPath()
      _root.sum(_i_long).sum(_h_long).lineTo = ctx
      _root.sub(_i_long).sum(_h_long).lineTo = ctx
      ctx.stroke()
      ctx.beginPath()
      _root.sum(_i_long).sub(_h_long).lineTo = ctx
      _root.sub(_i_long).sub(_h_long).lineTo = ctx
      ctx.stroke()

      super.draw(ctx, offset, scale)
    }
  }

  static get key_bind() { return null }

  get time() { return this._time } // Number
  get name() { return this._name } // String
  get idable() { return false }
  get id() { return this._id } // String,Number

  get serializable() { return false }
  static serialize(
    object, // Object,Null
  ) {
    return object != null && object.serializable ? object.serialize : object
  }

  static get readable() { return false }
  static read(
    object, // Object,Null
    state, // MazeGame.State,Null
  ) {
    const con__ = object && MazeGame[object._constructor]
    return con__ && con__.readable ? con__.read(object,state) : object
  }

  get syncable() { return false }
  sync(
    sync, // MazeGame.State.Sync
  ) {
    this.__sync = sync
    return this
  }
  static sync(
    object, // Object,Null
    sync, // MazeGame.State.Sync
  ) {
    return object != null && object.syncable ? object.sync(sync) : object
  }

  get expandable() { return false }
  static expand(
    object, // Object,Null
    state, // MazeGame.State
    ...path // String
  ) {
    if (object == null || MazeGame.get(state.child, ...path) != null) return
    else if (object.idable) {
      if (state.child[object.id] == null) {
        if (object.expandable) object.expand(state, object.id)
        else state.set(object, object.id)
      }
      if (path.length > 1) state.get(object.id, ...path)
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
    return Lib.set(parent, value, label)
  }
}
