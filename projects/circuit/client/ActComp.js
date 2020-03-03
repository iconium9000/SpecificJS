module.exports = Circuit => {

  const f = {

    rep0: (acts,map,actid,act) => {
      const next = map[actid] = {
        tok: 'setnext',
        win: {
          mid:[ {tok:'addlist'} ]
        },
        fail: {
          ret:[ {tok:'endlist'} ]
        }
      }
      next.win.next = next
      next.body = look(acts,map,act[1])
      return next
    },
    rep1: (acts,map,actid,act) => { throw "TODO rep1" },
    fun: (acts,map,actid,act) => { throw "TODO fun" },
    lst: (acts,map,actid,act) => {
      let next = { ret:[ {tok:'endlist'} ] }
      let {length} = act
      const list = {}
      while (--length > 0) list[length] = next = {
        tok: 'setnext',
        win: {
          mid: [ {tok:'addlist'} ],
          next: next
        },
      }
      map[actid] = next
      length = act.length
      while (--length > 0) list[length].body = look(acts,map,act[length])
      return next
    },

    or: (acts,map,actid,act) => {
      let {length} = act
      let next = map[actid] = { tok: 'or', list:{length:length} }
      for (let i = 1; i < length; ++i) next.list[i] = look(acts,map,act[i])
      return next
    },
    and: (acts,map,actid,act) => {
      const length = act.length-1
      if (length == 0) return map[actid] = { next:true }
      else if (length == 1) return map[actid] = look(acts,map,act[1])
      const check = []
      const comp = map[actid] = { tok: 'and', check:check }
      for (let i = 1; i < length; ++i) check.push(look(acts,map,act[i]))
      comp.real = look(acts,map,act[length])
      return comp
    },
    not: (acts,map,actid,act) => {
      const next = map[actid] = {
        tok: 'setnext',
        fail: { next:true }
      }
      next.body = look(acts,map,act[1])
      return next
    },

    char: (acts,map,actid,act) => {
      return map[actid] = {
        key: { '\\': { char: { ret: [ { 'schar':true } ] } } },
        char: { ret: [{ 'char':true }] }
      }
    },
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let {length} = str, next = {
        ret: [ {
          tok:'cstr',
          count:length
        } ]
      }
      while (--length >= 0) next = {
        key: { [str[length]]:next }
      }
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

  function arymerge(a,b) {
    return a && b ? a.concat(b) : a || b
  }
  function checkfail(comp) {
    const {key,char,next,ret} = comp
    return !(key || char || next || ret)
  }

  function setnext(comp,win,fail) {
    let newcomp = comp.setnext
    if (newcomp) return newcomp
    newcomp = comp.setnext = {}

    if (comp.key) {
      newcomp.key = {}
      for (const c in comp.key) {
        newcomp.key[c] = setnext(comp.key[c],win,fail)
      }
    }
    if (comp.char) newcomp.char = setnext(comp.char,win,fail)

    if (comp.next || comp.ret) {
      if (win) {
        let {mid,next,ret} = win
        if (comp.next == true) {
          if (mid) newcomp.mid = arymerge(comp.mid,mid)
          if (next) newcomp.next = next
          else if (ret) newcomp.ret = arymerge(comp.mid,ret)
        }
        else if (comp.next) {
          if (comp.mid) newcomp.mid = comp.mid
          newcomp.next = setnext(comp.next,win,fail)
        }
        else if (comp.ret) {
          if (mid) newcomp.mid = arymerge(comp.ret,mid)
          if (next) newcomp.next = next
          else if (ret) newcomp.ret = arymerge(comp.ret,ret)
        }
      }
    }
    else if (fail) {
      const {mid,next,ret} = fail
      if (mid) newcomp.mid = mid
      if (next) newcomp.next = next
      else if (ret) newcomp.ret = ret
    }
    delete comp.setnext
    return newcomp
  }
  function ormerge(list) {

    throw ['ormerge',list]
  }
  function andmerge(check,real) {
    throw ['andmerge',check,arg]
  }

  function dotok(comp) {
    let newcomp = comp.dotok
    if (newcomp) return newcomp
    comp.dotok = newcomp = {}
    switch (comp.tok) {
      case 'setnext': {
        let {body,win,fail} = comp
        body = dotok(body)
        if (win && win.next) win.next = dotok(win.next)
        if (fail && fail.next) fail.next = dotok(fail.next)
        Object.assign(newcomp,setnext(body,win,fail))
      } break
      case 'or': {
        const list = []
        for (let i = 1; i < comp.list.length; ++i) {
          list.push(dotok(comp.list[i]))
        }
        Object.assign(newcomp,ormerge(list))
      } break
      case 'and': {
        let {check,real} = comp
        let list = []
        for (const i in check) list.push(dotok(check[i]))
        Object.assign(newcomp,andmerge(list,dotok(real)))
      } break
      case undefined: {
        Object.assign(newcomp,comp)
      } break
      default: throw ['dotok bad tok',comp]
    }
    delete comp.dotok
    delete newcomp.dotok
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
