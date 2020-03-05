module.exports = Circuit => {

  const f = {
    rep0: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      const repl = rep.length
      return [
        {tok:'catch',jump:repl+repl+5}
      ].concat(
        rep,{tok:'newaddlst'},
        {tok:'catch',jump:repl+2},
        rep,{tok:'addlst',jump:-repl},
        {tok:'endlst',jump:2},
        {tok:'emptylst'},
      )
    },
    rep1: (acts,map,actid,act) => {
      let rep = look(acts,map,act[1])
      const repl = rep.length
      return rep.concat(
        {tok:'newaddlst'},
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
      if (act.length == 1) return [{tok:'emptylst'}]
      let list = [], {length} = act
      for (let i = 1; i < length; ++i) {
        const tok = i == 1 ? 'newaddlst' : i < length-1 ? 'addlst' : 'addendlst'
        list = list.concat(look(acts,map,act[i]),{tok:tok})
      }
      return list
    },

    or: (acts,map,actid,act) => {
      let {length} = act
      if (length == 1) return []
      let list = look(acts,map,act[--length])
      while (length > 1) {
        const rep = look(acts,map,act[--length])
        list = [
          {tok:'catch',jump:rep.length+2}
        ].concat(rep,{tok:'jump',jump:list.length+1},list)
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
      {tok:'cmp',cmp:{'\\':1},jump:2},
      {tok:'schar',jump:2},
      {tok:'char'}
    ],
    mch: (acts,map,actid,act) => { throw "TODO mch" },
    cmp: (acts,map,actid,act) => {
      const str = act[1]
      let {length} = str, list = [{tok:'err'},{tok:'txt',txt:str}]
      if (length == 0) return [list[1]]
      while (length > 0) {
        list = [{
          tok:'cmp',
          cmp:{ [str[--length]]:list.length == 2 ? 2 : 1 },
          jump:list.length-1
        }].concat(list)
      }
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

  function listexpand(list) {
    // throw list
    const state = { list:list, map:{} }
    const ret = jumpfollow(state,0)
    throw ['listexpand',ret,state]
  }
  function jumpfollow(state,jump) {
    let top = state.map[jump]
    if (top) return top
    top = state.list[jump]
    if (!top) {
      const ret = state.map[jump] = { tok:'end' }
      // throw ['!top',ret,state]
      return ret
    }
    if (state.tok == 'catch' && state.jump <= jump) state = state.parent
    switch (top.tok) {
      case 'cmp': {
        const ret = state.map[jump] = { tok:'cmp', cmp:{} }
        for (const c in top.cmp) {
          ret.cmp[c] = jumpfollow(state,jump+top.cmp[c])
        }
        ret.jump = jumpfollow(state,jump+top.jump)
        return ret
      }
      case 'err': {
        let ret = null, pop = null
        while (state.parent) {
          switch (state.tok) {
            case 'catch': {
              top = jumpfollow(state.parent, state.jump)
              if (pop) {
                pop.jump = top
                return ret
              }
              else return top
            }
            case 'save': {
              top = { tok:'endsave' }
              if (ret) {
                pop.jump = top
                pop = top
              }
              else ret = pop = top
              state = state.parent
            } break
            default: throw state
          }
        }
        top = Object.assign({},top)
        if (pop) pop.jump = top
        else ret = top
        return state.map[jump] = ret
      }
      case 'jump': {
        return state.map[jump] = jumpfollow(state,jump+top.jump)
      }
      case 'newlst':
      case 'newaddlst':
      case 'endlst':
      case 'addendlst':
      case 'emptylst':
      case 'addlst':
      case 'char':
      case 'schar':
      case 'txt': {
        const ret = state.map[jump] = Object.assign({},top)
        ret.jump = jumpfollow(state,jump+(top.jump || 1))
        return ret
      }
      case 'newsave': {
        const ret = state.map[jump] = { tok:'newsave' }
        ret.jump = jumpfollow({
          list:state.list,
          map:{},
          parent:state,
          tok:'save'
        },jump+(top.jump || 1))
        return ret
      }
      case 'endsave': {
        if (state.tok == 'save') state = state.parent
        else throw state
        const ret = state.map[jump] = { tok:'endsave' }
        ret.jump = jumpfollow(state,jump+(top.jump || 1))
        return ret
      }
      case 'catch': {
        return state.map[jump] = jumpfollow({
          list:state.list,
          map:{},
          parent:state,
          tok:'catch',
          jump:jump + top.jump
        },jump+1)
      }
      default: throw top
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
      newlist.push(listexpand(test))
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
      return map[actid] = ret // jumpcollapse(listexpand(ret))
    }
  }

  return function ActComp({act,start}) {
    const map = {}
    const top = look(act,map,start)
    log(map)
    log(listexpand(top))
    return top
  }
}
