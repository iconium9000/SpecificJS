module.exports = Circuit => {

  class Comp {
    constructor(actid) {
      this.complete = false
      this.char = false
      this.pass = false
      this.key = {}
      this.actid = actid
    }
  }

  const {assign} = Object
  const f = {

    rep0: (acts,map,actid,act) => { throw "TODO rep0" },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: (acts,map,actid,act) => { throw "TODO fun" },
    lst: (acts,map,actid,act) => {
      let next = { next:true, ret:[['endlist']] }
      let {length} = act
      const list = {}
      while (--length > 0) list[length] = next = {
        tok: 'setnext',
        body: act[length],
        next: next,
        ret: [['addlist']],
      }
      map[actid] = next
      length = act.length
      while (--length > 0) list[length].body = look(acts,map,act[length])
      return next
    },

    or: (acts,map,actid,act) => {
      let {length} = act
      let next = map[actid] = { tok: 'or', length:length, next:true }
      for (let i = 1; i < length; ++i) next[i] = look(acts,map,act[i])
      return next
    },
    and: (acts,map,actid,act) => { throw "TODO and" },
    not: (acts,map,actid,act) => { throw "TODO not" },

    char: (acts,map,actid,act) => { throw "TODO char" },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let ret = {
        ret:[['str',str]],
        next:true
      }
      let {length} = str
      while (--length >= 0) {
        ret.ret.push(['next'])
        ret = { key:{ [str[length]]:ret }, ret:[] }
      }
      return map[actid] = ret
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
  const tok = {
    or: comp => {
      const list = {}
      for (let i = 1; i < comp.length; ++i) list[i] = dotok(comp[i])
      return ormerge(list)
    },
    setnext: comp => {
      let {body,next,fail,ret} = comp
      body = dotok(body)
      next = dotok(next)
      fail = dotok(fail)
      return setnext(body,next,fail,ret)
    }
  }
  function dosimp(comp) {
    let {key,char,next,ret} = comp
    if (next == false) delete comp.next
    if (key || char || next == true || !next) return comp
    if (next.key) comp.key = next.key
    if (next.char) comp.char = next.char
    if (next.next) comp.next = next.next
    if (ret && next.ret) comp.ret = ret.concat(next.ret)
    else if (next.ret) comp.ret = next.ret
    return comp
  }
  function setnext(body,next,fail,ret) {
    let newcomp = body.setnext
    if (newcomp) return newcomp
    newcomp = body.setnext = {}
    if (body.key) {
      newcomp.key = {}
      for (const c in body.key) {
        newcomp.key[c] = setnext(body.key[c],next,fail,ret)
      }
    }
    if (body.char) {
      newcomp.char = setnext(body.char,next,fail,ret)
    }
    if (body.next == true) {
      if (next) {
        newcomp.next = next
        if (body.ret && ret) newcomp.ret = body.ret.concat(ret)
        else if (body.ret) newcomp.ret = body.ret
        else if (ret) newcomp.ret = ret
      }
    }
    else {
      if (body.ret) newcomp.ret = body.ret
      if (body.next) newcomp.next = setnext(body.next,next,fail,ret)
      else if (fail) newcomp.next = fail
    }
    delete body.setnext
    return dosimp(newcomp)
  }
  function ormerge(list) {
    let rets = { 0:'or' }
    let top, pop
    const newcomp = {}
    for (const i in list) {
      const {key,char,next} = pop = list[i]
      if (top == undefined) top = list[i]
      if (key) {
        if (!newcomp.key) newcomp.key = {}
        for (const c in key) {
          if (!newcomp.key[c]) newcomp.key[c] = {}
          newcomp.key[c][i] = key[c]
        }
      }
      if (char) {
        if (!newcomp.char) newcomp.char = {}
        newcomp.char[i] = char
      }
      if (next) {
        if (!newcomp.next) newcomp.next = {}
        newcomp.next[i] = next
      }
    }
    if (top == pop) return top || {}

    if (newcomp.key) {
      for (const c in newcomp.key) {
        const keys = newcomp.key[c]
        let rets, top, pop, ret
        for (const i in keys) {
          ret = list[i].ret
          pop = keys[i]
          if (!top) top = pop
          if (ret) {
            if (!rets) rets = {}
            rets[i] = ret
          }
        }
        if (top == pop) {
          newcomp.key[c] = top
          if (ret) {
            if (!newcomp.ret) newcomp.ret = { 0:'or' }
            if (!newcomp.ret.key) newcomp.ret.key = { 0:'_or' }
            newcomp.ret.key[c] = ret
          }
        }
        else {
          newcomp.key[c] = ormerge(keys)
          if (rets) {
            if (!newcomp.ret) newcomp.ret = { 0:'or' }
            if (!newcomp.ret.key) newcomp.ret.key = { 0:'_or' }
            newcomp.ret.key[c] = rets
          }
        }
      }
    }
    if (newcomp.char) {
      const chars = newcomp.char
      let rets, top, pop, ret
      for (const i in chars) {
        ret = list[i].ret
        pop = chars[i]
        if (!top) top = pop
        if (ret) {
          if (!rets) rets = {}
          rets[i] = ret
        }
      }
      if (top == pop) {
        newcomp.char = top
        if (ret) {
          if (newcomp.ret) newcomp.ret.char = ret
          else newcomp.ret = { 0:'_or', char:ret }
        }
      }
      else {
        newcomp.char = ormerge(chars)
        if (rets) {
          if (newcomp.ret) newcomp.ret.char = rets
          else newcomp.ret = { 0:'_or', char:rets }
        }
      }
    }
    if (newcomp.next) {
      const nexts = newcomp.next
      let rets, top, pop, ret
      for (const i in nexts) {
        ret = list[i].ret
        pop = nexts[i]
        if (!top) top = pop
        if (ret) {
          if (!rets) rets = {}
          rets[i] = ret
        }
      }
      if (top == pop) {
        newcomp.next = top
      }
    }

    throw ['ormerge',list,newcomp,rets]
  }

  function look(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret
    const act = acts[actid]
    return f[act[0]](acts,map,actid,act)
  }

  function dotok(comp) {
    if (!comp) return comp
    const fun = tok[comp.tok]
    return fun ? fun(comp) : comp
  }

  return function ActComp({act,start}) {
    const top = look(act,{},start)
    return dotok(top)
  }
}
