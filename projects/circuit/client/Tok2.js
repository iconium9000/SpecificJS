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



  return function Tok2 () { return TOK2 }
}
