module.exports = Circuit => {

  function copy(...ary) { return Object.assign({},...ary) }

  function expandtrace(body,trace,stack) {
    let pop = trace.pop()
    switch (body.tok) {
      case 'next': {
        if (pop.length > 0) trace.push(pop)
        stack.push({ trace:trace, fun:body.fun || [], ret:body.ret })
      }; break;
      case 'char': {
        let {char} = body
        if (char == undefined) throw 'expandtrace char undefined'
        expandtrace(body.body,trace.concat(
          [pop.concat({tok:'char',char:char})],[[]]
        ),stack)
        expandtrace(body.err,trace.concat(
          [pop.concat({tok:'notchar',char:char})]
        ),stack)
      }; break
      default: error(body); throw 'expandtrace tok'
    }
    return stack
  }
  function mergetrace(a,b) {
    error('mergetrace',a,b)
    throw 'mergetrace'
  }
  function mergetracelist(tracelist) {
    const root = {}
    log('mergetracelist',tracelist)
    for (const i in tracelist) {
      let node = root, {trace,fun,ret} = tracelist[i]
      for (const j in trace) {
        error(trace[j])
        throw 'mergetracelist trace[j]'
      }
      if (!node.tok) {
        node.tok = 'next'
        node.fun = fun
        node.ret = ret
      } else switch (node.tok) {
        default: error(node); throw 'mergetracelist node.tok'
      }
    }
    if (!root.tok) {
      root.tok = 'next'
      root.fun = []
      root.ret = false
    }
    return root
  }

  // on body error, prepends err to body
  // else body
  function mergeiferr(body,err) {
    // return {
    //   tok:'mergeiferr',
    //   body:body,err:err
    // }
  }
  // on body error, body
  // else prepend ret to body
  function mergeifret(body,ret) {
    // return {
    //   tok:'mergeifret',
    //   body:body,ret:ret
    // }
  }
  // on body error,
  // prepend std error with !!err as ret to body
  // else append ret to body
  function mergeappend(body,ret,err) {
    let bodytracelist = expandtrace(body,[[]],[])
    let rettracelist = expandtrace(ret,[[]],[])
    let tracelist = []; err = !!err
    for (const i in bodytracelist) {
      const bodytrace = bodytracelist[i]
      if (!bodytrace.ret) {
        tracelist.push({trace:bodytrace.trace,fun:[],ret:err})
      }
      else for (const j in rettracelist) {
        const rettrace = rettracelist[j]
        tracelist.push({
          trace:bodytrace.trace.concat(
            bodytrace.if ?
            mergetrace(bodytrace.if,rettrace.trace) :
            rettrace.trace
          ),
          fun:bodytrace.fun.concat(rettrace.fun),
          ret:rettrace.ret
        })
      }
    }
    return mergetracelist(tracelist)
  }

  function lookid(acts,stack,actid) {
    if (stack.includes(actid)) {
      if (!acts.map[actid]) acts.map[actid] = true
      return {
        tok:'link',link:actid,
        body:{ tok:'next',fun:['link'],ret:true },
        err:{ tok:'next',fun:[],ret:false }
      }
    }
    stack = stack.concat(actid)
    const act = acts[actid]
    if (!act) {
      throw actid
    }
    switch (act[0]) {
      case 'lstadd': {
        if (act.length == 1) return {tok:'next',fun:[],ret:true}
        let body = lookid(acts,stack,act[1])
        if (act.length == 2) {
          return mergeappend(body,{tok:'next',fun:['lstadd'],ret:true})
        }
        else return mergeappend(body,mergeappend(
          {tok:'next',fun:['lstadd'],ret:true},
          lookid(acts,stack,act[2])
        ),true)
      }
      case 'lstbare': {
        if (act.length < 2) return {tok:'next',fun:['lstempty'],ret:true}
        let {length} = act, ret = {tok:'next',fun:['lstend'],ret:true}
        while (length > 1) {
          ret = mergeappend(lookid(acts,stack,act[--length]),ret)
        }
        return mergeappend({tok:'next',fun:['lstnew'],ret:true},ret)
      }
      case 'lst': {
        if (act.length < 2) return {tok:'next',fun:['lstempty'],ret:true}
        let {length} = act, ret = {tok:'next',fun:['lstend'],ret:true}
        while (length > 1) ret = mergeappend(
          lookid(acts,stack,act[--length]),
          mergeappend({tok:'next',fun:['lstadd'],ret:true},ret)
        )
        return ret
      }
      case 'or': {
        if (act.length < 2) return {tok:'next',fun:[],ret:true}
        let {length} = act, err = {tok:'next',fun:[],ret:false}
        while (length > 1) {
          err = mergeiferr(lookid(acts,stack,act[--length]),err)
        }
        return err
      }
      case 'cmp': {
        let txt = act[1], {length} = txt
        let ret = {tok:'next',fun:['txt',txt],ret:true}
        while (length > 0) ret = {
          tok:'char',char:txt[--length],
          body:ret,err:{tok:'next',fun:[],ret:false}
        }
        return ret
      }
      default: error(...act); throw 'lookid'
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
