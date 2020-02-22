const TOK2 = `

pad {[or " " "\t" "\n" [lst "#" [rep0 [not "\n"]]]] [ary]}
pad0 [rep0 pad]
pad1 [rep1 pad]
parop [or pad "(" ")" "[" "]" "{" "}" "<" ">" ]
funop [or parop "." "-" '"' "'" "\`" ";"]
word {
  [rep1 [or [lst "$" [char]] [and [not funop] [char]]]]
  [str [fout]]
}
txt [or {[
  or
  [lst '\"' [rep0 ([lst pad0 [and [not '\"'] fun]] 1)] pad0 '\"']
  [lst "\'" [rep0 ([lst pad0 [and [not "\'"] fun]] 1)] pad0 "\'"]
  [lst "\`" [rep0 ([lst pad0 [and [not "\`"] fun]] 1)] pad0 "\`"]
] [ary txt [str [fout 1]]]} {word [ary txt [fout]]}]
out [or {
  [lst "." pad0 word [rep0 ([lst pad0 "." pad0 word] 3)]]
  [ary fout [pad [fout 2]] [fout 3]]
} {"." [ary fout]}]
par {
  [lst "(" pad0 txt [rep0 ([lst pad0 [and [not ")"] fun]] 1)] pad0 ")"]
  [ary [pad [fout 2]] [fout 3]]
}
ary {
  [lst "[" [rep0 ([lst pad0 [and [not "]"] fun]] 1)] pad0 "]"]
  [ary ary [fout 2]]
}
fpad { [lst "-" pad0 fun] [ary pad [fout 2]] }
fun [or txt out fpad par ary]
regop [or parop '.' '*' '+' '|' '&' '@' ':' ';']
match {
  [rep1 [or ([lst "$" [char]] 1) [and [not regop] [char]]]]
  [ary mch [str [fout]]]
}
char {'@' [ary char]}
range {
  [lst '<' pad0 [char] pad0 ':' pad0 [char] pad0 '>']
  [rng [fout 2] [fout 6]]
}
block ([or
  [lst '(' pad0 or pad0 ')']
  [lst '[' pad0 or pad0 ']']
  [lst '{' pad0 or pad0 '}']
] 2)
post {[
  lst
  [or char match block range]
  [rep0 ([lst pad0 [
    or
    {'*' [ary rep0]}
    {'+' [ary rep1]}
    {'!' [ary not]}
    {[lst '.' pad0 word] [ary out [fout 2]]}
    {[lst ':' pad0 fun] [ary fun [fout 2]]}
  ]] 1)]
] [stk [pad ary] [pad [fout 0]] [fout 1]]}

list [or {
  [lst post [rep1 ([pad0 post] 1)]]
  [ary lst [ary [fout 0]] [fout 1]]
} post]
and [or {
  [lst list [rep1 ([lst pad0 '&' pad0 list] 3)]]
  [ary and [ary [fout 0]] [fout 1]]
} list]
or [or {
  [lst and [rep1 ([lst pad0 '|' pad0 and] 3)]]
  [ary or [ary [fout 0]] [fout 1]]
} and]
regx ([lst [rep0 {
  [lst pad0 word pad0 or pad0 ';']
  [map [fout 1] [fout 3]]
}] pad0] 0)
`

const TOK3 = JSON.parse(`{
  "stop": [
    "or", ["cmp"," "],["cmp","\\t"],["cmp","\\n"],["cmp","\\""],["cmp","'"],
    ["cmp","{"],["cmp","}"],["cmp","["],["cmp","]"],["cmp","("],["cmp",")"]
  ],
  "pad": ["rep0",["or",["cmp"," "],["cmp","\\t"],["cmp","\\n"]]],
  "txt": ["or", ["fun", [
    "lst",
    ["cmp","\\""],
    ["rep0",["and",["not",["cmp","\\""]],["char"]]],
    ["cmp","\\""]
  ], ["str",["fout",["txt","1"]]]], ["fun", [
    "lst",
    ["cmp","'"],
    ["rep0",["and",["not",["cmp","'"]],["char"]]],
    ["cmp","'"]
  ], ["str",["fout",["txt","1"]]]], [
    "fun",
    ["rep1",["and",["not",["mch","stop"]],["char"]]],
    ["str",["fout"]]
  ]],
  "top": ["or",["mch","fun"],["mch","ary"],["mch","out"],["mch","mch"]],
  "mid": ["or",["mch","sub"],["mch","str"]],
  "str": ["fun",["mch","txt"],["ary",["txt","txt"],["fout"]]],
  "mch": ["fun",["mch","txt"],["ary",["txt","mch"],["fout"]]],
  "out": [
    "fun", [
      "lst",
      ["cmp","("],["mch","pad"],
      ["mch","top"],["mch","pad"],["mch","mid"],
      ["mch","pad"],["cmp",")"]
    ], [
      "ary",
      ["txt","out"],
      ["pad",["fout",["txt","2"]]],
      ["pad",["fout",["txt","4"]]]
    ]
  ],
  "fun": [
    "fun", [
      "lst",
      ["cmp","{"],
      ["mch","pad"],
      ["mch","top"],
      ["mch","pad"],
      ["mch","mid"],
      ["mch","pad"],
      ["cmp","}"]
    ], [
      "ary",
      ["txt","fun"],
      ["pad",["fout",["txt","2"]]],
      ["pad",["fout",["txt","4"]]]
    ]
  ],
  "ary": [
    "fun",[
      "lst",
      ["cmp","["],
      ["mch","pad"],
      ["mch","txt"],
      ["rep0",[
        "fun",
        ["lst",["mch","pad"],["mch","top"]],
        ["fout",["txt","1"]]
      ]],
      ["mch","pad"],
      ["cmp","]"]
    ],[
      "ary",
      ["fout",["txt","2"]],
      ["fout",["txt","3"]]
    ]
  ],
  "sub": [
    "fun",[
      "lst",
      ["cmp","["],
      ["mch","pad"],
      ["mch","txt"],
      ["rep0",[
        "out",
        ["lst",["mch","pad"],["mch","mid"]],
        ["txt","1"]
      ]],
      ["mch","pad"],
      ["cmp","]"]
    ],[
      "ary",
      ["fout",["txt","2"]],
      ["fout",["txt","3"]]
    ]
  ],
  "start": ["rep0",[
    "fun",
    ["lst",["mch","pad"],["mch","txt"],["mch","pad"],["mch","top"]],
    ["map",["fout",["txt","1"]],["fout",["txt","3"]]]
  ]]
}`)

module.exports = Circuit => {
  return function Tok2 () { return Circuit.Parse.init(TOK2,TOK3) }
}
