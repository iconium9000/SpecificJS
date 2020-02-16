const TOK = `

### Space ###

linecom // $\n!
multlncom /$* $*/!
space $ | $\n | linecom | multlncom

### Num ###
dig [0 : 9]
char [a : z] | [A : Z]

float dig* $. dig+
[Float (sum @0 . @2)]

oct 0 [0 : 7]*
[Oct (sum 0 @1)]

hex 0 (x|X) (dig | char)+
[Hex (sum 0x @2)]

int dig+
[Int (sum @0)]

sci (float|int) (e|E) ($+|-|) dig+
[Float (sum %0.1 %1 %2 @3)]

num hex | oct | sci | float | int

### Var ###

_var _ | char
var _var (_var | dig)*
(sum %0 @1)

start space* num space*
[Start %1]

`

module.exports = Circuit => {

  const tokmap = {}, funmap = {}
  let state = ['start']
  let stringidx = 0

  const toks = {
    'start': c => {
      if (' \t\n'.includes(c)) ++stringidx
      else if (c == '#') return ['comment',state]
      else return ['tok',state,'']
    },
    'comment': c => {
      ++stringidx
      if (c == '\n') return state[1]
    },
    'tok': c => {
      ++stringidx
      if (c == ' ') {
        state[0] = '_tok'
        return ['list',state]
      }
      else state[2] += c
    },
    '_tok': c => {
      ++stringidx
      if (c == '\n' || c == ' ');
      else if (c == '#') return ['comment',state]
      else if (c == '(') return ['simplefun',state]
      else if (c == '[') return ['fun',state]
      else {
        const [tok,parent,name,val,fun] = state
        tokmap[name] = val
        funmap[name] = fun || ['pass']
        --stringidx
        return parent
      }
    },
    'list': c => {
      ++stringidx
      if (c == ' ');
      else if ('\n|)'.includes(c)) {
        const [tok,parent,...args] = state
        if (args.length == 0) state = ['empty']
        else if (args.length == 1) state = args[0]
        else state = [tok,...args]
        if (c == '|') return ['list',['|',parent,state]]
        else {
          parent.push(state)
          return parent
        }
      }
      else if ('*+!'.includes(c)) state.push([c,state.pop()])
      else if (c == '[') return ['range',state]
      else if (c == '(') return ['list',state]
      else {
        --stringidx
        return ['string',state,'']
      }
    },
    '|': c => {
      const [tok,parent,arga,argb] = state
      if (arga[0] == '|') state = arga
      else state = [tok,arga]
      if (argb[0] == '|') state = state.concat(argb.slice(1))
      else state.push(argb)
      parent.push(state)
      return parent
    },
    'range': c => {
      ++stringidx
      if (c == ' ' || c == ':');
      else if (c == ']') {
        const [tok,parent,low,high] = state
        parent.push([tok,low,high])
        return parent
      }
      else state.push(c)
    },
    'string': c => {
      if (c == '$') {
        state[2] += TOK[++stringidx]
        ++stringidx
      }
      else if (' \n*+!|])'.includes(c)) {
        const [tok,parent,arg] = state
        parent.push([tok,arg])
        return parent
      }
      else {
        ++stringidx
        state[2] += c
      }
    },
    'simplefun': c => {
      ++stringidx
      if (c == ')') {
        const [tok,parent,...args] = state
        parent.push([tok,...args])
        return parent
      }
      else if (c == ' ');
      else if (c == '(') return ['simplefun',state]
      else if (c == '@' || c == '%') return ['lookup',state,c,'']
      else {
        --stringidx
        return ['string',state,'']
      }
    },
    'lookup': c => {
      if (' \n)]'.includes(c)) {
        const [tok,parent,info,...args] = state
        for (const i in args) args[i] = parseInt(args[i])
        parent.push([tok,info,...args])
        return parent
      }
      else if (c == '.') {
        ++stringidx
        state.push('')
      }
      else {
        ++stringidx
        state.push(state.pop() + c)
      }
    },
    'fun': c => {
      ++stringidx
      if (c == ']') {
        const [tok,parent,...args] = state
        if (args.length == 0) state = ['empty']
        else if (args.length == 1) state = args[0]
        else state = [tok,...args]
        parent.push(state)
        return parent
      }
      else if (c == ' ');
      else if (c == '(') return ['simplefun',state]
      else {
        --stringidx
        return ['string',state,'']
      }
    },
  }

  class Prg {
    static init(string) {
      const prg = new this
      prg._map = []
      prg._string = string
      prg._startidx = 0
      prg._endidx = 0
      return prg
    }
    get copy() {
      return Object.create(this)
    }
    get nextidx() {
      ++prg._endidx; const {_map,_endidx} = this
      while (_map.length < _endidx) _map.push({})
      return _endidx
    }
    output(arg) {
      const {copy} = this
      copy._output = arg
      return copy
    }
    parse(tok,...args) {
      if (!this[tok]) throw `string tok error "${tok}"`
      return this[tok](...args)
    }
    string(arg) {
      const {_map,_endidx} = this
      const ans = _map[_endidx][arg]
      if (ans) return ans

      if (tokmap[arg]) return _map[_endidx][arg] = this.parse(...tokmap[arg])
      else {
        const {copy} = this
        _map[_endidx][arg] = copy
        for (const i in arg) {
          if (copy._string[copy.nextidx] != arg[i]) {
            return copy.error(`string match err "${arg}"`)
          }
        }
        copy._output = arg
        return copy
      }
    }
    list(...args) {
      let {copy} = this
      for (const i in args) {
        copy = copy.parse(...args[i])
        args[i] = copy._output
      }
      copy.output(args)
      return copy
    }
    ['*'] (arg) {
      const args = []
      let {copy} = this
      try {
        copy = copy.parse(...arg)
        args.push(copy._output)
      }
      finally { return copy.output(args) }
    }
  }

  try {
    let previdx = -1, prevstate = null
    while (stringidx < TOK.length || prevstate != state) {
      if (previdx == stringidx && prevstate == state) throw 'REPEAT'
      previdx = stringidx; prevstate = state
      state = toks[state[0]](TOK[stringidx]) || state
    }
    do {
      prevstate = state = toks[state[0]](TOK[stringidx]) || state
    } while (state != prevstate)
  }
  catch (e) { error(e) }
  log(state,tokmap,funmap)

  return function Tok(string) {
    const prg = Prg.init(string)

    try {
      log(prg.string('start'))
    }
    catch (e) {
      error(e)
    }
    log(prg)
  }
}
