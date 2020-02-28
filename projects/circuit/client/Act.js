module.exports = Circuit => {

  const f = {
    txt: val => val,
    cmp: val => val,
    rng: val => val,
    mch: val => ['cmp',val[1]],
    map: val => {
      const arg = {
        temp:{}, str:{}, mch:{}, val:{}, map:{}, queue:[],
        act:{length:0}
      }
      for (let i = 1; i < val.length; ++i) {
        const [lst,[txt,name],body] = val[i]
        const mch = ['mch',name]
        let temp = {
          name: name,
          mch: mch,
          mchstr: JSON.stringify(mch),
          val: body,
          valstr: JSON.stringify(body),
        }
        arg.mch[temp.mchstr] = temp
      }
      for (const mchstr in arg.mch) {
        const temp = arg.mch[mchstr]
        if (arg.mch[temp.valstr] == undefined) {
          temp.idx = arg.map[temp.valstr]
          if (temp.idx == undefined) {
            temp.idx = arg.map[temp.valstr] = ++arg.act.length
            arg.val[temp.idx] = temp.val
            arg.temp[temp.idx] = temp
          }
        }
        else arg.queue.push(temp)
      }
      const map = temp => {
        if (temp.touch) {
          delete temp.touch
          temp.idx = arg.map[temp.valstr] = ++arg.act.length
          arg.val[temp.idx] = temp.val
          arg.temp[temp.idx] = temp
          return temp.idx
        }
        if (temp.idx > 0) return temp.idx
        temp.idx = arg.map[temp.valstr]
        if (temp.idx > 0) return temp.idx
        temp.touch = true
        temp.idx = map(arg.mch[temp.valstr])
        delete temp.touch
        return temp.idx
      }
      arg.queue.forEach(map)
      for (const mchstr in arg.mch) {
        const temp = arg.mch[mchstr]
        if (temp.name == 'start') arg.start = temp.idx
        arg.map[temp.mchstr] = temp.idx
      }
      for (let idx in arg.temp) {
        const {val,valstr} = arg.temp[idx]
        Act(val,arg,valstr)
      }
      return arg
    },
    lst: (val,arg) => {
      let ret = [val[0]]
      for (let i = 1; i < val.length; ++i) ret.push(Act(val[i],arg))
      return ret
    }
  }

  function Act(val,arg,str) {
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
  return Act
}
