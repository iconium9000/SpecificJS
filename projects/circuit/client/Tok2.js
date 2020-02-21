const TOK2 = `

pad {[or " " "\t" "\n" [lst "#" [rep0 [not "\n"]]]] [ary]}
pad0 [rep0 pad]
pad1 [rep1 pad]
parop [or pad "(" ")" "[" "]" "{" "}" "<" ">" ]
funop [or parop "." '"' "'" "\`" ";"]
str {
  [rep1 [or [lst "$" [char]] [and [not funop] [char]]]]
  [ary str [ary fout]]
}
txt {[
  or
  [lst '\"' [rep0 [out [lst pad0 [and [not '\"'] fun]] 1]] pad0 '\"']
  [lst "\'" [rep0 [out [lst pad0 [and [not "\'"] fun]] 1]] pad0 "\'"]
  [lst "\`" [rep0 [out [lst pad0 [and [not "\`"] fun]] 1]] pad0 "\`"]
] [ary str [fout 1]]}
out [or {
  [lst "." pad0 str [rep0 [out [lst pad0 "." pad0 str] 3]]]
  [fout [ary [fout 2]] [fout 3]]
} {"." [ary fout]}]
par {
  [lst "(" pad0 str [out [lst pad0 [and [not ")"] fun]] 1] pad0 ")"]
  [ary [fout 2] [fout 4]]
}
ary {
  [lst "[" [rep0 [ out [lst pad0 [and [not "]"] fun]] 1 ]] pad0 "]"]
  [ary ary [fout 2]]
}
fun [or str txt out par ary]
regop [or parop '.' '*' '+' '|' '&' '@' ':' ';']
match {str [ary mch [fout]]}
char {'@' [ary char]}
range {
  [lst '<' pad0 [char] pad0 ':' pad0 [char] pad0 '>']
  [rng [fout 2] [fout 6]]
}
block [out [or
  [lst '(' pad0 or pad0 ')']
  [lst '[' pad0 or pad0 ']']
  [lst '{' pad0 or pad0 '}']
] 2]
post {[
  lst
  [or char match block range]
  [lst pad0 [rep0 [out [
    or
    {'*' [ary rep0]}
    {'+' [ary rep1]}
    {'!' [ary not]}
    {[lst '.' pad0 str] [ary out [fout 2]]}
    {[lst ':' pad0 fun] [ary fun [fout 2]]}
  ] 1]]]
] [stk [ary] [ary [fout 0]] [fout 1]]}
list [or {
  [lst post [rep1 [out [pad0 post] 1]]]
  [lst [ary [fout 0]] [fout 1]]
} post]
and [or {
  [lst list [rep1 [out [lst pad0 '&' pad0 list] 3]]]
  [and [ary [fout 0]] [fout 1]]
} list]
or [or {
  [lst and [rep1 [out [lst pad0 '|' pad0 and] 3]]]
  [or [ary [fout 0]] [fout 1]]
} and]
regx [out [lst [rep0 {
  [lst pad0 str pad0 or pad0 ';']
  [ary [fout 1] [fout 3]]
}] pad0] 0]
`

const TOK3 = JSON.parse(`{
  "stop": [
    "or",
    ["cmp"," "],["cmp","\\t"],["cmp","\\n"],
    ["cmp","{"],["cmp","}"],["cmp","["],["cmp","]"],
    ["cmp","\\""],["cmp","'"]
  ],
  "pad": ["rep0",["or",["cmp"," "],["cmp","\\t"],["cmp","\\n"]]],
  "txt": ["or", ["fun", [
    "lst",
    ["cmp","\\""],
    ["rep0",["and",["not",["cmp","\\""]],["char"]]],
    ["cmp","\\""]
  ], ["str",["fout","1"]]], ["fun", [
    "lst",
    ["cmp","'"],
    ["rep0",["and",["not",["cmp","'"]],["char"]]],
    ["cmp","'"]
  ], ["str",["fout","1"]]], [
    "fun",
    ["rep1",["and",["not",["mch","stop"]],["char"]]],
    ["str",["fout"]]
  ]],
  "top": ["or",["mch","fun"],["mch","ary"],["mch","mch"]],
  "mid": ["or",["mch","sub"],["mch","str"]],
  "str": ["fun",["mch","txt"],["ary",["txt","txt"],["fout"]]],
  "mch": ["fun",["mch","txt"],["ary",["txt","mch"],["fout"]]],
  "fun": [
    "fun", [
      "lst",
      ["cmp","{"],["mch","pad"],
      ["mch","top"],["mch","pad"],["mch","mid"],
      ["mch","pad"],["cmp","}"]
    ], ["ary",["txt","fun"],["pad",["fout","2"]],["pad",["fout","4"]]]
  ],
  "ary": [
    "fun",[
      "lst",
      ["cmp","["],["mch","pad"],["mch","txt"],
      ["rep0",["fun",["lst",["mch","pad"],["mch","top"]],["fout","1"]]],
      ["mch","pad"],["cmp","]"]
    ],["ary",["pad",["fout","2"]],["fout","3"]]
  ],
  "sub": [
    "fun",[
      "lst",
      ["cmp","["],["mch","pad"],["mch","txt"],
      ["rep0",["fun",["lst",["mch","pad"],["mch","mid"]],["fout","1"]]],
      ["mch","pad"],["cmp","]"]
    ],["ary",["pad",["fout","2"]],["fout","3"]]
  ],
  "start": ["rep0",[
    "prs",
    "fun",
    ["lst",["mch","pad"],["mch","txt"],["mch","pad"],["mch","top"]],
    ["map",["fout","1"],["fout","3"]]
  ]]
}`)

module.exports = Circuit => {
  return function Tok2 () { return Circuit.Parse.init(TOK2,TOK3) }
}
