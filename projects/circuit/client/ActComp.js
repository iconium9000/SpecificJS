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
      let {length} = act, ret = { save:[], tok:'jumpret' }
      if (length == 1) return ret; else ret.tok = 'jumperr'
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
    and: (acts,map,act) => {
      let {length} = act, ret = { save:[], tok:'jumpret' }
      if (length == 1) return ret
      while (length > 1) {
        ret.save.splice(0,0,'clear')
        ret = {
          save:['new'],
          tok:'jumplink',link:act[--length],
          err:{ save:['clear'], tok:'jumperr' },
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
        char:{ save:['next'], ary:['schar'], tok:'jumpret' }
      }},
      char:{ save:['next'], ary:['char'], tok:'jumpret' }
    }},
    cmp: (acts,map,act) => {
      let str = act[1], {length} = str
      let ret = { ary:['txt',str], tok:'jumpret' }
      while (length > 0) {
        ret.save = ['next']
        ret = {
          tok:'char',
          branch:{ [str[--length]]:ret },
          char:{tok:'jumperr'}
        }
      }
      return ret
    },
  }

  function matchary(a,b) {
    return JSON.stringify(a) == JSON.stringify(b)
  }
  function popstack(stack,name) {
    if (stack.parent) return popstack(stack.parent,name).concat(stack[name])
    else return stack[name]
  }
  function stripstack(stack,keep,strip) {
    if (stack) return {
      parent: stripstack(stack.parent,keep,strip),
      [keep]: stack[keep],
      [strip]: []
    }; else return false
  }
  function annihilate(save) {

    let ret = [], stack = { parent:false, tok:'start', ret:[] }
    for (let i = 0; i < save.length; ++i) switch (stack.tok) {
      case 'lock': switch (save[i]) {
        case 'new': {
          stack.parent.ret.push(...stack.ret)
          stack = stack.parent
        } break;
        case 'txt': stack.ret.push('txt',save[++i]); break;
        default: ret.push(save[i]); break;
      } break;
      case 'new': switch (save[i]) {
        case 'new': stack = { parent:stack, tok:'new', ret:[] }; break;
        case 'lock': stack.parent.ret.push(...stack.ret)
        case 'clear': stack = stack.parent; break;
        case 'end': {
          if (stack.ret.length == 0) {
            stack = stack.parent
            stack.ret.push('empty')
          }
          else {
            stack.parent.ret.push('new',...stack.ret,stack.tok)
            stack = stack.parent
          }
        } break;
        case 'txt': stack.ret.push('txt',save[++i]); break;
        default: stack.ret.push(save[i]); break;
      } break;
      default: switch (save[i]) {
        case 'lock':
        case 'new': stack = { parent:stack, tok:save[i], ret:[] }; break;
        case 'txt': stack.ret.push('txt',save[++i]); break;
        default: stack.ret.push(save[i]); break;
      } break;
    }
    while (stack) {
      switch (stack.tok) {
        case 'lock':
        case 'new': ret = [stack.tok].concat(stack.ret,ret); break;
        case 'txt': stack.ret.push('txt',save[++i]); break;
        default: ret = stack.ret.concat(ret); break;
      }
      stack = stack.parent
    }
    return ret
  }
  function flatten(acts,map,act,stack,ret,err) {
    act.flag = true
    let fun = flatten.fun[act.tok]
    while (typeof fun == 'string') fun = flatten.fun[fun]
    if (typeof fun != 'function') {
      throw act
    }

    const bstack = stack
    const tstack = {parent:false,save:[],ary:[]}
    stack = stack || tstack
    for (const i in act.save) {
      let {parent,save,ary} = stack
      parent = parent || tstack
      switch (act.save[i]) {
        case 'new':stack = {
          parent:stack,
          save:['new'],
          ary:[]
        }; break;
        case 'lock':stack = {
          parent:parent.parent,
          save:parent.save.concat(save,'lock'),
          ary:parent.ary.concat(ary)
        }; break;
        case 'clear':stack = {
          parent:parent.parent,
          save:parent.save.concat(save,'clear'),
          ary:parent.ary
        }; break;
        case 'next':stack = {
          parent:parent,
          save:save.concat('next'),
          ary:ary
        }; break;
        default:
      }
    }
    if (act.ary) {
      const {parent,save,ary} = stack
      stack = {
        parent:parent,
        save:save,
        ary:ary.concat(act.ary)
      }
    }
    fun = fun(acts,map,act,stack,ret,err)

    act.flag = false
    return fun
  }
  flatten.fun = {
    jumplink: (acts,map,act,stack,ret,err) => {
      const tret = ret
      ret = flatten(acts,map,act.ret,false,ret,err)
      err = flatten(acts,map,act.err,false,tret,err)
      let {link} = act; act = acts[link]
      if (act.flag) {
        map[link] = true
        return {
          tok:'jumplink',link:link,
          save:annihilate(popstack(stack,'save')),
          ary:annihilate(popstack(stack,'ary')),
          ret:ret,
          err:err
        }
      }
      else return flatten(acts,map,act,stack,ret,err)
    },
    char: (acts,map,act,stack,ret,err) => {
      const ans = { tok:'char',branch:{} }

      // log('char',stack)

      let save = annihilate(popstack(stack,'save'))
      if (save.includes('next') || save.includes('clear')) {
        ans.save = save
        stack = stripstack(stack,'ary','save')
      }
      else ans.save = []

      const char = flatten(acts,map,act.char,stack,ret,err)
      if (char.tok == 'char' && matchary(ans.save,char.save)) {
        ans.char = char.char
        for (const c in char.branch) {
          ans.branch[c] = char.branch[c]
        }
      }
      else ans.char = char

      for (const c in act.branch) {
        ans.branch[c] = flatten(acts,map,act.branch[c],stack,ret,err)
      }

      return ans
    },
    badchar: (acts,map,act,stack,ret,err) => {
      const ans = { tok:'char',branch:{} }

      const {parent,save,ary} = stack
      stack = { parent:parent, save:[], ary:ary }

      ans.save = save
      ans.char = flatten(acts,map,act.char,stack,ret,err)
      for (const c in act.branch) {
        ans.branch[c] = flatten(acts,map,act.branch[c],stack,ret,err)
      }
      return ans
    },
    jumpret: (acts,map,act,stack,ret,err) => {
      if (ret) return flatten(acts,map,ret,stack)
      else return {
        tok:'jumpret',
        save:annihilate(popstack(stack,'save')),
        ary:annihilate(popstack(stack,'ary'))
      }
    },
    jumperr: (acts,map,act,stack,ret,err) => {
      if (err) return flatten(acts,map,err,stack)
      return {
        tok:'jumperr',
        save:annihilate(popstack(stack,'save')),
        ary:[]
      }
    }
  }

  return function ActComp({act,start}) {
    log(act)
    const map = {length:act.length}
    for (let i = 1; i <= act.length; ++i) map[i] = look(act,map,i)
    log(map)

    const flat = { [start]:true }
    while (true) {
      let flag = null
      for (const i in flat) if (flat[i] == true) {
        flag = i
        break
      }
      if (flag == null) break
      flat[flag] = flatten(map,flat,map[flag],false)
    }
    log(flat)

    return 'error'
  }
}
