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
        pre:{tok:'newsave'},
        tok:'jumplink',link:act[1],
        catch:{ tok:'clearsave' },
        pst:{
          pre:{
            tok:'addlist',
            pst:{tok:'locksave'},
          },
          tok:'jumplink',link:link,
          catch:{tok:'jumpfail'},
        }
      }
      return {
        pre:{tok:'newlist'},
        tok:'jumplink',link:link,
        catch:{tok:'jumpfail'},
        pst:{tok:'endlist'}
      }
    },
    rep1: (acts,map,act) => {
      const link = ++map.length
      map[link] = {
        pre:{tok:'newsave'},
        tok:'jumplink',link:act[1],
        catch:{tok:'clearsave'},
        pst:{
          pre:{
            tok:'addlist',
            pst:{tok:'locksave'},
          },
          tok:'jumplink',link:link,
          catch:{tok:'jumpfail'}
        }
      }
      return {
        pre:{tok:'newlist'},
        tok:'jumplink',link:act[1],
        catch:{tok:'jumpfail'},
        pst:{
          pre:{tok:'addlist'},
          tok:'jumplink',link:link,
          catch:{tok:'jumpfail'},
          pst:{tok:'endlist'}
        }
      }
    },
    lst: (acts,map,act) => {
      let {length} = act, ret = {tok:'endlist'}
      while (length > 1) {
        ret.pre = {tok:'addlist'}
        ret = {
          tok:'jumplink',link:act[--length],
          pst:ret,
        }
      }
      ret.pre = {tok:'newlist'}
      return ret
    },

    or: (acts,map,act) => {
      let {length} = act, ret = { tok:'jumpback' }
      if (length == 1) return ret
      ret = {
        tok:'jumplink',link:act[--length],
        catch:{tok:'jumpfail'}
      }
      while (length > 1) {
        if (ret.pre) ret.pre = {tok:'clearsave',pst:ret.pre}
        else ret.pre = {tok:'clearsave'}
        ret = {
          pre:{tok:'newsave'},
          tok:'jumplink',link:act[--length],
          catch:ret,
          pst:{ tok:'locksave' }
        }
      }
      return ret
    },
    and: (acts,map,act) =>  {
      let {length} = act, ret = { tok:'jumpback' }
      if (length == 1) return ret
      ret = {
        tok:'jumplink',link:act[--length],
        catch:{tok:'jumpfail'}
      }
      while (length > 1) {
        if (ret.pre) ret.pre = {tok:'clearsave',pst:ret.pre}
        else ret.pre = {tok:'clearsave'}
        ret = {
          pre:{tok:'newsave'},
          tok:'jumplink',link:act[--length],
          catch:{tok:'jumpfail'},
          pst:ret
        }
      }
      return ret
    },
    not: (acts,map,act) => { return {
      pre:{tok:'newsave'},
      tok:'jumplink',link:act[1],
      catch:{ tok:'clearsave' },
      pst:{
        pre:{tok:'clearsave'},
        tok:'jumpfail'
      }
    }},
    char: (acts,map,act) => { return {
      tok:'char',
      branch:{ '\\':{ pre:{tok:'next'}, tok:'schar', pst:{tok:'next'} } },
      catch:{ pre:{tok:'rchar'}, tok:'next' }
    }},
    cmp: (acts,map,act) => {
      let str = act[1], {length} = str
      let ret = {tok:'txt',txt:str}
      while (length > 0) {
        ret.pre = {tok:'next'}
        ret = {
          tok:'char',
          branch:{ [str[--length]]:ret },
          catch:{tok:'jumpfail'}
        }
      }
      return ret
    },
  }



  return function ActComp({act,start}) {
    log(act)
    const map = {length:act.length}
    for (let i = 1; i <= act.length; ++i) map[i] = look(act,map,i)
    log(map)

    return 'error'
  }
}
