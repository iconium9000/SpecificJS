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
  const map_funs = JSON.parse(`{
    "str":true,
    "ary":true,
    "pad":true,
    "fout":true,
    "stk":true,
    "act":true,
    "map":true
  }`)
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
      prs._endidx = 0
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

    srtidx(idx) {
      this._srtidx = idx
      return this
    }
    endidx(idx) {
      this._endidx = idx
      return this
    }

    info(inst,info) {
      this._inst = inst
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

    inst(instid,pret) {
      const {_endidx,_const:{insts,map}} = this, inst = insts[instid]
      let ret = map[instid][_endidx]
      if (pret == undefined && ret != undefined) {
        if (ret._err) throw ret
        else return ret
      }
      try {
        if (!special_funs[inst[0]]) throw ['inst','bad fun',inst]
        return ret = this[inst[0]](inst,pret)
      }
      catch (e) { throw ret = e._err ? e : this.err.info(inst,e) }
      finally { map[instid][_endidx] = ret }
    }

    fun(inst) {
      let prs = this, info = [inst[0]]
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = prs.inst(inst[i])
          info.push(prs._info)
        }
        info.push(prs._ret)
        return prs.copy.info(inst,info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw prs.err.info(inst,info)
      }
    }
    lst(inst) {
      let prs = this, info = [inst[0]], ret = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = prs.inst(inst[i])
          ret.push(prs._ret)
          info.push(prs._info)
        }
        return prs.copy.ret(ret).info(inst,info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw prs.err.ret(ret).info(inst,info)
      }
      finally { info.push(ret) }
    }
    rep0(inst) {
      const info = [inst[0]], ret = [], instid = inst[1]
      let prs = this, idx
      try {
        do {
          idx = prs._endidx
          prs = prs.inst(instid)
          ret.push(prs._ret)
          info.push(prs._info)
        } while (idx < prs._endidx)
        throw [inst[0],'no progress']
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        return prs.copy.ret(ret).info(inst,info)
      }
      finally { info.push(ret) }
    }
    rep1(inst) {
      const prs = this.rep0(inst)
      if (prs._ret.length > 0) return prs
      prs._info.push(['rep1 empty'])
      throw prs.err
    }
    or(inst) {
      const info = [inst[0]]
      for (let i = 1; i < inst.length; ++i) {
        try {
          const prs = this.inst(inst[i])
          info.push(prs._info,prs._ret)
          return prs.copy.info(inst,info)
        }
        catch (e) { info.push(e._err ? e._info : e) }
      }
      throw this.copy.err.ret(['no option']).info(inst,info)
    }
    and(inst) {
      let prs = this, info = [inst[0]]
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = this.inst(inst[i])
          info.push(prs._info)
        }
        info.push(prs._ret)
        return prs.copy.info(inst,info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw this.copy.err.ret(inst).info(inst,info)
      }
    }
    not(inst) {
      let info, prs = this.copy.ret(inst)
      try { info = [inst[0],this.inst(inst[1])._info] }
      catch (e) { return prs.info(inst,[inst[0],e._err ? e._info : e]) }
      throw prs.err.info(inst,info)
    }

    cmp(inst) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this
      const idx = _endidx + word.length
      let prs = this.copy.endidx(idx)
      if (idx > string.length) throw prs.err.ret(['overflow']).info(inst,inst)
      const slice = string.slice(_endidx,idx)
      prs = prs.ret(slice).info(inst,['cmp',word,slice])
      if (slice == word) return prs
      else throw prs.err
    }
    char(inst) {
      let {copy,_const:{string},_endidx} = this; copy._ret = inst
      if (_endidx >= string.length) {
        throw copy.err.info(inst,['char','overflow'])
      }
      let c = string[_endidx++]
      if (c == '\\') {
        if (_endidx >= string.length) {
          throw copy.err.info(inst,['char','overflow'])
        }
        c = string[_endidx++]
        const sc = special_chars[c]
        if (sc != undefined) c = sc
      }
      return copy.ret(c).endidx(_endidx).info(inst,['char',c])
    }

    txt(inst) { return this.copy.ret(inst[1]).info(inst,inst) }
    ary(inst) {
      let ret = [], info = [inst[0]]
      try {
        for (let i = 1; i < inst.length; ++i) {
          const prs = this.inst(inst[i])
          ret = ret.concat(prs._ret)
          info.push(prs._info)
        }
        return this.copy.ret(ret).info(inst,info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw this.err.ret(ret).info(inst,info)
      }
      finally { info.push(ret) }
    }
    str(inst) {
      let prs
      try { return prs = this.ary(inst) }
      catch (e) { throw prs = e }
      finally {
        const {_ret,_info} = prs
        prs._ret = ''
        for (const i in _ret) prs._ret += _ret[i]
        _info.push(prs._ret)
      }
    }
    fout(inst) {
      let {_ret} = this, info = [inst[0]]
      try {
        for (let i = 1; i < inst.length; ++i) {
          const prs = this.inst(inst[i])
          info.push(prs._info)
          _ret = _ret[prs._ret]
        }
        return this.copy.ret(_ret).info(inst,info)
      }
      catch (e) {
        info.push(e._err ? e._info : e)
        throw this.err.ret(_ret).info(inst,info)
      }
      finally { info.push(_ret) }
    }

    mch(inst) { error('TODO mch'); throw ['TODO',...inst] }

    pad(inst) { error('TODO pad'); throw ['TODO',...inst] }
    stk(inst) { error('TODO stk'); throw ['TODO',...inst] }

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
