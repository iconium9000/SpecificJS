// `; test = `
const TOK = `

pad {$ | $\t | $\n | $# $\n!* } : [];
parop pad | $( | $) | \${ | \$} | $[ | $] | $< | $> ;

### FUN ###

funop parop | $. | " | ' | \` | $; ;
str ($$ @ | funop! & @)+ : [str .];
txt {
  (\" [pad* {\"! & fun}].1* pad* \") |
  (\' [pad* {\'! & fun}].1* pad* \') |
  (\` [pad* {\`! & fun}].1* pad* \`)
}:[str .1];
out {$. pad* str (pad* $. pad* str).3*}:[fout [.2] .3] | { $.:[fout] };
par {$( pad* str [pad* {$)! & fun}].1* pad* $)}:[.2 .4];
ary {$[ [pad* {$]! & fun}].1* pad* $]}:(ary ary .2);
fun str | txt | out | par | ary;

### REGX ###

regop parop | $. | $* | $+ | $| | $& | $@ | $: | $; ;
match str : (mch .);

char $@ : (ary char);
range {$< pad* @ pad* $: pad* @ pad* $>}:(rng .2 .6);
block {
  ( \$( pad* or pad* $) ) |
  ( \$[ pad* or pad* $] ) |
  ( \${ pad* or pad* $} )
}.2;
post {
  (char | match | block | range)
  (pad* [
    $*:[rep0] | $+:[rep1] | $!:[not] |
    ($. pad* str):[out .2] |
    ($: pad* fun):[fun .2]
  ]).1*
}:(stk [] [.0] .1);
list (post (pad* post).1+):[[.0] .1] | post;
and {list (pad* $& pad* list).3+}:(and [.0] .1) | list;
or {and (pad* $| pad* and).3+}:(or [.0] .1) | and;

regx {[pad* str pad* or pad* $;]:[.1 .3]* pad*}.0;

`

module.exports = Circuit => function Tok () { return TOK }
