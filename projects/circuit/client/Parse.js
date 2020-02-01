module.exports = Circuit => {

  const {Tok,Operator} = Circuit

  class Prg {

    static init(
      string,tok, // String
    ) {
      const _prg = new this
      _prg._startidx = 0
      _prg._idx = 0
      _prg._depth = 0
      _prg._stats = {
        map: {},
        acts: [],
        string: string,
        copies: 0,
      }
      return _prg.clear.tok(tok).resolveget
    }
    get string() {
      return this._stats.string.slice(this._startidx,this._idx)
    }
    get clear() {
      this._acts = {}
      this._defs = {}
      return this
    }
    get copy() {
      const {_stats,_idx,_depth,_scope,_startidx,_acts,_defs} = this
      const prg = new Prg
      prg._startidx = _startidx; prg._idx = _idx
      prg._stats = _stats
      prg._depth = _depth+1
      prg._scope = _scope; prg._src = this
      prg._acts = _acts; prg._defs = _defs
      prg._myacts = {}
      ++_stats.copies
      return prg
    }
    output(input) {
      const {copy} = this
      copy._output = input
      return copy
    }
    error(...error) {
      const {copy} = this
      copy._error = error
      return copy
    }
    get resolveget() {
      // TODO check for dangling Getvar's
      return this
    }
    get split() {
      return this.copy.clear
    }
    get join() {
      this._myacts = this._acts
      this._mydefs = this._defs
      return this
    }
    get endsplit() {
      this._defs = {}
      return this
    }
    get myacts() {
      const {_acts,_stats:{acts}} = this, myacts = {}
      for (const i in _acts) myacts[_acts[i]] = acts[_acts[i]]
      return myacts
    }
    scope(prg) {
      const {_defs,_acts} = prg, {_myacts,_stats:{acts}} = this
      this._scope = prg; this._defs = prg._defs
      this._acts = Object.assign({},_acts)
      this._defs = Object.assign({},prg._defs,this._mydefs)
      for (const actid in _myacts) {
        this._acts[actid] = Operator(this,..._myacts[actid])
      }
      return this
    }
    newact(...args) {
      const {acts} = this._stats, actid = acts.length
      acts.push(args)
      Operator(this,'Newact',actid)
      return this.output(['Getact',actid])
    }
    getvar(name) {
      switch (name) {
        case 'true': case 'false':
          return this.settype(name == 'true','Boolean')
        case 'null': return this.settype('null','Void')
        default: return this.newact('Getvar',name)
      }
    }
    settype(rawval,typename) {
      return this.newact('Settype',['Nativetype',typename],rawval)
    }
    getop(op,...args) {
      return this.newact(op,...args)
    }
    filter(filter,...args) {
      if (this[filter]) return this[filter](...args)
      else return this.error('filter error',filter)
    }
    map(scope,idx,tok) {
      const {_idx,_stats} = this
      this._tok = tok
      this._startidx = idx
      _stats.map[idx][tok] = this
      return this.scope(scope)
    }
    tok(tok) {
      const {_idx,_stats:{map},_depth} = this
      if (!map[_idx]) map[_idx] = {}
      else if (map[_idx][tok]) return map[_idx][tok].scope(this)
      return Tok(this.split,tok).map(this,_idx,tok)
    }

    get empty() {
      if (this._output || this._error) return this.copy
      else return this
    }

    idx(idx) {
      this._startidx = this._idx
      this._idx = idx
      return this
    }

    match(match) {
      const {_idx,_stats:{string}} = this, off = _idx + match.length
      if (string.slice(_idx,off) == match) return this.output(match).idx(off)
      else return this.error('no match',match)
    }


    range(low, upr) {
      const c = this._stats.string[this._idx]
      if (low <= c && c <= upr) return this.output(c).idx(this._idx+1)
      else return this.error('range error',c,low,upr)
    }

    not(not) {
      const _prg = this.match(not)
      if (_prg._error) return this.empty
      else return this.error('not error',not)
    }

    endat(tok,skip) {
      let output = '', {_idx, _stats:{string}} = this
    	while (_idx < string.length) {
    		if (string[_idx] == skip) { output += string[++_idx]; ++_idx }
    		else if (string.slice(_idx,_idx+tok.length) != tok) {
          output += string[_idx++]
        }
    		else return this.output(output).idx(_idx+tok.length)
    	}
      return this.error('endat error',tok)
    }

    comp(...args) {
      const errors = []
      for (const i in args) {
        const arg = args[i]
        let prg = this

        if (typeof arg == 'string') prg = prg.tok(arg)
        else prg = prg.filter(...arg)

        if (prg._error) errors.push(prg._error)
        else return prg
      }
      return this.error('comp error',...errors)
    }

    regx(...args) {
      let prg = this; const output = []

      for (const i in args) {
        const arg = args[i]

        if (typeof arg == 'string') prg = prg.tok(arg)
        else prg = prg.filter(...arg)

        if (prg._error) return prg.error('regx error', arg, prg._error)
        else if (prg._output) output.push(prg._output)
      }
      return prg.output(output)
    }

    rept(tok) {
      let prg = this; const output = [], {length} = this._stats.string
      while (prg._idx < length) {
        const _prg = prg.tok(tok)
        if (_prg._error) break
        else prg = _prg
        if (prg._output) output.push(prg._output)
      }
      return prg.output(output)
    }

    repf(tok, ...args) {
      let prg = this; const output = [], {length} = this._stats.string
      while (prg._idx < length) {
        const _prg = prg.filter(tok,...args)
        if (_prg._error) break
        else prg = _prg
        if (prg._output) output.push(prg._output)
      }
      return prg.output(output)
    }
  }

  function Parse(string) {
    let prg = Prg.init(string,'start')

    if (prg._error) console.error('\n\n\nerror',prg._idx, prg._error)
    else if (prg._output) log('\n\n\noutput',prg._output)
    if (prg._stats.string.length > prg._idx) console.error('_idx error')
    log(prg)
    log(prg._acts)
  }
  return Parse
}
