module.exports = Circuit => {

  const f = {

    rep0: (acts,map,actid,act) => {
      const next = map[actid] = {
        tok: 'setnext',
        mid: [ {tok:'addlist'} ],
        fail: { ret:[ {tok:'endlist'} ] }
      }
      next.next = next
      next.body = look(acts,map,act[1])
      return next
    },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: (acts,map,actid,act) => { throw "TODO fun" },
    lst: (acts,map,actid,act) => {
      let next = { ret:[{tok:'endlist'}] }
      let {length} = act
      const list = {}
      while (--length > 0) list[length] = next = {
        tok: 'setnext',
        mid: [ {tok:'addlist'} ],
        next: next,
      }
      map[actid] = next
      length = act.length
      while (--length > 0) list[length].body = look(acts,map,act[length])
      return next
    },

    or: (acts,map,actid,act) => {
      let {length} = act
      let next = map[actid] = { tok: 'or', length:length }
      for (let i = 1; i < length; ++i) next[i] = look(acts,map,act[i])
      return next
    },
    and: (acts,map,actid,act) => { throw "TODO and" },
    not: (acts,map,actid,act) => {
      const next = map[actid] = {
        tok: 'setnext',
        fail: { pass:true }
      }
      next.body = look(acts,map,act[1])
      return next
    },

    char: (acts,map,actid,act) => { throw "TODO char" },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let {length} = str, next = { ret: [{tok:'str',count:length}] }
      while (--length >= 0) next = { key: { [str[length]]:next } }
      return map[actid] = next
    },
    txt: (acts,map,actid,act) => { throw "TODO txt" },
    rng: (acts,map,actid,act) => { throw "TODO rng" },

    str: (acts,map,actid,act) => { throw "TODO str" },
    ary: (acts,map,actid,act) => { throw "TODO ary" },
    pad: (acts,map,actid,act) => { throw "TODO pad" },
    fout: (acts,map,actid,act) => { throw "TODO fout" },
    out: (acts,map,actid,act) => { throw "TODO out" },
    stk: (acts,map,actid,act) => { throw "TODO stk" },

    map: (acts,map,actid,act) => { throw "TODO map" },
    key: (acts,map,actid,act) => { throw "TODO key" },
    act: (acts,map,actid,act) => { throw "TODO act" },
  }

  function arymerge(a,b) { return a && b ? a.concat(b) : a || b }
  function compmerge(comp) {
    // return comp

    const {next} = comp
    if (!next) return comp
    let compkc = comp.key || comp.char
    let nextkc = next.key || next.char
    if (compkc && nextkc) return comp
    else if (nextkc) {
      if (next.key) comp.key = next.key
      if (next.char) comp.char = next.char
    }
    if (next.pass) {
      let mid = arymerge(comp.mid,next.mid)
      if (mid) comp.mid = mid
      delete comp.next
      comp.pass = true
    }
    else if (next.next) {
      let mid = arymerge(comp.mid,next.mid)
      if (mid) comp.mid = mid
      comp.next = next.next
    }
    else if (next.ret) {
      delete comp.mid
      delete comp.next
      comp.ret = arymerge(comp.mid,next.ret)
    }
    else delete comp.next
    return comp
  }

  function setnext(comp,mid,next,fail) {
    let newcomp = comp.setnext
    if (newcomp) return newcomp
    newcomp = comp.setnext = {}

    if (comp.key) {
      newcomp.key = {}
      for (const c in comp.key) {
        newcomp.key[c] = setnext(comp.key[c],mid,next,fail)
      }
    }
    if (comp.char) newcomp.char = setnext(comp.char,mid,next,fail)

    if (comp.pass) {
      if (next) {
        if (comp.mid) newcomp.mid = comp.mid
        newcomp.next = next
      }
    }
    else if (comp.next) {
      if (comp.mid) newcomp.mid = comp.mid
      newcomp.next = setnext(comp.next,mid,next,fail)
    }
    else if (comp.ret) {
      if (next) {
        newcomp.mid = comp.ret
        newcomp.next = next
      }
    }
    else if (fail) newcomp.next = fail

    delete comp.setnext
    return newcomp // merge(newcomp)
  }
  function ormerge(list) {
    const newlist = { length:list.length }
    for (let i = 1; i < list.length; ++i) {
      newlist[i] = dotok(list[1])
    }
    throw ['ormerge',newlist]
  }

  function dotok(comp) {
    let newcomp = comp.dotok
    if (newcomp) return newcomp
    comp.dotok = newcomp = {}
    switch (comp.tok) {
      case 'setnext': {
        let {body,mid,next,fail} = comp
        body = dotok(body)
        if (next) next = dotok(next)
        if (fail) fail = dotok(fail)
        Object.assign(newcomp,setnext(body,mid,next,fail))
      } break
      case 'or': {
        Object.assign(newcomp,ormerge(comp))
      } break
      case undefined: {
        Object.assign(newcomp,comp)
        delete newcomp.dotok
      } break
      default: throw ['dotok bad tok',comp]
    }
    delete comp.dotok
    log('dotok',comp,newcomp)
    return newcomp
  }

  function look(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret
    const act = acts[actid]
    return f[act[0]](acts,map,actid,act)
  }

  return function ActComp({act,start}) {
    log('ActComp',act)
    const top = look(act,{},start)
    return dotok(top)
  }
}
