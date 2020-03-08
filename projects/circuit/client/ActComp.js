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
      const link = ++map.length
      map[link] = [
        {tok:'newsave'},
        look(acts,map,act[1]),
        {tok:'addlst'},
        {tok:'locksave'},
        {tok:'jumplink',link:link}
      ]
      return [
        {tok:'newlst'},
        {tok:'try',catch:2},
        {tok:'jumplink',link:link},
        {tok:'clearsave'},
        {tok:'endlst'},
      ]
    },
    rep1: (acts,map,actid,act) => {
      const link = ++map.length
      map[link] = [
        {tok:'newsave'},
        look(acts,map,act[1]),
        {tok:'addlst'},
        {tok:'locksave'},
        {tok:'jumplink',link:link},
      ]
      return [
        {tok:'newlst'},
        look(acts,map,act[1]),{tok:'addlst'},
        {tok:'try',catch:2},
        {tok:'jumplink',link:link},
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
        {tok:'endtry'},
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
      {tok:'try',catch:6},
      {tok:'newsave'},
      look(acts,map,act[1]),
      {tok:'clearsave'},
      {tok:'endtry'},
      {tok:'err'},
      {tok:'clearsave'},
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
          { tok:'cmp', cmp:cmp },
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

  function copy(...state) { return Object.assign({},...state) }
  function jumpstate(state,act) {
    if (act.jump > 0) state.jump += act.jump
    else ++state.jump
    return state
  }

  function proj(state) {
    let newlist = []
    while (state.jump >= 0) {
      const act = state.link.list[state.jump]
      if (!act) break

      let fun = proj.fun[act.tok]
      if (typeof fun == 'string') fun = proj.fun[fun]
      if (typeof fun != 'function') {
        throw ['proj',state,act]
      }
      state.ret = []
      state = copy(state)
      state = fun(state,act)
      newlist = newlist.concat(state.ret)
    }
    return newlist
  }
  proj.fun = {
    end: (state,act) =>{
      const {ret} = state.save
      state.save = copy(state.save)
      state.save.ret = []
      state.ret = [{tok:'doret',ret:ret},{ tok:'jumpback' }]
      state.jump = -1
      return state
    },
    fail: (state,act) => {
      state.ret = { tok:'jumpfail' }
      state.jump = -1
      return state
    },
    try: (state,act) => {
      const {catcher,link} = state
      state.catcher = {
        parent:catcher,
        jump:state.jump + act.catch,
        link:link,
        count:0,
      }
      return jumpstate(state,act)
    },
    err: (state,act) => {
      const {link,parent,jump,count} = state.catcher
      for (let i = count; i > 0; --i) state.link = state.link.parent
      state.catcher = parent
      state.jump = jump
      return state
    },
    endtry: (state,act) => {
      const {parent,count} = state.catcher
      state.catcher = copy(parent,{ count:parent.count+count })
      return jumpstate(state,act)
    },
    sudojump: (state,act) => {
      let ret = state.map[act.link]
      if (!ret) {
        ret = []
        state.map[act.link] = ret
        const safestate = copy(state)
        safestate.jump = 0
        safestate.save = { parent:false, ret:[], move:0 }
        safestate.catcher = { parent:false, count:0 }
        safestate.link = {
          parent:false,
          list: [
            {tok:'try',catch:1,jump:2},
            {tok:'fail'},
            {tok:'safejump', link:act.link },
            {tok:'endtry'},{tok:'end'}
          ]
        }
        Object.assign(ret,proj(safestate))
      }

      const saveret = state.save.ret
      state.save = copy(state.save)
      state.save.ret = []
      const catcher = copy(state)
      const {link,parent,jump,count} = catcher.catcher
      for (let i = count; i > 0; --i) catcher.link = catcher.link.parent
      catcher.catcher = parent
      catcher.jump = jump
      state.ret = [{tok:'doret',ret:saveret},{
        tok:'jumplink',
        link:act.link,
        catcher:proj(catcher)
      }]
      return jumpstate(state,act)
    },
    jumplink: (state,act) => {
      let {acts,link} = state, list = acts[act.link]
      while (link.parent) {
        if (list == link.list) return proj.fun.sudojump(state,act)
        else link = link.parent
      }
      return proj.fun.safejump(state,act)
    },
    safejump: (state,act) => {
      const {acts,link,catcher} = state
      const list = acts[act.link]
      state.catcher = copy(catcher,{ count:catcher.count+1 })
      state.link = jumpstate({
        parent:link,
        list:list,
        jump:state.jump
      },act)
      state.jump = 0
      return state
    },
    jumpback: (state,act) => {
      const {catcher,link:{parent,jump}} = state
      state.catcher = copy(catcher,{ count:catcher.count-1 })
      state.link = parent
      state.jump = jump
      return state
    },
    rchar: (state,act) => {
      state.ret = { tok:act.tok }
      state.save = copy(state.save)
      ++state.save.move
      return jumpstate(state,act)
    },
    move: (state,act) => {
      state.ret = { tok:act.tok }
      return jumpstate(state,act)
    },
    newlst: 'ret',
    endlst: 'ret',
    addlst: 'ret',
    txt: 'ret',
    ret: (state,act) => {
      const {ret} = state.save
      state.save = copy(state.save)
      state.save.ret = ret.concat(act)
      return jumpstate(state,act)
    },
    newsave: (state,act) => {
      state.save = { parent:state.save, ret:[], move:0 }
      return proj.fun.move(state,act)
    },
    clearsave: (state,act) => {
      const {move} = state.save
      if (state.save.parent) {
        state.save = state.save.parent
      }
      else state.save = { parent:false, ret:[], move:0 }
      if (move > 0) return proj.fun.move(state,act)
      else return proj.fun.ret(state,copy(act,{tok:'locksave'}))
    },
    locksave: (state,act) => {
      const {ret} = state.save
      if (state.save.parent) state.save = copy(state.save.parent)
      else state.save = { parent:false, ret:[], move:0 }
      state.save.ret = state.save.ret.concat(ret)
      log('locksave',state.save)
      return proj.fun.move(state,act)
    },
    cmp: (state,act) => {
      const ret = {tok:'cmp',cmp:{}}
      for (const c in act.cmp) {
        const jump = { jump:state.jump + act.cmp[c] }
        ret.cmp[c] = proj(copy(state,jump))
      }
      state.ret = ret
      return jumpstate(state,act)
    }
  }

  function flatten(list,jump) {
    let newlist = [], {length} = list
    // log('flatten',list)
    let i = 0
    while (i < length) {
      const act = list[i++]
      if (act.tok == 'cmp') while (i < length) {
        const test = list[i]
        if (test.tok != 'cmp') break
        for (const c in test.cmp) {
          if (!act.cmp[c]) act.cmp[c] = test.cmp[c]
        }
        list.splice(i,1); --length
      }
    }
    while (length > 0) {
      let act = list[--length]
      let fun = flatten.fun[act.tok]
      if (typeof fun == 'string') fun = flatten.fun[fun]
      if (typeof fun != 'function') {
        throw ['flatten',act]
      }
      fun = fun(act,newlist.length+jump)
      log('flat',fun,newlist)
      newlist = fun.concat(newlist)
    }
    return newlist
  }
  flatten.fun = {
    jumpfail: 'move',
    jumpback: 'move',
    locksave: 'move',
    newsave: 'move',
    clearsave: 'move',
    rchar: 'move',
    move: ({tok},jump) => [{tok:tok}],
    doret: ({tok,ret},jump) => [{tok:tok,ret:ret}],
    cmp: (act,jump) => {
      const ret = {
        tok:'cmp',
        cmp: {}
      }
      let newlist = [ret]
      for (const c in act.cmp) {
        ret.cmp[c] = newlist.length
        newlist = newlist.concat(flatten(act.cmp[c],0))
      }
      ret.jump = newlist.length + jump
      return newlist
    },
    jumplink: (act,jump) => {
      const catcher = flatten(act.catcher,0)
      return [{
        tok:'jumplink',
        link:act.link,
        catch:1,
        jump:catcher.length
      }].concat(catcher)
    }
  }

  return function ActComp({act,start}) {
    const map = {length:act.length}
    let top = look(act,map,start)
    map[0] = [
      {tok:'try',catch:1,jump:2},
      {tok:'fail'},top,{tok:'endtry'},{tok:'end'}
    ]
    log(top,map)

    const newmap = {}
    const ret = proj({
      map: newmap,
      acts: map,
      save: { parent:false, ret:[], move:0 },
      link: { parent:false, list:map[0] },
      catcher: { parent:false, count:0 },
      jump: 0
    })
    log(ret,newmap)
    const flatmap = {}
    for (const i in newmap) flatmap[i] = flatten(newmap[i],0)
    log(flatmap)


    return top
  }
}
