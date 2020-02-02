module.exports = Circuit => {

  const nativetypes = {
    Int: {},
    Float: {},
    Void: {},
    String: {},
    Boolean: {},
    '*': {},
    '&': {},
  }
  const nativetemps = {
    '*': (prg) => {},
    '&': (prg) => {},
    '()': (prg,returntype,...argtypes) => {
      const _returntype = Operator(prg,...returntype)
      const _argtypes = []
      for (const i in argtypes) {
        const _argtype = Operator(prg,...argtypes[i])
        _argtypes.push(_argtype)
      }
      log(prg._acts, prg._stats.acts)
      throw ['Nativetype','()',_returntype,_argtypes,returntype,argtypes]
    },
    '[]': (prg,type,info) => {},
  }

  function gettype([tok,type]) {
    return type[0] == '_Getact' ? type[1] : type
  }

  const _def = (prg,...args) => {
    const type = ['Badtype','Defop']

    for (const i in args) type.push(gettype(args[i]))

    return type
  }
  const _opmap = {
    '+': null,
    '-': null,
    '%': null,
    '/': null,
    '*': null,
    '!': null,
    '~': null,
    '&': null,
    '|': null,
    'Pre+': null,
    'Pre-': null,
    'Pre*': null,
    'Pre&': null,
    'Pre++': null,
    'Pre--': null,
    'Post++': null,
    'Post--': null,
    '?': null,
    '<': null,
    '>': null,
    '<=': null,
    '>=': null,
    '==': null,
    '!=': null,
    '<=>': null,
    '=': null,
    '&&': null,
    '||': null,
    'if': null,
    'else': null,
    'while': null,
    'do': null,
    ',': null,
    ';': null,
    '{}': null,
    '()': null,
    '[]': null,
    'Array': null,
  }
  for (const i in _opmap) if (_opmap[i] == null) _opmap[i] = _def

  const opmap = {
    Newact: (prg,actid) => {
      const act = prg._stats.acts[actid]
      if (act[0] == 'Newact') return ['Badop',['Badtype',...act]]
      return prg._acts[actid] = Operator(prg,...act)
    },
    Getact: (prg,actid) => {
      let act = prg._acts[actid]
      if (act == null) {
        act = prg._stats.acts[actid]
        act = prg._acts[actid] = Operator(prg,...act)
      }
      log('Getact',act)
      return act
    },
    // Getact: (prg,actid) => Operator(prg,'_Getact',null,actid),
    // _Getact: (prg,type,actid) => {
    //   let act = prg._acts[actid]
    //   if (act == null) {
    //     act = prg._stats.acts[actid]
    //     act = prg._acts[actid] = Operator(prg,...act)
    //   }
    //   log('_Getact',act)
    //   return act
    //   type = act[1]
    //   return ['_Getact',type,actid]
    // },
    Settype: (prg,type,rawval) => ['Settype',type,rawval],
    Badop: (prg,...args) => ['Badop',...args],
    Vardef: (prg,type,varname) => Operator(prg,'_Vardef',null,type,varname),
    _Vardef: (prg,type,gettype,varname) => {
      type = Operator(prg,...gettype), [tok,toktype] = type
      if (tok == '_Getact') type = toktype
      return ['_Vardef',type,gettype,varname]
    },
    Gettype: (prg,typename) => {
      if (nativetypes[typename]) return ['Nativetype',typename]
      throw ['Gettype',typename]
    },
    Nativetype: (prg,typename) => ['Nativetype',typename],
    Nativetemp: (prg,compname,type,...info) => {
      return nativetemps[compname](prg,type,...info)
    },
    Getvar: (prg,varname) => {
      return Operator(prg,'_Getvar',['Badtype','Getvar',varname])
    },
    _Getvar: (prg,type) => {
      const [badtype,getvar,varname] = type
      const actid = prg._defs[varname]
      if (actid == null) return ['_Getvar',type]
      const [tok,_type] = Operator(prg,'Getact',actid)
      return Operator(prg,'Getdef',_type,actid)
    },
    Getdef: (prg,type,actid) => {
      return ['Getdef',type,actid]
    },
    Op: (prg,op,...args) => Operator(prg,'_Op',null,op,...args),
    _Op: (prg,type,op,...args) => {
      // throw [type,op,...args]
      let flag = false; type = []
      const _args = []
      for (const i in args) {
        const arg = Operator(prg,...args[i]), _type = gettype(arg)
        flag = flag || _type[0] == 'Badtype'
        type.push(_type)
        _args.push(arg)
      }
      if (flag) return ['_Op',['Badtype',...type],op,..._args]
      return ['_Op',_opmap[op](prg,..._args),op,..._args]
    },
  }


  function Operator(prg,tok,...args) {
    if (opmap[tok]) return opmap[tok](prg,...args)
    throw ['badop',tok,...args]
    return Operator(prg,'Badop',['Badtype',tok,...args])
  }
  return Operator
}
