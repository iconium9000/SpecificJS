module.exports = Circuit => {

  class Prg {

    static init(
      string, // String
    ) {
      const _prg = new this
      _prg._idx = 0
      _prg._depth = 0
      _prg._stats = {
        map: {},
        string: string,
        copies: 0,
      }
      return _prg
    }

    get copy() {
      const {_stats,_idx,_depth,_scope} = this
      const prg = new Prg
      prg._idx = _idx
      prg._stats = _stats
      prg._depth = _depth+1
      prg._scope = _scope
      prg._src = this
      ++_stats.copies
      return prg
    }

    get push() {
      return this
    }
    get pop() {
      this._pop = true
      return this
    }
    scope(prg) {
      this._scope = prg
      return this
    }
    getvar(name) {

    }
    vardef(name,input) {

    }
    gettype(name) {

    }
    typedef(name,input) {

    }

    filter(filter,...args) {
      if (this[filter]) return this[filter](...args)
      else return this.error('filter error',filter)
    }

    map(idx,tok) {
      const {_idx,_stats} = this
      if (idx < _idx) {
        this._range = _stats.string.slice(idx,_idx)
        log('range',tok,this._range)
      }
      this._tok = tok
      this._startidx = idx
      _stats.map[idx][tok] = this
      return this
    }

    tok(tok) {
      const {_idx,_stats:{map},_depth} = this

      if (!map[_idx]) map[_idx] = {}
      else if (map[_idx][tok]) return map[_idx][tok].scope(this)

      let prg = this
      if (tokmap[tok]) {
        const [fun,filter,scope] = tokmap[tok]

        if (scope) prg = prg.push

        prg = prg.filter(...filter)
        if (prg._error) return prg.map(_idx,tok)

        prg = fun(prg, prg._output)
        if (prg._error) return prg.map(_idx,tok)

        if (scope) prg = prg.pop
        return prg.map(_idx,tok)
      }
      else return prg.match(tok).map(_idx,tok)
    }

    get empty() {
      if (this._output || this._error) return this.copy
      else return this
    }

    idx(idx) {
      this._idx = idx
      return this
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

    comp(...toks) {
      const errors = []
      for (const i in toks) {
        const tok = toks[i]
        const _prg = this.tok(tok)
        if (_prg._error) errors.push(tok, _prg._error)
        else return _prg
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
        fun: (prg,[z, x, dig, digs]) => {
          z += x + dig
          for (const i in digs) z += digs[i]
          return prg.output(['Hex',z])
        },
      },
      float: {
        str: 'regx [rept _intdig] . _intdig [rept _intdig]',
        fun: (prg, [digA, d, digB, digC]) => {
          let str  = ''
          for (const i in digA) str += digA[i]
          str += d + digB
          for (const i in digC) str += digC[i]
          return prg.output(['Float',str])
        },
      },
      oct: {
        str: 'regx 0 [rept _octdig]',
        fun: (prg,[z, digs]) => {
          for (const i in digs) z += digs[i]
          // TODO type
          return prg.output(['Oct',z])
        },
      },
      int: {
        str: 'regx _intdig [rept _intdig]',
        fun: (prg, [dig, digs]) => {
          for (const i in digs) dig += digs[i]
          // TODO type
          return prg.output(['Int',dig])
        },
      },
      num: { str: 'comp hex float oct int', },

      _ltrlow: { str: 'range a z', val: true, },
      _ltrupr: { str: 'range A Z', val: true, },
      _ltr: { str: 'comp _ _ltrlow _ltrupr', val: true, },
      var: {
        str: 'regx _ltr [repf comp _intdig _ltr]',
        fun: (prg,[ltrA,ltrB]) => {
          for (const i in ltrB) ltrA += ltrB[i]
          return prg.output(ltrA)
        },
      },

      string: {
        str: 'regx " [endat " \\]',
        fun: (prg, input) => {
          // TODO make type
          return prg.output(['String',input[1]])
        },
      }
    },

    getval1: {

      array: {
        str: 'regx $[ space* getval17 space* $]',
        fun: (prg, input) => {
          const gotval = input[1]
          // TODO check type
          return prg.output(['Array',...gotval])
        }
      },
      tupleval: {
        str: 'regx ( space* getval16 space* )',
        fun: (prg, input) => prg.output(input[1])
      },
      tuplevar: {
        str: 'regx ( space* getvar16 space* )',
        fun: (prg, input) => prg.output(input[1])
      },

      _getvar1: {
        str: 'comp var',
        fun: (prg, name) => {
          // log('_getvar',name)
          return prg.output(['Getvar',name])
        }
      },
      getvar1: { str: 'comp _getvar1 tuplevar', },
      getval1: { str: 'comp num getvar1 array tupleval', },

      repref: {
        str: 'regx space* * [repf regx space* *]',
        fun: (prg, [op,{length}]) => prg.output([op,1+length])
      },
      repadd: {
        str: 'regx space* & [repf regx space* &]',
        fun: (prg, [op,{length}]) => prg.output([op,1+length])
      },
      _repsub: {
        str: 'regx space* $[ space* int space* $]',
        fun: (prg, [a,i,b]) => prg.output(i),
      },
      repsub: {
        str: 'regx _repsub [rept _repsub]',
        fun: (prg, [int,ints]) => prg.output(['Sub',int,...ints]),
      },
      gettype: {
        str: 'regx var [comp repref repadd repsub space+]',
        fun: (prg, [gettype, ops]) => {
          log('gettype',gettype,ops)
          return prg.output(['Type',gettype,...(ops || [])])
        }
      },
      vardef: {
        str: 'regx gettype space* var',
        fun: (prg, [gottype,gotvar]) => {
          return prg.output(['vardef',gottype,gotvar])
        },
      }
    },

    getval2: {
      memop: { str: 'comp . ->' },
      incop: { str: 'comp ++ --', },

      postinc: {
        str: 'regx space* getvar2 space* incop',
        fun: (prg, [gotvar, op]) => prg.output(['Post'+op,gotvar]),
      },
      fun: {
        str: 'regx space* ( space* getval17 space* )',
        fun: (prg, input) => {
          return prg.output(['Fun',...input[1]])
        },
      },
      sub: {
        str: 'regx space* $[ space* getval16 space* $]',
        fun: (prg, input) => prg.output(['Sub',input[1]]),
      },
      mem: { str: 'regx memop space* var', },

      getvar2: {
        str: 'regx getval1 [repf comp sub mem]',
        fun: (prg, [gotvar, repvar]) => {
          for (const i in repvar) {
            const [op,...args] = repvar[i]
            gotvar = [op, gotvar,...args]
          }
          return prg.output(gotvar)
        }
      },

      getval2: {
        str: 'regx [comp postinc getval1] [repf comp fun sub mem]',
        fun: (prg, [gotval, repop]) => {
          for (const i in repop) {
            const [op,...args] = repop[i]
            gotval = [op, gotval,...args]
          }
          return prg.output(gotval)
        }
      },
    },

    getval3: {

      preinc: {
        str: 'regx incop space* getvar3',
        fun: (prg,[op,gotvar]) => {
          // TODO check type
          return prg.output(['Pre'+op,gotvar])
        }
      },

      _val3op: { str: 'comp + - ! ~' },
      _getval3: {
        str: 'regx _val3op space* getval3',
        fun: (prg,[op,gotval]) => {
          // TODO check type
          return prg.output(['Pre'+op,gotval])
        }
      },

      _refop: { str: 'comp * &' },
      ref: {
        str: 'regx _refop space* getvar3',
        fun: (prg,[op,gotvar]) => {
          // TODO check type
          return prg.output([op,gotvar])
        }
      },

      getval3: { str: 'comp preinc ref _getval3 getval2'},
      getvar3: { str: 'comp ref getvar2' },
    },

    getval4_15: {
      _val4op: { str: 'regx memop *', val: true, },
      getval4: {
        str: 'regx [repf regx getval3 space* _val4op space*] getval3',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val5op: { str: 'comp * / %' },
      getval5: {
        str: 'regx [repf regx getval4 space* _val5op space*] getval4',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val6op: { str: 'comp + -' },
      getval6: {
        str: 'regx [repf regx getval5 space* _val6op space*] getval5',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val7op: { str: 'comp << >>' },
      getval7: {
        str: 'regx [repf regx getval6 space* _val7op space*] getval6',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval8: {
        str: 'regx [repf regx getval7 space* <=> space*] getval7',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val9op: { str: 'comp < <= >= >' },
      getval9: {
        str: 'regx [repf regx getval8 space* _val9op space*] getval8',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval11: {
        str: 'regx [repf regx getval10 space* & [not &] space*] getval10',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval12: {
        str: 'regx [repf regx getval11 space* ^ space*] getval11',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval13: {
        str: 'regx [repf regx getval12 space* | [not |] space*] getval12',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval14: {
        str: 'regx [repf regx getval13 space* && space*] getval13',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },

      getval15: {
        str: 'regx [repf regx getval14 space* || space*] getval14',
        fun: (prg,[rept, gotval]) => {
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
          return prg.output(gotval)
        }
      },
    },

    getval16: {

      ternval: {
        str: 'regx getval15 space* ? space* getval16 space* : space* getval16',
        fun: (prg, [bool,op,a,c,b]) => {
          return prg.output([op,bool,a,b])
        }
      },

      ternvar: {
        str: 'regx getval15 space* ? space* getvar16 space* : space* getvar16',
        fun: (prg, [bool,op,a,c,b]) => {
          // TODO gettype
          return prg.output([op,bool,a,b])
        }
      },

      _assignop: { str: 'comp = += -= *= /= %= <<= >>= &= ^= |=' },
      varassign: {
        str: 'regx getvar3 space* _assignop space* getval16',
        fun: (prg,[gotvar,op,gotval]) => {
          // log('varassign', gotvar, op, gotval)
          return prg.output([op,gotvar,gotval])
        }
      },
      defassign: {
        str: 'regx vardef space* = space* getval16',
        fun: (prg,[gotdef,op,gotval]) => {
          // TODO gettype
          return prg.output([op,gotdef,gotval])
        }
      },

      getval16: { str: 'comp ternval varassign getval15' },
      getvar16: { str: 'comp ternvar getvar3' },
    },

    getval17: {

      valspread: {
        str: 'regx ... space* getval16',
        fun: (prg,[op,gotval]) => {
          // TODO typedef
          return prg.output([op,gotval])
        },
      },

      _getval17: { str: 'comp valspread getval16', },
      _repval17: { str: 'regx space* _getval17 space* ,', val: true, },
      getval17: {
        str: 'regx [rept _repval17] space* _getval17',
        fun: (prg,[rep,gotval]) => {
          return prg.output([...rep,gotval])
        },
      },

    },

    scope: {

      _statement: { str: 'comp varassign defassign vardef typedef getval16' },
      statement: {
        str: 'regx space* _statement space* ;',
        val: true,
      },

      scope: { str: 'comp statement subscope', },
      _repscope: { str: 'regx space* scope', val: true, },
      repscope: { str: 'rept _repscope', scope: true, },
      subscope: {
        str: 'regx { space* repscope space* }',
        fun: (prg, input) => prg.output(input[1]),
      },

      start: {
        str: 'regx repscope space*',
        fun: (prg, [input]) => {
          const {_stats,_idx} = prg, {length} = prg._stats.string
          if (_idx < length) {
            const string = _stats.string.slice(_idx)
            return prg.error('unexpected char at', _idx, string)
          }
          else return prg.output(input)
        }
      }
    }
  }

  const tokmap = {}
  for (const i in _tokmap) {
    const toks = _tokmap[i]

    for (const tok in toks) {
      let {str,fun,val,empty,scope} = toks[tok]

      if (!str) throw tok

      let stack = [], filter = [], word = ''
      for (let j = 0; j < str.length; ++j) switch (str[j]) {
        case ' ': if (word) filter.push(word); word = ''; break
        case '[':
        if (word) filter.push(word); word = ''
        stack.push(filter); filter = []; break
        case ']':
        if (word) filter.push(word); word = ''
        const temp = stack.pop(); temp.push(filter); filter = temp
        break
        case '$': ++j
        default: word += str[j]; break
      }
      if (word) filter.push(word)

      if (fun);
      else if (val) fun = (prg,input) => prg.output(input[0])
      else if (empty) fun = prg => prg.empty
      else fun = (prg,input) => prg.output(input)

      tokmap[tok] = [fun,filter,scope]
    }
  }

  function Parse(string) {
    let prg = Prg.init(string).tok('start')

    if (prg._error) console.error('\n\n\nerror',prg.__idx, prg._error)
    else if (prg._output) log('\n\n\noutput',prg._output)
    if (prg._stats.string.length > prg._idx) console.error('_idx error')
    log(prg)
  }
  return Parse
}
