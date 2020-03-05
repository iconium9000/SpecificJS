module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [
        {tok:'newlst'},
        {tok:'catch',jump:rep.length+4}
      ].concat(
        rep, {tok:'addlst'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endcatch'},
        {tok:'endlst'}
      )
    },
    rep1: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [ {tok:'newlst'} ].concat(
        rep, {tok:'addlst'},
        {tok:'catch',jump:rep.length+4},
        rep, {tok:'addlst'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endcatch'},
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
      if (act.length == 1) return [{tok:'emptylst'}]
      let list = [{tok:'newlst'}]
      for (let i = 1; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:"addlst"})
      }
      list.push({tok:'endlst'})
      return list
    },

    or: (acts,map,actid,act) => {
      if (act.length == 1) return []

      let list = []
      for (let i = 1; i < act.length; ++i) list.push(look(acts,map,act[i]))
      return ormerge(list)
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
      return [{tok:'catch',jump:rep.length+2}].concat(rep,{tok:'err'})
    },

    char: (acts,map,actid,act) => [ {tok:'char'} ],
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1], list = []
      for (const i in str) list.push({tok:'cmp',cmp:{[str[i]]:1}})
      list.push({tok:'txt',txt:str})
      return list
    },
    txt: (acts,map,actid,act) => [ {tok:'txt',txt:act[1]} ],
    rng: (acts,map,actid,act) => [ {tok:'rng',low:act[1],high:act[2]} ],

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

  function jumpfollow(list,jump) {
    const top = list[jump]
    if (top == undefined) return { tok: 'jumpend' }
    switch (top.tok) {
      case 'char': return {
        tok: 'char',
        next: jumpfollow(list,jump+1)
      }
      case 'err': return { tok: 'err' }
      case 'cmp': {
        const ret = {
          tok: 'cmp',
          cmp: {},
        }
        for (const c in top.cmp) ret.cmp[c] = jumpfollow(list,jump+top.cmp[c])
        return ret
      }
      case 'catch': return {
        tok: 'catch',
        next: jumpfollow(list,jump+1),
        catch: jumpfollow(list,jump+top.jump),
      }
      case 'jump': return jumpfollow(list,jump+top.jump)
      default: return {
        tok: 'next',
        body: top,
        next: jumpfollow(list,jump+1)
      }
    }
  }

  function ormerge(list) {
    if (list.length == 0) return []
    else if (list.length == 1) return list[0]

    const newlist = []
    for (const i in list) {
      const test = list[i]
      if (test.length == 0) {
        newlist.push({tok:'empty'})
        break
      }
      newlist.push(jumpfollow(test,0))
    }
    throw [list,newlist]
  }

  function look(acts,map,actid) {
    let ret = map[actid]
    if (ret) return ret

    const act = acts[actid]
    if (act.look != null) {
      act.look = true
      return [{tok:'addrep',rep:actid}]
    }
    else {
      act.look = false
      ret = f[act[0]](acts,map,actid,act)
      if (act.look == true) {
        ret = [{tok:'newrep',rep:actid}].concat(ret,{tok:'endrep'})
      }
      delete act.look
      return map[actid] = ret
    }
  }

  return function ActComp({act,start}) {
    const map = {}
    const top = look(act,map,start)
    log(map)
    log(jumpfollow(top,0))
    return top
  }
}
