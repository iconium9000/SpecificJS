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
      src, // Scope,Null
    ) {
      this.string = string
      this.idx = idx
      this._idx = idx
      this.src = src
      this.map = {}
      this.stats = { count: 0, }
    }

    // get valid() {
    //   const {idx,string:{length}} = this
    //   return idx < length
    // }
    //
    // get copy() {
    //   const {map,stats,string,idx,src} = this
    //   const scp = new Scope(string,idx,this)
    //   scp.map = map
    //   scp.stats = stats
    //   return scp
    // }
    //
    // fun(tok,...args) {
    //   const {idx,map,stats} = this
    //
    //   if (!map[idx]) map[idx] = {}
    //   // else if (map[idx][tok]) return map[idx][tok]
    //   ++stats.count
    //
    //   let scp = this.copy;
    //   scp._tok = tok
    //   scp._input = []
    //   delete scp._error
    //
    //   if (tokmap[tok]) scp = tokmap[tok](scp,...args)
    //   else scp = scp.match(tok)
    //   scp._args = args
    //
    //   const _scp = map[idx][tok]
    //   if (_scp) {
    //     const in1 = _scp._input
    //     const in2 = scp._input
    //     const string1 = JSON.stringify(in1)
    //     const string2 = JSON.stringify(in2)
    //     if (string1 != string2) {
    //       log(map)
    //       throw ['bad',tok,_scp._args,scp._args,in1,in2]
    //     }
    //   }
    //   return map[idx][tok] = scp
    // }
    //
    // match(match) {
    //   const {idx,string} = this, off = idx + match.length
    //   if (string.slice(idx,off) == match) {
    //     this.idx = off
    //     return this.input(match)
    //   }
    //   else return this.error('no match',match)
    // }
    //
    // get empty() {
    //   delete this._input
    //   return this
    // }
    //
    // get next() {
    //   return this.string[this.idx++]
    // }
    //
    // input(input) {
    //   this._input = input
    //   return this
    // }
    //
    // get output() {
    //   const {_input} = this
    //   if (_input == null) return []
    //   else if (typeof this == 'string') return [_input]
    //   else return _input
    // }
    //
    // error(...args) {
    //   this._error = args
    //   return this
    // }
    // get clear() {
    //   delete this._error
    //   return this
    // }
    //
    // filter(filter,...args) {
    //   this._filter = filter
    //   if (this[filter]) return this[filter](...args)
    //   else return this.error('no filter for',filter)
    // }
    //
    // range(low, upr) {
    //   const c = this.next
    //   if (low <= c && c <= upr) return this.input(c)
    //   else return this.error(c,'not in range',low,upr)
    // }
    //
    // endat(tok,skip) {
    //   let str = '', i = this.idx, s = this.string
  	// 	while (i < s.length) {
  	// 		if (s[i] == skip) { str += s[++i]; ++i }
  	// 		else if (s.slice(i,i+tok.length) == tok) {
    //       this.idx = i + tok.length
  	// 			return this.input(str)
  	// 		}
  	// 		else str += s[i++]
  	// 	}
    //   return this.error('endat terminated without',tok)
    // }
    //
    // comp(...toks) {
    //   const errors = []
    //   for (const i in toks) {
    //     const _scp = this.copy.fun(toks[i])
    //     if (_scp._error) errors.push(toks[i], _scp._error)
    //     else return _scp
    //   }
    //   return this.error('comp error',...errors)
    // }
    //
    // repo(tok) {
    //   const _scp = this.copy.fun(tok)
    //   if (_scp.error) return this.empty
    //   else return _scp
    // }
    //
    // rept(tok) {
    //   let scp = this; const output = []
    //   while (scp.valid) {
    //     const _scp = scp.copy.fun(tok)
    //     if (_scp._error) break
    //
    //     scp = _scp
    //     if (scp._input) output.push(scp._input)
    //   }
    //   // log('rept',tok,output)
    //   return scp.input(output)
    // }
    //
    // repf(tok, ...args) {
    //   let scp = this; const output = []
    //   while (scp.valid) {
    //     const _scp = scp.copy.filter(tok,...args)
    //     if (_scp._error) break
    //
    //     scp = _scp
    //     if (scp._input) output.push(scp._input)
    //   }
    //   // log('repf',args,output)
    //   return scp.input(output)
    // }
    //
    // regx(...args) {
    //   let scp = this; const output = []
    //
    //   for (const i in args) {
    //     const arg = args[i]
    //
    //     if (typeof arg == 'string') scp = scp.fun(arg)
    //     else scp = scp.filter(...arg)
    //
    //     // log('regx',arg,scp._input,scp._error)
    //     if (scp._error) return scp.error('regx error',...scp._error)
    //     else if (scp._input) output.push(scp._input)
    //   }
    //   // log('regx',args,output)
    //   return scp.input(output)
    // }

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
        fun: (scp,[z,        x,     dig,         digs]) => {
          z += x + dig
          for (const i in digs) z += digs[i]
          return scp.input(['Hex',z])
        },
      },
      float: {
        str: 'regx [rept _intdig] . _intdig [rept _intdig]',
        fun: (scp,         [digA, d,   digB,         digC]) => {
          let str  = ''
          for (const i in digA) str += digA[i]
          str += d + digB
          for (const i in digC) str += digC[i]
          return scp.input(['Float',str])
        },
      },
      oct: {
        str: 'regx 0 [rept _octdig]',
        fun: (scp,[z,         digs]) => {
          for (const i in digs) z += digs[i]
          return scp.input(['Oct',z])
        },
      },
      int: {
        str: 'regx _intdig [rept _intdig]',
        fun: (scp,    [dig,         digs]) => {
          for (const i in digs) dig += digs[i]
          return scp.input(['Int',dig])
        },
      },
      num: { str: 'comp hex float oct int', },

      _ltrlow: { str: 'range a z', val: true, },
      _ltrupr: { str: 'range A Z', val: true, },
      _ltr: { str: 'comp _ _ltrlow _ltrupr', fun: (scp,[ltr]) => {
        log('_ltr', ltr)
        return scp.input(ltr)
      } },
      var: {
        str: 'regx _ltr [repf comp _intdig _ltr]',
        fun: (scp,[ltrA,ltrB]) => {
          for (const i in ltrB) ltrA += ltrB[i]
          return scp.input(['Var',ltrA])
        },
      },

      string: {
        str: 'regx " [endat " \\]',
        fun: (scp, input) => {
          // TODO make type
          return scp.input(['String',input[1]])
        },
      }
    },

    getval1: {

      array: {
        str: 'regx $[ space* getval17 space* $]',
        fun: (scp, input) => {
          const gotval = input[1]
          // TODO check type
          return scp.input(['Array',...gotval])
        }
      },
      tupleval: {
        str: 'regx ( space* getval16 space* )',
        fun: (scp, input) => scp.input(input[1])
      },
      tuplevar: {
        str: 'regx ( space* getvar16 space* )',
        fun: (scp, input) => scp.input(input[1])
      },

      _getvar1: {
        str: 'comp var',
        fun: (scp, name) => {
          // log('_getvar',name)
          return scp.input(name)
        }
      },
      getvar1: { str: 'comp _getvar1 tuplevar', },
      getval1: {
        str: 'comp num getvar1 array tupleval',
        fun: (scp, input) => {
          // log('getval1',input)
          return scp.input(input)
        }
      },

      defvar: {
        str: 'regx gettype space+ var',
        fun: (scp, [type,gotvar]) => {
          // TODO def type gotvar
          return scp.input([type,gotvar])
        },
      }
    },

    getval2: {
      memop: { str: 'comp . ->' },
      incop: { str: 'comp ++ --', },

      postinc: {
        str: 'regx getvar2 space* incop',
        fun: (scp, [gotvar, op]) => scp.input(['Post'+op,gotvar]),
      },
      fun: {
        str: 'regx ( space* getval17 space* )',
        fun: (scp, input) => scp.input(['Fun',...input[1]]),
      },
      sub: {
        str: 'regx $[ space* getval16 space* $]',
        fun: (scp, input) => scp.input(['Sub',input[1]]),
      },
      mem: { str: 'regx memop space* var', },

      getvar2: {
        str: 'regx [comp _getvar getvar1] [repf comp sub mem]',
        fun: (scp, [gotvar, repvar]) => {
          // log('getvar2', gotvar, repvar)
          return scp.input([gotvar,repvar])
        }
      },

      getval2: {
        str: 'regx [comp postinc getval1] [repf comp fun sub mem]',
        fun: (scp, [gotval, repop]) => {
          // log('getval2', gotval, repop)
          return scp.input(gotval,repop)
        }
      },
    },

    getval3: {

      preinc: {
        str: 'regx incop space* getvar3',
        fun: (scp,[op,gotvar]) => {
          // TODO check type
          return scp.input([op,gotval])
        }
      },

      _val3op: { str: '+ - ! ~' },
      _getval3: {
        str: 'regx _val3op space* getval3',
        fun: (scp,[op,gotval]) => {
          // TODO check type
          return scp.input([op,gotval])
        }
      },

      _refop: { str: '* &' },
      ref: {
        str: 'regx _refop space* getvar3',
        fun: (scp,[op,gotvar]) => {
          // TODO check type
          return scp.input([op,gotvar])
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
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val5op: { str: 'comp * / %' },
      getval5: {
        str: 'regx [repf regx getval4 space* _val5op space*] getval4',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val6op: { str: 'comp + -' },
      getval6: {
        str: 'regx [repf regx getval5 space* _val6op space*] getval5',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val7op: { str: 'comp << >>' },
      getval7: {
        str: 'regx [repf regx getval6 space* _val7op space*] getval6',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval8: {
        str: 'regx [repf regx getval7 space* <=> space*] getval7',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val9op: { str: 'comp < <= >= >' },
      getval9: {
        str: 'regx [repf regx getval8 space* _val9op space*] getval8',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      _val10op: { str: 'comp == !=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval11: {
        str: 'regx [repf regx getval10 space* & space*] getval10',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval12: {
        str: 'regx [repf regx getval11 space* ^ space*] getval11',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval13: {
        str: 'regx [repf regx getval12 space* | space*] getval12',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval14: {
        str: 'regx [repf regx getval13 space* && space*] getval13',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },

      getval15: {
        str: 'regx [repf regx getval14 space* || space*] getval14',
        fun: (scp,[rept, gotval]) => {
          // TODO fix this
          return scp.input([rept,gotval])
        }
      },
    },

    getval16: {

      ternval: {
        str: 'regx getval15 space* ? space* getval16 space* : space* getval16',
        fun: (scp, [bool,op,a,c,b]) => {
          // TODO gettype
          return scp.input(op,bool,a,b)
        }
      },

      ternvar: {
        str: 'regx getval15 space* ? space* getvar16 space* : space* getvar16',
        fun: (scp, [bool,op,a,c,b]) => {
          // TODO gettype
          return scp.input(op,bool,a,b)
        }
      },

      _assignop: { str: 'comp = += -= *= /= %= <<= >>= &= ^= |=' },
      varassign: {
        str: 'regx getvar3 space* _assignop space* getval16',
        fun: (scp,[gotvar,op,gotval]) => {
          log('varassign', gotvar, op, gotval)
          return scp.input([op,gotvar,gotval])
        }
      },
      defassign: {
        str: 'regx getdef space* = space* getval16',
        fun: (scp,[gotdef,op,gotval]) => {
          // TODO gettype
          return scp.input([op,gotdef,gotval])
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
          return scp.input([op,gotval])
        },
      },

      _getval17: { str: 'comp valspread getval16', },
      _repval17: { str: 'regx space* _getval17 space* ,', val: true, },
      getval17: {
        str: 'regx [rept _repval17] space* _getval17 [repo ,]',
        fun: (scp,[rep,gotval]) => {
          // TODO type??
          return scp.input([...rep,gotval])
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
        fun: (scp, input) => scp.input(input[1]),
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
      else if (val) fun = (scp,[val]) => scp.input(val)
      else if (empty) fun = scp => scp.empty
      else fun = (scp,input) => scp.input(input)

      tokmap[tok] = scp => {
        scp = scp.copy.filter(...scope)
        // log('\nfilter',tok,scope,scp.string.slice(scp._idx))
        // if (scp._error) console.error('error',scp._error)
        // if (scp._input) log('input',scp._input)

        if (scp._error) return scp
        scp = fun(scp.copy,scp._input)
        // log('\nfun',tok,"'",scp.string.slice(scp._idx))
        // if (scp._error) console.error('error',scp._error)
        // if (scp._input) log('input',scp._input,'\n')

        return scp
      }
    }
  }

  function Parse(string) {
    let scp = Scope.init(string).fun('getval16')

    if (scp._error) console.error('\n\n\nerror',scp._idx, scp._error)
    else if (scp._input) log('\n\n\noutput',scp._input)

    log(scp)
    // while (scp) {
    //   log('scp',scp._tok,scp._filter,scp._input)
    //   scp = scp.src
    // }
  }
  return Parse
}
