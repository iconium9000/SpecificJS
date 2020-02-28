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

  return class Lex {

    static get Info() {
      return class Info extends Lex {
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
      let lex = _const.temp.copy
      try { return lex.parse(act.start) }
      catch (e) {
        lex._err = e
        lex._info = _const.info
        return lex
      }
    }

    get const() { return this._const }
    get copy() {
      let lex = Object.create(this._const.temp)
      lex._ret = this._ret
      lex._endidx = this._endidx
      return lex
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
      let lex = this
      for (let i = 1; i < inst.length; ++i) {
        lex = lex.parse(inst[i],arg)
        arg = lex._ret
      }
      return lex
    }
    lst(inst,arg) {
      let lex = this, ret = []
      for (let i = 1; i < inst.length; ++i) {
        lex = lex.parse(inst[i],arg)
        ret.push(lex._ret)
      }
      lex = lex.copy
      lex._ret = ret
      return lex
    }
    rep0(inst,arg) {
      let idx, instid = inst[1], lex = this, ret = []
      try {
        do {
          idx = lex._endidx
          lex = lex.parse(instid,arg)
          ret.push(lex._ret)
        } while (lex._endidx > idx)
      }
      finally {
        lex = lex.copy
        lex._ret = ret
        return lex
      }
    }
    rep1(inst,arg) {
      let lex = this.rep0(inst,arg)
      if (lex._ret.length > 0) return lex
      else throw 'fail first case'
    }
    or(inst,arg) {
      let lex = this
      for (let i = 1; i < inst.length; ++i) {
        try { return this.parse(inst[i],arg) }
        catch (e) {}
      }
      throw 'fail all cases'
    }
    and(inst,arg) {
      let lex = this
      for (let i = 1; i < inst.length; ++i) lex = this.parse(inst[i],arg)
      return lex
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
      const lex = this.char(inst,arg), c = lex._ret
      if (inst[1] <= c && c <= inst[2]) return lex
      else throw 'out of range'
    }
    txt(inst,arg) {
      arg = this.copy
      arg._ret = inst[1]
      return arg
    }
    ary(inst,arg) {
      let lex = this, ret = []
      for (let i = 1; i < inst.length; ++i) {
        lex = this.parse(inst[i],arg)
        ret = ret.concat(lex._ret)
      }
      lex = lex.copy
      lex._ret = ret
      return lex
    }
    pad(inst,arg) {
      const lex = this.ary(inst,arg)
      lex._ret = [lex._ret]
      return lex
    }
    act(inst,arg) {
      let {act} = this._const, lex = this.ary(inst,arg).copy
      const actid = ++act.length
      act[actid] = lex._ret
      lex._ret = actid
      return lex
    }
    str(inst,arg) {
      let str = '', lex = this.ary(inst,arg), {_ret} = lex
      for (const i in _ret) str += _ret[i]; lex._ret = str
      return lex
    }
    out(inst,arg) {
      let lex = this
      lex = this.parse(inst[1],arg)
      arg = lex._ret
      for (let i = 2; i < inst.length; ++i) {
        const lex = this.parse(inst[i],arg)
        arg = arg[lex._ret]
      }
      lex = lex.copy
      lex._ret = arg
      return lex
    }
    fout(inst,arg) {
      let lex = this, ret = arg
      for (let i = 1; i < inst.length; ++i) {
        lex = this.parse(inst[i],arg)
        ret = ret[lex._ret]
      }
      lex = lex.copy
      lex._ret = ret
      return lex
    }

    map(inst,arg) {
      let lex = this, ret = {}
      for (let i = 1; i < inst.length; ++i) {
        lex = lex.parse(inst[i],arg)
        ret[lex._ret.key] = lex._ret.body
      }
      lex = lex.copy
      lex._ret = ret
      return lex
    }
    key(inst,arg) {
      let lex, ret = {
        key: (lex = this.parse(inst[1],arg))._ret,
        body: (lex = lex.parse(inst[2],arg))._ret
      }
      lex = lex.copy
      lex._ret = ret
      return lex
    }
    stk(inst,arg) {
      let instid = inst[1]
      let lex = this.parse(inst[2],arg)
      let stk = this.parse(inst[3],arg)._ret
      for (const i in stk) {
        const [tok,...args] = stk[i]
        lex = this.parse(instid,[tok,lex._ret,...args])
      }
      return lex
    }
  }
}
