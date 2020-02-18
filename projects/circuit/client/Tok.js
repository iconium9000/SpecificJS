// `; test = `
const TOK = `

### Space ###

linecom // $\n.;
multlncom /$* $*/.;
pad $ | $\n | linecom | multlncom;

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

var1
  var { act Var @ }; # |
  # ($( var16?? $)) { strip @2 };
val1 var1 | num |
  ( $( pad* val16 pad* $) ) { strip @2 } |
  ( $( $). ) { err @1 };

### op level 2 ###
inc $+$+ | --;

val2 (val1 (
  (pad* inc) {ary (txtsum Post @1)} |
  (pad* ($. | ->) pad* var) {ary (txtsum Mem @1) @3} |
  (pad* $( pad* comma pad* ($) {ary} | $). {err @}) )
    {ary Callfun @3 @5} |
  (pad* $[ pad*
    ( (val16 pad* $]){strip @0} | $]. {err @}) )
    {ary Subscript @3}
)*) {stack};

### op level 3 ###
val3_pfx inc | $+ | - | $! | ~ | $* | &;
val3
  (val3_pfx pad* val3) {act (txtsum Pre @0) %2} |
  # TODO sizeof
  # TODO typecast
  # TODO new
  # TODO delete
  val2;

val4 (val3 (pad* ($.$* | ->$*) pad* val3){ary %1 %3}*) { stack };
val5 (val4 (pad* ($* | / | $%) pad* val4){ary %1 %3}*) { stack };
val6 (val5 (pad* ($+ | -) pad* val5){ary %1 %3}*) { stack };
val7 (val6 (pad* (<< | >>) pad* val6){ary %1 %3}*) { stack };
val8 (val7 (pad* <=> pad* val7){ary %1 %3}*) { stack };
val9 (val8 (pad* (< | > | <= | >=) pad* val8){ary %1 %3}*) { stack };
val10 (val9 (pad* (== | $!=) pad* val9){ary %1 %3}*) { stack };
val11 (val10 (pad* (& &!){ary @0} pad* val10){ary %1 %3}*) { stack };
val12 (val11 (pad* ^^ pad* val11){ary %1 %3}*) { stack };
val13 (val12 (pad* ($| $|!){ary @0} pad* val12){ary %1 %3}*) { stack };
val14 (val13 (pad* && pad* val13){ary %1 %3}*) { stack };
val15 (val14 (pad* $|$| pad* val14){ary %1 %3}*) { stack };
val16 val15;

### Scope ###
comma ( (val16 pad* , pad*){strip @0}* (val16|)){ary @0 @1};

statement
  ( comma pad* $; ) { act Comma @0 } |
  $;. {err @};
scope (
  ( statement (pad* statement){strip @1}* ) {ary %0 @1} |
) {act Scope @};

start (pad* scope pad*) {strip @1};

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
      else if ('*+.!'.includes(c)) state.push([c,state.pop()])
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
      else if (' \n)}'.includes(c)) {
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
      else if (' \n*+.!|])};'.includes(c)) {
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
