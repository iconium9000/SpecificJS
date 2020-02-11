module.exports = Circuit => {

  class Scope {
    constructor(parent) {
      this.parent = parent
      this.vardefs = {}
      this.typedefs = {}
      this.valdefs = []
    }

    getvardef(varname) {
      throw ['getvardef',varname]
    }
    gettypedef(typename) {
      throw ['gettypedef',typename]
    }

  }

  const nativetypes = {}
  nativetypes.Type = class Type {
    static init(stat) { throw 'Bad Type Init' }
    static _rawval(stat,rawval) { throw 'Bad Type _rawval' }
  }
  nativetypes.Void = class Void extends nativetypes.Type {
    static init(stat) { return this }
    static _rawval(stat,rawval) { return stat._newval(this) }
  }
  nativetypes.Bool = class Bool extends nativetypes.Void {
    static _rawval(stat,rawval) {
      const valin = stat._newval(this)

    }
  }
  nativetypes.Char = class Char extends nativetypes.Bool {}
  nativetypes.Int = class Int extends nativetypes.Char {}
  nativetypes.Float = class Float extends nativetypes.Int {}
  nativetypes.Tuple = class Tuple extends nativetypes.Type {
    static init(stat,...types) {
      throw ['Tuple init',...types]

      // const _tuple = Object.create(this.prototype)
      // _tuple.types = types
      // return _tuple
    }
  }
  nativetypes.Array = class Array extends nativetypes.Void {
    static init(stat,type,size) {
      throw ['Array',type,size]
    }
  }
  nativetypes.String = class String extends nativetypes.Array {
    static init(stat,size) {
      super(stat,nativetypes.Char,size)
    }
    static _rawval(stat,rawval) {
      const type = this.init(stat,rawval.length)
      const valin = stat._newval(type)
      
    }
  }

  class Stats {
    constructor(string) {
      this.map = {}
      this.acts = []
      this.string = string
      this.copies = 0

      this.scope = this.rootscope = new Scope
    }

    _getintype(valin) {
      throw ['_gettype',valin]
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
    _newvar(type,varname) {
      throw ['_newvar',type]
    }
    _newval(type) {
      throw ['_newval',type]
    }
    _setval(dstid,srcid) {
      throw ['_setval',dstid,srcid]
    }

    _singleop(actid) {
      const [tok,aid] = this.acts[actid]
      const ain = this._doact(aid)
      const type = this._getintype(ain)
      if (type[tok]) return type[tok](this,ain)
      else throw ['_singleop bad tok',type,tok]
    }
    _doubleop(actid,typename) {
      const [tok,aid,bid] = this.acts[actid]
      throw ['_doubleop',actid,tok,aid,bid,typename]
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
      this.scope = new Scope(scope)
      this._doacts(...argids)
      this.scope = scope
      return this._newval(nativetypes.Void)
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
      const valin = this._doact(valid)
      const varin = this._doact(varid)
      return this._setvar(varin,valin)
    }
  }

  return Stats
}
