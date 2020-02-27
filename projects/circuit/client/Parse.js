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
    "key":true,
    "act":true
  }`)

  return class Parse {

    static get Info() {
      return class Info extends Parse {
        get inst() { return this._const.strs[this._instid] }
        get slice() {
          return this._const.string.slice(this._srtidx,this._endidx)
        }
        get next() {
          return this._const.string.slice(this._srtidx)
        }
        parse(instid,arg) {
          const {_endidx,_const:{map,insts,strs,string,info}} = this
          let ret = arg === undefined ? map[instid][_endidx] : undefined
          if (ret !== undefined) {
            info.push(ret)
            if (ret._err) throw ret._err
            else return ret
          }
          const inst = insts[instid]
          this._const.info = []
          try { return ret = this[inst[0]](inst,arg).copy }
          catch (e) {
            ret = this.copy
            throw ret._err = e
          }
          finally {
            ret._instid = instid
            ret._inst = inst
            ret._srtidx = _endidx
            ret._info = this._const.info
            this._const.info = info
            info.push(ret)
            map[instid][_endidx] = ret
          }
        }
      }
    }

    static init(string,act) {
      const _const = {
        act:{length:0},map:{},
        insts:act.act,
        strs:act.val,
        string:string,
        info: [],
        temp: new this
      }
      for (const i in act.act) _const.map[i] = {}
      _const.temp._const = _const
      _const.temp._endidx = 0
      let prs = _const.temp.copy
      try { return prs.parse(act.start) }
      catch (e) {
        prs._err = e
        prs._info = _const.info
        return prs
      }
    }

    get const() { return this._const }
    get copy() {
      let prs = Object.create(this._const.temp)
      prs._ret = this._ret
      prs._endidx = this._endidx
      return prs
    }
    endidx(endidx) { this._endidx = endidx; return this }

    parse(instid,arg) {
      const {_endidx,_const:{map,insts,strs,string}} = this
      let ret = arg === undefined ? map[instid][_endidx] : undefined
      if (ret !== undefined) {
        if (ret._err) throw ret._err
        else return ret
      }
      const inst = insts[instid]
      try { return ret = this[inst[0]](inst,arg) }
      catch (e) { ret = {_err:e}; throw e }
      finally { map[instid][_endidx] = ret }
    }

    fun(inst,arg) {
      let prs = this
      for (let i = 1; i < inst.length; ++i) {
        prs = prs.parse(inst[i],arg)
        arg = prs._ret
      }
      return prs
    }
    lst(inst,arg) {
      let prs = this, ret = []
      for (let i = 1; i < inst.length; ++i) {
        prs = prs.parse(inst[i],arg)
        ret.push(prs._ret)
      }
      prs = prs.copy
      prs._ret = ret
      return prs
    }
    rep0(inst,arg) {
      let idx, instid = inst[1], prs = this, ret = []
      try {
        do {
          idx = prs._endidx
          prs = prs.parse(instid,arg)
          ret.push(prs._ret)
        } while (prs._endidx > idx)
      }
      finally {
        prs = prs.copy
        prs._ret = ret
        return prs
      }
    }
    rep1(inst,arg) {
      let prs = this.rep0(inst,arg)
      if (prs._ret.length > 0) return prs
      else throw 'fail first case'
    }
    or(inst,arg) {
      let prs = this
      for (let i = 1; i < inst.length; ++i) {
        try { return this.parse(inst[i],arg) }
        catch (e) {}
      }
      throw 'fail all cases'
    }
    and(inst,arg) {
      let prs = this
      for (let i = 1; i < inst.length; ++i) prs = this.parse(inst[i],arg)
      return prs
    }
    not(inst,arg) {
      try { this.parse(inst[1],arg) }
      catch (e) { return this }
      throw 'not'
    }
    cmp(inst,arg) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this, idx = _endidx + word.length
      if (idx > string.length) throw 'string overflow'
      const slice = string.slice(_endidx,idx)
      if (slice == word) {
        arg = this.copy
        arg._ret = slice
        arg._endidx = idx
        return arg
      }
      else throw `match "${word}"`
    }
    mch(inst,arg) {
      return this.cmp(inst,arg)
    }
    char(inst,arg) {
      let {_const:{string},_endidx} = this
      if (_endidx >= string.length) throw 'string overflow'
      let c = string[_endidx++]
      if (c == '\\') {
        if (_endidx >= string.length) throw 'string overflow'
        c = string[_endidx++]
        const sc = special_chars[c]
        if (sc !== undefined) c = sc
      }
      arg = this.copy
      arg._ret = c
      arg._endidx = _endidx
      return arg
    }
    rng(inst,arg) {
      const prs = this.char(inst,arg), c = prs._ret
      if (inst[1] <= c && c <= inst[2]) return prs
      else throw 'out of range'
    }
    txt(inst,arg) {
      arg = this.copy
      arg._ret = inst[1]
      return arg
    }
    ary(inst,arg) {
      let prs = this, ret = []
      for (let i = 1; i < inst.length; ++i) {
        prs = this.parse(inst[i],arg)
        ret = ret.concat(prs._ret)
      }
      prs = prs.copy
      prs._ret = ret
      return prs
    }
    pad(inst,arg) {
      const prs = this.ary(inst,arg)
      prs._ret = [prs._ret]
      return prs
    }
    act(inst,arg) {
      let {act} = this._const, prs = this.ary(inst,arg).copy
      const actid = ++act.length
      act[actid] = prs._ret
      prs._ret = actid
      return prs
    }
    str(inst,arg) {
      let str = '', prs = this.ary(inst,arg), {_ret} = prs
      for (const i in _ret) str += _ret[i]; prs._ret = str
      return prs
    }
    out(inst,arg) {
      let prs = this
      prs = this.parse(inst[1],arg)
      arg = prs._ret
      for (let i = 2; i < inst.length; ++i) {
        const prs = this.parse(inst[i],arg)
        arg = arg[prs._ret]
      }
      prs = prs.copy
      prs._ret = arg
      return prs
    }
    fout(inst,arg) {
      let prs = this, ret = arg
      for (let i = 1; i < inst.length; ++i) {
        prs = this.parse(inst[i],arg)
        ret = ret[prs._ret]
      }
      prs = prs.copy
      prs._ret = ret
      return prs
    }

    map(inst,arg) {
      let prs = this, ret = {}
      for (let i = 1; i < inst.length; ++i) {
        prs = prs.parse(inst[i],arg)
        ret[prs._ret.key] = prs._ret.body
      }
      prs = prs.copy
      prs._ret = ret
      return prs
    }
    key(inst,arg) {
      let prs, ret = {
        key: (prs = this.parse(inst[1],arg))._ret,
        body: (prs = prs.parse(inst[2],arg))._ret
      }
      prs = prs.copy
      prs._ret = ret
      return prs
    }
    stk(inst,arg) {
      let instid = inst[1]
      let prs = this.parse(inst[2],arg)
      let stk = this.parse(inst[3],arg)._ret
      for (const i in stk) {
        const [tok,...args] = stk[i]
        prs = this.parse(instid,[tok,prs._ret,...args])
      }
      return prs
    }
  }
}
