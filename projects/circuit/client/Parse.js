module.exports = Circuit => {

  class Scope {

    static init(
      string, // String
    ) {
      return new this(string,0,null)
    }

    constructor(
      string, // String
      idx, // Number
      parent, // Scope,Null
    ) {
      this.string = string
      this.idx = idx
      this._idx = idx
      this.parent = parent
    }

    get valid() {
      const {idx,string:{length}} = this
      return idx < length
    }

    copy(tok,...args) {
      const {string,idx,parent} = this
      const _scope = new Scope(string,idx,parent)
      return _scope.fun(tok,...args)
    }

    fun(tok,...args) {
      this._tok = tok
      this._input = undefined

      if (tokmap[tok]) {
        return tokmap[tok](this,...args)
      }
      const {idx,string} = this, off = idx + tok.length
      if (string.slice(idx,off) == tok) {
        this.idx = off
        return this.input(tok)
      }
      else return this.error('no match',tok)
    }

    get empty() {
      // called when regex is valid but want to input nothing
      return this
    }

    get next() {
      return this.string[this.idx++]
    }


    input(input) {
      this._input = input
      return this
    }

    get output() {
      const {_input} = this
      if (_input == null) return []
      else if (typeof this == 'string') return [_input]
      else return _input
    }

    error(...args) {
      this._error = args
      return this
    }

  }

  const _tokmap = {

    // regexp operators --------------------------------------------------------

    mainop: {
      range: (scp, low, upr) => {
        const c = scp.next
        if (low <= c && c <= upr) {
          return scp.input(c)
        }
        else return scp.error(c,'not in range',low,upr)
      },

      comp: (scp, ...toks) => {
        const errors = []
        for (const i in toks) {
          const _scp = scp.copy(toks[i])
          if (_scp._error) errors.push(_scp)
          else return _scp
        }
        return scp.error('no comp', ...errors)
      },

      rept: (scp, tok) => {
        const output = []
        while (scp.valid) {
          const _scp = scp.copy(tok)
          if (_scp._error) break

          scp = _scp
          if (scp._input) output.push(scp._input)
        }
        return scp.input(output)
      },

      repf: (scp, tok, ...args) => {
        const output = []
        while (scp.valid) {
          const _scp = scp.copy(tok,...args)
          if (_scp._error) break

          scp = _scp
          if (scp._input) output.push(scp._input)
        }
        return scp.input(output)
      },

      regx: (scp, ...args) => {
        const output = []
        for (const i in args) {
          const arg = args[i]

          if (typeof arg == 'string') scp = scp.fun(arg)
          else scp = scp.fun(...arg)

          if (scp._error) return scp.input(output)
          else if (scp._input) output.push(scp._input)
        }
        return scp.input(output)
      },
    },

    // operator precedence 0 ---------------------------------------------------

    space: {
      _commentsl: { str: 'regx // [endat \n]', empty: true, },
      _commentml: { str: 'regx /* [endat */]', empty: true, },
      _space: { str: 'comp _commentsl _commentml $  \t \n', empty: true, },
      'space*': { str: 'rept _space', empty: true, },
      'space+': { str: 'regx _space space*', empty: true, },
    },
    num: {
      _intdig: { str: 'range 0 9', val: true, },
      _octdig: { str: 'range 0 7', val: true, },
      _hexlow: { str: 'range a f', val: true, },
      _hexupr: { str: 'range A F', val: true, },
      _hexdig: { str: 'comp _intdig _hexlow _hexupr', val: true, },
      hex: {
        str: 'regx 0 [comp x X] _hexdig [rept _hexdig]',
        fun: (scp, z,        x,     dig,         digs) => {
          z += x + dig
          for (const i in digs) z += digs[i]
          return scp.input(['Hex',z])
        },
      },
      float: {
        str: 'regx [rept _intdig] . _intdig [rept _intdig]',
        fun: (scp,          digA, d,   digB,         digC) => {
          let str  = ''
          for (const i in digA) str += digA[i]
          str += d + digB
          for (const i in digC) str += digC[i]
          return scp.input(['Float',str])
        },
      },
      oct: {
        str: 'regx 0 [rept _octdig]',
        fun: (scp, z,         digs) => {
          for (const i in digs) z += digs[i]
          return scp.input(['Oct',z])
        },
      },
      int: {
        str: 'regx _intdig [rept _intdig]',
        fun: (scp,     dig,         digs) => {
          for (const i in digs) dig += digs[i]
          return scp.input(['Int',dig])
        },
      },
      num: { str: 'comp hex float oct int', val: true, },
    },
    var: {
      _ltrlow: { str: 'range a z', val: true, },
      _ltrupr: { str: 'range A Z', val: true, },
      _ltr: { str: 'comp _ _ltrlow _ltrupr', val: true, },
      var: {
        str: 'regx _ltr [repf comp _intdig _ltr]',
        fun: (scp, ltrA,                   ltrB) => {
          for (const i in ltrB) ltrA += ltrB[i]
          return scp.input(['Var',ltrA])
        },
      },
    },
    string : {},

    // operator precedence 1 -----------------------------------------------------

    bracket: {
      _nulltuple: { str: 'regx ( space * )', nam: '_Nulltuple', },
      _halftuple: {
        str: 'repf regx space* , space* rval16',
        // fun: (...[            c,          val]) => {
        //
        // },
      },
      _tuple: {
        str: 'regx ( space* rval16 _halftuple space* )',
        // fun: (regx,a,          val,[]) => {
        //
        // },
      },

      subscope: {
        str: 'regx { space* scope space* }',
        val: true,
      },
    },

    rval1: {
      rval1: {
        str: 'comp var num',
        val: true,
      }
    },

    rval16: {

      rval16: { str: 'comp rval1', val: true, },

    },

    start: {

      statment: {
        str: 'regx rval16 space* ;',
        val: true,
      },
      scope: {
        str: 'comp statment subscope',
        val: true,
      },

      start: {
        str: 'regx space* scope space*',
        val: true,
      }
    }
  }

  const tokmap = {}
  for (const i in _tokmap) {
    const toks = _tokmap[i]

    for (const tok in toks) {
      if (typeof toks[tok] == 'function') {
        tokmap[tok] = toks[tok]
      }
      else {
        let {str,fun,val,empty} = toks[tok]

        let stack = [], scope = [], word = ''
        for (let j = 0; j < str.length; ++j) switch (str[j]) {
          case ' ': if (word) scope.push(word); word = ''; break
          case '[':
          if (word) scope.push(word); word = ''
          stack.push(scope); scope = []; break
          case ']':
          if (word) scope.push(word); word = ''
          const temp = stack.pop(); temp.push(scope); scope = temp
          break
          case '$': ++j
          default: word += str[j]; break
        }
        if (word) scope.push(word)

        if (fun);
        else if (val) fun = (scp,a) => {
          scp = scp.input(a)
          log('val',scp,a,scp._input)
          return scp
        }
        else if (empty) fun = scp => scp.empty
        else fun = (scp,f,...args) => scp.input([f,...args])

        tokmap[tok] = scp => {
          scp = scp.fun(...scope)
          if (scp._error) return scp
          else return fun(scp,...scp.output)
        }
      }

    }
  }

  function Parse(string) {
    const scp = Scope.init(string).copy('start')
    if (scp._error) console.error(scp._idx, scp._error)
    else log(scp)
  }
  return Parse
}
