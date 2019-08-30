var proj_name = '16 Bit CPU:'
var jquery_dir = '/node_modules/jquery/dist/'
var socket_io_dir = '/node_modules/socket.io-client/dist/'
var log = (...msg) => console.log.apply(null, [proj_name].concat(msg))

var inst = `
  n inst  reg
  0 nop   null
  1 srl   swap
  2 sll   stack
  3 sla   pc
  4 or    temp0
  5 xor   temp1
  6 and   temp2
  7 add   temp3
  8 sub   var0
  9 if   var1 # if c a b : c = a == 0 ? c : b
  a lui   var2
  b ori   var3
  c addi  arg0
  d subi  arg1
  e read  ret0
  f write ret1
`
var macro = `
  %null 0, %nop 0, %swap 1, %srl 1
  %sll 2, %stack 2, %sla 3, %pc 3
  %or 4, %temp0 4, %xor 5, %temp1 5
  %and 6, %temp2 6, %add 7, %temp3 7
  %sub 8, %var0 8, %if 9, %var1 9
  %lui a, %var2 a, %ori b, %var3 b
  %addi c, %arg0 c, %subi d, %arg1 d
  %read e $0 $1 null, %ret0 e
  %write f $0 $1 null, %ret1 f
  %set lui $0 $1 $2 ori $0 $3 $4
  %move sll $0 $1 null

  0000 # this is a comment

  set var0 @text
  set var1 @log_char

  move var3 pc
  read var2 var0
  write var1 var2
  addi var0 01
  sll var1 var1 8
  if pc var1 var3

  set temp0 @exit
  write temp0 null

  @text  'This is some # .,,"" text\0\0'
  @words 'This is some # .,,"" text\n'
  @words 'This is some # .,,"" text'

  @log_char <log_char>
`

var lines = []
var line = []
var word = ''

var comment = false
var quote = false

for (var i in macro) {
  var c = macro[i]

  if (c == '\n' || c == ',') {
    if (quote) {
      word += c
    }
    else if (comment == '#') {
      comment = null
      word = ''
      line.length && lines.push(line)
      line = []
    }
    else {
      word && line.push(word)
      word = ''
      line.length && lines.push(line)
      line = []
    }
  }
  else if (c == `'` || c == `"` || c == '`') {
    if (comment);
    else if (quote == c) {

      quote = ''
      word += word.length % 2 == '0' ? '\0\0' : '\0'
      for (var j in word) {
        var s = '0000' + word.charCodeAt(j).toString(16)
        quote += s.slice(s.length - 2, s.length)
      }
      line.push(quote)

      word = ''
      quote = null
    }
    else if (quote) {
      word += c
    }
    else {
      quote = c
    }
  }
  else if (c == ' ') {
    if (comment || quote) {
      word += c
    }
    else {
      word && line.push(word)
      word = ''
    }
  }
  else if (c == '#') {
    if (quote) {
      word += c
    }
    else {
      comment = c
      word && line.push(word)
      word = ''
    }
  }
  else {
    word += c
  }
}

word && line.push(word)
line.length && lines.push(line)

var macros = {}
var labels = {}

do {
  var changes = false
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i]

    if (line[0][0] == '%') {
      macros[line[0].slice(1)] = line.slice(1)
      lines.splice(i--, 1)
      changes = true
      continue
    }
    else if (line[0][0] == '@') {
      if (!(labels[line[0]] > i)) {
        labels[line[0]] = i
      }
    }

    for (var j = 1; j < line.length; ++j) {
      var w = line[j]
      if (w[0] == '@') {
        line.splice(j, 1, 0+w, 1+w, 2+w, 3+w )
        j += 3
      }
    }

    for (var j = 0; j < line.length; ++j) {
      var word = line[j]
      var macro = macros[word]

      if (macro) {
        var max = 1
        var splice = []

        for (var k = 0; k < macro.length; ++k) {
          var m = macro[k]

          if (m[0] == '$') {
            m = parseInt(m.slice(1)) + 2
            splice.push(line[j + m - 1])
            if (m > max) {
              max = m
            }
          }
          else {
            splice.push(m)
          }
        }

        line.splice(j, max)
        for (var k = 0; k < splice.length; ++k) {
          line.splice(j+k, 0, splice[k])
        }
        --j

        change = true
      }
    }
  }
} while (changes)

log('macros', macros)
log('labels', labels)
log('lines', lines)
