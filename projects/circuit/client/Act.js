module.exports = Circuit => function Act(vals,start,ary,strs) {
  const map = {}
  const mch = {}

  for (const name in vals) {
    const strA = mch[name] = JSON.stringify(vals[name])
    const strB = `["mch","${name}"]`
    const idx = ary.push('temp')-1
    map[strA] = map[strB] = map[name] = idx
  }
  for (const name in vals) test(mch[name],vals[name],true)

  function test(str,val,flag) {
    let idx = map[str]
    if (idx != undefined && !flag) return idx
    const [top,txt] = val
    if (top == 'mch') return push(`["cmp","${txt}"]`,['cmp',txt])
    else if (top == 'cmp' || top == 'txt') return push(str,val)
    const ret = val.slice(1)
    for (const i in ret) ret[i] = test(JSON.stringify(ret[i]),ret[i])
    return push(str,[top].concat(ret))
  }

  function push(str,ret) {
    let idx = map[str]
    if (idx == undefined) map[str] = idx = ary.push(ret)-1
    else ary[idx] = ret
    return idx
  }

  for (const name in map) strs[map[name]] = name
  log(strs)
  for (const name in mch) strs[map[mch[name]]] = name
  return map[start]
}
