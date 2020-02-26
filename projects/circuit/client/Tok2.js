const TOK2 = `

pad {[or " " "\t" "\n" [lst "#" [rep0 [and [not "\n"] [char]]]]] [ary]}
pad* [rep0 pad]
parop [or pad "(" ")" "[" "]" "{" "}" "<" ">" ]
funop [or regop '"' "'" "\`" ";"]
word {
  [rep1 [or ([lst "$" [char]] 1) [and [not funop] [char]]]]
  [str [fout]]
}
txt [or {[
  or
  [lst '\"' [rep0 ([lst pad* [and [not '\"'] fun]] 1)] pad* '\"']
  [lst "\'" [rep0 ([lst pad* [and [not "\'"] fun]] 1)] pad* "\'"]
  [lst "\`" [rep0 ([lst pad* [and [not "\`"] fun]] 1)] pad* "\`"]
] [ary str [fout 1]]} {word [ary txt [fout]]}]
out [or {[rep1 ([lst "." txt] 1)] [ary fout [fout]]} {"." [ary fout]}]
par {
  [lst "(" pad* txt [rep0 ([lst pad* [and [not ")"] fun]] 1)] pad* ")"]
  [ary [fout 2 1] [fout 3]]
}
ary {
  [lst "[" [rep0 ([lst pad* [and [not "]"] fun]] 1)] pad* "]"]
  [ary ary [fout 1]]
}
fpad {
  [lst "{" [rep0 ([lst pad* [and [not "}"] fun]] 1)] pad* "}"]
  [ary pad [fout 1]]
}
fun [or txt out fpad par ary]
regop [or parop '.' '*' '+' '-' '!' '|' '&' '@' ':' ';']
match {
  [rep1 [or ([lst "$" [char]] 1) [and [not regop] [char]]]]
  [ary mch [str [fout]]]
}
char {'@' [ary char]}
range {
  [lst [char] pad* '-' pad* [char] ]
  [ary rng [fout 0] [fout 4]]
}
block ([or
  [lst '(' pad* or pad* ')']
  [lst '[' pad* or pad* ']']
  [lst '{' pad* or pad* '}']
] 2)
post {[
  lst
  [or char match block range]
  [rep0 ([lst pad* [
    or
    {'*' [ary rep0]}
    {'+' [ary rep1]}
    {'!' [ary not]}
    {[lst '.' pad* word] [ary out [pad txt [fout 2]]]}
    {[lst ':' pad* fun] [ary fun [pad [fout 2]]]}
  ]] 1)]
] [stk [fout] [fout 0] [fout 1]]}

list [or {
  [lst post [rep1 ([lst pad* post] 1)]]
  [ary lst [pad [fout 0]] [fout 1]]
} post]
and [or {
  [lst list [rep1 ([lst pad* '&' pad* list] 3)]]
  [ary and [pad [fout 0]] [fout 1]]
} list]
or [or {
  [lst and [rep1 ([lst pad* '|' pad* and] 3)]]
  [ary or [pad [fout 0]] [fout 1]]
} and]
start {[lst [rep0 {
  [lst pad* word pad* or pad* ';']
  [ary key [pad txt [fout 1]] [pad [fout 3]]]
}] pad*] [ary map [fout 0]]}

`

const TOK3 = JSON.parse(`["map",
  ["key",["txt","stop"], [
    "or", ["cmp"," "],["cmp","\\t"],["cmp","\\n"],["cmp","\\""],["cmp","'"],
    ["cmp","{"],["cmp","}"],["cmp","["],["cmp","]"],["cmp","("],["cmp",")"]
  ]],
  ["key",["txt","pad"], ["rep0",["or",["cmp"," "],["cmp","\\t"],["cmp","\\n"]]]],
  ["key",["txt","txt"], ["or", ["fun", [
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
  ]]],
  ["key",["txt","top"], ["or",["mch","fun"],["mch","ary"],["mch","out"],["mch","mch"]]],
  ["key",["txt","mid"], ["or",["mch","sub"],["mch","str"]]],
  ["key",["txt","str"], ["fun",["mch","txt"],["ary",["txt","txt"],["fout"]]]],
  ["key",["txt","mch"], ["fun",["mch","txt"],["ary",["txt","mch"],["fout"]]]],
  ["key",["txt","out"], [
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
  ]],
  ["key",["txt","fun"], [
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
  ]],
  ["key",["txt","ary"], [
    "fun",[
      "lst",
      ["cmp","["],
      ["mch","pad"],
      ["mch","txt"],
      ["rep0",["out",["lst",["mch","pad"],["mch","top"]],["txt","1"]]],
      ["mch","pad"],
      ["cmp","]"]
    ],[
      "ary",
      ["fout",["txt","2"]],
      ["fout",["txt","3"]]
    ]
  ]],
  ["key",["txt","sub"], [
    "fun",[
      "lst",
      ["cmp","["],
      ["mch","pad"],
      ["mch","txt"],
      ["rep0",["out",["lst",["mch","pad"],["mch","mid"]],["txt","1"]]],
      ["mch","pad"],
      ["cmp","]"]
    ],[
      "ary",
      ["fout",["txt","2"]],
      ["fout",["txt","3"]]
    ]
  ]],
  ["key",["txt","start"], ["fun",["rep0",[
    "fun",
    ["lst",["mch","pad"],["mch","txt"],["mch","pad"],["mch","top"]],
    [
      "ary",
      ["txt","key"],
      ["pad",["txt","txt"],["fout",["txt","1"]]],
      ["pad",["fout",["txt","3"]]]
    ]
  ]],["ary",["txt","map"],["fout"]]]]
]`)

module.exports = Circuit => function Tok2 () {}
