module.exports = Circuit => {

  class Scope {

    static init(
      string, // String
    ) {
      const _scp = new this
      _scp.idx = 0
      _scp.depth = 0
      _scp.stats = {
        map: {},
        string: string
      }
      return _scp
    }

    get copy() {
      const {stats,idx,depth} = this
      const scp = new Scope
      scp._idx = scp.idx = idx
      scp.stats = stats
      scp.depth = depth+1
      return scp
    }

    get umap() {
      const scp = this.copy
      scp._output = this._output
      scp._error = this._error
      return scp
    }
    map(idx,tok) {
      return this.stats.map[idx][tok] = this.umap
    }

    tok(tok) {
      const {idx,stats:{map},depth} = this

      if (!map[idx]) map[idx] = {}
      else if (map[idx][tok]) return map[idx][tok].umap

      let scp = this
      if (tokmap[tok]) {
        const [fun,filter] = tokmap[tok]

        scp = scp.copy.filter(...filter)
        if (scp._error) return scp.map(idx,tok)

        scp = fun(scp.copy, scp._output)
        if (scp._error) return scp.map(idx,tok)

        return scp.map(idx,tok)
      }
      else return scp.match(tok).map(idx,tok)
    }

    filter(filter,...args) {
      if (this[filter]) return this[filter](...args)
      else return this.error('filter error',filter)
    }

    get valid() {
      return this.idx < this.stats.string.length
    }

    get next() {
      return this.stats.string[this.idx++]
    }

    get empty() {
      if (this._output) throw ['bad empty', this]
      return this
    }

    output(input) {
      const {_output,_error} = this
      if (_output) {
        const scp = this.copy
        scp._output = input
        scp._error = _error
        return scp
      }
      this._output = input
      return this
    }
    error(...error) {
      const {_output,_error} = this
      if (_error) {
        const scp = this.copy
        scp._error = error
        scp._output = _output
        return scp
      }
      this._error = error
      return this
    }

    match(match) {
      const {idx,stats:{string}} = this, off = idx + match.length
      if (string.slice(idx,off) == match) {
        this.idx = off
        return this.output(match)
      }
      else return this.error('no match',match)
    }


    range(low, upr) {
      const c = this.next
      if (low <= c && c <= upr) return this.output(c)
      else return this.error(c,'not in range',low,upr)
    }

    endat(tok,skip) {
      let str = '', i = this.idx, s = this.stats.string
    	while (i < s.length) {
    		if (s[i] == skip) { str += s[++i]; ++i }
    		else if (s.slice(i,i+tok.length) == tok) {
          this.idx = i + tok.length
    			return this.output(str)
    		}
    		else str += s[i++]
    	}
      return this.error('endat error',tok)
    }

    comp(...toks) {
      const errors = []
      for (const i in toks) {
        const tok = toks[i]
        const _scp = this.copy.tok(tok)
        if (_scp._error) errors.push(tok, _scp._error)
        else return _scp
      }
      return this.error('comp error',...errors)
    }

    regx(...args) {
      let scp = this; const output = []

      for (const i in args) {
        const arg = args[i]

        if (typeof arg == 'string') scp = scp.copy.tok(arg)
        else scp = scp.copy.filter(...arg)

        if (scp._error) return scp.error('regx error', arg, ...scp._error)
        else if (scp._output) output.push(scp._output)
      }
      return scp.output(output)
    }

    rept(tok) {
      let scp = this; const output = []

      while (scp.valid) {
        const _scp = scp.copy.tok(tok)
        if (_scp._error) break

        scp = _scp; if (scp._output) output.push(scp._output)
      }
      return scp.output(output)
    }

    repf(tok, ...args) {
      let scp = this; const output = []
      while (scp.valid) {
        const _scp = scp.copy.filter(tok,...args)
        if (_scp._error) break

        scp = _scp
        if (scp._output) output.push(scp._output)
      }

      return scp.output(output)
    }
  }

  const _tokmap = {

    // operator precedence 0 ---------------------------------------------------

    space: {
      _commentsl: { str: 'regx // [endat \n]', empty: true, },
      _commentml: { str: 'regx /* [endat */]', empty: true, },
      _space: { str: 'comp _commentsl _commentml $  \t \n', empty: true, },
      'space*': { str: 'rept _space', empty: true, },
      'space+': { str: 'regx _space space*', empty: true, },
    },
    native_types: {
      _intdig: { str: 'range 0 9', val: true, },
      _octdig: { str: 'range 0 7', val: true, },
      _hexlow: { str: 'range a f', val: true, },
      _hexupr: { str: 'range A F', val: true, },
      _hexdig: { str: 'comp _intdig _hexlow _hexupr', val: true, },
      hex: {
        str: 'regx 0 [comp x X] _hexdig [rept _hexdig]',
        fun: (scp,[z, x, dig, digs]) => {
          z += x + dig
          for (const i in digs) z += digs[i]
          return scp.output(['Hex',z])
        },
      },
      float: {
        str: 'regx [rept _intdig] . _intdig [rept _intdig]',
        fun: (scp, [digA, d, digB, digC]) => {
          let str  = ''
          for (const i in digA) str += digA[i]
          str += d + digB
          for (const i in digC) str += digC[i]
          return scp.output(['Float',str])
        },
      },
      oct: {
        str: 'regx 0 [rept _octdig]',
        fun: (scp,[z, digs]) => {
          for (const i in digs) z += digs[i]
          // TODO type
          return scp.output(['Oct',z])
        },
      },
      int: {
        str: 'regx _intdig [rept _intdig]',
        fun: (scp, [dig, digs]) => {
          for (const i in digs) dig += digs[i]
          // TODO type
          return scp.output(['Int',dig])
        },
      },
      num: { str: 'comp hex float oct int', },

      _ltrlow: { str: 'range a z', val: true, },
      _ltrupr: { str: 'range A Z', val: true, },
      _ltr: { str: 'comp _ _ltrlow _ltrupr', val: true, },
      var: {
        str: 'regx _ltr [repf comp _intdig _ltr]',
        fun: (scp,[ltrA,ltrB]) => {
          for (const i in ltrB) ltrA += ltrB[i]
          return scp.output(['Var',ltrA])
        },
      },

      string: {
        str: 'regx " [endat " \\]',
        fun: (scp, input) => {
          // TODO make type
          return scp.output(['String',input[1]])
        },
      }
    },

    getval1: {

      array: {
        str: 'regx $[ space* getval17 space* $]',
        fun: (scp, input) => {
          const gotval = input[1]
          // TODO check type
          return scp.output(['Array',...gotval])
        }
      },
      tupleval: {
        str: 'regx ( space* getval16 space* )',
        fun: (scp, input) => scp.output(input[1])
      },
      tuplevar: {
        str: 'regx ( space* getvar16 space* )',
        fun: (scp, input) => scp.output(input[1])
      },

      _getvar1: {
        str: 'comp var',
        fun: (scp, name) => {
          // log('_getvar',name)
          return scp.output(name)
        }
      },
      getvar1: { str: 'comp _getvar1 tuplevar', },
      getval1: { str: 'comp num getvar1 array tupleval', },

      defvar: {
        str: 'regx gettype space+ var',
        fun: (scp, [type,gotvar]) => {
          // TODO def type gotvar
          return scp.output([type,gotvar])
        },
      }
    },

    getval2: {
      memop: { str: 'comp . ->' },
      incop: { str: 'comp ++ --', },

      postinc: {
        str: 'regx getvar2 space* incop',
        fun: (scp, [gotvar, op]) => scp.output(['Post'+op,gotvar]),
      },
      fun: {
        str: 'regx ( space* getval17 space* )',
        fun: (scp, input) => {
          return scp.output(['Fun',...input[1]])
        },
      },
      sub: {
        str: 'regx $[ space* getval16 space* $]',
        fun: (scp, input) => scp.output(['Sub',input[1]]),
      },
      mem: { str: 'regx memop space* var', },

      getvar2: {
        str: 'regx getval1 [repf comp sub mem]',
        fun: (scp, [gotvar, repvar]) => {
          for (const i in repvar) {
            const [op,...args] = repvar[i]
            gotvar = [op, gotvar,...args]
          }
          return scp.output(gotvar)
        }
      },

      getval2: {
        str: 'regx [comp postinc getval1] [repf comp fun sub mem]',
        fun: (scp, [gotval, repop]) => {
          for (const i in repop) {
            const [op,...args] = repop[i]
            gotval = [op, gotval,...args]
          }
          return scp.output(gotval)
        }
      },
    },

    getval3: {

      preinc: {
        str: 'regx incop space* getvar3',
        fun: (scp,[op,gotvar]) => {
          // TODO check type
          return scp.output(['Pre'+op,gotvar])
        }
      },

      _val3op: { str: 'comp + - ! ~' },
      _getval3: {
        str: 'regx _val3op space* getval3',
        fun: (scp,[op,gotval]) => {
          // TODO check type
          return scp.output(['Pre'+op,gotval])
        }
      },

      _refop: { str: 'comp * &' },
      ref: {
        str: 'regx _refop space* getvar3',
        fun: (scp,[op,gotvar]) => {
          // TODO check type
          return scp.output([op,gotvar])
        }
      },

      getval3: { str: 'comp preinc ref _getval3 getval2'},
      getvar3: { str: 'comp ref getvar2' },
    },

    getval4_15: {
      _val4op: { str: 'regx memop *', val: true, },
      getval4: {
        str: 'regx [repf regx getval3 space* _val4op space*] getval3',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val5op: { str: 'comp * / %' },
      getval5: {
        str: 'regx [repf regx getval4 space* _val5op space*] getval4',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val6op: { str: 'comp + -' },
      getval6: {
        str: 'regx [repf regx getval5 space* _val6op space*] getval5',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val7op: { str: 'comp << >>' },
      getval7: {
        str: 'regx [repf regx getval6 space* _val7op space*] getval6',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval8: {
        str: 'regx [repf regx getval7 space* <=> space*] getval7',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val9op: { str: 'comp < <= >= >' },
      getval9: {
        str: 'regx [repf regx getval8 space* _val9op space*] getval8',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval11: {
        str: 'regx [repf regx getval10 space* & space*] getval10',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval12: {
        str: 'regx [repf regx getval11 space* ^ space*] getval11',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval13: {
        str: 'regx [repf regx getval12 space* | space*] getval12',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval14: {
        str: 'regx [repf regx getval13 space* && space*] getval13',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },

      getval15: {
        str: 'regx [repf regx getval14 space* || space*] getval14',
        fun: (scp,[rept, gotval]) => {
          const stack = []
          while (rept.length) {
            const [repval,op] = rept.pop()
            stack.push([op,gotval])
            gotval = repval
          }
          while (stack.length) {
            const [op,repval] = stack.pop()
            gotval = [op,gotval,repval]
          }
          return scp.output(gotval)
        }
      },
    },

    getval16: {

      ternval: {
        str: 'regx getval15 space* ? space* getval16 space* : space* getval16',
        fun: (scp, [bool,op,a,c,b]) => {
          // TODO gettype
          return scp.output(op,bool,a,b)
        }
      },

      ternvar: {
        str: 'regx getval15 space* ? space* getvar16 space* : space* getvar16',
        fun: (scp, [bool,op,a,c,b]) => {
          // TODO gettype
          return scp.output(op,bool,a,b)
        }
      },

      _assignop: { str: 'comp = += -= *= /= %= <<= >>= &= ^= |=' },
      varassign: {
        str: 'regx getvar3 space* _assignop space* getval16',
        fun: (scp,[gotvar,op,gotval]) => {
          // log('varassign', gotvar, op, gotval)
          return scp.output([op,gotvar,gotval])
        }
      },
      defassign: {
        str: 'regx getdef space* = space* getval16',
        fun: (scp,[gotdef,op,gotval]) => {
          // TODO gettype
          return scp.output([op,gotdef,gotval])
        }
      },

      getval16: { str: 'comp ternval varassign getval15' },
      getvar16: { str: 'comp ternvar getvar3' },
    },

    getval17: {

      valspread: {
        str: 'regx ... space* getval16',
        fun: (scp,[op,gotval]) => {
          // TODO typedef
          return scp.output([op,gotval])
        },
      },

      _getval17: { str: 'comp valspread getval16', },
      _repval17: { str: 'regx space* _getval17 space* ,', val: true, },
      getval17: {
        str: 'regx [rept _repval17] space* _getval17',
        fun: (scp,[rep,gotval]) => {
          return scp.output([...rep,gotval])
        },
      },

    },

    scope: {

      _statement: { str: 'comp varassign defassign newvar newtype callfun' },
      statement: {
        str: 'regx space* _statement space* ;',
        val: true,
      },

      scope: { str: 'comp statement subscope', },
      _repscope: { str: 'regx space* scope', val: true, },
      repscope: { str: 'rept _repscope' },
      subscope: {
        str: 'regx { space* repscope space* }',
        fun: (scp, input) => scp.output(input[1]),
      },

      start: {
        str: 'regx repscope space*',
      }
    }
  }

  const tokmap = {}
  for (const i in _tokmap) {
    const toks = _tokmap[i]

    for (const tok in toks) {
      let {str,fun,val,empty} = toks[tok]

      if (!str) throw tok

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
      else if (val) fun = (scp,[val]) => scp.output(val)
      else if (empty) fun = scp => scp.empty
      else fun = (scp,input) => scp.output(input)

      tokmap[tok] = [fun,scope]
    }
  }

  function Parse(string) {
    let scp = Scope.init(string).tok('getval16')

    if (scp._error) console.error('\n\n\nerror',scp._idx, scp._error)
    else if (scp._output) log('\n\n\noutput',scp._output)
    log(scp)
  }
  return Parse
}
