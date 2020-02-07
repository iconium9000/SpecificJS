module.exports = Circuit => {

  class Scope {
    constructor(parent) {
      this.parent = parent
      this.vardefs = {}
      this.typedefs = {}
      this.acts = []
    }
  }

  class Type {
    static init() { throw 'Bad Type Init' }
  }
  class Void extends Type {
    static init() { return this }
    static ['Pre-'] (s,actid,valid) {
      s.acts.push(actid)
      return this
    }
  }
  class Bool extends Void {}
  class Char extends Bool {}
  class Int extends Char {}
  class Float extends Int {}
  class Tuple extends Type {
    static init(...types) {
      const _tuple = Object.create(this.prototype)
      _tuple.types = types
      return _tuple
    }
  }
  class Array extends Tuple {
    static init(...types) {
      throw ['Array',...types]
    }
  }
  class String extends Array {}

  const nativetypes = {
    Type:Type, Void:Void, Bool:Bool, Char:Char, Int:Int, Float:Float,
    String:String, Tuple:Tuple, Array:Array,
  }


  class Stats {
    constructor(string) {
      this.map = {}
      this.acts = []
      this.string = string
      this.copies = 0

      this.acttypes = {}
      this.scope = this.rootscope = new Scope
    }

    _doact(actid) {
      const type = this.acttypes[actid]
      if (type) return type

      const [tok,...args] = this.acts[actid]
      try {
        if (this[tok]) {
          return this.acttypes[actid] = this[tok](actid,...args)
        }
        else throw ['_doact tok error',tok,...args]
      }
      catch (e) {
        error('_doact',tok,actid)
        throw e
      }
    }

    _gettypedef(typename) {
      const typedef = this.typedefs[typename]
      if (typedef != undefined) return typedef
      else if (this.parent) return this.parent._gettypedef(typename)
      else return null
    }
    _gettypes(...actids) {
      const types = []
      for (const i in actids) types.push(this._doact(actids[i]))
      return types
    }

    // Getvar () {}
    Gettype (actid,typename,...args) {
      if (nativetypes[typename]) {
        const types = this._gettypes(...args)
        return nativetypes[typename].init(...types)
      }
      const typedef = this._gettypedef(typename)
      if (typedef != null) return this.acttypes[typedef]
      else throw ['Gettype bad get',actid,typename]
    }
    Vardef (actid,typeid,varname) {
      const {vardefs} = this.scope
      if (vardefs[varname] != null) {
        throw ['Vardef bad def',varname,vardefs[varname]]
      }
      this.scope.acts.splice(0,0,typeid)
      return vardefs[varname] = this._doact(typeid)
    }
    Rawval (actid,typename,rawval) {
      this.scope.acts.push(actid)
      return nativetypes[typename].init()
    }
    // tern () {}
    // if () {}
    // else () {}
    // while () {}
    // do () {}
    // for () {}
    // Tuple () {}
    Scope (actid,...argids) {
      const {scope,acttypes} = this, act = this.acts[actid]
      this.scope = new Scope(scope)
      this._gettypes(...argids)
      scope.acts = scope.acts.concat(actid,scope.acts)
      this.scope = scope
      return _newtype('Void')
    }
    // Array () {}
    // Pntrtype () {}
    // Addrtype () {}
    // Funtype () {}
    // Arraytype () {}
    // Callfun () {}
    // Subscript () {}
    // Typecast () {}

    // ['+'] () {}
    // ['-'] () {}
    // ['%'] () {}
    // ['/'] () {}
    // ['*'] () {}
    // ['!'] () {}
    // ['~'] () {}
    // ['&'] () {}
    // ['|'] () {}

    // ['Pre+'] () {}
    ['Pre-'] (actid,valid) {
      const valtype = this._doact(valid)
      
    }
    // ['Pre*'] () {}
    // ['Pre&'] () {}
    // ['Pre++'] () {}
    // ['Pre--'] () {}
    // ['Post++'] () {}
    // ['Post--'] () {}

    // ['<'] () {}
    // ['>'] () {}
    // ['<='] () {}
    // ['>='] () {}
    // ['=='] () {}
    // ['!='] () {}
    // ['<=>'] () {}
    ['='] (actid,varid,valid) {
      const [vartype,valtype] = this._gettypes(varid,valid)

      throw "TODO ['=']"
    }
    // ['&&'] () {}
    // ['||'] () {}
  }

  return Stats
}
