module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      return [
        {tok:'newlst'},
        {tok:'try',catch:5},
        {tok:'newsave'},
        look(acts,map,act[1]),{tok:'addlst'},
        {tok:'locksave',jump:-3},
        {tok:'clearsave'},
        {tok:'endlst'},
      ]
    },
    rep1: (acts,map,actid,act) => {
      return [
        {tok:'newlst'},
        look(acts,map,act[1]),{tok:'addlst'},
        {tok:'try',catch:5},
        {tok:'newsave'},
        look(acts,map,act[1]),{tok:'addlst'},
        {tok:'locksave',jump:-3},
        {tok:'clearsave'},
        {tok:'endlst'}
      ]
    },
    fun: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let list = [look(acts,map,act[1])]
      for (let i = 2; i < act.length; ++i) {
        list.push({tok:'arg'},look(acts,map,act[i]))
      }
      return list
    },
    lst: (acts,map,actid,act) => {
      let list = [{tok:'newlst'}]
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]),{tok:'addlst'})
      }
      return list.concat({tok:'endlst'})
    },
    or: (acts,map,actid,act) => {
      let {length} = act
      if (length == 1) return []
      let list = [look(acts,map,act[--length])]
      while (length > 1) list = [
        {tok:'try',catch:5},
        {tok:'newsave'},
        look(acts,map,act[--length]),
        {tok:'catch'},
        {tok:'locksave',jump:list.length+2},
        {tok:'clearsave'},
      ].concat(list)
      return list
    },
    and: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let {length} = act, list = [look(acts,map,act[--length])]
      while (length > 1) {
        list = [
          {tok:'newsave'},
          look(acts,map,act[--length]),
          {tok:'clearsave'}
        ].concat(list)
      }
      return list
    },
    not: (acts,map,actid,act) => [
      {tok:'try',catch:5},
      {tok:'newsave'},
      look(acts,map,act[1]), {tok:'catch'},
      {tok:'clearsave',jump:2},
      {tok:'clearsave',jump:2},
      {tok:'err'}
    ],

    char: (acts,map,actid,act) => [
      {tok:'cmp',cmp:{'\\':1},jump:3},
      {tok:'char'},{tok:'schar',jump:2},
      {tok:'char'}
    ],
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let {length} = str, list = [{tok:'txt',txt:str,jump:2},{tok:'err'}]
      if (length == 0) return [list[1]]
      while (length > 0) {
        list = [{
          tok:'cmp',
          cmp:{ [str[--length]]:1 },
          jump:list.length+1,
        },{tok:'char'}].concat(list)
      }
      return list
    },
    txt: (acts,map,actid,act) => [ {tok:'txt',txt:act[1]} ],
    rng: (acts,map,actid,act) => {
      let low = act[1].charCodeAt(0)
      const high = act[2].charCodeAt(0)
      if (low <= high) {
        const cmp = {}
        while (low <= high) cmp[String.fromCharCode(low++)] = 2
        return [
          { tok:'cmp', cmp:cmp, jump:1},
          { tok:'err' },
          { tok:'char'},
        ]
      }
      else return [ { tok:'err' } ]
    },

    ary: (acts,map,actid,act) => {
      if (act.length == 1) return [{tok:'emptyary'}]
      else if (act.length == 2) return look(acts,map,act[1])
      let list = [{tok:'newary'}]
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]),{tok:'addary'})
      }
      list.push({tok:'endary'})
      return list
    },
    str: (acts,map,actid,act) => f.ary(acts,map,actid,act).concat({tok:'str'}),
    pad: (acts,map,actid,act) => f.ary(acts,map,actid,act).concat({tok:'pad'}),
    fout: (acts,map,actid,act) => {
      let list = [{tok:'fout'}]
      for (let i = 1; i < act.length; ++i) {
        list.push(look(acts,map,act[i]),{tok:'out'})
      }
      return list
    },
    out: (acts,map,actid,act) => {
      let list = [look(acts,map,act[1]),{tok:'arg'}]
      for (let i = 2; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:'out'})
      }
      return list
    },
    stk: (acts,map,actid,act) => [
      {tok:'newstk'},
      look(acts,map,act[2]),{tok:'addstk'},
      look(acts,map,act[3]),{tok:'addstk'},
      look(acts,map,act[1]),{tok:'endstk'},
    ],

    key: (acts,map,actid,act) => look(acts,map,act[1]).concat(
      {tok:'addkey'}, look(acts,map,act[2]), {tok:'addmap'}
    ),
    map: (acts,map,actid,act) => {
      let list = [{tok:'newmap'}]
      for (let i = 1; i < act.length; ++ i) {
        list = list.concat(look(acts,map,act[i]))
      }
      return list.concat({tok:'endmap'})
    },
    act: (acts,map,actid,act) => f.ary(acts,map,actid,act).concat({tok:'act'}),
  }
  function look(acts,map,actid) {
    let ret = map[actid], act = acts[actid]
    if (!ret && !act.look) {
      act.look = true
      ret = f[act[0]](acts,map,actid,act)
      delete act.look
      if (typeof ret.concat != 'function') {
        throw [ret,act]
      }
      map[actid] = ret.concat({tok:'jumpback'})
    }
    return {tok:'jumplink',link:actid}
  }

  function proj(acts,catcher,link,save,jump) {
    const list = acts[link.actid]
    const top = list[jump]
    let bot
    if (top.flag == true) {
      top.flag = { tok:'temp' }
    }
    else if (top.flag) {
      return top.flag
    }
    else top.flag = true
    
    let fun = top && j[top.tok]
    if (typeof fun == 'string') fun = j[fun]
    if (typeof fun != 'function') {
      throw top
    }
    let ret = fun(acts,catcher,link,save,top,jump)
    let {flag} = top
    if (flag == true) delete top.flag
    else if (flag) {
      let {length} = save.stack
      while (length > 0) {
        ret = Object.assign({},save.stack[--length],{jump:ret})
      }
      Object.assign(flag,ret)
      top.flag = true
    }
    else throw top
    return ret
  }
  const j = {
    end: (acts,catcher,link,save,top,jump) => {
      let ret = { tok:'end' }
      while (save) {
        let {length} = save.stack
        while (length > 0) {
          ret = Object.assign({},save.stack[--length],{jump:ret})
        }
        save = save.parent
      }
      return ret
    },
    char:'top',
    txt:'top',
    newlst:'top',
    addlst:'top',
    endlst:'top',
    top: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher,link,
      {parent:save.parent, stack:save.stack.concat(top), move:save.move},
      jump+top.jump,
    ),
    newsave: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher,link, {parent:save, stack:[], move:0}, jump+top.jump
    ),
    clearsave: (acts,catcher,link,{parent,move},top,jump) => {
      let ret = proj(acts,catcher,link,parent,jump+top.jump)
      if (move == 0) return ret
      else return { tok:'move', move:-move, jump:ret }
    },
    locksave: (acts,catcher,link,{parent,stack},top,jump) => {
      let {length} = stack
      let ret = proj(acts,catcher,link,parent,jump+top.jump)
      while (length > 0) ret = Object.assign({},stack[--length],{jump:ret})
      return ret
    },
    try: (acts,catcher,link,save,top,jump) => proj(
      acts,{ parent:catcher, catch:jump+top.catch, link:link },
      link,save,jump+top.jump
    ),
    catch: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher.parent,link,save,jump+top.jump
    ),
    err: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher.parent,catcher.link,save,catcher.catch
    ),
    fail: () => { return { tok:'fail' } },
    jumplink: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher,
      { parent:link, actid:top.link, jump:jump+top.jump },
      save,0
    ),
    jumpback: (acts,catcher,link,save,top,jump) => proj(
      acts,catcher,link.parent,save,link.jump
    ),
    cmp: (acts,catcher,link,save,top,jump) => {
      const ret = { tok:'cmp', cmp:{} }
      const newsave = {
        parent:save.parent,
        stack:save.stack,
        move:save.move+1
      }
      for (const c in top.cmp) {
        ret.cmp[c] = proj(acts,catcher,link,newsave,jump+top.cmp[c])
      }
      ret.jump = proj(acts,catcher,link,save,jump+top.jump)
      return ret
    }
  }

  return function ActComp({act,start}) {
    const map = {}
    const top = look(act,map,start)
    map[0] = [
      {tok:'try',catch:1,jump:2},
      {tok:'fail'},
      top,{tok:'catch'},{tok:'end'},
    ]
    for (const i in map) {
      const sub = map[i]
      for (const i in sub) if (sub[i].jump == undefined) sub[i].jump = 1
    }
    log(top,map)
    log(proj(
      map,
      false,
      { actid:0, parent:false },
      { parent:false, stack:[], move:0 },
      0,
    ))
    return top
  }
}
