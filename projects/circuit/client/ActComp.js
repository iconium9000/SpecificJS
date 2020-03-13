module.exports = Circuit => {

  function copy(...ary) { return Object.assign({},...ary) }

  function expandtracelist(body,trace,stack) {
    if (body == true || !body) return {trace:trace,fun:[],ret:!!body}
    switch (body.tok) {
      case 'next': return {trace:trace, fun:body.fun || [], ret:!!body.ret}
      default: error(body); throw 'expandtracelist body.tok'
    }
  }
  function prependtrace(root,spot) {
    throw 'prependtrace'
  }
  function appendtrace(root,spot) {
    throw 'appendtrace'
  }
  function mergetracelist(tracelist) {
    throw 'mergetracelist'
  }

  // on body error, prepend err to body
  // else body
  function mergeiferr(body,err) {
    let bodytracelist = expandtracelist(body,[[]],[])
    let errtracelist = expandtracelist(err,[[]],[])
    let tracelist = []
    for (const i in bodytracelist) {
      const bodytrace = bodytrace[i]
      if (bodytrace.ret) tracelist.push(bodytrace)
      else for (const j in errtracelist) {
        let {trace,fun,ret} = errtracelist[j]
        tracelist.push({
          trace:prependtrace(bodytrace.trace,trace),
          fun:fun,ret:ret
        })
      }
    }
    return mergetracelist(tracelist)
  }
  // on body error, body
  // else prepend ret to body
  function mergeifret(body,ret) {
    let bodytracelist = expandtracelist(body,[[]],[])
    let rettracelist = expandtracelist(ret,[[]],[])
    let tracelist = []
    for (const i in bodytracelist) {
      const bodytrace = bodytrace[i]
      if (bodytrace.ret) for (const j in rettracelist) {
        let {trace,fun,ret} = rettracelist[j]
        tracelist.push({
          trace:prependtrace(bodytrace.trace,trace),
          fun:bodytrace.fun.concat(fun),ret:ret
        })
      }
      else tracelist.push(bodytrace)
    }
    return mergetracelist(tracelist)
  }
  // on body error, prepend err
  // else append ret to body
  function mergeappend(body,ret,err) {
    let bodytracelist = expandtracelist(body,[[]],[])
    let rettracelist = expandtracelist(ret,[[]],[])
    let errtracelist = expandtracelist(err,[[]],[])
    let tracelist = []
    for (const i in bodytracelist) {
      const bodytrace = bodytrace[i]
      if (bodytrace.ret) for (const j in rettracelist) {
        let {trace,fun,ret} = rettracelist[j]
        tracelist.push({
          trace:appendtrace(bodytrace.trace,trace),
          fun:bodytrace.fun.concat(fun),ret:ret
        })
      }
      else for (const j in errtracelist) {
        let {trace,fun,ret} = errtracelist[j]
        tracelist.push({
          trace:prependtrace(bodytrace.trace,trace),
          fun:fun,ret:ret
        })
      }
    }
    return mergetracelist(tracelist)
  }
  function lookid(acts,stack,actid) {
    if (stack.includes(actid)) {
      if (!acts.map[actid]) acts.map[actid] = true
      return {
        tok:'link',err:false,
        link:{[actid]:{tok:'next',fun:['link'],ret:true }},
      }
    }
    stack = stack.concat(actid)
    const act = acts[actid]
    if (!act) {
      throw actid
    }
    switch (act[0]) {
      case 'lstadd': {
        if (act.length == 1) return true
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
        if (act.length < 2) return true
        let {length} = act, err = false
        while (length > 1) {
          err = mergeiferr(lookid(acts,stack,act[--length]),err)
        }
        return err
      }
      case 'cmp': {
        let txt = act[1], {length} = txt
        let ret = {tok:'next',fun:['txt',txt],ret:true}
        while (length > 0) ret = {
          tok:'char',err:false,
          char:{ [txt[--length]]:ret }
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
    log(act.map)

    return 'ActComp'
  }
}
