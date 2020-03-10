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
        save:['new'],
        tok:'jumplink',link:act[1],
        err:{save:['clear'],tok:'jumpret'},
        ret:{
          save:['lock'],
          ary:['add'],
          tok:'jumplink',link:link,
          ret:{tok:'jumpret'},
          err:{tok:'jumperr'}
        }
      }
      return {
        ary:['new'],
        tok:'jumplink',link:link,
        err:{tok:'jumperr'},
        ret:{ary:['end'],tok:'jumpret'}
      }
    },
    rep1: (acts,map,act) => {
      const link = ++map.length
      map[link] = {
        save:['new'],
        tok:'jumplink',link:act[1],
        err:{save:['clear'],tok:'jumpret'},
        ret:{
          save:['lock'],
          ary:['add'],
          tok:'jumplink',link:link,
          err:{tok:'jumperr'},
          ret:{tok:'jumpret'}
        }
      }
      return {
        ary:['new'],
        tok:'jumplink',link:act[1],
        err:{tok:'jumperr'},
        ret:{
          ary:['add'],
          tok:'jumplink',link:link,
          err:{tok:'jumperr'},
          ret:{ary:['end'],tok:'jumpret'}
        }
      }
    },
    lst: (acts,map,act) => {
      let {length} = act, ret = {ary:['end'],tok:'jumpret'}
      while (length > 1) {
        ret.ary.splice(0,0,'add')
        ret = {
          ary:[],
          tok:'jumplink',link:act[--length],
          err:{tok:'jumperr'},
          ret:ret,
        }
      }
      ret.ary.splice(0,0,'new')
      return ret
    },

    or: (acts,map,act) => {
      let {length} = act, ret = { tok:'jumpret' }
      if (length == 1) return ret
      ret = {
        save:[],
        tok:'jumplink',link:act[--length],
        err:{tok:'jumperr'},
        ret:ret
      }
      while (length > 1) {
        ret.save.splice(0,0,'clear')
        ret = {
          save:['new'],
          tok:'jumplink',link:act[--length],
          err:ret,
          ret:{ save:['lock'], tok:'jumpret' }
        }
      }
      return ret
    },
    and: (acts,map,act) =>  {
      let {length} = act, ret = { tok:'jumpret' }
      if (length == 1) return ret
      ret = {
        save:[],
        tok:'jumplink',link:act[--length],
        err:{tok:'jumperr'},
        ret:ret
      }
      while (length > 1) {
        ret.save.splice(0,0,'clear')
        ret = {
          save:['new'],
          tok:'jumplink',link:act[--length],
          err:{save:['clear'],tok:'jumperr'},
          ret:ret
        }
      }
      return ret
    },
    not: (acts,map,act) => { return {
      save:['new'],
      tok:'jumplink',link:act[1],
      err:{ save:['clear'], tok:'jumpret' },
      ret:{ save:['clear'], tok:'jumperr' }
    }},
    char: (acts,map,act) => { return {
      tok:'char',
      branch:{'\\':{
        save:['next'],
        tok:'char',
        char:{
          save:['next'],
          ary:['schar'],
          tok:'jumpret'
        }
      }},
      char:{
        ary:['char'],
        save:['next'],
        tok:'jumpret'
      }
    }},
    cmp: (acts,map,act) => {
      let str = act[1], {length} = str
      let ret = {
        save:[],
        ary:['txt',str],
        tok:'jumpret'
      }
      while (length > 0) {
        ret.save.splice(0,0,'next')
        ret = {
          save:[],
          tok:'char',
          branch:{ [str[--length]]:ret },
          char:{tok:'jumperr'}
        }
      }
      return ret
    },
  }

  function flatten(acts,act,stack,ret,err) {
    act.flag = true
    let fun = flatten.fun[act.tok]
    while (typeof fun == 'string') fun = flatten.fun[fun]
    if (typeof fun != 'function') {
      throw act
    }

    const tstack = {parent:false,save:[],ary:[]}
    stack = stack || tstack
    for (const i in act.save) {
      let {parent,save,ary} = stack
      parent = parent || tstack
      switch (act.save[i]) {
        case 'new': stack = {
          parent:stack, save:['new'], ary:[]
        }; break
        case 'lock': stack = {
          parent:parent.parent,
          save:annihilate(parent.save.concat(save,'lock')),
          ary:parent.ary.concat(ary)
        }; break
        case 'clear': stack = {
          parent:parent.parent,
          save:annihilate(parent.save.concat('clear')),
          ary:parent.ary
        }; break
        default: stack = {
          parent:parent, save:save.concat(act.save[i]), ary:ary
        }; break
      }
    }
    if (act.ary) {
      const {parent,save,ary} = stack
      stack = { parent:parent, save:save, ary:ary.concat(act.ary) }
    }
    fun = fun(acts,act,stack,ret,err)

    act.flag = false
    return fun
  }
  function popstack(stack,name) {
    if (stack.parent) return popstack(stack.parent,name).concat(stack[name])
    else return stack[name]
  }
  function annihilate(save) {
    return save

    let stack = { parent:false, ret:[] }

    for (let i = 0; i < save.length; ++i) {
      let {parent,ret} = stack
      switch (save[i]) {
        case 'new': {
          stack = { parent:stack, ret:[] }
          break;
        }
        case 'end': {
          if (parent == false) stack.ret.push('end')
          else if (stack.ret.length == 0) {
            stack = parent
            stack.ret.push('empty')
          }
          else {
            stack = parent
            stack.ret = stack.ret.concat('new',ret,'end')
          }
          break;
        }
        case 'lock': {
          if (parent == false) stack.ret.push('lock')
          else if (stack.ret.length == 0) stack = parent
          else {
            stack = stack.parent
            stack.ret = stack.ret.concat(ret)
          }
          break;
        }
        case 'clear': {
          if (parent == false) stack.ret.push('clear')
          else stack = parent
          break;
        }
        case 'txt': stack.ret.push(save[i],save[++i]); break;
        case 'schar':
        case 'char':
        case 'add':
        case 'next': stack.ret.push(save[i]); break;
        default: break;
      }
    }

    let ret = []
    while (stack) {
      if (stack.parent) ret = ['new'].concat(stack.ret,ret)
      else ret = stack.ret.concat(ret)
      stack = stack.parent
    }
    return ret
  }
  flatten.fun = {
    jumplink: (acts,act,stack,ret,err) => {
      const tret = ret
      ret = flatten(acts,act.ret,false,ret,err)
      err = flatten(acts,act.err,false,tret,err)
      let {link} = act; act = acts[link]
      if (act.flag) {
        acts.flat[link] = true
        return {
          tok:'jumplink',link:link,
          save:annihilate(popstack(stack,'save')),
          ary:annihilate(popstack(stack,'ary')),
          ret:ret,
          err:err
        }
      }
      else return flatten(acts,act,stack,ret,err)
    },
    char: (acts,act,stack,ret,err) => {
      const ans = { tok:'char',branch:{} }

      const {parent,save,ary} = stack
      // if (save.includes('next') || save.includes('clear')) {
        stack = { parent:parent, save:[], ary:ary }
        ans.save = save
      // }
      // else ans.save = []
      // if(save.length != ans.save.length) {
      //   log(ans)
      // }

      const char = flatten(acts,act.char,stack,ret,err)

      if (char.tok != 'char' || char.save.length > 0) ans.char = char
      else {
        ans.char = char.char
        for (const c in char.branch) {
          ans.branch[c] = char.branch[c]
        }
      }

      for (const c in act.branch) {
        ans.branch[c] = flatten(acts,act.branch[c],stack,ret,err)
      }

      return ans
    },
    badchar: (acts,act,stack,ret,err) => {
      const ans = { tok:'char',branch:{} }

      const {parent,save,ary} = stack
      stack = { parent:parent, save:[], ary:ary }

      ans.save = save
      ans.char = flatten(acts,act.char,stack,ret,err)
      for (const c in act.branch) {
        ans.branch[c] = flatten(acts,act.branch[c],stack,ret,err)
      }
      return ans
    },
    jumpret: (acts,act,stack,ret,err) => {
      if (ret) return flatten(acts,ret,stack)
      else return {
        tok:'jumpret',
        save:annihilate(popstack(stack,'save')),
        ary:annihilate(popstack(stack,'ary'))
      }
    },
    jumperr: (acts,act,stack,ret,err) => {
      if (err) return flatten(acts,err,stack)
      return {
        tok:'jumperr',
        save:annihilate(popstack(stack,'save')),
        ary:[]
      }
    }
  }

  return function ActComp({act,start}) {
    log(act)
    const map = {length:act.length,flat:{}}
    for (let i = 1; i <= act.length; ++i) map[i] = look(act,map,i)
    log(map)

    map.flat[start] = true
    while (true) {
      let flag = null
      for (const i in map.flat) if (map.flat[i] == true) {
        flag = i
        break
      }
      if (flag == null) break
      map.flat[flag] = flatten(map,map[flag],false)
    }
    log(map.flat)

    return 'error'
  }
}
