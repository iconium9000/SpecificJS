module.exports = Circuit => {

  class Prg {
    static init(string) {
      const prg = new this
      prg._map = []
      prg._acts = []
      prg._string = string
      prg._startidx = 0
      prg._endidx = 0
      return prg
    }
    get acts() { return this._acts.slice() }
    get map() { return this._map }
    get copy() {
      const copy = Object.create(this)
      return copy
    }
    error(...args) {
      // error('error',...args)
      this._error = args
      return this
    }
    output(arg) {
      // log('output',arg)
      this._output = arg
      return this
    }

    parse(key,...args) {
      // log('parse',key,...args)
      if (this[key]) return this[key](...args)
      else throw this.copy.error(`list key '${key}'`,...args)
    }

    tok(tok) {
      const {_map,_endidx} = this
      while (_map.length <= _endidx) _map.push({})
      const prg = _map[_endidx][tok]
      if (prg != undefined) {
        if (prg._error) throw prg
        else return prg
      }
      try {
        if (!Circuit.Tok[tok]) throw `tok ${tok}`
        return _map[_endidx][tok] = this.parse(...Circuit.Tok[tok])
      }
      catch (e) { throw _map[_endidx][tok] = e._error ? e : this.error(e) }
    }
    match(string) {
      const {_string,_map,_endidx} = this
      while (_map.length <= _endidx) _map.push({})
      let prg = _map[_endidx][string]
      if (prg != undefined) {
        if (prg._error) throw prg
        else return prg
      }
      const newidx = _endidx + string.length
      if (_string.slice(_endidx,newidx) == string) {
        prg = this.copy
        prg._endidx = newidx
        return _map[_endidx][string] = prg.output(string)
      }
      else throw _map[_endidx][string] = this.copy.error('match',string)
    }
    list(...args) {
      let prg = this
      for (const i in args) {
        prg = prg.parse(...args[i])
        args[i] = prg._output
      }
      return prg.copy.output(args)
    }
    fun(test,fun) { return this.parse(...test).parse(...fun) }
    ary(...args) {
      const {copy} = this, ary = []
      for (const i in args) {
        const {_output} = this.parse(...args[i])
        ary.push(..._output)
      }
      return copy.output(ary)
    }
    act(...args) {
      const act = []
      for (const i in args) {
        const {_output} = this.parse(...args[i])
        act.push(..._output)
      }
      return this.dumbact(...act)
    }
    dumbact(...args) {
      const {copy} = this
      return copy.output(['Getact',copy._acts.push(args)-1])
    }
    txt(txt) { return this.copy.output([txt]) }
    txtsum(...args) {
      let txt = ''
      for (const i in args) {
        const {_output} = this.parse(...args[i])
        for (const j in _output) txt += _output[j]
      }
      return this.copy.output([txt])
    }
    lookup(tok,...args) {
      let {_output} = this
      for (const i in args) _output = _output[args[i]]
      return this.copy.output(tok == '@' ? _output : [_output])
    }
    stack() {
      const [val,opvals] = this._output
      let copy = this.copy.output(val)
      for (const i in opvals) {
        const [op,next] = opvals[i]
        copy = copy.dumbact(op,copy._output,next)
      }
      return copy
    }
    empty() { return this.copy.output('') }
    range(low,high) {
      const c = this._string[this._endidx]
      const {copy} = this
      if (low <= c && c <= high) {
        ++copy._endidx
        return copy.output(c)
      }
      else throw copy.error('range',low,high)
    }

    ['*'] (toparse) {
      let idx, prg = this, args = []
      try {
        do {
          idx = prg._endidx
          prg = prg.parse(...toparse)
          args.push(prg._output)
        } while (prg._endidx > idx)
      }
      finally {
        return prg.copy.output(args)
      }
    }
    ['+'] (toparse) {
      let idx, prg = this, args = []
      prg = prg.parse(...toparse)
      args.push(prg._output)
      try {
        do {
          idx = prg._endidx
          prg = prg.parse(...toparse)
          args.push(prg._output)
        } while (prg._endidx > idx)
      }
      finally { return prg.copy.output(args) }
    }
    ['|'] (...args) {
      for (const i in args) {
        try { return this.parse(...args[i]) }
        catch (e) { continue }
      }
      throw this.copy.error('|',...args)
    }
    ['!'] (endkey) {
      let {copy} = this, string = ''
      do {
        const c = copy._string[copy._endidx]
        if (c == '\\') string += c + copy._string[++copy._endidx] // TODO \\
        else try {
          return copy.parse(...endkey).copy.output(string)
        } catch (e) { string += c }
      } while (++copy._endidx < copy._string.length)

      throw copy.error('!',endkey)
    }
  }


  return function Parse(string) {
    log('Parse')
    let prg = Prg.init(string)

    try {
      prg = prg.tok('start')
    }
    catch (e) {
      error(e)
    }
    log(prg,prg.acts)
    if (prg._error) error(...prg._error)
    else log(prg._output)
  }
}
