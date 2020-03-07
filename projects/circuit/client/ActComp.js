module.exports = Circuit => {

  function look(acts,map,actid) {
    let ret = map[actid], act = acts[actid]
    if (!ret && !act.look) {
      act.look = true
      ret = look.fun[act[0]](acts,map,actid,act)
      delete act.look
      if (typeof ret.concat != 'function') {
        throw [ret,act]
      }
      map[actid] = ret.concat({tok:'jumpback'})
    }
    return {tok:'jumplink',link:actid}
  }
  look.fun = {
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
      {tok:'rchar'},{tok:'schar',jump:2},
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
        },{tok:'rchar'}].concat(list)
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
          { tok:'rchar'}
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
  function pushstack(stack,ret) {
    if (stack.length > 0) {
      ret = Object.assign({},ret)
      if (ret.stack) ret.stack = ret.stack.concat(stack)
      else ret.stack = stack
    }
    return ret
  }

  function proj(acts,catcher,link,save,jump) {
    const list = acts[link.actid]
    const top = list[jump]
    const idx = ++acts.map.length
    const {parent,move} = save
    const {projpar} = proj

    if (top.flag == true) {
      top.flag = { tok:'jumplink', jump:{} }
      save = { parent:parent, move:move }
    }
    else if (top.flag) {
      top.flag.jump.flag = true
      log(projpar)
      acts.map[idx] = [...projpar,link.actid,jump,top,top.flag]
      return top.flag
    }
    else top.flag = true

    let fun = top && proj.fun[top.tok]
    if (typeof fun == 'string') fun = proj.fun[fun]
    if (typeof fun != 'function') {
      throw top
    }
    proj.projpar = [link.actid,jump]
    let ret = fun(acts,catcher,link,save,top,jump)
    proj.projpar = projpar
    if (top.flag == true) delete top.flag
    else if (top.flag) {
      const jump_flag = top.flag.jump.flag
      delete top.flag.jump.flag
      Object.assign(top.flag.jump,ret)
      if (jump_flag) {
        ret = top.flag
      }
      top.flag = true
    }
    else throw top
    acts.map[idx] = [...projpar,link.actid,jump,top,ret]
    return ret
  }
  proj.fun = {
    end: (acts,catcher,link,save,top,jump) => {
      return { tok:'end' }
    },
    txt:'top',
    rchar:'top',
    newlst:'top',
    addlst:'top',
    endlst:'top',
    top: (acts,catcher,link,save,top,jump) => {
      let ret = proj(acts,catcher,link,save,jump+top.jump,)
      return { tok:'top', top:top, jump:ret }
    },
    newsave: (acts,catcher,link,save,top,jump) => {
      let ret = proj(
        acts,catcher,link,
        {parent:save, move:0},
        jump+top.jump
      )
      return { tok:'newsave', jump:ret }
    },
    clearsave: (acts,catcher,link,{parent,move},top,jump) => {
      let ret = proj(acts,catcher,link,parent,jump+top.jump)
      // if (move > 0)
      ret = { tok:'clearsave', jump: ret, move:move }
      return ret
    },
    locksave: (acts,catcher,link,{parent,move},top,jump) => {
      let ret = proj(acts,catcher,link,{
        parent:parent.parent,
        move:parent.move
      },jump+top.jump)
      return { tok:'locksave', jump:ret, move:move }
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
    schar:'char',
    char: (acts,catcher,link,{parent,move},top,jump) => {
      return {
        tok:top.tok,
        jump:proj(acts,catcher,link,{
          parent:parent,
          move:move+1
        },jump+top.jump),
        stack: [{tok:'rchar'}]
      }
    },
    cmp: (acts,catcher,link,save,top,jump) => {
      const ret = { tok:'cmp', cmp:{} }
      const {parent,move} = save
      const newsave = { parent:parent, move:move+1 }
      for (const c in top.cmp) {
        ret.cmp[c] = proj(acts,catcher,link,newsave,jump+top.cmp[c])
      }
      let next = proj(acts,catcher,link,save,jump+top.jump)
      if (next.tok == 'cmp') {
        for (const c in next.cmp) {
          if (!ret.cmp[c]) ret.cmp[c] = next.cmp[c]
        }
        ret.jump = next.jump
      }
      else ret.jump = next
      return ret
    }
  }

  function annihilate(map,top) {
    if (top.flag == true) {
      throw top
    }
    else top.flag = true
    let fun = annihilate.fun[top.tok]
    if (typeof fun == 'string') fun = annihilate.fun[fun]
    if (typeof fun != 'function') {
      throw top
    }
    let ret = fun(map,top)
    if (top.flag == true) {
      delete top.flag
    }
    else {
      throw top
    }
    return ret
  }
  annihilate.fun = {
    top: (map,{tok,jump}) => [{tok:tok}].concat(annihilate(map,jump)),
    newsave: 'top',
    cmp: (map,{tok,cmp,jump}) => {
      const newcmp = {}
      for (const c in cmp) newcmp[c] = annihilate(map,cmp[c])
      throw ['cmp',newcmp,jump]
    }
  }
  return function ActComp({act,start}) {
    const map = {}
    let top = look(act,map,start)
    map[0] = [
      {tok:'try',catch:1,jump:2},
      {tok:'fail'},
      top,{tok:'catch'},{tok:'end'}
    ]
    for (const i in map) {
      const sub = map[i]
      for (const i in sub) if (sub[i].jump == undefined) sub[i].jump = 1
    }
    log(top,map)
    map.map = {length:0}
    proj.projpar = [0,0]
    top = proj(
      map,
      false,
      { actid:0, parent:false },
      { parent:false, move:0 },
      0,
    )
    for (let i = 1; i < map.map.length; ++i) log(...map.map[i])
    log(top,map)
    // const acts = {length:0}
    // acts[0] = annihilate(acts,top)
    // log(acts)
    return top
  }
}
