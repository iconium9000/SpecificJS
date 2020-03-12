module.exports = Circuit => {

  function copy(...ary) { return Object.assign({},...ary) }

  function mergebranch(branch) {
    let {preretfun,preerrfun,body,retfun,ret,errfun,err} = branch
    if (!preretfun || preretfun == true) preretfun = []
    if (!preerrfun || preerrfun == true) preerrfun = []
    if (retfun == true) retfun = []
    else if (!retfun) retfun = false
    if (errfun == true) errfun = []
    else if (!errfun) errfun = false
    if (ret == true || !ret) ret = { fun:[], ret:!!ret }
    if (err == true || !err) err = { fun:[], ret:!ret }

    log(preretfun,preerrfun,body,retfun,errfun,ret,err)
    return 'branch'
  }

  function lookid(acts,stack,actid) {
    if (stack.includes(actid)) {
      if (!acts.map[actid]) acts.map[actid] = true
      return {
        branch:[{
          tok:'link',link:actid,
          next:{ fun:[], ret:true },
          pass:false
        }],
        ret:{fun:[],ret:false}
      }
    }
    stack = stack.concat(actid)
    let act = acts[actid], flag = true
    switch (act[0]) {
      case 'or': {
        let {length} = act, ret = false
        while (length > 1) ret = mergebranch({
          body:lookid(acts,stack,act[--length]),
          retfun:true,ret:true,err:ret
        })
        return ret
      }
      case 'lst':flag = ['lstadd']
      case 'lstbare':{
        if (act.length < 2) return { fun:['lstempty'], ret:true }
        let {length} = act, ret = { fun:['lstend'], ret:true }
        while (length > 1) {
          ret = {
            body:lookid(acts,stack,act[--length]),
            retfun:flag,ret:ret
          }
          if (length == 1) ret.preretfun = ['lstnew']
          ret = mergebranch(ret)
        }
        return ret
      }
      case 'lstadd':switch (act.length) {
        case 3:flag = mergebranch({
          body:lookid(acts,stack,act[2]),
          retfun:true,ret:true
        })
        case 2:return mergebranch({
          body:lookid(acts,stack,act[1]),
          retfun:['lstadd'],ret:flag,err:flag!=true
        })
        default:return true
      }
      case 'cmp':{
        let str = act[1], {length} = str
        let ret = { fun:['txt',str], ret:true }
        while (length > 0) ret = mergebranch({
          body:{
            branch:[{
              tok:'char',char:str[--length],
              next: {fun:['char'],ret:true},
              pass:false
            }],
            ret:{fun:[],ret:false},
          },
          retfun:true,ret:ret
        })
        return ret
      }
      default:error(...act); throw 'lookid'
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

    act.map = { [start]:true }
    while (true) {
      let flag = true
      for (const i in act.map) if (act.map[i] == true) {
        act.map[i] = lookid(act,[],parseInt(i))
        flag = false
      }
      if (flag) break
    }
    log(act)

    return 'ActComp'
  }
}
