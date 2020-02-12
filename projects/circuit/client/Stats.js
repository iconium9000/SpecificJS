module.exports = Circuit => {

  class Inst {
    static init(stat,tok,memdst,memargs,rawargs) {
      const _inst = new this
      _inst.tok = tok
      _inst.memdst = memdst
      _inst.memargs = memargs
      _inst.rawargs = rawargs
      _inst.id = stat.insts.push(_inst)-1
      stat.scope.insts.push(_inst.id)
      return memdst
    }
  }

  class Scope {
    static init(parent) {
      const _scope = new this
      _scope.parent = parent
      _scope.typedefs = Object.create(parent.typedefs)
      _scope._typedefs = {}
      _scope.vardefs = Object.create(parent.vardefs)
      _scope._vardefs = {}

      _scope.memvals = []
      _scope.insts = []
      return _scope
    }
    static initraw() {
      const _scope = new this
      _scope._typedefs = _scope.typedefs = {}
      _scope._vardefs = _scope.vardefs = {}

      _scope.memvals = []
      _scope.insts = []
      return _scope
    }
  }

  const nativetypes = {}
  {
    nativetypes.Type = class Type {
      static get _size() { return 0 }
      static _init(stat,type) {
        const _type = Object.create(this)
        _type.type = type
        return _type
      }
      static _rawval(stat,rawval) {
        throw ['Bad Type _rawval',rawval]
      }
      static _typecast(stat,mem) {
        throw ['Type _typecast',mem]
      }
    }
    nativetypes.Void = class Void extends nativetypes.Type {
      static get _size() { return 0 }
      static _init(stat) { return this }
      static _rawval(stat,rawval) {
        throw ['Void _rawval',rawval]
      }
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
      static ['Pre-'] (stat,mem) {
        const newmem = stat._newval(this)
        Inst.init(stat,'float::not',newmem,[mem])
        return newmem
      }
      static _rawval(stat,rawval) {
        const newmem = stat._newval(this)
        Inst.init(stat,'float::set',newmem,[],[rawval])
        return newmem
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

      this.memtypes = []
      this.insts = []
      this.scope = this.rootscope = Scope.initraw()
    }

    _newval(type) {
      // throw ['_newval',type]
      const mem = this.memtypes.push(type)-1
      this.scope.memvals.push(mem)
      return mem
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
      const [tok,_actid] = this.acts[actid]
      const _mem = this._doact(_actid)
      if (_mem.type[tok]) return _mem.type[tok](this,_mem)
      else throw ['_singleop',tok,_mem]
    }
    _doubleop(actid) {
      const [tok,actida,actidb] = this.acts[actid]
      const mema = this._doact(actida)
      const memb = this._doact(actidb)
      if (mema.type[tok]) return mema.type[tok](this,mema,memb)
      else throw ['_doubleop',tok,mema,memb]
    }

    // Getvar () {}
    Gettype (actid,typename,...args) {
      const _type = nativetypes[typename]
      if (!_type) throw ['Gettype',typename,...args]
      return this._newval(nativetypes.Type._init(this,_type))
    }
    Vardef (actid,typeid,varname) {
      if (this.scope._vardefs[varname] != undefined) {
        throw ['_newvar used varname',varname]
      }
      const mem = this._newmem(this._doact(typeid).type.type)
      this.scope._vardefs[varname] = mem
      this.scope.vardefs[varname] = mem
      return mem
    }
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
      // TODO merge scopes
      this.scope = scope

      throw ['Scope',...argids]
    }

    // Array () {}
    // Pntrtype () {}
    // Addrtype () {}
    // Funtype () {}
    Arraytype (actid,typeid,sizeid) {
      const [tok,typename,rawval] = this.acts[sizeid]
      if (tok == 'Rawval' && typename == 'Int' && rawval >= 0) {
        const {type} = this._doact(typeid)
        const arraytype = nativetypes.Array._init(this,type,rawval)
        return this._newval(arraytype)
      }
      else throw ['Arraytype size error',tok,typename,rawval]
    }
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

    ['<'] (actid) { return this._doubleop(actid) }
    ['>'] (actid) { return this._doubleop(actid) }
    ['<='] (actid) { return this._doubleop(actid) }
    ['>='] (actid) { return this._doubleop(actid) }
    ['=='] (actid) { return this._doubleop(actid) }
    ['!='] (actid) { return this._doubleop(actid) }
    ['<=>'] (actid) { return this._doubleop(actid) }
    ['&&'] (actid) { return this._doubleop(actid) }
    ['||'] (actid) { return this._doubleop(actid) }
    ['='] (actid,varid,valid) {
      const valmem = this._doact(valid)
      const varmem = this._doact(varid)
      const castmem = varmem.type._typecast(this,valmem)
      return Inst.init(this,'set',varmem,[castmem])
    }
  }

  return Stats
}
