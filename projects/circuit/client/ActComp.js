module.exports = Circuit => {

  function look(acts,map,actid) {
    const act = acts[actid]
    let fun = look.fun[act[0]]
    while (typeof fun == 'string') fun = look.fun[fun]
    if (typeof fun != 'function') {
      throw act
    }
    return fun(acts,map,act)
  }
  look.fun = {
    rep0: (acts,map,act) => {
      const link = ++map.length
      map[link] = {
        save:['new'],
        tok:'jumplink',link:act[1],
        err:{save:['clear'],tok:'jumpret'},
        ret:{
          save:['lock'],
          ary:['add'],
          tok:'jumplink',link:link,
          ret:{tok:'jumpret'},
          err:{tok:'jumperr'}
        }
      }
      return {
        ary:['new'],
        tok:'jumplink',link:link,
        err:{tok:'jumperr'},
        ret:{ary:['end'],tok:'jumpret'}
      }
    },
    rep1: (acts,map,act) => {
      const link = ++map.length
      map[link] = {
        save:['new'],
        tok:'jumplink',link:act[1],
        err:{save:['clear'],tok:'jumpret'},
        ret:{
          save:['lock'],
          ary:['add'],
          tok:'jumplink',link:link,
          err:{tok:'jumperr'},
          ret:{tok:'jumpret'}
        }
      }
      return {
        ary:['new'],
        tok:'jumplink',link:act[1],
        err:{tok:'jumperr'},
        ret:{
          ary:['add'],
          tok:'jumplink',link:link,
          err:{tok:'jumperr'},
          ret:{ary:['end'],tok:'jumpret'}
        }
      }
    },
    lst: (acts,map,act) => {
      let {length} = act, ret = {ary:['end'],tok:'jumpret'}
      while (length > 1) {
        ret.ary.splice(0,0,'add')
        ret = {
          ary:[],
          tok:'jumplink',link:act[--length],
          err:{tok:'jumperr'},
          ret:ret,
        }
      }
      ret.ary.splice(0,0,'new')
      return ret
    },

    or: (acts,map,act) => {
      let {length} = act, ret = { tok:'jumpret' }
      if (length == 1) return ret
      ret = {
        save:[],
        tok:'jumplink',link:act[--length],
        err:{tok:'jumperr'},
        ret:ret
      }
      while (length > 1) {
        ret.save.splice(0,0,'clear')
        ret = {
          save:['new'],
          tok:'jumplink',link:act[--length],
          err:ret,
          ret:{ save:['lock'], tok:'jumpret' }
        }
      }
      return ret
    },
    and: (acts,map,act) =>  {
      let {length} = act, ret = { tok:'jumpret' }
      if (length == 1) return ret
      ret = {
        save:[],
        tok:'jumplink',link:act[--length],
        err:{tok:'jumperr'},
        ret:ret
      }
      while (length > 1) {
        ret.save.splice(0,0,'clear')
        ret = {
          save:['new'],
          tok:'jumplink',link:act[--length],
          err:{save:['clear'],tok:'jumperr'},
          ret:ret
        }
      }
      return ret
    },
    not: (acts,map,act) => { return {
      save:['new'],
      tok:'jumplink',link:act[1],
      err:{ save:['clear'], tok:'jumpret' },
      ret:{ save:['clear'], tok:'jumperr' }
    }},
    char: (acts,map,act) => { return {
      tok:'char',
      branch:{'\\':{
        save:['next'],
        tok:'char',
        char:{
          save:['next'],
          ary:['schar'],
          tok:'jumpret'
        }
      }},
      char:{
        ary:['char'],
        save:['next'],
        tok:'jumpret'
      }
    }},
    cmp: (acts,map,act) => {
      let str = act[1], {length} = str
      let ret = {
        save:[],
        ary:['txt',str],
        tok:'jumpret'
      }
      while (length > 0) {
        ret.save.splice(0,0,'next')
        ret = {
          save:[],
          tok:'char',
          branch:{ [str[--length]]:ret },
          char:{tok:'jumperr'}
        }
      }
      return ret
    },
  }

  let stack = []
  function flatten(acts,act,save,ary,ret,err) {
    act.flag = true
    let fun = flatten.fun[act.tok]
    while (typeof fun == 'string') fun = flatten.fun[fun]
    if (typeof fun != 'function') {
      throw act
    }
    if (!act.save) act.save = []
    if (!act.ary) act.ary = []

    log('save',save,act.save)
    log('ary',ary,act.ary)
    save = save.concat(act.save)
    ary = ary.concat(act.ary)
    fun = fun(acts,act,save,ary,ret,err)

    act.flag = false
    return fun
  }
  flatten.fun = {
    jumplink: (acts,act,save,ary,ret,err) => {
      const tret = ret
      ret = flatten(acts,act.ret,[],[],ret,err)
      err = flatten(acts,act.err,[],[],tret,err)

      let {link} = act
      act = acts[link]
      if (act.flag) return {
        tok:'jumplink',link:link,
        save:save,ary:ary,
        ret:ret,err:err
      }
      else return flatten(acts,act,save,ary,ret,err)
    },
    char: (acts,act,save,ary,ret,err) => {
      const ans = {
        tok:'char',
        branch:{},
        char:flatten(acts,act.char,save,ary,ret,err)
      }
      for (const c in act.branch) {
        ans.branch[c] = flatten(acts,act.branch[c],save,ary,ret,err)
      }
      return ans
    },
    jumpret: (acts,act,save,ary,ret,err) => {
      if (ret) return flatten(acts,ret,save,ary)
      else return { tok:'jumpret', save:save, ary:ary }
    },
    jumperr: (acts,act,save,ary,ret,err) => {
      if (err) return flatten(acts,err,save,ary)
      else return { tok:'jumperr', save:save, ary:ary }
    }
  }

  return function ActComp({act,start}) {
    log(act)
    const map = {length:act.length}
    for (let i = 1; i <= act.length; ++i) map[i] = look(act,map,i)
    log(map)

    const flatmap = {}
    for (let i = 1; i <= map.length; ++i) {
      flatmap[i] = flatten(map,map[i],[],[])
    }
    log(flatmap)
    log(stack)

    return 'error'
  }
}
