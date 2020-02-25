module.exports = Circuit => {

  const special_chars = {
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
    "out":true,
    "stk":true,

    "rng":true,
    "map":true,
    "act":true
  }`)

  return class Parse {

    static init(string,insts,strs) {
      const prs = new this
      prs._instid = -1
      prs._inst = ['start']
      prs._info = []
      prs._ret = undefined
      prs._err = false
      prs._endidx = 0
      const map = {}
      for (const i in insts) map[i] = {}
      prs._const = {
        acts:[],mch:{},map:map,
        string:string,
        insts:insts,
        strs:strs,
      }
      return prs
    }

    get copy() { return Object.assign(new Parse,this) }
    info(info) { this._info = info; return this }
    ret(ret) { this._ret = ret; return this }
    endidx(endidx) { this._endidx = endidx; return this }
    err(err) {
      if (err._err) return err.copy
      const prs = this.copy
      prs._err = err
      return prs
    }

    parse(instid,arg) {
      const {_endidx,_const:{map,insts,strs,string}} = this
      let ret = arg === undefined ? map[instid][_endidx] : undefined
      if (ret !== undefined) {
        if (ret._err) throw ret.copy
        else return ret.copy
      }
      const inst = insts[instid], [fun] = inst
      try {
        if (!special_funs[fun]) throw `!special_funs[${fun}]`
        else return ret = this[fun](inst,arg)
      }
      catch (e) { throw ret = this.err(e) }
      finally {
        ret._instid = instid
        ret._inst = inst
        ret._arg = arg
        ret._srtidx = _endidx
        ret._str = strs[instid]
        ret._slice = string.slice(_endidx,ret._endidx)
        ret._string = string.slice(_endidx)
        if (arg === undefined) map[instid][_endidx] = ret
      }
    }

    fun(inst,arg) {
      let prs = this, info = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          info.push(prs = prs.parse(inst[i],arg))
          arg = prs._ret
        }
        return prs = prs.copy
      }
      catch (e) { info.push(e); throw prs = prs.err(e) }
      finally { prs._info = info }
    }
    lst(inst,arg) {
      let prs = this, info = [], ret = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          info.push(prs = prs.parse(inst[i],arg))
          ret.push(prs._ret)
        }
        return prs = prs.copy
      }
      catch (e) { info.push(e); throw prs = prs.err(e) }
      finally { prs._ret = ret; prs._info = info }
    }
    rep0(inst,arg) {
      let idx, instid = inst[1], prs = this, info = [], ret = []
      try {
        do {
          idx = prs._endidx
          info.push(prs = prs.parse(instid,arg))
          ret.push(prs._ret)
        } while (prs._endidx > idx)
        throw 'no progress'
      }
      catch (e) { info.push(prs.err(e)); return prs = prs.copy }
      finally { prs._ret = ret; prs._info = info }
    }
    rep1(inst,arg) {
      let prs = this.rep0(inst,arg)
      if (prs._ret.length > 0) return prs
      else throw prs.err('fail first case')
    }
    or(inst,arg) {
      const info = []
      for (let i = 1; i < inst.length; ++i) {
        try {
          const prs = this.parse(inst[i],arg)
          info.push(prs)
          return prs.copy.info(info)
        }
        catch (e) { info.push(e) }
      }
      const prs = this.err('fail all cases')
      delete prs._ret
      prs._info = info
      throw prs
    }
    and(inst,arg) {
      let prs = this, info = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          info.push(prs = this.parse(inst[i],arg))
        }
        return prs.copy.info(info)
      }
      catch (e) { info.push(e); throw prs.err(e).info(info) }
    }
    not(inst,arg) {
      let prs
      try { prs = this.parse(inst[1],arg) }
      catch (e) { e = this.err(e); return this.copy.ret(e._err).info([e]) }
      throw prs.err('not').info([prs])
    }

    cmp(inst,arg) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this, idx = _endidx + word.length
      if (idx > string.length) throw 'string overflow'
      const slice = string.slice(_endidx,idx)
      try {
        if (slice == word) return arg = this.copy
        else throw arg = this.err(`match "${word}"`)
      }
      finally { arg._ret = slice; arg._info = []; arg._endidx = idx }
    }
    char(inst,arg) {
      let {_const:{string},_endidx} = this
      if (_endidx >= string.length) throw this.err('char overflow')
      let c = string[_endidx++]
      if (c == '\\') {
        if (_endidx >= string.length) throw this.err('char overflow')
        c = string[_endidx++]
        const sc = special_chars[c]
        if (sc !== undefined) c = sc
      }
      return this.copy.ret(c).endidx(_endidx).info([])
    }

    txt(inst,arg) { return this.copy.ret(inst[1]).info([]) }
    ary(inst,arg) {
      let prs, ret = [], info = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = this.parse(inst[i],arg)
          info.push(prs)
          ret = ret.concat(prs._ret)
        }
        return prs = this.copy
      }
      catch (e) { info.push(e); throw prs = this.err(e) }
      finally { prs._ret = ret; prs._info = info }
    }
    str(inst,arg) {
      let str = '', prs = this.ary(inst,arg), {_ret} = prs
      for (const i in _ret) str += _ret[i]; prs._ret = str
      return prs
    }
    out(inst,arg) {
      let prs, info = []
      try {
        info.push(prs = this.parse(inst[1],arg)); arg = prs._ret
        for (let i = 2; i < inst.length; ++i) {
          prs = this.parse(inst[i],arg)
          info.push(prs)
          arg = arg[prs._ret]
        }
        return prs = this.copy
      }
      catch (e) { info.push(e); throw prs = this.err(e) }
      finally { prs._ret = arg; prs._info = info }
    }
    fout(inst,arg) {
      let prs, info = []
      try {
        for (let i = 1; i < inst.length; ++i) {
          prs = this.parse(inst[i],arg)
          info.push(prs)
          arg = arg[prs._ret]
        }
        return prs = this.copy
      }
      catch (e) { info.push(e); throw prs = this.err(e) }
      finally { prs._ret = arg; prs._info = info }
    }
    pad(inst,arg) {
      const prs = this.ary(inst,arg)
      prs._ret = [prs._ret]
      return prs
    }

    map(inst,arg) {
      let word,value,prs,info = []
      try {
        info.push(word = this.parse(inst[1],arg))
        info.push(value = this.parse(inst[2],arg))
        this._const.mch[word._ret] = value._ret
        return prs = this.copy
      }
      catch (e) { info.push(e); throw this.err(e) }
      finally { prs._ret = word && word._ret; prs._info = info }
    }
    mch(inst,arg) {
      error('TODO mch');
      throw this.err(['TODO',inst,arg]).info(arg)
    }
    stk(inst,arg) {
      let instid = inst[1], prs = this, stk, info = []
      try {
        info.push(prs = this.parse(inst[2],arg))
        info.push(stk = this.parse(inst[3],arg))
        stk = stk._ret
        for (const i in stk) {
          const [tok,...args] = stk[i]
          prs = this.parse(instid,[tok,prs._ret,...args])
        }
        return prs = prs.copy
      }
      catch (e) { info.push(e); throw prs = prs.err(e) }
      finally { prs._info = info }
    }
    rng(inst,arg) {
      error('TODO rng');
      throw this.err(['TODO',inst,arg]).info(arg)
    }
    act(inst,arg) {
      error('TODO act');
      throw this.err(['TODO',inst,arg]).info(arg)
    }
  }
}
