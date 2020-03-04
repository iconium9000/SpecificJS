module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [
        {tok:'newlst'},
        {tok:'errjump',jump:rep.length+3}
      ].concat(
        rep, {tok:'addlst'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endlst'}
      )
    },
    rep1: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      return [ {tok:'newlst'} ].concat(
        rep, {tok:'addlst'},
        {tok:'errjump',jump:rep.length+3},
        rep, {tok:'addlst'},
        {tok:'jump',jump:-rep.length-1},
        {tok:'endlst'}
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
      if (act.length == 1) return [{tok:'emptylst'}]
      let list = [{tok:'newlst'}]
      for (let i = 1; i < act.length; ++i) {
        list = list.concat(look(acts,map,act[i]),{tok:"addlist"})
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
      return [{tok:'errjump',jump:rep.length+2}].concat(rep,{tok:'err'})
    },

    char: (acts,map,actid,act) => [ {tok:'char'} ],
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1], list = []
      let {length} = str, next = [{tok:'txt',txt:str}]
      while (length > 0) next = [{tok:'cmp',cmp:{[str[--length]]:next}}]
      return next
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

  function ormerge(list) {

    if (list.length == 0) return []
    else if (list.length == 1) return list[0]

    const newlist = []
    let cmp = null, char = null, errjump = null
    function pushcmp() {
      if (!cmp) return
      for (const c in cmp) cmp[c] = ormerge(cmp[c])
      newlist.push({tok:'cmp',cmp:cmp})
      cmp = null
    }
    function pushchar() {
      if (!char) return
      newlist.push({tok:'char',char:ormerge(char)})
      char = null
    }
    function pusherrjump() {}
    for (const i in list) {
      const test = list[i]
      if (test.length == 0) {
        pushcmp(); pushchar(); pusherrjump()
        newlist.push({tok:'empty'})
        break
      }
      const top = test[0]
      switch (top.tok) {
        case 'cmp': {
          pushchar(); pusherrjump();
          if (!cmp) cmp = {}
          for (const c in top.cmp) {
            if (cmp[c]) cmp[c].push(top.cmp[c])
            else cmp[c] = [top.cmp[c]]
          }
        } break
        case 'char': {
          pushcmp(); pusherrjump();
          const slice = test.slice(1)
          if (char) char.push(slice)
          else char = [slice]
        } break
        default: {
          pushcmp(); pushchar(); pusherrjump()
          newlist.push({tok:'default',default:test})
        }
      }
    }

    pushcmp(); pushchar(); pusherrjump()
    list = []
    while (newlist.length) {
      const pop = newlist.pop()
      let {length} = list
      switch (pop.tok) {
        case 'char': {
          const {char} = pop
          if (char.length) {
            
          }
        } break
        // case 'cmp': {
        //   if (list.length) {
        //     list = [{tok:'jump',jump:list.length}].concat(list)
        //   }
        //   list = [pop].concat(list)
        // } break
        // case 'default': {
        //   if (list.length) {
        //     list = [{tok:'jump',jump:list.length}].concat(list)
        //   }
        //   list = pop.default.concat(list)
        // } break
        default: throw pop
      }
    }
    throw list
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
