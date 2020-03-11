module.exports = Circuit => {

  function copy(...ary) { return Object.assign({},...ary) }
  function looktok(acts,map,tok,state) {
    state = copy(state)
    switch (tok.tok) {
      case 'char': {
        let strip = state.strip[state.stripidx]
        let ret = true, err = true
        if (strip) {
          const char = strip.char[tok.char]
          if (char == false) ret = false
          else if (char == true) err = false
        }
        else {


          strip = { char:{}, link:{} }
          state.strip[state.stripidx] = strip
        }

        throw 'strip'
      }
      case 'actid': {
        if (tok.ret) state.ret = tok.ret
        if (tok.err) state.err = tok.err
        if (tok.fun) state.fun = state.fun.concat(tok.fun)
        if (tok.stripidx >= 0) state.stripidx = tok.stripidx
        return lookid(acts,map,tok.actid,state)
      }
      default: throw tok
    }
  }
  function lookact(acts,map,act,state) {
    let {length} = act
    switch (act[0]) {
      case 'lstadd': return looktok(acts,map,{
        tok:'actid',actid:act[1],
        ret:{ tok:'actid',actid:act[2],fun:['lstadd'] },
        err:{ tok:'fun' }
      },state)
      case 'rep0': {
        let link = ++acts.length
        acts[link] = ['lstadd',act[1],link]
        return looktok(acts,map,{
          tok:'actid',actid:link,fun:['lstnew'],
          ret:{ tok:'fun',fun:['lstend'] }
        },state)
      }
      case 'lst': {
        let tok = { tok:'fun',fun:['lstend'] }
        while (length > 1) tok = {
          tok:'actid',actid:act[--length],
          fun:['lstadd'],ret:tok,
        }
        tok.fun.slice(0,0,'lstnew')
        return looktok(acts,map,tok,state)
      }
      case 'or': {
        let tok = false
        while (length > 1) tok = {
          tok:'actid',actid:act[--length],
          err:tok,stripidx:state.stripidx
        }
        return looktok(acts,map,tok,state)
      }
      case 'cmp': {
        let str = act[1], {length} = str, tok = { tok:'fun', fun:['txt',str] }
        while (length > 0) tok = { tok:'char',char:--length,ret:tok }
        return looktok(acts,map,tok,state)
      }
      default: error(...act); throw 'bad act'
    }
  }
  function lookid(acts,map,actid,state) {
    if (state.stack.includes(actid)) {
      log(state,actid)
      throw 'linkid'
    }
    state = copy(state)
    state.stack = state.stack.concat(actid)
    const act = acts[actid]
    return lookact(acts,map,act,state)
  }

  return function ActComp({act,start}) {
    const map = {}
    lookid(act,map,start,{
      stack:[],
      strip:[],
      fun:[],
      stripidx:0,
      ret:{tok:'end'},
      err:{tok:'err'}
    })

    return 'ActComp'
  }
}
