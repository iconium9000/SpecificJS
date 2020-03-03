module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [
        {tok:'newlist'},
        {err:true,tok:'jump',jump:rep.length+3}
      ].concat(
        rep, {tok:'addlist'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endlist'}
      )
    },
    rep1: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [ {tok:'newlist'} ].concat(
        rep, {tok:'addlist'},
        {err:true,tok:'jump',jump:rep.length+3},
        rep, {tok:'addlist'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endlist'}
      )
    },
    fun: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let list = look(acts,map,act[1])
      for (let i = 2; i < act.length; ++i) {
        list = list.concat({tok:'ret'},look(acts,map,act[i]))
      }
      return list
    },
    lst: (acts,map,actid,act) => {
      let list = [{tok:'newlist'}]
      for (let i = 1; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:"addlist"})
      }
      list.push({tok:'endlist'})
      return list
    },

    or: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let {length} = act, list = look(acts,map,act[--length])
      while (length > 1) {
        let rep = look(acts,map,act[--length])
        list = [ {err:true,tok:'jump',jump:rep.length+2} ].concat(
          rep, {tok:'jump',jump:list.length}, list
        )
      }
      return list
    },
    and: (acts,map,actid,act) => {
      if (act.length == 1) return []
      let {length} = act, list = look(acts,map,act[--length])
      while (length > 1) {
        let rep = look(acts,map,act[--length])
        list = [{tok:'newsave'}].concat(rep,{tok:'endsave'},list)
      }
      return list
    },
    not: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [{err:true,tok:'jump',jump:rep.length+2}].concat(rep,{tok:'err'})
    },

    char: (acts,map,actid,act) => [ {tok:'char'} ],
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1], list = []
      for (const i in str) list.push({tok:'cmp',c:str[i]})
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
      let list = look(acts,map,act[1]).concat({tok:'ret'})
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

    key: (acts,map,actid,act) => {
      return look(acts,map,act[1]).concat(
        {tok:'addkey'}, look(acts,map,act[2]), {tok:'addmap'}
      )
    },
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
    return top
  }
}
