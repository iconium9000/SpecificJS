// `; test = `
const TOK = `

### Space ###

linecom // $\n!;
multlncom /$* $*/!;
space $ | $\n | linecom | multlncom;

### Num ###
dig [0 : 9];
char [a : z] | [A : Z];

float (dig* $. dig+) {ary Float (txtsum @0 . @2)};

oct (0 [0 : 7]*) {ary Oct (txtsum 0 @1)};

hex (0 (x|X) (dig | char)+) {
  ary Hex (txtsum 0x @2)
};

int dig+ { ary Int (txtsum @) };

sci ( (float|int) (e|E) ($+|-|) dig+ ) {
  ary Float (txtsum %0.1 %1 %2 @3)
};

num (hex | oct | sci | float | int) {act Rawnum @};

### Var ###
_var _ | char;
var ( _var (_var | dig)* ) { txtsum %0 @1 };

var1 var { act Var @ };
val1 var1 | num | ( $( space* val3 space* $) ) { ary @2 };

_val2 $* | $/ | $%;
val2 (val1 (space* _val2 space* val1){ary %1 %3}*) { stack };
_val3 $+ | $-;
val3 (val2 (space* _val3 space* val2){ary %1 %3}*) { stack };

### Start ###
start ( space* ( val3 space* $; space* ){ ary @0 }+ ) {
  act Start @1
};

`

module.exports = Circuit => {

  const Tok = {name:'Tok'}, stringmap = {}
  let state = ['start']
  let stringidx = 0

  const toks = {
    'start': c => {
      if (' \t\n'.includes(c)) ++stringidx
      else if (c == '#') return ['comment',state]
      else return ['regx',state,'']
    },
    'comment': c => {
      ++stringidx
      if (c == '\n') return state[1]
    },
    'regx': c => {
      ++stringidx
      if (' \t\n'.includes(c)) {
        state[0] = 'regxnext'
        return ['list',state]
      }
      else state[2] += c
    },
    'regxnext': c => {
      ++stringidx
      if (' \t\n'.includes(c));
      else if (c == '#') return ['comment',state]
      else {
        --stringidx
        const [tok,parent,key,arg] = state
        Tok[key] = arg
        return parent
      }
    },
    'list': c => {
      ++stringidx
      if (' \t\n'.includes(c));
      else if (c == '#') return ['comment',state]
      else if (';|)'.includes(c)) {
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
      else if (c == '{') return ['fun',['funnext',state]]
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
      if (' \n:'.includes(c));
      else if (c == ']') {
        const [tok,parent,low,high] = state
        parent.push([tok,low,high])
        return parent
      }
      else state.push(c)
    },
    'txt': c => {
      if (c == '$') {
        state[2] += TOK[++stringidx]
        ++stringidx
      }
      else if (' \n)'.includes(c)) {
        const [tok,parent,arg] = state
        parent.push([tok,arg])
        return parent
      }
      else {
        ++stringidx
        state[2] += c
      }
    },
    'string': c => {
      if (c == '$') {
        state[2] += TOK[++stringidx]
        ++stringidx
      }
      else if (' \n*+!|])};'.includes(c)) {
        const [tok,parent,arg] = state
        parent.push(stringmap[arg] || (stringmap[arg] = [tok,arg]))
        return parent
      }
      else {
        ++stringidx
        state[2] += c
      }
    },
    'fun': c => {
      ++stringidx
      if (c == ')' || c == '}') {
        const [tok,parent,name,...args] = state
        parent.push([name[1],...args])
        return parent
      }
      else if (' \t\n'.includes(c));
      else if (c == '#') return ['comment',state]
      else if (c == '(') return ['fun',state]
      else if (c == '@' || c == '%') return ['lookup',state,c]
      else return ['txt',state,c]
    },
    'funnext': c => {
      const [tok,parent,fun] = state
      const arg = parent.pop()
      parent.push(['fun',arg,fun])
      return parent
    },
    'lookup': c => {
      if (' \n)]}'.includes(c)) {
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
        if (state.length == 3) state.push('')
        state.push(state.pop() + c)
      }
    },
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

    for (const string in stringmap) {
      stringmap[string][0] = Tok[string] ? 'tok' : 'match'
    }
  }
  catch (e) { error(e) }
  log(state,Tok)
  return Tok
}
