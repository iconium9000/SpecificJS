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

    static init(string,insts,strs) {
      const prs = new this
      prs._info = ['start']
      prs._ret = undefined
      prs._err = false
      const map = {}
      for (const i in insts) map[i] = {}
      prs._const = {
        acts:[],mch:{},map:map,
        string:string,insts:insts,strs:strs,
      }
      return prs
    }

    ret(ret) {
      this._ret = ret
      return this
    }

    info(info) {
      this._info = info
      return this
    }

    get err() {
      const copy = Object.assign(new Parse,this)
      copy._err = true
      return copy
    }

    get copy() {
      const copy = Object.assign(new Parse,this)
      return copy
    }

    inst(instid) {
      const {_endidx,_const:{insts,map}} = this, inst = insts[instid]
      let ret = map[instid][_endidx]
      if (ret != undefined) {
        if (ret._err) throw ret
        else return ret
      }
      try {
        if (!special_funs[inst[0]]) throw ['inst','bad fun',inst]
        return ret = this[inst[0]](inst)
      }
      catch (e) { throw ret = e._err ? e : this.err.info(e) }
      finally { map[instid][_endidx] = ret }
    }

    fun(inst) {
      let prs = this, info = ['fun']
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = prs.inst(inst[i])
          info.push(prs._info)
        }
        return prs.copy.info(info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw prs.err.info(info)
      }
    }
    lst(inst) {
      let prs = this, info = ['lst'], ret = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = prs.inst(inst[i])
          ret.push(prs._ret)
          info.push(prs._info)
        }
        return prs.copy.ret(ret).info(info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw prs.err.ret(ret).info(info)
      }
    }
    cmp(inst) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this
      const idx = _endidx + word.length
      const prs = this.copy.endidx(idx)
      if (idx > string.length) throw prs.err('cmp','overflow')
      const slice = string.slice(_endidx,idx)
      if (slice == word) {
        return prs.ret(word)
      }
      else throw prs.err('cmp',word,slice)
    }

    mch(inst) { error('TODO mch'); throw ['TODO',...inst] }
    rep0(inst) { error('TODO rep0'); throw ['TODO',...inst] }
    rep1(inst) { error('TODO rep1'); throw ['TODO',...inst] }

    or(inst) { error('TODO or'); throw ['TODO',...inst] }
    and(inst) { error('TODO and'); throw ['TODO',...inst] }
    not(inst) { error('TODO not'); throw ['TODO',...inst] }
    char(inst) { error('TODO char'); throw ['TODO',...inst] }
    txt(inst) { error('TODO txt'); throw ['TODO',...inst] }

    str(inst) { error('TODO str'); throw ['TODO',...inst] }
    ary(inst) { error('TODO ary'); throw ['TODO',...inst] }
    pad(inst) { error('TODO pad'); throw ['TODO',...inst] }
    fout(inst) { error('TODO fout'); throw ['TODO',...inst] }
    stk(inst) { error('TODO stk'); throw ['TODO',...inst] }

    out(inst) { error('TODO out'); throw ['TODO',...inst] }
    rng(inst) { error('TODO rng'); throw ['TODO',...inst] }
    map(inst) { error('TODO map'); throw ['TODO',...inst] }
    act(inst) { error('TODO act'); throw ['TODO',...inst] }

  }



  // return class Parse {
  //   static init(string,insts,strs) {
  //     const prs = new this
  //     prs._err = undefined
  //     prs._ret = undefined
  //     prs._const = {
  //       map:{},act:[],match:{},
  //       string: string,insts:insts,
  //     }
  //     prs._srtidx = 0
  //     prs._endidx = 0
  //     return prs
  //   }
  //   get slice() {
  //     const {_srtidx,_endidx,_const:{string}} = this
  //     return string.slice(_srtidx,_endidx)
  //   }
  //   get copy() {
  //     const copy = Object.assign(new Parse,this)
  //     return copy
  //   }
  //   srtidx(idx) {
  //     this._srtidx = idx
  //     return this
  //   }
  //   endidx(idx) {
  //     this._endidx = idx
  //     return this
  //   }
  //   ret(ret) {
  //     this._ret = ret
  //     return this
  //   }
  //   err(...err) {
  //     this._err = err
  //     return this
  //   }
  //
  //   inst(instid) {
  //     const {_endidx,_const:{map,insts}} = this
  //     if (map[instid]) {
  //       const ret = map[instid][_endidx]
  //       if (ret === undefined);
  //       else if (ret._err) throw ret
  //       else return ret
  //     }
  //     else map[instid] = {}
  //
  //     let ret, inst = insts[instid]
  //     try {
  //       if (!special_funs[inst[0]]) throw inst
  //       return ret = this[inst[0]](inst)
  //     }
  //     catch (e) { throw ret = e._err ? e.copy : this.copy.err('inst',e) }
  //     finally { map[instid][_endidx] = ret }
  //   }
  //
  //   rep0(inst) {
  //     const instid = inst[1], ret = []
  //     let prs = this, {_endidx} = this
  //     try {
  //       while (true) {
  //         prs = prs.inst(instid)
  //         ret.push(prs._ret)
  //         if (_endidx >= prs._endidx) throw 'underflow'
  //         _endidx = prs._endidx
  //       }
  //     }
  //     finally { return prs.copy.ret(ret) }
  //   }
  //   rep1(inst) {
  //     const prs = this.rep0(inst); prs._inst = inst
  //     if (prs._ret.length > 0) return prs
  //     else throw prs.err('rep1','underflow')
  //   }
  //   fun(inst) {
  //     let prs = this
  //     for (let i = 1; i < inst.length; ++i) prs = prs.inst(inst[i])
  //     return prs
  //   }
  //   and(inst) {
  //     let prs = this
  //     for (let i = 1; i < inst.length; ++i) prs = this.inst(inst[i])
  //     return prs
  //   }
  //   not(inst) {
  //     for (let i = 1; i < inst.length; ++i) {
  //       try { this.inst(inst[i]) }
  //       catch (e) { continue }
  //       throw this.copy.err('not',inst)
  //     }
  //     return this
  //   }
  //   lst(inst) {
  //     let prs = this, ret = []
  //     for (let i = 1; i < inst.length; ++i) {
  //       prs = prs.inst(inst[i])
  //       ret.push(prs._ret)
  //     }
  //     return prs.copy.ret(ret)
  //   }
  //   or(inst) {
  //     for (let i = 1; i < inst.length; ++i) {
  //       try { return this.inst(inst[i]) }
  //       catch (e) {}
  //     }
  //     throw this.copy.err('or','overflow')
  //   }
  //   cmp(inst) {
  //     const word = inst[1]
  //     const {_endidx,_const:{string}} = this
  //     const idx = _endidx + word.length
  //     const prs = this.copy.endidx(idx)
  //     if (idx > string.length) throw prs.err('cmp','overflow')
  //     const slice = string.slice(_endidx,idx)
  //     if (slice == word) {
  //       return prs.ret(word)
  //     }
  //     else throw prs.err('cmp',word,slice)
  //   }
  //   txt(inst) { return this.copy.ret(inst[1]) }
  //   char(inst) {
  //     let {copy,_const:{string},_endidx} = this
  //     if (_endidx >= string.length) throw copy.err('char','overflow')
  //     let c = string[_endidx++]
  //     if (c == '\\') {
  //       if (_endidx >= string.length) throw copy.err('char','overflow')
  //       c = string[_endidx++]
  //       const sc = special_chars[c]
  //       if (sc != undefined) c = sc
  //     }
  //     return copy.ret(c).endidx(_endidx)
  //   }
  //
  //   mch(inst) { throw this.copy.err('TODO mch') }
  //   str(inst) {
  //     let str = '', prs = this.ary(inst), {_ret} = prs
  //     for (const i in _ret) str += _ret[i]
  //     return prs.ret(str)
  //   }
  //   ary(inst) {
  //     let ret = []
  //     for (let i = 1; i < inst.length; ++i) {
  //       ret = ret.concat(this.inst(inst[i])._ret)
  //     }
  //     return this.copy.ret(ret)
  //   }
  //   pad(inst) {
  //     let prs = this.ary(inst)
  //     return prs.ret([prs._ret])
  //   }
  //   fout(inst) {
  //     let {_ret} = this
  //     for (let i = 1; i < inst.length; ++i) {
  //       _ret = _ret[this.inst(inst[i])._ret]
  //     }
  //     return this.copy.ret(_ret)
  //   }
  //   out(inst) {
  //     let {_ret} = this.inst(inst[1])
  //     for (let i = 2; i < inst.length; ++i) {
  //       _ret = _ret[this.inst(inst[i])._ret]
  //     }
  //     return this.copy.ret(_ret)
  //   }
  //   stk(inst) {
  //     error('TODO stk')
  //     throw this.copy.err('TODO stk')
  //   }
  //   rng(inst) {
  //     error('TODO rng')
  //     throw this.copy.err('TODO rng')
  //   }
  //   map(inst) {
  //     error('TODO map')
  //     throw this.copy.err('TODO map')
  //   }
  //   act(inst) {
  //     error('TODO act')
  //     throw this.copy.err('TODO act')
  //   }
  // }
}
