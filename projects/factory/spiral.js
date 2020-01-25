const {log} = console

const {random,ceil,floor,sqrt,pow} = Math
function randomize(a,b) {
  return random()-0.5
}

function rand() {
  return pow(10,ceil(random() * 3)) * ceil(random()*9)
}

const recipes = {}, chars = []
const acode = 'A'.charCodeAt(0), zcode = 'Z'.charCodeAt(0)
for (let idx = acode; idx <= zcode; ++idx) {
  const char = String.fromCharCode(idx)

  const _chars = chars.slice().sort(randomize)
  let length = ceil(sqrt(_chars.length)*random()+1)
  if (length > _chars.length) length = _chars.length
  let _idx = 0, in_len = ceil(random()*(length-1)), out_len = length - in_len
  const _in = {}, _out = {}
  _in.time = rand()
  while (in_len-- > 0) {
    const char = _chars.pop()
    _in[char] = rand()
  }
  while (out_len-- > 0) {
    const char = _chars.pop()
    _out[char] = rand()
  }
  recipes[char] = [_in,_out]

  chars.push(char)
}

log(recipes)
