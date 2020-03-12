module.exports = Circuit => {

  function copy(...ary) { return Object.assign({},...ary) }

  function gotostrip(state,stripidx,fun) {
    state = copy(state)
    if (stripidx > state.stripidx) throw "strip can't jump forward"
    else if (stripidx != undefined && stripidx != state.stripidx) do {
      if (!state.strip) throw 'empty strip stack'
      let {parent} = state

      --state.stripidx
    } while (stripidx < state.stripidx)


    return state
  }
  function lookbranch(state,branch) {
    log(state,branch)
    throw 'lookbranch'
  }
  function lookid(state,actid) {
    if (state.stack.includes(actid)) {
      return lookbranch(state,{tok:'link',link:actid})
    }
    state = copy(state)
    state.stack = state.stack.concat(actid)
    return lookact(state,state.acts[actid])
  }
  function lookact(state,act) {
    let {ret,err} = state; state = copy(state)
    switch (act[0]) {
      case 'lstbare': {
        let {length} = act; ret = {tok:'ret',fun:['lstend'],ret:ret}
        while (length > 1) ret = {
          tok:'actid',actid:act[--length],fun:[],
          ret:ret,err:err
        }
        ret.fun.splice(0,0,'lstnew')
        return looktok(state,ret)
      }
      case 'lstadd': {
        let [tok,actid,jump] = act
        if (jump == undefined) state.ret = {tok:'ret',fun:['lstadd'],ret:ret}
        else {
          state.ret = {tok:'actid',fun:['lstadd'],actid:jump,ret:ret,err:err}
          state.err = {tok:'ret',stripidx:state.stripidx,ret:ret}
        }
        return lookid(state,actid)
      }
      case 'or': {
        let {length} = act
        while (length > 1) err = {
          tok:'actid',actid:act[--length],
          ret:ret,err:err,
          stripidx:state.stripidx
        }
        return looktok(state,err)
      }
      case 'lst': {
        let {length} = act; ret = {tok:'ret',fun:['lstend'],ret:ret}
        while (length > 1) {
          ret.fun.splice(0,0,'lstadd')
          ret = { tok:'actid',fun:[],actid:act[--length],ret:ret,err:err }
        }
        ret.fun.splice(0,0,'lstnew')
        return looktok(state,ret)
      }
      case 'cmp': {
        let str = act[1], {length} = str
        ret = {tok:'ret',fun:['txt',str],ret:ret}
        err = {tok:'err',stripidx:state.stripidx,err:err}
        while (length > 0) ret = {tok:'char',char:str[--length],ret:ret,err:err}
        return looktok(state,ret)
      }
      default: error(...act); throw 'lookact'
    }
  }
  function looktok(state,tok) {
    state = gotostrip(state,tok.stripidx,tok.fun || [])
    state.err = tok.err
    state.ret = tok.ret

    switch (tok.tok) {
      case 'ret': {
        if (state.ret) return looktok(state,state.ret)
        else throw 'ret'
      }
      case 'err': {
        if (state.err) return looktok(state,state.err)
        else throw 'err'
      }
      case 'char': {
        const {stripidx,ret} = state
        state.ret = {tok:'ret',fun:['char'],stripidx:stripidx+1,ret:ret}
        return lookbranch(state,{tok:'char',char:tok.char})
      }
      case 'actid': return lookid(state,tok.actid)
      default: error(tok); throw 'looktok'
    }
  }


  return function ActComp({act,start}) {

    let rep = {}
    for (let i = 1; i < act.length; ++i) {
      let [tok,actid] = act[i]
      let rep0 = tok == 'rep0'
      if (rep0 || tok == 'rep1') {
        let repid = rep[actid]
        if (!repid) {
          rep[actid] = repid = ++act.length
          act[repid] = ['lstadd',actid,repid]
        }
        if (rep0) act[i] = ['lstbare',repid]
        else {
          let addid = ++act.length
          act[addid] = ['lstadd',actid]
          act[i] = ['lstbare',addid,repid]
        }
      }
    }
    log(act)
    const map = {}
    let ret = lookid({
      acts:act,
      map:map,
      stack:[],
      strip:false,
      stripidx:0,
      ret:false,
      err:false,
    },start)
    log(map,ret)

    return 'ActComp'
  }
}
