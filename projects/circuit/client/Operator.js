module.exports = Circuit => {

  function matchtypes(prg,op,...types) {
    const _types = {}, {length} = types; let flag = false
    for (const i in types) {
      _types[i] = JSON.stringify(types[i] = Operator(prg,types[i]))
      flag = flag || types[i][0] == 'Badget'
    }
    if (flag) return ['Badget',op,...types]
    for (let i = 0; i < length-1; ++i) {
      for (let j = i+1; j < length; ++j) {
        if (_types[i] != _types[j]) return ['Matcherror',op,...types]
      }
    }
    return types[0]
  }

  const nativetypes = {
    Int: {

    },
    Float: {

    },
    Void: {

    },
    String: {

    },
    Bool: {

    },
  }
  function boolcomp(op) {
    return (prg,aid,bid) => {
      const atype = Operator(prg,aid)
      const btype = Operator(prg,bid)
      if (atype[0] == 'Badget' || btype[0] == 'Badget') {
        return ['Badget',op,atype,btype]
      }
      else return ['Nativetype','Bool']
    }
  }
  function boolmatch(op) {
    return (prg,bool,scope) => {
      bool = Operator(prg,bool)
      if (bool == 'Nativetype,Bool') return ['Nativetype','Bool']
      else return ['Badget',op,'typematch',bool]
    }
  }
  function match1(nativetype) {
    return (prg,a) => nativetype ? ['Nativetype',nativetype] : Operator(prg,a)
  }
  function matchall(op,nativetype) {
    return (prg,...args) => {
      const type = matchtypes(prg,op,...args)
      if (type[0] == 'Badget' || type[0] == 'Matcherror') return type
      else if (nativetype) return ['Nativetype',nativetype]
      else return type
    }
  }

  const opmap = {
    Getvar: (prg,varname) => {
      const actid = prg._defs[varname]
      if (actid == null) return ['Badget','Getvar',varname]
      else return Operator(prg,actid)
    },
    Gettype: (prg,typename) => {
      if (nativetypes[typename]) return ['Nativetype',typename]
      const actid = prg._defs[typename]
      if (actid == null) return ['Badget','Gettype',typename]
      const type = Operator(prg,actid)
      if (type[0] == 'Typedef') return type[1]
      else return ['Badget','Gettype',type]
    },
    Vardef: (prg,actid,varname) => Operator(prg,actid),
    Rawval: (prg,typename,rawval) => ['Nativetype',typename],
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
    'for': null,
    ',': null,
    'Scope': null,
    'Callfun': null,
    'Subscrpt': null,
    'Array': null,
    'Funtype': (prg,...args) => {
      const type = ['Funtype']
      for (const i in args) type.push(Operator(prg,args[i]))
      return type
    },
    'Arraytype': (prg,typeid,sizeid) => {
      const [tok,typename,rawval] = prg._stats.acts[sizeid]
      if (tok == 'Rawval' && typename == 'Int' && rawval > 0) {
        const type = Operator(prg,typeid)
        if (type[0] == 'Badget') return ['Badget','Arraytype',type]
        return ['Arraytype',type,rawval]
      }
      else return ['Badget','sizeerror',sizeact]
    }
  }
  for (const op in opmap) if (opmap[op] == null) {
    opmap[op] = (prg,...args) => {
      log(...args)
      throw op
    }
  }


  function Operator(prg,actid,nulltype) {
    const type = nulltype || prg._acts[actid]
    if (type && type[0] != 'Badget') return type

    const [tok,...args] = prg._stats.acts[actid]
    if (opmap[tok]) return prg._acts[actid] = opmap[tok](prg,...args)
    log('Operator',actid,type,tok,...args)
    throw 'Operator'
  }
  return Operator
}
