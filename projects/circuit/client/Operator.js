module.exports = Circuit => {

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

  const oparray = [
    '+','-','%','/','*','!','~','&','|',
    'Pre+','Pre-','Pre*','Pre&','Pre++','Pre--','Post++','Post--',
    '?','<','>','<=','>=','==','!=','<=>','=','&&','||','Callfun','Subscrpt',
  ]
  const opmap = {}, actmap = {
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

    'if': null,
    'else': null,
    'while': null,
    'do': null,
    'for': null,
    ',': null,
    'Scope': null,
    'Array': null,
    'Pntrtype': null,
    'Addrtype': null,
    'Funtype': (prg,...args) => {
      const type = ['Temptype','Fun']
      for (const i in args) type.push(Operator(prg,args[i]))
      return type
    },
    'Arraytype': (prg,typeid,sizeid) => {
      const [tok,typename,rawval] = prg._stats.acts[sizeid]
      if (tok == 'Rawval' && typename == 'Int' && rawval > 0) {
        const type = Operator(prg,typeid)
        if (type[0] == 'Badget') return ['Badget','Arraytype',type]
        return ['Temptype','Array',type,rawval]
      }
      else return ['Badget','sizeerror',sizeact]
    }
  }
  for (const op in actmap) if (actmap[op] == null) {
    actmap[op] = (prg,...args) => {
      log(...args)
      throw op
    }
  }
  for (const i in oparray) opmap[oparray[i]] = true

  function doop(prg,tok,...args) {
    const types = []
    for (const i in args) types.push(Operator(prg,args[i]))
    const roottype = types[0]
    for (const i in types) if (types[i][0] == 'Badget') {
      return ['Badget',tok,...types]
    }
    let opfun
    switch (roottype[0]) {
      case 'Nativetype':
        opfun = nativetypes[roottype[1]][tok]
        if (opfun) return opfun(prg,args,types)
        else return ['Typeerror',tok,...types]
      case 'Typeerror': return ['Typeerror',tok,...types]
      default:
        log('doop',tok,args,types)
        throw 'doop'
    }
  }
  
  function Operator(prg,actid,nulltype) {
    const type = nulltype || prg._acts[actid]
    if (type && type[0] != 'Badget') return type

    const [tok,...args] = prg._stats.acts[actid]
    if (actmap[tok]) return prg._acts[actid] = actmap[tok](prg,...args)
    else if (opmap[tok]) return prg._acts[actid] = doop(prg,tok,...args)
    log('Operator',actid,type,tok,...args)
    throw 'Operator'
  }
  return Operator
}
