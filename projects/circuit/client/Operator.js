module.exports = Circuit => {

  const opmatchbool = (stat,thisid,valid) => {
    typeOperator(stat,'Typecast',valid,thisid)
    return nativetypes.Bool
  }
  const opmatchint = (stat,thisid,valid) => {
    typeOperator(stat,'Typecast',valid,thisid)
    return nativetypes.Int
  }
  const opbool = (stat,thisid,valid) => nativetypes.Bool
  const opmatch = (stat,thisid,valid) => typeOperator(stat,'Typecast',valid,thisid)
  const opsingle = (stat,thisid) => Operator(stat,thisid)

  const _typearray = {
    Void: {
      cat: 'Nativetype',
      Typecast: (stat,thisid,typeid) => {
        const type = Operator(stat,typeid)
        if (type.cat == 'Nativetype') return type
        throw ['Void','Typecast',thisid,type]
      },
      'Pre~': opsingle, 'Pre!': opsingle,
      'Pre-': opsingle, 'Pre+': opsingle,
      'Pre--': opsingle, 'Pre++': opsingle,
      'Post--': opsingle, 'Post++': opsingle,
      '=': opmatch,
      '<': opmatchbool, '>': opmatchbool,
      '<=': opmatchbool, '>=': opmatchbool,
      '<=>': opmatchint,
      '||': opmatch, '&&': opmatch,
      '|': opmatch, '&': opmatch,
      '==': opbool, '!=': opbool,
    },
    Bool: {
      parent: 'Void',
    },
    Char: {
      parent: 'Bool'
    },
    Int: {
      parent: 'Char',
    },
    Float: {
      parent: 'Int',
    },
    String: {
      parent: 'Void',
    },
    Tuple: {
      parent: 'Void',
      cat: 'Nativetemp',
      Typecast: (stat,thisid,typeid) => {
        const thistype = Operator(stat,thisid)
        const type = Operator(stat,typeid)
        if (thistype.name == type.name) return thistype

        
        throw ['Tuple','Typecast',thistype,type]
      }
    },
    Array: {
      parent: 'Tuple',
    }
  }
  const nativetypes = {}
  for (const typename in _typearray) {
    const newtype = _typearray[typename]
    newtype.name = typename
    nativetypes[typename] = newtype

    const parent = newtype.parent = nativetypes[newtype.parent]

    for (const op in parent) {
      if (newtype[op] == null) newtype[op] = parent[op]
    }
    // TODO
  }
  function _gettype(stat,typename,...args) {
    let parent = nativetypes[typename], newtype = null
    // log('_gettype',typename,parent)
    if (parent == null) throw ['_gettype',typename]
    else if (parent.cat == 'Nativetype') return parent

    switch (typename) {
      case 'Array': {
        const [type,size] = args
        newtype = {
          parent: nativetypes.Array,
          name: `Array<${type.name}>[${size}]`,
          type: type,
          size: size,
        }
        break
      }
      case 'Tuple': {
        const [types] = args
        const typenames = []
        for (const i in types) typenames.push(types[i].name)
        newtype = {
          parent: nativetypes.Tuple,
          cat: 'Tuple',
          name: `Tuple<${typenames}>`,
          types: types
        }
        break
      }
      default: throw ['_gettype',typename,...args]
    }
    for (const op in newtype.parent) {
      if (newtype[op] == null) newtype[op] = newtype.parent[op]
    }
    return newtype
  }

  const oparray = [
    '+','-','%','/','*','!','~','&','|',
    'Pre+','Pre-','Pre*','Pre&','Pre++','Pre--','Post++','Post--',
    '<','>','<=','>=','==','!=','<=>','=','&&','||',
    'Callfun','Subscript','Typecast',
  ]
  const opmap = {}
  const actmap = {
    Getvar: (stat,thisid,varname) => {
      const def = getdef(stat,varname)
      if (def == null) throw ['Getvar name error',varname,stat.scopes]
      return stat.acttypes[def]
    },
    Gettype: (stat,thisid,typename) => {
      if (nativetypes[typename]) return nativetypes[typename]
      throw typename
    },
    Vardef: (stat,thisid,type,varname) => {
      if (stat.scope[varname] == null) {
        stat.scope[varname] = thisid
        return Operator(stat,type)
      }
      else throw ['Vardef','dup name',varname]
    },
    Rawval: (stat,thisid,typename,rawval) => {
      return nativetypes[typename]
    },
    tern: (stat,thisid,...args) => {
      const [boolid,trueid,falseid] = args
      return typeOperator(stat,'Typecast',falseid,trueid)
    },
    if: (stat,thisid,boolid,scopeid) => {
      const booltype = Operator(stat,boolid)
      const scopetype = Operator(stat,scopeid)
      return booltype
    },
    else: (stat,thisid,ifid,scopeid) => {
      const iftype = Operator(stat,ifid)
      const scopetype = Operator(stat,scopeid)
      return iftype
    },
    while: (stat,thisid,boolid,scopeid) => {
      const booltype = Operator(stat,boolid)
      const scopetype = Operator(stat,scopeid)
      return booltype
    },
    do: (stat,thisid,boolid,scopeid) => {
      const booltype = Operator(stat,boolid)
      const scopetype = Operator(stat,scopeid)
      return booltype
    },
    for: null,
    Tuple: (stat,thisid,...args) => _gettype(stat,'Tuple',doops(stat,args)),
    Scope: (stat,thisid,...args) => {
      stat.scopes.push(stat.scope)
      stat.actscopes[thisid] = stat.scope = {}
      args = doops(stat,args)
      stat.scope = stat.scopes.pop()
      return nativetypes.Void
    },
    Array: (stat,thisid,tupleid) => {
      const tuple = Operator(stat,tupleid)

      if (tuple.types.length == 0) {
        return _gettype(stat,'Array',nativetypes.Void,0)
      }
      const [tok,rootid,...tupleids] = stat.acts[tupleid]

      for (const i in tupleids) {
        typeOperator(stat,'Typecast',tupleids[i],rootid)
      }
      // throw ['Array',thisid,tupleid]
      delete stat.acttypes[tupleid]
      stat.acts[thisid] = ['Array',rootid,...tupleids]
      return _gettype(stat,'Array',tuple.types[0],tuple.types.length)
    },
    Pntrtype: null,
    Addrtype: null,
    Funtype: null,
    Arraytype: (stat,thisid,type,sizeid) => {
      const [tok,typename,size] = stat.acts[sizeid]
      if (tok == 'Rawval' && typename == 'Int' && size >= 0) {
        stat.acttypes[sizeid] = nativetypes.Int
        if (size == 0) type = nativetypes.Void
        return _gettype(stat,'Array',Operator(stat,type),size)
      }
      else throw ['Arraytype','Sizeerror',tok,typename,size]
    },
  }
  for (const op in actmap) if (actmap[op] == null) {
    actmap[op] = (stat,...args) => {
      log(op,...args)
      throw op
    }
  }
  for (const i in oparray) opmap[oparray[i]] = true

  function getdef(stat,defname) {
    const def = stat.scope[defname]
    if (def != null) return def

    let {scopes} = stat, {length} = scopes
    while (length > 0) {
      const def = scopes[--length][defname]
      if (def != null) return def
    }
  }
  function doops(stat,args) {
    const types = []
    for (const i in args) types.push(Operator(stat,args[i]))
    return types
  }
  // let sanity = 10
  function typeOperator(stat,tok,rootid,...args) {
    const type = Operator(stat,rootid)
    if (type[tok]) {
      const newactid = stat.acts.push(stat.acts[rootid])-1
      stat.acttypes[newactid] = type
      stat.acts[rootid] = [tok,newactid,...args]
      return stat.acttypes[rootid] = type[tok](stat,rootid,...args)
    }
    throw ['typeOperator',type,tok,...args]
  }
  function Operator(stat,actid) {
    try {
      // if (sanity-- < 0) throw 'Operator sanity'
      if (stat.acttypes[actid]) return stat.acttypes[actid]

      const act = stat.acts[actid]
      if (act == null) {
        throw ['Operator null act',actid]
      }
      const [tok,...args] = act
      log(actid,tok,...args)

      let type = null
      if (opmap[tok]) {
        type = Operator(stat,args[0])
        if (type[tok]) {
          return stat.acttypes[actid] = type[tok](stat,...args)
        }
        throw ['Operator op error',type,tok,...args]
      }
      else if (actmap[tok]) {
        type = actmap[tok](stat,actid,...args)
      }
      else throw ['Operator tok error',actid,tok,...args]

      if (type == null) throw ['Operator null error',actid,tok,...args]
      return stat.acttypes[actid] = type
    }
    catch (e) {
      if (e[0] == 'Operator') {
        const [tok,p,...args] = e
        throw [tok,p,actid,...args]
      }
      // else throw e
      else throw ['Operator',e,actid]

    }
  }
  return Operator
}
