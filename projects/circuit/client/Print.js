const PRT1 = `

`


module.exports = Circuit => {

  const special_chars = {
    '\\': '\\\\',
    '\n': '$\\n',
    '\r': '\\r',
    '\t': '$\\t',
    '\b': '\\b',
    '\f': '\\f',
    '\v': '\\v',
    '\0': '\\0',
    ' ': '$ ',
    '"': '$"',
    "'": "$'",
    "\`": "$\`",
    '$': '$$',
    '#': '$#',
    '(': '$(',
    ')': '$)',
    '[': '$[',
    ']': '$]',
    '{': '${',
    '}': '$}',
    '<': '$<',
    '>': '$>',
    '.': '$.',
    '*': '$*',
    '+': '$+',
    '-': '$-',
    '!': '$!',
    '|': '$|',
    '&': '$&',
    '@': '$@',
    ':': '$:',
    ';': '$;',
  }
  function txt(inst) {
    let str = '', word = inst[1]
    for (const i in word) {
      const c = word[i], sc = special_chars[c]
      str += sc == undefined ? c : sc
    }
    return str
  }
  function ary(inst,i,str,c,prc,blk) {
    if (i >= inst.length) return str + c
    str += parse(inst[i++],prc,blk)
    while (i < inst.length) str += ' ' + parse(inst[i++],prc,blk)
    return str + c
  }
  const blks = ['[]','{}','()']
  function par(str,blk) {
    blk = blks[blk % blks.length]
    return blk[0] + str + blk[1]
  }
  const f = {
    mch: txt,
    rep0: (inst,prc,blk) => {
      if (prc < 1) ++blk
      const str = parse(inst[1],1,blk) + '*'
      return prc < 1 ? par(str,blk) : str
    },
    rep1: (inst,prc,blk) => {
      if (prc < 1) ++blk
      const str = parse(inst[1],1,blk) + '+'
      return prc < 1 ? par(str,blk) : str
    },
    not: (inst,prc,blk) => {
      if (prc < 1) ++blk
      const str = parse(inst[1],1,blk) + '!'
      return prc < 1 ? par(str,blk) : str
    },
    fun: (inst,prc,blk) => {
      if (inst.length == 1) return ''
      if (prc < 1) ++blk
      let str = parse(inst[1],1,blk)
      for (let i = 2; i < inst.length; ++i) str += ':' + parse(inst[i],-1,blk)
      return prc < 1 ? par(str,blk) : str
    },
    out: (inst,prc,blk) => {
      if (inst.length == 1) return ''
      if (prc < 1) ++blk
      let str = parse(inst[1],1,blk)
      if (inst.length == 2) return str
      for (let i = 2; i < inst.length; ++i) {
        str += '.' + parse(inst[i],1,blk)
      }
      return prc < 1 ? par(str,blk) : str
    },
    lst: (inst,prc,blk) => {
      if (inst.length == 1) return ''
      if (prc < 2) ++blk
      let str = parse(inst[1],2,blk)
      for (let i = 2; i < inst.length; ++i) str += ' ' + parse(inst[i],2,blk)
      return prc < 2 ? par(str,blk) : str
    },
    and: (inst,prc,blk) => {
      if (inst.length == 1) return ''
      if (prc < 3) ++blk
      let str = parse(inst[1],3,blk)
      for (let i = 2; i < inst.length; ++i) str += ' & ' + parse(inst[i],3,blk)
      return prc < 3 ? par(str,blk) : str
    },
    or: (inst,prc,blk) => {
      if (inst.length == 1) return ''
      if (prc < 4) ++blk
      let str = parse(inst[1],4,blk)
      for (let i = 2; i < inst.length; ++i) str += ' | ' + parse(inst[i],4,blk)
      return prc < 4 ? par(str,blk) : str
    },
    char: (inst,prc,blk) => '@',
    cmp: txt,
    txt: txt,

    str: (inst,prc,blk) => ary(inst,1,'"','"',prc,blk),
    ary: (inst,prc,blk) => ary(inst,1,'[',']',prc,blk),
    pad: (inst,prc,blk) => ary(inst,1,'{','}',prc,blk),
    fout: (inst,prc,blk) => {
      if (inst.length == 1) return '.'
      let str = ''
      for (let i = 1; i < inst.length; ++i) str += '.' + parse(inst[i],prc,blk)
      return str
    },
    stk: (inst,prc,blk) => ary(inst,1,'(stk ',')',prc,blk),

    rng: (inst,prc,blk) => inst[1] + '-' + inst[2],
    map: (inst,prc,blk) => ary(inst,1,'(map ',')',prc,blk),
    act: (inst,prc,blk) => ary(inst,1,'(act ',')',prc,blk),
  }

  function parse(val,prc,blk) {
    if (typeof val == 'string') throw ['parse string',val]
    const fun = f[val[0]]
    if (fun == undefined) {
      throw ['parse undef fun',val]
    }
    return fun(val,prc,blk)
  }

  Circuit.PrintStr = val => parse(val,5,0)

  return function Print(mch) {
    let str = ''
    for (const name in mch) {
      // log(name,mch[name])
      // log(f.txt(['txt',name]))
      str += `\n${f.txt(['txt',name])} ${parse(mch[name],5,0)};`
    }
    return str + '\n'
  }
}
