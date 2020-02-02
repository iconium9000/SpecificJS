module.exports = Circuit => {

  const _tokmap = {

    // operator precedence 0 ---------------------------------------------------

    space: {
      _commentsl: { str: 'regx // [endat \n]', empty: true, },
      _commentml: { str: 'regx /$* [endat $*/]', empty: true, },
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
      _int: {
        str: 'regx _intdig [rept _intdig]',
        fun: (prg, [dig, digs]) => {
          for (const i in digs) dig += digs[i]
          return prg.output(dig)
        },
      },
      _float: {
        str: 'regx [rept _intdig] . _int',
        fun: (prg, [repdig, d, int]) => {
          let str = ''; for (const i in repdig) str += repdig[i]
          return prg.output(str+d+int)
        },
      },
      hex: {
        str: 'regx 0 [comp x X] _hexdig [rept _hexdig]',
        fun: (prg,[z, x, dig, digs]) => {
          for (const i in digs) dig += digs[i]
          return prg.rawval(parseInt(dig,16),'Int')
        },
      },
      _sci: {
        str: 'regx [comp $+ -] _int',
        fun: (prg, [op, int]) => prg.output(op+int)
      },
      sci: {
        str: 'regx [comp _float _int] e [comp _sci _int]',
        fun: (prg,[float,e,pow]) => prg.rawval(parseFloat(float+e+pow),'Float')
      },
      float: {
        str: 'comp _float',
        fun: (prg, float) => prg.rawval(parseFloat(float),'Float')
      },
      oct: {
        str: 'regx 0 [rept _octdig]',
        fun: (prg,[z, digs]) => {
          for (const i in digs) z += digs[i]
          return prg.rawval(parseInt(z,8),'Int')
        },
      },
      int: {
        str: 'comp _int',
        fun: (prg, int) => prg.rawval(parseInt(int),'Int')
      },
      num: { str: 'comp hex sci float oct int', },

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
        fun: (prg, [q,string]) => {
          // TODO parse string
          return prg.rawval(string,'String')
        },
      }
    },

    getval1: {

      array: {
        str: 'regx $[ space* getval17 space* $]',
        fun: (prg, [q,gotval]) => prg.newact('Op','Array',gotval)
      },
      tupleval: {
        str: 'regx ( space* getval16 space* )',
        fun: (prg, [p,gotval]) => prg.output(gotval)
      },
      tuplevar: {
        str: 'regx ( space* getvar16 space* )',
        fun: (prg, [p,gotvar]) => prg.output(gotvar)
      },

      _getvar1: { str: 'comp var', fun: (prg, name) => prg.getvar(name) },
      getvar1: { str: 'comp _getvar1 tuplevar', },
      getval1: { str: 'comp num string getvar1 array tupleval', },

      addrop: {
        str: 'regx space* [comp $* $&]',
        fun: (prg,op) => prg.output(op)
      },
      arrayop: {
        str: 'regx space* $[ space* getval16 space* $]',
        fun: (prg, [p,gotvar]) => prg.output(['[]',gotvar])
      },
      voidfun: {
        str: 'regx space* ( space* )',
        fun: prg => prg.output(['()'])
      },
      _funop: {
        str: 'regx space* , space* gettype',
        fun: (prg, [c,gottype]) => prg.output(gottype)
      },
      funop: {
        str: 'regx space* ( space* gettype [rept _funop] space* )',
        fun: (prg, [p,gottype,reptypes]) => {
          return prg.output(['()',gottype,...reptypes])
        }
      },
      gettype: {
        str: 'regx var [repf comp addrop arrayop voidfun funop]',
        fun: (prg, [typename,ops]) => {
          prg = prg.newact('Gettype',typename)
          for (const i in ops) {
            const [op,...info] = ops[i]
            prg = prg.newact('Nativetemp',op,prg._output,...info)
          }
          return prg
        }
      },
      vardef: {
        str: 'regx gettype space* var',
        fun: (prg, [gottype,varname]) => {
          prg = prg.newact('Vardef',gottype,varname)
          const [newact,actid] = prg._output
          prg._defs = Object.assign({},prg._defs,{[varname]:actid})
          return prg
        },
      }
    },

    getval2: {
      memop: { str: 'comp . ->' },
      incop: { str: 'comp $+$+ --', },

      postinc: {
        str: 'regx space* getvar2 space* incop',
        fun: (prg, [gotvar, op]) => prg.newact('Op','Post'+op,gotvar),
      },
      callfun: {
        str: 'regx space* ( space* getval17 space* )',
        fun: (prg, input) => prg.output(['Callfun',input[1]])
      },
      subspt: {
        str: 'regx space* $[ space* getval16 space* $]',
        fun: (prg, input) => prg.output(['Subscrpt',input[1]])
      },
      _mem: { str: 'regx memop space* var', },

      _getvar2: {
        str: 'regx getval1 [comp subspt _mem] [repf comp subspt _mem]',
        fun: (prg, [gotvar, [op,...args], repop]) => {
          prg = prg.newact('Op',op,gotvar,...args)
          if (prg._error) return prg
          else gotvar = prg._output
          for (const i in repop) {
            const [op,...args] = repop[i]
            prg = prg.newact('Op',op,gotvar,...args)
            if (prg._error) return prg
            else gotvar = prg._output
          }
          return prg.output(gotvar)
        }
      },

      getvar2: { str: 'comp _getvar2 getvar1' },

      getval2: {
        str: 'regx [comp postinc getval1] [repf comp callfun subspt _mem]',
        fun: (prg, [gotval, repop]) => {
          for (const i in repop) {
            const [op,...args] = repop[i]
            prg = prg.newact('Op',op,gotval,...args)
            if (prg._error) return prg
            else gotval = prg._output
          }
          return prg.output(gotval)
        }
      },
    },

    getval3: {

      preinc: {
        str: 'regx incop space* getvar3',
        fun: (prg,[op,gotvar]) => prg.newact('Op','Pre'+op,gotvar)
      },

      _val3op: { str: 'comp $+ - $! ~' },
      _getval3: {
        str: 'regx _val3op space* getval3',
        fun: (prg,[op,gotval]) => prg.newact('Op','Pre'+op,gotval)
      },

      _refop: { str: 'comp $* &' },
      ref: {
        str: 'regx _refop space* getval3',
        fun: (prg,[op,gotvar]) => prg.newact('Op','Pre'+op,gotvar)
      },

      getval3: { str: 'comp preinc ref _getval3 getval2'},
      getvar3: { str: 'comp ref getvar2' },
    },

    getval4_15: {
      _val4op: { str: 'regx memop $*', fun: (prg,[op,s]) => prg.output(op+s) },
      getval4: {
        str: 'regx [repf regx getval3 space* _val4op space*] getval3',
        midfx: true,
      },
      _val5op: { str: 'comp $* / %' },
      getval5: {
        str: 'regx [repf regx getval4 space* _val5op space*] getval4',
        midfx: true,
      },
      _val6op: { str: 'comp $+ -' },
      getval6: {
        str: 'regx [repf regx getval5 space* _val6op space*] getval5',
        midfx: true,
      },
      _val7op: { str: 'comp << >>' },
      getval7: {
        str: 'regx [repf regx getval6 space* _val7op space*] getval6',
        midfx: true,
      },
      getval8: {
        str: 'regx [repf regx getval7 space* <=> space*] getval7',
        midfx: true,
      },
      _val9op: { str: 'comp < <= >= >' },
      getval9: {
        str: 'regx [repf regx getval8 space* _val9op space*] getval8',
        midfx: true,
      },
      _val10op: { str: 'comp == $!=' },
      getval10: {
        str: 'regx [repf regx getval9 space* _val10op space*] getval9',
        midfx: true,
      },
      getval11: {
        str: 'regx [repf regx getval10 space* & [not &] space*] getval10',
        midfx: true,
      },
      getval12: {
        str: 'regx [repf regx getval11 space* ^ space*] getval11',
        midfx: true,
      },
      getval13: {
        str: 'regx [repf regx getval12 space* $| [not $|] space*] getval12',
        midfx: true,
      },
      getval14: {
        str: 'regx [repf regx getval13 space* && space*] getval13',
        midfx: true,
      },
      getval15: {
        str: 'regx [repf regx getval14 space* $|$| space*] getval14',
        midfx: true,
      },
    },

    getval16: {

      ternval: {
        str: 'regx getval15 space* ? space* getval16 space* : space* getval16',
        fun: (prg, [bool,op,a,c,b]) => prg.newact('Op',op,bool,a,b)
      },

      ternvar: {
        str: 'regx getval15 space* ? space* getvar16 space* : space* getvar16',
        fun: (prg, [bool,op,a,c,b]) => prg.newact('Op',op,bool,a,b),
      },

      _opassign: { str: 'regx [comp $+ - $* / % << >> & ^ $|] =' },
      opassign: {
        str: 'regx getvar3 space* _opassign space* getval16',
        fun: (prg,[gotvar,[op,eq],gotval]) => {
          prg = prg.newact('Op',op,gotvar,gotval)
          return prg.newact('Op',eq,gotvar,prg._output)
        }
      },


      varassign: {
        str: 'regx getvar3 space* = space* getval16',
        fun: (prg,[gotvar,op,gotval]) => prg.newact('Op',op,gotvar,gotval),
      },
      defassign: {
        str: 'regx vardef space* = space* getval16',
        fun: (prg,[gotdef,op,gotval]) => prg.newact('Op',op,gotdef,gotval),
      },


      getval16: { str: 'comp ternval varassign opassign getval15' },
      getvar16: { str: 'comp ternvar getvar3' },
    },

    getval17: {

      valspread: {
        str: 'regx ... space* getval16',
        fun: (prg,[op,gotval]) => prg.newact('Op',op,gotval),
      },

      _getval17: { str: 'comp valspread getval16', },
      _repval17: { str: 'regx space* _getval17 space* ,', val: true, },
      getval17: {
        str: 'regx [rept _repval17] space* _getval17',
        fun: (prg,[rep,gotval]) => prg.newact('Op',',',...rep,gotval),
      },

    },

    scope: {

      ifop: {
        str: 'regx if space* ( space* getval16 space* ) space* scope',
        fun: (prg,[op,p,gotval,q,scope]) => prg.newact('Op',op,gotval,scope)
      },
      ifelse: {
        str: 'regx ifop space* else space* scope',
        fun: (prg,[ifop,op,scope]) => prg.newact('Op',op,ifop,scope)
      },
      whileop: {
        str: 'regx while space* ( space* getval16 space* ) space* scope',
        fun: (prg,[op,p,gotval,q,scope]) => prg.newact('Op',op,gotval,scope),
      },
      _loopscope: {
        str: 'regx space* { space* [rept _repscope] space* }',
        fun: (prg,[p,repscope]) => prg.output(repscope)
      },
      _doop: {
        str: 'regx while space* ( space* getval16 space* )',
        fun: (prg,[op,p,gotval]) => prg.output(gotval)
      },
      doop: {
        str: 'regx do _loopscope space* _doop',
        fun: (prg,[op,_loopscope,bool]) => {
          return prg.newact('Op',op,bool,..._loopscope).endsplit
        }
      },
      _forop: { str: 'regx space* getval16 space*', val: true },
      forop: {
        str: 'regx for space* ( statement _forop ; _forop ) _loopscope',
        fun: (prg,[op,p,stat,bool,itr,q,loopscope]) => {
          return prg.newact('Op',op,bool,stat,itr,...loopscope).endsplit
        }
      },
      loop: { str: 'comp ifop ifelse whileop forop doop', },

      _statement: {
        str: 'comp varassign defassign vardef typedef getval16',
      },
      statement: {
        str: 'regx [comp [regx space* _statement space*] space*] ;',
        fun: (prg,arg) => {
          if (arg.length == 1) return prg.rawval('null','Void')
          else return prg.output(arg[0][0])
        }
      },
      scope: { str: 'comp loop subscope statement' },
      _repscope: { str: 'regx space* scope', val: true, },
      repscope: {
        str: 'rept _repscope',
        fun: (prg,rept) => prg.output(rept).endsplit
      },
      subscope: {
        str: 'regx { space* repscope space* }',
        fun: (prg, input) => prg.newact('Op','Scope',...input[1]),
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
      let {str,fun,val,empty,midfx,scope} = toks[tok]

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
      else if (midfx) fun = (prg,[rept, gotval]) => {
        const stack = []
        while (rept.length) {
          const [repval,op] = rept.pop()
          stack.push([op,gotval])
          gotval = repval
        }
        while (stack.length) {
          const [op,repval] = stack.pop()
          prg = prg.newact('Op',op,gotval,repval)
          if (prg._error) return prg
          else gotval = prg._output
        }
        return prg.output(gotval)
      }
      else fun = (prg,input) => prg.output(input)

      tokmap[tok] = [fun,filter,scope]
    }
  }

  return function Tok(prg,tok) {
    if (tokmap[tok]) {
      const [fun,filter] = tokmap[tok]

      prg = prg.filter(...filter)
      if (prg._error) return prg

      prg = fun(prg, prg._output)
      if (prg._error) return prg

      return prg.join
    }
    else return prg.match(tok)
  }
}
