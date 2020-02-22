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

  const noprint = {
    // lst:true,
    or:true,
    cmp:true,//txt:true,char:true,
    // rep0:true,rep1:true,fun:true,and:true,not:true,
  }

  return class Parse {
    static init(string,insts,strs) {
      const prs = new this
      prs._err = undefined
      prs._ret = undefined
      prs._const = {
        map:{},act:[],match:{},stack:[],trace:[],strs:strs,
        string: string,insts:insts,
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
    err(...err) {
      this._err = err
      return this
    }

    inst(instid) {
      const {_endidx,_const:{map,insts,stack,trace}} = this
      if (map[instid]) {
        const ret = map[instid][_endidx]
        if (ret === undefined);
        else if (ret._err) throw ret
        else return ret
      }
      else map[instid] = {}

      let ret, inst = insts[instid]
      stack.push(instid)
      this._const.trace = []

      try {
        if (!special_funs[inst[0]]) throw inst
        return ret = this[inst[0]](inst)
      }
      catch (e) {
        throw ret = (e._err ? e.copy : this.copy.err('inst',e)).srtidx(_endidx)
      }
      finally {
        // log('inst',ret,...stack,inst)
        // if (ret._err) {
          // error(...ret._err)
          // const [tok] = ret._err
          // if (!noprint[tok]) log(inst,instid,...ret._err)
        // }
        // else log(ret._ret)

        trace.push(Object.assign(ret.copy,{
          _inst: inst, _instid: instid,
          _trace: this._const.trace,
        }))
        this._const.trace = trace

        stack.pop()
        map[instid][_endidx] = ret
      }
    }

    rep0(inst) {
      const instid = inst[1], ret = []
      let prs = this, {_endidx} = this
      try {
        while (true) {
          prs = prs.inst(instid)
          ret.push(prs._ret)
          if (_endidx >= prs._endidx) throw 'underflow'
          _endidx = prs._endidx
        }
      }
      finally { return prs.copy.ret(ret) }
    }
    rep1(inst) {
      const prs = this.rep0(inst); prs._inst = inst
      if (prs._ret.length > 0) return prs
      else throw prs.err('rep1','underflow')
    }
    fun(inst) {
      let prs = this
      for (let i = 1; i < inst.length; ++i) prs = prs.inst(inst[i])
      return prs
    }
    and(inst) {
      let prs = this
      for (let i = 1; i < inst.length; ++i) prs = this.inst(inst[i])
      return prs
    }
    not(inst) {
      for (let i = 1; i < inst.length; ++i) {
        try { this.inst(inst[i]) }
        catch (e) { continue }
        throw this.copy.err('not',inst)
      }
      return this
    }
    lst(inst) {
      let prs = this, ret = []
      for (let i = 1; i < inst.length; ++i) {
        prs = prs.inst(inst[i])
        ret.push(prs._ret)
      }
      return prs.copy.ret(ret)
    }
    or(inst) {
      for (let i = 1; i < inst.length; ++i) {
        try { return this.inst(inst[i]) }
        catch (e) {}
      }
      throw this.copy.err('or','overflow')
    }
    cmp(inst) {
      const word = inst[1]
      const {_endidx,_const:{string}} = this
      const idx = _endidx + word.length
      const prs = this.copy.endidx(idx)
      if (idx > string.length) throw prs.err('cmp','overflow')
      if (string.slice(_endidx,idx) == word) {
        return prs.ret(word)
      }
      else throw prs.err('cmp',word)
    }
    txt(inst) { return this.copy.ret(inst[1]).set(this,inst,[]) }
    char(inst) {
      let {copy,_const:{string},_endidx} = this
      if (_endidx >= string.length) throw copy.err('char','overflow')
      let c = string[_endidx++]
      if (c == '\\') {
        if (_endidx >= string.length) throw copy.err('char','overflow')
        c = string[_endidx++]
        const sc = special_chars[c]
        if (sc != undefined) c = sc
      }
      return copy.ret(c).endidx(_endidx)
    }

    mch(inst) { throw this.copy.err('TODO mch') }
    str(inst) {
      let str = '', prs = this.ary(inst), {_ret} = prs
      for (const i in _ret) str += _ret[i]
      return prs.ret(str)
    }
    ary(inst) {
      let ret = []
      for (let i = 1; i < inst.length; ++i) {
        ret = ret.concat(this.inst(inst[i])._ret)
      }
      return this.copy.ret(ret)
    }
    pad(inst) {
      let prs = this.ary(inst)
      return prs.ret([prs._ret])
    }
    fout(inst) {
      let {_ret} = this
      for (let i = 1; i < inst.length; ++i) _ret = _ret[this.inst(inst[i])]
      return this.copy.ret(_ret)
    }
    stk(inst) { throw this.copy.err('TODO stk') }

    out(inst) { throw this.copy.err('TODO out') }
    rng(inst) { throw this.copy.err('TODO rng') }
    map(inst) { throw this.copy.err('TODO map') }
    act(inst) { throw this.copy.err('TODO act') }
  }
}
