module.exports = Circuit => {

  const nativetypes = {
    Int: {

    },
    Float: {

    },
  }

  const _opmap = {
    "+": (prg,argA,argB) => {

    },
    "-": {},
    "%": {},
    "/": {},
    "*": {},
    "!": {},
    "~": {},
    "&": {},
    "|": {},
    "Pre+": {},
    "Pre-": {},
    "Pre*": {},
    "Pre&": {},
    "Pre++": {},
    "Pre--": {},
    "Post++": {},
    "Post--": {},
    "?": {},
    "<": {},
    ">": {},
    "<=": {},
    ">=": {},
    "==": {},
    "!=": {},
    "<=>": {},
    "=": {},
    "&&": {},
    "||": {},
    "if": {},
    "else": {},
    "while": {},
    "do": {},
    ",": {},
    ";": {},
    "{}": {},
    "()": {},
    "[]": {},
    "Array": {}
  }

  const opmap = {
    Newact: (prg,actid) => {
      const act = prg._stats.acts[actid]
      if (act[0] == 'Newact') return ['Badop',['Badtype',...act]]
      return prg._acts[actid] = Operator(prg,...act)
    },
    Getact: (prg,actid) => Operator(prg,'_Getact',null,actid),
    _Getact: (prg,type,actid) => {
      let act = prg._acts[actid]
      if (act == null) {
        act = prg._stats.acts[actid]
        act = prg._acts[actid] = Operator(prg,...act)
      }
      type = act[1]
      return ['_Getact',type,actid]
    },
    Nativetype: (prg,typename,...ops) => {
      // TODO
      return ['Nativetype',typename,...ops]
    },
    Settype: (prg,type,rawval) => ['Settype',type,rawval],
    Badop: (prg,...args) => ['Badop',...args],
    Vardef: (prg,type,varname) => Operator(prg,'_Vardef',null,type,varname),
    _Vardef: (prg,type,gettype,varname) => {
      type = Operator(prg,...gettype), [tok,toktype] = type
      if (tok == '_Getact') type = toktype
      return ['_Vardef',type,gettype,varname]
    },
    Gettype: (prg,typename,...ops) => {
      return Operator(prg,'_Gettype',['Badtype','Gettype',typename],ops)
    },
    _Gettype: (prg,type,ops) => {
      const [badtype,gettype,typename] = type
      const actid = prg._defs[typename]
      if (actid == null) return ['_Gettype',type,ops]
      throw 'wtf'
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
    Op: (prg,type,op,...args) => {
      let flag = false; type = []
      const _args = []
      for (const i in args) {
        const arg = Operator(prg,...args[i])
        const _type = arg[1]
        flag = flag || _type[0] == 'Badtype'
        type.push(_type)
        _args.push(arg)
      }
      if (flag) return ['Op',['Badtype',...type],op,..._args]
      return ['Op',['Optype',...type],op,..._args]
    },
  }
  for (const op in _opmap) {
    opmap[op] = (prg,...args) => Operator(prg,'Op',null,op,...args)
  }


  function Operator(prg,tok,...args) {
    if (opmap[tok]) return opmap[tok](prg,...args)
    throw 'badop'
    return Operator(prg,'Badop',['Badtype',tok,...args])
  }
  return Operator
}
