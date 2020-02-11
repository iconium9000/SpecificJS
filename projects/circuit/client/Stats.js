module.exports = Circuit => {

  class Scope {
    static init(parent) {
      const _scope = new this
      _scope.parent = parent
      _scope.typedefs = Object.create(parent.typedefs)
      _scope._typedefs = {}
      _scope.vardefs = Object.create(parent.vardefs)
      _scope._vardefs = {}
      _scope.indefs = []
      return _scope
    }
    static initraw() {
      const _scope = new this
      _scope._typedefs = _scope.typedefs = {}
      _scope._vardefs = _scope.vardefs = {}
      _scope.indefs = []
      return _scope
    }
  }

  const nativetypes = {}
  {
    nativetypes.Type = class Type {
      static get _size() { throw 'Bad Type _size' }
      static _init(stat) { throw 'Bad Type _init' }
      static _rawval(stat,rawval) { throw 'Bad Type _rawval' }
    }
    nativetypes.Void = class Void extends nativetypes.Type {
      static get _size() { return 0 }
      static _init(stat) { return this }
      static _rawval(stat,rawval) { return stat._newval(this) }
    }
    nativetypes.Bool = class Bool extends nativetypes.Void {
      static get _size() { return 1 }
      static _rawval(stat,rawval) {
        throw ['Bool _rawval',rawval]
      }
    }
    nativetypes.Char = class Char extends nativetypes.Bool {
      static get _size() { return 8 }
      static _rawval(stat,rawval) {
        throw ['Char _rawval',rawval]
      }
    }
    nativetypes.Int = class Int extends nativetypes.Char {
      static get _size() { return 32 }
      static _rawval(stat,rawval) {
        throw ['Int _rawval',rawval]
      }
    }
    nativetypes.Float = class Float extends nativetypes.Int {
      static _rawval(stat,rawval) {
        throw ['Float _rawval',rawval]
      }
    }
    nativetypes.Tuple = class Tuple extends nativetypes.Type {
      static get _size() {
        let size = 0
        for (const i in this.types) size += this.types[i]
        return size
      }
      static _init(stat,...types) {
        const _tuple = Object.create(this)
        _tuple.types = types
        return _tuple
      }
    }
    nativetypes.Array = class Array extends nativetypes.Void {
      static get _size() {
        return nativetypes.Int._size + this.size * this.type._size
      }
      static _init(stat,type,size) {
        const _array = Object.create(this)
        _array.type = type
        _array.size = size
        return _array
      }
    }
    nativetypes.String = class String extends nativetypes.Array {
      static _init(stat,size) {
        throw ['String',size]
      }
      static _rawval(stat,rawval) {
        throw ['_rawval',rawval]
      }
    }
  }

  class Stats {
    constructor(string) {
      this.map = {}
      this.acts = []
      this.string = string
      this.copies = 0

      this.indefs = []
      this.intypes = []
      this.scope = this.rootscope = Scope.initraw()
    }

    _doact(actid) {
      const [tok,...args] = this.acts[actid]
      try {
        if (this[tok]) return this[tok](actid,...args)
        else throw ['_doact tok error',tok,...args]
      }
      catch (e) {
        error('_doact',tok,actid)
        throw e
      }
    }
    _doacts(...actids) {
      for (const i in actids) actids[i] = this._doact(actids[i])
      return actids
    }

    _singleop(actid) {
      throw ['_singleop',actid]
    }
    _doubleop(actid,typename) {
      throw ['_doubleop',actid,typename]
    }

    // Getvar () {}
    // Gettype (actid,typename,...args) {}
    // Vardef (actid,typeid,varname) {}
    Rawval (actid,typename,rawval) {
      return nativetypes[typename]._rawval(this,rawval)
    }
    // tern () {}
    // if () {}
    // else () {}
    // while () {}
    // do () {}
    // for () {}
    // Tuple () {}
    Scope (actid,...argids) {
      const {scope} = this
      this.scope = Scope.init(scope)
      this._doacts(...argids)
      this.scope = scope

      throw ['Scope',...argids]
    }
    // Array () {}
    // Pntrtype () {}
    // Addrtype () {}
    // Funtype () {}
    // Arraytype () {}
    // Callfun () {}
    // Subscript () {}
    // Typecast () {}

    ['+'] (actid) { return this._doubleop(actid) }
    ['-'] (actid) { return this._doubleop(actid) }
    ['%'] (actid) { return this._doubleop(actid) }
    ['/'] (actid) { return this._doubleop(actid) }
    ['*'] (actid) { return this._doubleop(actid) }
    ['!'] (actid) { return this._doubleop(actid) }
    ['~'] (actid) { return this._doubleop(actid) }
    ['&'] (actid) { return this._doubleop(actid) }
    ['|'] (actid) { return this._doubleop(actid) }

    ['Pre+'] (actid) { return this._singleop(actid) }
    ['Pre-'] (actid) { return this._singleop(actid) }
    ['Pre*'] (actid) { return this._singleop(actid) }
    ['Pre&'] (actid) { return this._singleop(actid) }
    ['Pre++'] (actid) { return this._singleop(actid) }
    ['Pre--'] (actid) { return this._singleop(actid) }
    ['Post++'] (actid) { return this._singleop(actid) }
    ['Post--'] (actid) { return this._singleop(actid) }

    ['<'] (actid) { return this._doubleop(actid,'Bool') }
    ['>'] (actid) { return this._doubleop(actid,'Bool') }
    ['<='] (actid) { return this._doubleop(actid,'Bool') }
    ['>='] (actid) { return this._doubleop(actid,'Bool') }
    ['=='] (actid) { return this._doubleop(actid,'Bool') }
    ['!='] (actid) { return this._doubleop(actid,'Bool') }
    ['<=>'] (actid) { return this._doubleop(actid,'Int') }
    ['&&'] (actid) { return this._doubleop(actid) }
    ['||'] (actid) { return this._doubleop(actid) }
    ['='] (actid,varid,valid) {
      throw ['=',actid,varid,valid]
    }
  }

  return Stats
}
