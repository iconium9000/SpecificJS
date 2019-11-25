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
    static fill_color = 'black'
    static stroke_color = 'white'
    static thin_stroke_color = '#505050'
    static line_width = 0.5
    static get thin_line_width() { return this.line_width / 3 }
    static speed = 2e-2 // dist / time = speed

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

    get idx() { return this._idx }
  }
  MazeGame.Type = Type

  class Float extends Type {

  }
  MazeGame.Float = Float
  class FloatLerp extends Float {

  }
  MazeGame.FloatLerp = FloatLerp
  class Point extends Type {

  }
  MazeGame.Point = Point

  class PointLerp extends Point {

  }
  MazeGame.PointLerp = PointLerp

  class Action extends Type {

    /*
      sync is only true iff child == build (when sync is false)
      if changes are made to any parent or grandparent
      sync will NOT be updated.
    */

    get time() { return this._time } // Number
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

    get tally() {
      const {__action, _tally} = this
      return __action.top((_tally || 0) + 1, '_tally')
    }

    get level_node() { return this._level_node }
    set_level_node(
      level_node, // LevelNode
    ) {
      const {__action,_level_node} = this, {idx} = level_node
      if (_level_node == level_node) return _level_node
      else return __action.get(idx, 'level_node')
    }

    get editors() { return this._editors }

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

    get set_level_node(
      level_node, // LevelNode,Null
    ) {
      const {_idx,__action,_level_node} = this, {time} = __action
      if (_level_node == level_node) return _level_node
      if (_level_node) {
        const _action = _level_node.at_time
        
      }
      if (level_node) {
        __action.get(_level_node.idx, _idx, '_level_node')
        const _action = level_node.at_time

      }
      else __action.set(null, _idx, '_level_node')
    }

    get name() { return this._name }
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
      const {_action} = this, {time} = this
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

      return _levelnode
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

    get tally() {
      const {__action, _tally} = this
      return __action.top((_tally || 0) + 1, '_tally')
    }

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

  class Lock extends Type {
    static key_bind = 'l'
    static long_min = 3
    static long_max = 3
    static long_round = 3
    static radius = 0.5
    static search_radius = 3 * this.radius
  }
  MazeGame.Lock = Lock

  class Laser extends Lock {
    static key_bind = 's'
    static long_min = 9
    static long_max = Infinity
  }
  MazeGame.Laser = Laser

  class Wall extends Type {
    static key_bind = 'w'
    static root_round = 2
    static long_round = 2
    static long_min = 2
    static short_min = 2
    static short_max = 2
    static default_long_open = 0
    static short_sign = false
    static locks = {}
    static lock_names = []
    static is_portal = false

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

  class Key extends Type {
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
