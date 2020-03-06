module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      const repl = rep.length
      return [
        {tok:'newlst'},
        {tok:'catch',jump:repl+2},
      ].concat(
        rep,{tok:'addlst',jump:-repl},
        {tok:'endlst'},
      )
    },
    rep1: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      const repl = rep.length
      return [{tok:'newlst'}].concat(
        rep,{tok:'addlst'},
        {tok:'catch',jump:repl+2},
        rep,{tok:'addlst',jump:-repl},
        {tok:'endlst'}
      )
    },
    fun: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let list = look(acts,map,act[1])
      for (let i = 2; i < act.length; ++i) {
        list = list.concat({tok:'arg'},look(acts,map,act[i]))
      }
      return list
    },
    lst: (acts,map,actid,act) => {
      let list = [{tok:'newlst'}]
      for (let i = 1; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:'addlst'})
      }
      return list.concat({tok:'endlst'})
    },
    or: (acts,map,actid,act) => {
      let {length} = act
      if (length == 1) return []
      let list = look(acts,map,act[--length])
      while (length > 1) {
        const rep = look(acts,map,act[--length])
        list = [
          {tok:'catch',jump:rep.length+2}
        ].concat(
          rep,
          {tok:'jump',jump:list.length+1},
          list
        )
      }
      return list
    },
    and: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let {length} = act, list = look(acts,map,act[--length])
      while (length > 1) {
        let rep = look(acts,map,act[--length])
        if (rep.length > 0) {
          list = [{tok:'newsave'}].concat(rep,{tok:'endsave'},list)
        }
      }
      return list
    },
    not: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [
        {tok:'catch',jump:rep.length+2}
      ].concat(
        rep, {tok:'jump',jump:2},
        {tok:'jump',jump:2},
        {tok:'err'}
      )
    },

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
        list = list.concat(look(acts,map,act[i]),{tok:'addary'})
      }
      list.push({tok:'endary'})
      return list
    },
    str: (acts,map,actid,act) => f.ary(acts,map,actid,act).concat({tok:'str'}),
    pad: (acts,map,actid,act) => f.ary(acts,map,actid,act).concat({tok:'pad'}),
    fout: (acts,map,actid,act) => {
      let list = [{tok:'fout'}]
      for (let i = 1; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:'out'})
      }
      return list
    },
    out: (acts,map,actid,act) => {
      let list = look(acts,map,act[1]).concat({tok:'arg'})
      for (let i = 2; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:'out'})
      }
      return list
    },
    stk: (acts,map,actid,act) => [{tok:'newstk'}].concat(
      look(acts,map,act[2]),{tok:'addstk'},
      look(acts,map,act[3]),{tok:'addstk'},
      look(acts,map,act[1]),{tok:'endstk'},
    ),

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

  function listexpand(list,map) {
    const state = {
      act:map,
      list:list,
      tok:'top',
    }
    const ret = jumpfollow(state,0)
    throw ['listexpand',ret,state]
  }
  function jumpfollow(state,jump) {

    let top = state.list[jump]
    if (!top) return { tok:'end' }

    switch (top.tok) {
      case 'jumplink':
        return jumpfollow({
          act:state.act,
          list:state.act[top.link],
          tok:'jumplink',
          parent:state,
          link:state.link,
          jump:jump+1,
        },0)
      default: throw top
    }
  }

  function look(acts,map,actid) {
    let ret = map[actid], act = acts[actid]
    if (!ret && !act.look) {
      act.look = true
      ret = f[act[0]](acts,map,actid,act)
      delete act.look
      map[actid] = ret.concat({tok:'jumpback'})
    }
    return [ {tok:'jumplink',link:actid} ]
  }

  return function ActComp({act,start}) {
    const map = {}
    const top = look(act,map,start)
    log(listexpand(top,map))
    return top
  }
}
