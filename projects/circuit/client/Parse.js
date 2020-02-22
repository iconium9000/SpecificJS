module.exports = Circuit => {

  const special_chars = {
    '\'': '\'',
    '"': '\"',
    '\\': '\\',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'b': '\b',
    'f': '\f',
    'v': '\v',
    '0': '\0',
  }
  const special_funs = JSON.parse(`{
    "mch":true,
    "rep0":true,
    "rep1":true,
    "fun":true,
    "lst":true,

    "or":true,
    "and":true,
    "not":true,
    "char":true,
    "cmp":true,
    "txt":true,

    "str":true,
    "ary":true,
    "pad":true,
    "fout":true,
    "stk":true,

    "out":true,
    "rng":true,
    "map":true,
    "act":true
  }`)

  return class Parse {
    static init(string,insts) {
      const prs = new this
      prs._const = {
        string: string,insts: insts,
        map: {},act: [],match: {},
      }
      prs._srtidx = 0
      prs._endidx = 0
      return prs
    }
    get slice() {
      const {_srtidx,_endidx,_const:{string}} = this
      return string.slice(_srtidx,_endidx)
    }
    get copy() {
      const copy = Object.assign(new Parse,this)
      return copy
    }
    srtidx(idx) {
      this._srtidx = idx
      return this
    }
    endidx(idx) {
      this._endidx = idx
      return this
    }
    ret(ret) {
      this._ret = ret
      return this
    }
    set(parent,inst,children) {
      this._parent = parent
      this._srtidx = parent._endidx
      this._inst = inst
      this._children = children
      return this
    }
    err(...err) {
      this._err = err
      return this
    }

    inst(instid) {
      const {_endidx,_const:{map,insts}} = this
      if (map[instid]) {
        const ret = map[instid][_endidx]
        if (ret === undefined);
        else if (ret._err) throw ret
        else return ret
      }
      else map[instid] = {}

      let ret, inst = insts[instid]
      try {
        if (!special_funs[inst[0]]) throw inst
        return ret = this[inst[0]](inst)
      }
      catch (e) {
        throw ret = (e._err ? e.copy : this.copy.err('inst',e)).srtidx(_endidx)
      }
      finally {
        log('inst',ret,instid,inst)
        map[instid][_endidx] = ret
      }
    }

    rep0(inst) {
      const instid = inst[1]
      const children = [], ret = []
      let prs = this, {_endidx} = this
      try {
        while (true) {
          children.push(prs = prs.inst(instid))
          ret.push(prs._ret)
          if (_endidx >= prs._endidx) throw 'underflow'
          _endidx = prs._endidx
        }
      }
      catch (e) {
        if (e._err) children.push(e)
        else throw prs.copy.ret(ret).set(this,inst,children).err('rep0',e)
      }
      return prs.copy.ret(ret).set(this,inst,children)
    }
    rep1(inst) {
      const prs = this.rep0(inst); prs._inst = inst
      if (prs._ret.length > 0) return prs
      else throw prs.err('rep1','underflow')
    }
    fun(inst) {
      let prs = this, children = []
      for (let i = 1; i < inst.length; ++i) {
        children.push(prs = prs.inst(inst[i]))
      }
      return prs.copy.set(this,inst,children)
    }
    lst(inst) {
      let prs = this, children = [], ret = []
      for (let i = 1; i < inst.length; ++i) {
        children.push(prs = prs.inst(inst[i]))
        ret.push(prs._ret)
      }
      return prs.copy.ret(ret).set(this,inst,children)
    }
    or(inst) {
      const children = []
      for (let i = 1; i < inst.length; ++i) {
        try {
          return this.inst(inst[i]).copy.set(this,inst,children)
        }
        catch (e) {
          if (e._err) children.push(e)
          else throw this.copy.err('or','underflow',e).set(this,inst,children)
        }
      }
      throw this.copy.err('or','overflow').set(this,inst,children)
    }
    cmp(inst) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this
      const idx = _endidx + word.length
      const prs = this.copy.set(this,inst,[]).endidx(idx)
      if (idx > string.length) throw prs.err('cmp','overflow')
      if (string.slice(_endidx,idx) == word) {
        return prs.ret(word)
      }
      else throw prs.err('cmp',word)
    }
    txt(inst) { return this.copy.ret(inst[1]).set(this,inst,[]) }

    mch(inst) { throw this.copy.err('TODO mch') }

    and(inst) { throw this.copy.err('TODO and') }
    not(inst) { throw this.copy.err('TODO not') }
    char(inst) { throw this.copy.err('TODO char') }

    str(inst) { throw this.copy.err('TODO str') }
    ary(inst) { throw this.copy.err('TODO ary') }
    pad(inst) { throw this.copy.err('TODO pad') }
    fout(inst) { throw this.copy.err('TODO fout') }
    stk(inst) { throw this.copy.err('TODO stk') }

    out(inst) { throw this.copy.err('TODO out') }
    rng(inst) { throw this.copy.err('TODO rng') }
    map(inst) { throw this.copy.err('TODO map') }
    act(inst) { throw this.copy.err('TODO act') }
  }

  // return class Parse {
  //   static init(string,match) {
  //     const prg = new this
  //     prg._time = null
  //     prg._slice = null
  //     prg._error = null
  //     prg._ret = null
  //     prg._const = {
  //       str:string,mch:match,
  //       par:[],acts:[],map:{},tbl:{},
  //       dup:0,skip:0
  //     }
  //     prg._copies = []
  //     prg._srtidx = 0
  //     prg._endidx = 0
  //     return prg
  //   }
  //   get slice() { return this._string.slice(this._srtidx,this._endidx) }
  //   get _parent() { return this._const.par }
  //   set _parent(p) { this._const.par = p }
  //   get _string() { return this._const.str }
  //   get _table() { return this._const.tbl }
  //   get _map() { return this._const.map }
  //   get _acts() { return this._const.acts }
  //   get _match() { return this._const.mch }
  //   get _acts() { return this._const.acts }
  //   get dup() { return this._const.dup }
  //   set dup(d) { this._dup = this._const.dup = d }
  //   get skip() { return this._const.skip }
  //   set skip(k) { this._skip = this._const.skip = k }
  //   get copy() {
  //     const copy = Object.assign(new Parse,this)
  //     ++copy.dup
  //     this._copies.push(copy)
  //     copy._copies = []
  //     copy._scp = this
  //     return copy
  //   }
  //   get endidx() { return this._endidx }
  //   get count() {
  //     let map = {}, {_map} = this, total = 0
  //     for (const i in _map) total += map[i] = Object.keys(_map[i]).length
  //     map.__total = total
  //     return map
  //   }
  //   get ncount() {
  //     let map = {}, {_map} = this, total = 0
  //     for (const i in _map) {
  //       for (const j in _map[i]) {
  //         if (!map[j]) map[j] = 1
  //         else ++map[j]
  //         ++total
  //       }
  //     }
  //     map.__total = total
  //     return map
  //   }
  //   get nmap() {
  //     let map = {}, {_map} = this
  //     for (const i in _map) {
  //       for (const j in _map[i]) {
  //         if (!map[j]) map[j] = {}
  //         map[j][i] = _map[i][j]
  //       }
  //     }
  //     return map
  //   }
  //   srtidx(srtidx) {
  //     this._srtidx = srtidx
  //     return this
  //   }
  //   endidx(endidx) {
  //     this._endidx = endidx
  //     return this
  //   }
  //   idx(srtidx,endidx) {
  //     this._srtidx = srtidx
  //     this._endidx = endidx
  //     return this
  //   }
  //   ret(ret) {
  //     this._ret = ret
  //     return this
  //   }
  //   error(...error) {
  //     this._error = error
  //     return this
  //   }
  //
  //   prs(...args) {
  //     const [tok,...arg] = args
  //     // log('prs',tok,...arg)
  //     const {_parent,_endidx,_string,_map} = this
  //     this._parent = []
  //     this._trace = _parent
  //
  //     // const str = JSON.stringify(args)
  //     // if (_map[str]) {
  //     //   const ret = _map[str][_endidx]
  //     //   if (ret) {
  //     //     ++this.skip
  //     //     if (ret._error) throw ret
  //     //     else return ret
  //     //   }
  //     // }
  //     // else _map[str] = {}
  //
  //     let ret, {time} = Circuit.Lib
  //     try {
  //       if (!special_funs[tok]) throw this.copy.error(`parse ${tok}`)
  //       return ret = this[tok](...arg)
  //     }
  //     catch (e) { throw ret = e._error ? e : this.copy.error(e) }
  //     finally {
  //       ret = ret.copy//.srtidx(_endidx)
  //       ret._args = args
  //       ret._time = Circuit.Lib.time - time
  //       ret._slice = ret.slice
  //       ret._children = this._parent
  //       _parent.push(ret)
  //       this._parent = _parent
  //     }
  //     // finally { _map[str][_endidx] = ret }
  //   }
  //   mch(str) {
  //     const {_endidx,_match,_map} = this
  //     if (_map[str]) {
  //       const ret = _map[str][_endidx]
  //       if (ret) {
  //         ++this.skip
  //         if (ret._error) throw ret
  //         else return ret
  //       }
  //     }
  //     else _map[str] = {}
  //     let ret, mch = _match[str] || ['cmp',str]
  //     try { return ret = this.prs(...mch) }
  //     catch (e) { throw ret = e._error ? e : this.copy.error(e) }
  //     finally { _map[str][_endidx] = ret.srtidx(_endidx) }
  //   }
  //   rep0(arg) {
  //     let prg = this, ret = [], {length} = this._string
  //     try {
  //       while (prg._endidx < length) {
  //         prg = prg.prs(...arg)
  //         ret.push(prg._ret)
  //       }
  //     }
  //     // catch (e) { error(e._error || e) }
  //     finally { return prg.copy.ret(ret).srtidx(this._endidx) }
  //   }
  //   rep1(arg) {
  //     let prg = this.prs(...arg), ret = [prg._ret], {length} = this._string
  //     try {
  //       while (prg._endidx < length) {
  //         prg = prg.prs(...arg)
  //         ret.push(prg._ret)
  //       }
  //     }
  //     finally { return prg.copy.ret(ret).srtidx(this._endidx) }
  //   }
  //   fun(...args) {
  //     let prg = this
  //     for (const i in args) prg = prg.prs(...args[i])
  //     return prg.copy.srtidx(this._endidx)
  //   }
  //   lst(...args) {
  //     let prg = this
  //     for (const i in args) {
  //       prg = prg.prs(...args[i])
  //       args[i] = prg._ret
  //     }
  //     return prg.copy.ret(args)
  //   }
  //   or(...args) {
  //     for (const i in args) {
  //       try { return this.prs(...args[i]) }
  //       catch (e) { args[i] = e._error || e }
  //       // finally { continue }
  //     }
  //     throw this.copy.error('or',...args)
  //   }
  //   and(...args) {
  //     let ret = this
  //     for (const i in args) ret = this.prs(...args[i])
  //     return ret
  //   }
  //   not(arg) {
  //     try { this.prs(...arg) }
  //     catch (e) { return this }
  //     throw this.copy.error('not',...arg)
  //   }
  //   char() {
  //     let {copy,_string,_endidx} = this
  //     if (_endidx >= _string.length) throw copy.error('char overflow')
  //     let c = _string[_endidx++]
  //     if (c == '\\') {
  //       if (_endidx >= _string.length) throw copy.error('char overflow')
  //       c = _string[_endidx++]
  //       const sc = special_chars[c]
  //       if (sc != undefined) c = sc
  //     }
  //     return copy.ret(c).idx(this._endidx,_endidx)
  //   }
  //   cmp(str) {
  //     const {copy,_string,_endidx} = this, idx = _endidx + str.length
  //     if (idx > _string.length) throw copy.error('cmp overflow')
  //     if (_string.slice(_endidx,idx) == str) {
  //       return copy.ret(str).idx(_endidx,idx)
  //     }
  //     else throw copy.error('cmp',str)
  //   }
  //   txt(str) { return this.copy.ret(str) }
  //   out(arg,out) {
  //     const prg = this.prs(...arg)
  //     const {_ret} = prg.prs(...out)
  //     return prg.copy.ret(prg._ret[_ret]).srtidx(this._endidx)
  //   }
  //   rng(low,hgh) {
  //     let {copy,_string,_endidx} = this
  //     if (_endidx >= _string.length) throw copy.error('rng overflow')
  //     const c = _string[_endidx]
  //     if (low <= c && c <= high) return copy.ret(c).idx(_endidx,1+_endidx)
  //     else throw copy.error('rng',low,hgh,c)
  //   }
  //   map(name,fun) {
  //     name = this.prs(...name)._ret
  //     fun = this.prs(...fun)._ret
  //     this._table[name] = fun
  //     return this.copy.ret(name)
  //   }
  //   stk(fun,val,...rep) {
  //     let prg = this.prs(...val), {_ret} = this.ary(...rep)
  //     for (const i in _ret) {
  //       const [tok,...args] = _ret[i]
  //       prg = this.copy.ret([tok,prg._ret,...args]).prs(...fun)
  //     }
  //     return prg
  //   }
  //   str(...args) {
  //     let str = '', prg = this.ary(...args), {_ret} = prg;
  //     for (const i in _ret) str += _ret[i]
  //     return prg.copy.ret(str).srtidx(this._endidx)
  //   }
  //   ary(...args) {
  //     let ary = []
  //     for (const i in args) ary = ary.concat(this.prs(...args[i])._ret)
  //     return this.copy.ret(ary)
  //   }
  //   pad(...args) { return this.copy.ret([this.ary(...args)._ret]) }
  //   fout(...args) {
  //     let {_ret} = this
  //     for (const i in args) _ret = _ret[this.prs(...args[i])._ret]
  //     return this.copy.ret(_ret)
  //   }
  // }
}
