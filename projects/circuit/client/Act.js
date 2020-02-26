module.exports = Circuit => {


  const f = {
    txt: val => val,
    cmp: val => val,
    mch: val => ['cmp',val[1]],
    map: val => {
      let i = 0, arg = { temp:{}, mch:{}, val:{}, map:{}, act:{length:0} }
      while (++i < val.length) {
        const [lst,[txt,name],body] = val[i]
        let temp = arg.temp[name] = {
          idx: ++arg.act.length,
          mch: ['mch',name],
          str: JSON.stringify(body),
          val: body,
        }
        arg.map[name] = temp.idx
        arg.map[temp.str] = temp.idx
        arg.map[JSON.stringify(temp.mch)] = temp.idx
        arg.val[temp.idx] = body
        arg.mch[temp.idx] = name
        if (name == 'start') arg.start = temp.idx
      }
      for (let name in arg.temp) {
        const {idx,mch,str,val} = arg.temp[name]
        act(val,arg,str)
      }
      return arg
    },
    lst: (val,arg) => {
      let ret = [val[0]]
      for (let i = 1; i < val.length; ++i) ret.push(act(val[i],arg))
      return ret
    }
  }

  function act(val,arg,str) {
    if (Array.isArray(val)) {
      let idx,fun = f[val[0]]
      if (typeof fun != 'function') fun = f.lst
      if (arg == undefined) return fun(val)

      if (str == undefined) {
        str = JSON.stringify(val)
        idx = arg.map[str]
        if (idx == undefined) {
          arg.act[idx = ++arg.act.length] = fun(val,arg)
          arg.map[str] = idx
        }
      }
      else arg.act[idx = arg.map[str]] = fun(val,arg)
      if (arg.val[idx] == undefined) arg.val[idx] = val
      return idx
    }
    else {
      throw ['Act !Array',val]
    }
  }

  return function Act(val) { return act(val) }
}

function OldAct(vals,start) {
  const ary = [], src = {}
  const map = {}, strs = {}, mch = {}

  for (const name in vals) {
    const strA = mch[name] = JSON.stringify(vals[name])
    const strB = `["mch","${name}"]`
    const idx = ary.push('temp')-1
    map[strA] = map[strB] = map[name] = idx
  }
  for (const name in vals) set(mch[name],vals[name],true)

  function test(str,val,flag) {
    if (!Array.isArray(val)) {
      throw ['act',val]
    }
    let idx = map[str]
    if (idx != undefined && !flag) return idx
    const [top,txt] = val
    if (top == 'mch') return push(`["cmp","${txt}"]`,['cmp',txt])
    else if (top == 'cmp' || top == 'txt') return push(str,val)
    const ret = val.slice(1)
    for (const i in ret) ret[i] = set(JSON.stringify(ret[i]),ret[i])
    idx = push(str,[top].concat(ret))
    src[idx] = val
    return idx
  }

  function set(str,val,flag) {
    let idx = test(str,val,flag)
    src[idx] = val
    return idx
  }

  function push(str,ret) {
    let idx = map[str]
    if (idx == undefined) map[str] = idx = ary.push(ret)-1
    else ary[idx] = ret
    return idx
  }

  // for (const name in map) strs[map[name]] = name
  for (const name in mch) strs[map[mch[name]]] = name
  // for (const i in map) src[map[i]] = i
  // log(strs)
  return {
    mch: vals,
    ary: ary,
    map: src,
    start: map[start]
  }
}
