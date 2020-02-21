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
    "prs":true,"mch":true,"rep0":true,"rep1":true,"fun":true,"lst":true,
    "or":true,"and":true,"not":true,"char":true,"cmp":true,"txt":true,
    "str":true,"ary":true,"pad":true,"fout":true,"stk":true,
    "out":true,"rng":true,"map":true
  }`)

  return class Parse {
    static init(string,match) {
      const prg = new this
      prg._slice = null
      prg._error = null
      prg._ret = null
      prg._const = {
        str:string,mch:match,
        par:[],acts:[],map:{},tbl:{},
        dup:0,skip:0
      }
      prg._endidx = 0
      return prg
    }
    get _parent() { return this._const.par }
    set _parent(p) { this._const.par = p }
    get _string() { return this._const.str }
    get _table() { return this._const.tbl }
    get _map() { return this._const.map }
    get _acts() { return this._const.acts }
    get _match() { return this._const.mch }
    get _acts() { return this._const.acts }
    get dup() { return this._const.dup }
    set dup(d) { this._dup = this._const.dup = d }
    get skip() { return this._const.skip }
    set skip(k) { this._skip = this._const.skip = k }
    get copy() { ++this.dup; return Object.assign(new Parse,this) }
    get endidx() { return this._endidx }
    get count() {
      let map = {}, {_map} = this, total = 0
      for (const i in _map) total += map[i] = Object.keys(_map[i]).length
      map.__total = total
      return map
    }
    get ncount() {
      let map = {}, {_map} = this, total = 0
      for (const i in _map) {
        for (const j in _map[i]) {
          if (!map[j]) map[j] = 1
          else ++map[j]
          ++total
        }
      }
      map.__total = total
      return map
    }
    get nmap() {
      let map = {}, {_map} = this
      for (const i in _map) {
        for (const j in _map[i]) {
          if (!map[j]) map[j] = {}
          map[j][i] = _map[i][j]
        }
      }
      return map
    }
    idx(idx) {
      this._endidx = idx;
      return this
    }
    ret(ret) {
      this._ret = ret
      return this
    }
    error(...error) {
      this._error = error
      return this
    }

    prs(...args) {
      const [tok,...arg] = args
      // log('prs',tok,...arg)
      const {_parent,_endidx,_string,_map} = this
      this._parent = []

      // const str = JSON.stringify(args)
      // if (_map[str]) {
      //   const ret = _map[str][_endidx]
      //   if (ret) {
      //     ++this.skip
      //     if (ret._error) throw ret
      //     else return ret
      //   }
      // }
      // else _map[str] = {}

      let ret, {time} = Circuit.Lib
      try {
        if (!special_funs[tok]) throw this.copy.error(`parse ${tok}`)
        return ret = this[tok](...arg)
      }
      catch (e) { throw ret = e._error ? e : this.copy.error(e) }
      finally {
        ret = ret.copy
        ret._args = args
        ret._time = Circuit.Lib.time - time
        ret._slice = _string.slice(_endidx,ret._endidx)
        ret._children = this._parent
        _parent.push(ret)
        this._parent = _parent
        // stack.push(new Stack(
        //   args,ret,this.stack,
        //   _string.slice(_endidx,ret._endidx),
        //   Circuit.Lib.time - time
        // ))
        // this.stack = stack
      }
      // finally { _map[str][_endidx] = ret }
    }
    mch(str) {
      const {_endidx,_match,_map} = this
      if (_map[str]) {
        const ret = _map[str][_endidx]
        if (ret) {
          ++this.skip
          if (ret._error) throw ret
          else return ret
        }
      }
      else _map[str] = {}
      let ret, mch = _match[str] || ['cmp',str]
      try { return ret = this.prs(...mch) }
      catch (e) {
        // error('mch',e)
        throw ret = e._error ? e : this.copy.error(e)
      }
      finally { _map[str][_endidx] = ret }
    }
    rep0(arg) {
      let prg = this, {length} = prg._string, ret = []
      try {
        while (prg._endidx < length) {
          prg = prg.prs(...arg)
          ret.push(prg._ret)
        }
      }
      // catch (e) { error(e._error || e) }
      finally { return prg.copy.ret(ret) }
    }
    rep1(arg) {
      let prg = this.prs(...arg), ret = [prg._ret], {length} = prg._string
      try {
        while (prg._endidx < length) {
          prg = prg.prs(...arg)
          ret.push(prg._ret)
        }
      }
      finally { return prg.copy.ret(ret) }
    }
    fun(top,mid) {
      const prg = this.prs(...top).prs(...mid)
      return prg.copy.ret(prg._ret)
    }
    lst(...args) {
      let prg = this
      for (const i in args) {
        prg = prg.prs(...args[i])
        args[i] = prg._ret
      }
      return prg.copy.ret(args)
    }
    or(...args) {
      for (const i in args) {
        try { return this.prs(...args[i]) }
        catch (e) { args[i] = e._error || e }
        // finally { continue }
      }
      throw this.copy.error('or',...args)
    }
    and(...args) {
      let ret = this
      for (const i in args) ret = this.prs(...args[i])
      return ret
    }
    not(arg) {
      try { this.prs(...arg) }
      catch (e) { return this }
      throw this.copy.error('not',...arg)
    }
    char() {
      let {copy,_string,_endidx} = this
      if (_endidx >= _string.length) throw copy.error('char overflow')
      let c = _string[_endidx++]
      if (c == '\\') {
        if (_endidx >= _string.length) throw copy.error('char overflow')
        c = _string[_endidx++]
        const sc = special_chars[c]
        if (sc != undefined) c = sc
      }
      return copy.ret(c).idx(_endidx)
    }
    cmp(str) {
      const {copy,_string,_endidx} = this, idx = _endidx + str.length
      if (idx >= _string.length) throw copy.error('cmp overflow')
      if (_string.slice(_endidx,idx) == str) return copy.ret(str).idx(idx)
      else throw copy.error('cmp',str)
    }
    txt(str) {
      return this.copy.ret(str)
    }
    str(...args) {
      let str = '', prg = this.ary(...args), {_ret} = prg;
      for (const i in _ret) str += _ret[i]
      return prg.copy.ret(str)
    }
    ary(...args) {
      let ary = []
      for (const i in args) ary = ary.concat(this.prs(...args[i])._ret)
      // for (const i in args) ary.push(this.prs(...args[i])._ret)
      return this.copy.ret(ary)
    }
    pad(arg) {
      const prg = this.prs(...arg)
      return prg.copy.ret([prg._ret])
    }
    map(name,fun) {
      name = this.prs(...name)._ret
      fun = this.prs(...fun)._ret
      this._table[name] = fun
      return this.copy.ret(name)
    }
    fout(...args) {
      let {_ret} = this
      for (const i in args) _ret = _ret[args[i]]
      return this.copy.ret(_ret)
    }
    stk(...args) { throw this.copy.error('TODO','stk',...args) }
    out(...args) { throw this.copy.error('TODO','out',...args) }
    rng(low,hgh) { throw this.copy.error('TODO','rng',low,hgh) }
  }
}
