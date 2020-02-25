module.exports = Circuit => function Act(vals,start) {
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
    if (typeof val == 'string') {
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
