module.exports = Circuit => {

  function matchtypes(...types) {
    const _types = {}, {length} = types
    for (const i in types) _types[i] = JSON.stringify(types[i])
    for (let i = 0; i < length-1; ++i) {
      for (let j = i+1; j < length; ++j) {
        if (_types[i] != _types[j]) return false
      }
    }
    return true
  }

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
    '()': (prg,...gottypes) => {
      const type = ['Nativetype','()']
      for (const i in gottypes) type.push(gottypes[i][1])
      return type
    },
    '[]': (prg,[got,type],[tok,sizetype,actid]) => {
      if (type[0] == 'Badtype') return ['Badtype','[]',type]
      else if (sizetype != 'Nativetype,Int') {
        return ['Badtype','[]','sizetype',sizetype]
      }
      else if (tok != '_Getact') return ['Badtype','[]','getact',tok]
      const [_tok,_sizetype,rawval] = prg._acts[actid]
      if (_tok != 'Rawval') return ['Badtype','[]','getsize',_tok]
      else if (rawval > 0) return ['Nativetype','[]',type,rawval]
      else return ['Badtype','[]','sizeerror',rawval]
    },
  }

  const _def = (prg,...args) => {
    const type = ['Badtype','Defop',...args]
    return type
  }
  function boolmatch(prg,bool,scope) {
    if (bool == 'Nativetype,Boolean') return ['Nativetype','Boolean']
    else return ['Badtype','typematch',bool]
  }
  function match1(nativetype) {
    return (prg,a) => nativetype ? ['Nativetype',nativetype] : a
  }
  function match2(nativetype) {
    return (prg,a,b) => {
      if (matchtypes(a,b)) return nativetype ? ['Nativetype',nativetype] : a
      else return ['Badtype','typematch',a,b]
    }
  }
  const _opmap = {
    '+': match2(),
    '-': match2(),
    '%': match2(),
    '/': match2(),
    '*': match2(),
    '!': match1('Boolean'),
    '~': match1(),
    '&': match2(),
    '|': match2(),
    'Pre+': match1(),
    'Pre-': match1(),
    'Pre*': null,
    'Pre&': null,
    'Pre++': match1(),
    'Pre--': match1(),
    'Post++': match1(),
    'Post--': match1(),
    '?': null,
    '<': match2('Boolean'),
    '>': match2('Boolean'),
    '<=': match2('Boolean'),
    '>=': match2('Boolean'),
    '==': match2('Boolean'),
    '!=': match2('Boolean'),
    '<=>': match2('Int'),
    '=': match2(),
    '&&': match2(),
    '||': match2(),
    'if': boolmatch,
    'else': boolmatch,
    'while': boolmatch,
    'do': boolmatch,
    'for': boolmatch,
    ',': null,
    'Scope': match1('Void'),
    'Callfun': null,
    'Subscrpt': null,
    'Array': null,
  }
  for (const i in _opmap) if (_opmap[i] == null) _opmap[i] = _def

  const opmap = {
    Newact: (prg,actid) => {
      const act = prg._stats.acts[actid]
      if (act[0] == 'Newact') return ['Badop',['Badtype',...act]]
      return prg._acts[actid] = Operator(prg,...act)
    },
    Getact: (prg,actid) => Operator(prg,'_Getact',null,actid),
    _Getact: (prg,nulltype,actid) => {
      let act = prg._acts[actid]
      if (act == null) {
        act = prg._stats.acts[actid]
        act = prg._acts[actid] = Operator(prg,...act)
      }
      return ['_Getact',act[1],actid]
    },
    Rawval: (prg,type,rawval) => ['Rawval',type,rawval],
    Badop: (prg,...args) => ['Badop',...args],
    Vardef: (prg,type,varname) => Operator(prg,'_Vardef',null,type,varname),
    _Vardef: (prg,nulltype,gettype,varname) => {
      return ['_Vardef',Operator(prg,...gettype)[1],gettype,varname]
    },
    Gettype: (prg,typename) => {
      if (nativetypes[typename]) return ['Gottype',['Nativetype',typename]]

      throw ['Gettype',typename]
    },
    Nativetype: (prg,typename) => ['Gottype',['Nativetype',typename]],
    Gottype: (prg,type) => ['Gottype',type],
    Nativetemp: (prg,tempname,...info) => {
      return Operator(prg,'_Nativetemp',null,tempname,...info)
    },
    _Nativetemp: (prg,nulltype,tempname,...info) => {
      const _info = []
      for (const i in info) _info.push(Operator(prg,...info[i]))
      const type = nativetemps[tempname](prg,..._info)
      return ['_Nativetemp',type,tempname,...info]
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
    Getdef: (prg,type,actid) => ['Getdef',type,actid],
    Op: (prg,op,...args) => Operator(prg,'_Op',null,op,...args),
    _Op: (prg,type,op,...args) => {
      // throw [type,op,...args]
      let flag = false; type = []
      const _args = []
      for (const i in args) _args.push(Operator(prg,...args[i])[1])
      return ['_Op',_opmap[op](prg,..._args),op,...args]
    },
  }


  function Operator(prg,tok,...args) {
    log('Operator',tok,...args)
    if (opmap[tok]) return opmap[tok](prg,...args)
    throw ['badop',tok,...args]
    return Operator(prg,'Badop',['Badtype',tok,...args])
  }
  return Operator
}
