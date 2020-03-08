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
      map[link] = [
        {tok:'newsave'},
        {tok:'jumplink',link:act[1],catch:[
          {tok:'clearsave'},
          {tok:'jumpback'}
        ]},
        {tok:'addlist'},
        {tok:'locksave'},
        {tok:'jumplink',link:link},
        {tok:'jumpback'}
      ]
      return list = [
        {tok:'newlist'},
        {tok:'jumplink',link:link},
        {tok:'endlist'},
        {tok:'jumpback'}
      ]
    },
    rep1: (acts,map,act) => {
      const link = ++map.length
      map[link] = [
        {tok:'newsave'},
        {tok:'jumplink',link:act[1],catch:[
          {tok:'clearsave'},
          {tok:'jumpback'}
        ]},
        {tok:'addlist'},
        {tok:'locksave'},
        {tok:'jumplink',link:link},
        {tok:'jumpback'}
      ]
      return list = [
        {tok:'newlist'},
        {tok:'jumplink',link:act[1]},
        {tok:'addlist'},
        {tok:'jumplink',link:link},
        {tok:'endlist'},
        {tok:'jumpback'}
      ]
    },

    or: (acts,map,act) => {
      const {length} = act
      if (length == 1) return []
      let ret = [
        {tok:'jumplink',link:act[--length]},
        {tok:'jumpback'}
      ]
      while (length > 1) {
        ret = [{tok:'clearsave'}].concat(ret)
        ret = [
          {tok:'newsave'},
          {tok:'jumplink',link:act[--length],catch:ret},
          {tok:'jumpback'}
        ]
      }
      return ret
    },
    and: (acts,map,act) => {
      const list = [], length = act.length-1
      if (length < 1) return list
      for (let i = 1; i < length; ++i) list.push(
        {tok:'newsave'},
        {tok:'jumplink',link:act[i]},
        {tok:'clearsave'}
      )
      list.push({tok:'jumplink',link:act[length]})
      return list
    },
    not: (acts,map,act) => { return [
      {tok:'newsave'},
      {tok:'jumplink',link:act[1],catch:[
        {tok:'clearsave'},
        {tok:'jumpback'}
      ]},
      {tok:'clearsave'},
      {tok:'jumpfail'}
    ]},
    char: (acts,map,act) => { return [
      { tok:'char', branch: {
        '\\': [ {tok:'next'},{tok:'schar'},{tok:'next'} ]
      }},
      {tok:'rchar'},{tok:'next'}
    ]},
    cmp: (acts,map,act) => {

    },


    lst: (acts,map,act) => {
      let list = [{tok:'newlist'}]
      for (let i = 1; i < act.length; ++i) {
        list.push({tok:'jumplink',link:act[i]},{tok:'addlist'})
      }
      list.push({tok:'endlist'})
      return list
    }
  }

  return function ActComp({act,start}) {
    const map = {length:act.length}
    for (let i = 1; i < act.length; ++i) map[i] = look(act,map,i)
    log(map)

    return 'error'
  }
}
