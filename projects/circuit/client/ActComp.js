module.exports = Circuit => {

  const special_chars = {
    '\\': '\\',
    'n': '\n',
    'r': '\r',
    't': '\t',
    'b': '\b',
    'f': '\f',
    'v': '\v',
    '0': '\0',
  }

  function list(acts,map,actid,act) {
    const comp = map[actid] = { actid:actid }
    const next = { actid:actid,next:true }

    const list = []
    for (let i = 1; i < act.length; ++i) {
      list.push(setnext(look(acts,map,act[i]),next))
    }
    throw ['TODO ' + act[0],list]
  }

  const f = {

    rep0: (acts,map,actid,act) => {
      const comp = map[actid] = { actid:actid }
      const next = { actid:actid }
      next.next = next
      const fail = { actid:actid, next:true }
      const rep = setnext(look(acts,map,act[1]),next,fail)
      throw ['TODO','rep0',rep,next]
    },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: list,
    lst: list,

    or: (acts,map,actid,act) => {
      const next = { actid:actid,next:true }
      const comp = map[actid] = { actid:actid }

      const list = []
      for (let i = 1; i < act.length; ++i) {
        list.push(setnext(look(acts,map,act[i]),next))
      }
      throw ['TODO ' + act[0],list]
    },
    and: (acts,map,actid,act) => {
      const comp = map[actid] = { actid:actid }
      const list = []
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]))
      }
      return andmerge(comp,list)
    },
    not: (acts,map,actid,act) => {
      const comp = map[actid] = { actid:actid, flag:true }
      const next = setnext(look(acts,map,act[1]),false,true)
      delete comp.flag
      return Object.assign(comp,next)
    },

    char: (acts,map,actid,act) => map[actid] = {
      actid:actid,
      key: { '\\': {
        actid:actid,
        char: {
          actid:actid,
          ret: {charf: c => {
            const sc = special_chars[c]
            return sc == undefined ? c : sc
          }},
          next:true,
        }
      }},
      char: {
        actid:actid,
        ret: {charf: c => c},
        next:true,
      }
    },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      let str = act[1], comp = {
        actid:actid,
        ret: {str: str},
        next: true
      }
      let {length} = str
      while (--length >= 0) comp = {
        actid: actid,
        key: { [str[length]]: comp }
      }
      return map[actid] = comp
    },
    txt: (acts,map,actid,act) => { throw "TODO txt" },
    rng: (acts,map,actid,act) => { throw "TODO rng" },

    str: list,
    ary: list,
    pad: list,
    fout: list,
    out: list,
    stk: (acts,map,actid,act) => { throw "TODO stk" },

    map: (acts,map,actid,act) => { throw "TODO map" },
    key: (acts,map,actid,act) => { throw "TODO key" },
    act: (acts,map,actid,act) => { throw "TODO act" },
  }

  function andmerge(comp,list) {

    let key = false, char = false, next = false
    const popidx = list.length-1
    for (const i in list) {
      const test = list[i]

      if (test.key) {
        if (!key) key = {}
        for (const c in test.key) key[c] = {}
        if (test.char) char = {}
        if (test.next) next = {}
      }
    }
    for (const i in list) {
      const test = list[i]
      for (const c in key) {
        let next = (test.key && test.key[c]) || test.char || test.next
        if (!next) return comp
        else if (next != true) key[c][i] = next
        else if (i == popidx) key[c][i] = test
      }
      if (char) {
        let next = test.char || test.next
        if (!next) return comp
        else if (next != true) char[i] = next
        else if (i == popidx) char[i] = test
      }
      if (next && test.next) {
        if (test.next != true) next[i] = test.next
        else if (i == popidx) next[i] = test
      }
    }

    log(list,key,char,next)

    throw 'andmerge'
  }

  function setnext(comp,next,fail) {
    let newcomp = comp.setnext
    if (newcomp) return newcomp
    newcomp = comp.setnext = { actid:comp.actid }
    if (comp.key || comp.char || comp.ret) {
      if (comp.key) {
        newcomp.key = {}
        for (const c in comp.key) {
          newcomp.key[c] = setnext(comp.key[c],next,fail)
        }
      }
      if (comp.char) newcomp.char = setnext(comp.char,next,fail)
      if (comp.next == true) { if (next) newcomp.next = next }
      else if (comp.next) newcomp.next = setnext(comp.next,next,fail)
      else if (fail) newcomp.next = fail
      if (comp.ret && newcomp.next) newcomp.ret = comp.ret
    }
    else if (comp.next == true) {
      if (next == true) newcomp.next = true
      else if (next) Object.assign(newcomp,next)
    }
    else if (comp.next) Object.assign(newcomp,setnext(comp.next,next,fail))
    else if (fail == true) newcomp.next = fail
    else if (fail) Object.assign(newcomp,fail)
    delete comp.setnext
    return newcomp
  }

  function look(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret

    const act = acts[actid]
    return f[act[0]](acts,map,actid,act)
  }



  return function ActComp({act,start}) { look(act,{},start) }
}
