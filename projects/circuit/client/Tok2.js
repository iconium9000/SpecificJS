const TOK2 = `

pad [fun [or " " "\t" "\n" [lst "#" [rep0 [not "\n"]]]] [ary]]
pad0 [rep0 pad]
pad1 [rep1 pad]
parop [or pad "(" ")" "[" "]" "{" "}" "<" ">" ]
funop [or parop "." '"' "'" "\`" ";"]
str [
  fun
  [rep1 [or [lst "$" [char]] [and [not funop] [char]]]]
  [ary str [ary fout]]
]
txt [fun [
  or
  [lst '\"' [rep0 [out [lst pad0 [and [not '\"'] fun]] 1]] pad0 '\"']
  [lst "\'" [rep0 [out [lst pad0 [and [not "\'"] fun]] 1]] pad0 "\'"]
  [lst "\`" [rep0 [out [lst pad0 [and [not "\`"] fun]] 1]] pad0 "\`"]
] [ary str [fout 1]]]
out [or [
  fun
  [lst "." pad0 str [rep0 [out [lst pad0 "." pad0 str] 3]]]
  [fout [ary [fout 2]] [fout 3]]
] [fun "." [ary fout]]]
par [
  fun
  [lst "(" pad0 str [out [lst pad0 [and [not ")"] fun]] 1] pad0 ")"]
  [ary [fout 2] [fout 4]]
]
ary [
  fun
  [lst "[" [rep0 [ out [lst pad0 [and [not "]"] fun]] 1 ]] pad0 "]"]
  [ary ary [fout 2]]
]
fun [or str txt out par ary]
regop [or parop '.' '*' '+' '|' '&' '@' ':' ';']
match [fun str [mch [fout]]]
char [fun '@' [ary char]]
range [
  fun
  [lst '<' pad0 [char] pad0 ':' pad0 [char] pad0 '>']
  [rng [fout 2] [fout 6]]
]
block [out [or
  [lst '(' pad0 or pad0 ')']
  [lst '[' pad0 or pad0 ']']
  [lst '{' pad0 or pad0 '}']
] 2]
post [fun [
  lst
  [or char match block range]
  [lst pad0 [rep0 [out [
    or
    [fun '*' [ary rep0]]
    [fun '+' [ary rep1]]
    [fun '!' [ary not]]
    [fun [lst '.' pad0 str] [ary out [fout 2]]]
    [fun [lst ':' pad0 fun] [ary fun [fout 2]]]
  ] 1]]]
] [stk [ary] [ary [fout 0]] [fout 1]]]
list [or [
  fun
  [lst post [rep1 [out [pad0 post] 1]]]
  [ary [ary [fout 0]] [fout 1]]
] post]
and [or [
  fun
  [lst list [rep1 [out [lst pad0 '&' pad0 list] 3]]]
  [and [ary [fout 0]] [fout 1]]
] list]
or [or [
  fun
  [lst and [rep1 [out [lst pad0 '|' pad0 and] 3]]]
  [or [ary [fout 0]] [fout 1]]
] and]
regx [out [lst [rep0 [
  fun
  [lst pad0 str pad0 or pad0 ';']
  [ary [fout 1] [fout 3]]
]] pad0] 0]
`

module.exports = Circuit => {

  function pad(idx) {
    if (' \n\t'.includes(TOK2[idx])) return [idx+1]
    else throw 'no pad'
  }
  function txt(idx) {
    let txt = ''
    while (idx < TOK2.length) {
      const c = TOK2[idx]
      if ('[] \n'.includes(c)) break
      txt += c; ++idx
    }
    if (txt.length) return [idx, txt]
    else throw 'bad txt'
  }
  function str(idx) {
    const start = TOK2[idx]
    if ('\'\"\`'.includes(start)) {
      let str = ''
      while (++idx < TOK2.length) {
        const c = TOK2[idx]
        if (c == start) return [idx+1,str]
        else str += c
      }
      throw `str no close at ${idx}`
    }
    throw `bad str`
  }
  function rep0(idx,fun) {
    const out = []
    try {
      while (idx < TOK2.length) {
        const [_idx,_out] = fun(idx)
        idx = _idx; out.push(_out)
      }
    }
    // catch (e) { error('rep0',e)}
    finally { return [idx,out] }
  }
  function or(idx,...funs) {
    for (const i in funs) {
      try { return funs[i](idx) }
      catch (e) {}
    }
    throw 'bad or'
  }
  function cmp(idx) {
    const [sidx,name] = str(idx)
    return [sidx,['cmp',name]]
  }
  function mch(idx) {
    const [sidx,name] = txt(idx)
    return [sidx,['cmp',name]]
  }
  function list(idx) {
    if (TOK2[idx++] != '[') throw 'bad list'
    const [_idx,name] = txt(rep0(idx,pad)[0])
    const [aidx,ary] = rep0(_idx,idx => or(rep0(idx,pad)[0],cmp,list,mch))
    idx = rep0(aidx,pad)[0]
    if (TOK2[idx++] != ']') throw 'bad list'
    else return [idx,[name].concat(ary)]
  }

  function start() {
    const match = {}
    let [idx] = rep0(0,idx => {
      idx = rep0(idx,pad)[0]
      const [nidx,name] = txt(idx)
      idx = rep0(nidx,pad)[0]
      const [aidx,ary] = list(idx)
      match[name] = ary
      return [aidx]
    })
    idx = rep0(idx,pad)[0]
    return [idx,match]
  }
  const [idx,match] = start()
  log(match)

  return function Tok2 () { return TOK2 }
}
