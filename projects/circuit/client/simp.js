const _simp = ([_s,s]) => s
const _midfx = (...ops) => (array) => {
  let op = array[3][0], l = array[1], r = array[5]
  const stack = []
  while (true) {
    let flag = false
    for (const i in ops) if (ops[i] == r[0]) { flag = true; break }
    if (flag) { stack.push(r); r = r[1] }
    else break
  }
  while (stack.length) {
    const [_op,_l,_r] = stack.pop()
    l = [op,l,r]; op = _op; r = _r
  }
  return [op,l,r]
}
let simpmap = {

  // operator precedence 0 -----------------------------------------------------


  // space/comment
  _space: () => 'space',
  'space*': () => 'space',
  'space+': () => 'space',

  // num,var
	_hexdig: _simp, _intdig: _simp, _octdig: _simp, num: _simp,
	_lowltr: _simp, _highltr: _simp, _ltr: _simp,
	comp: _simp, range: _simp,
	hex: ([_hex,_0,_x,hex,[_rept,...hexs]]) => {
		let str = '0x' + hex
		for (const i in hexs) str += hexs[i]
		return ['Hex',str]
	},
	float: ([_float,[_pre,...pre],_dot,intdig,[_post,...post]]) => {
		let str = ''
		for (const i in pre) str += pre[i]; str += '.' + intdig
		for (const i in post) str += post[i]
		return ['Float',str]
	},
	oct: ([_oct,_0,[_rept,...octs]]) => {
		let str = '0'
		for (const i in octs) str += octs[i]
		return ['Oct',str]
	},
	int: ([_int,_intdig,[_rept,...intdigs]]) => {
		let str = _intdig
		for (const i in intdigs) str += intdigs[i]
		return ['Int',str]
	},
	var: ([_var,_ltr,[_repf,...chars]]) => {
		let str = _ltr
		for (const i in chars) str += chars[i]
		return ['Var',str]
	},

  // operator precedence 1 -----------------------------------------------------

	// bracket
	_halftuple: ([_halftuple,...halves]) => {
		const a = ['_Halftuple']
		for (const i in halves) a.push(halves[i][4])
		return a
	},
	_nulltuple: () => ['_Nulltuple'],
	_tuple: (array) => ['_Tuple',array[3],...array[4].slice(1)],
	tuple: ([_tuple,[_Tuple,...vals]]) => ['Tuple',...vals],
	_array: ([_array,...subs]) => {
		const a = ['_Array']
		for (const i in subs) a.push(subs[i][4])
		return a
	},
	array: (array) => ['Array',array[3],...array[4].slice(1)],
	subscope: (array) => ['Subscope',...array[3].slice(1)],

  ltuple: (array) => array[3],
  def: (array) => ['Def',array[1],array[3]],

  // operator precedence 2 -----------------------------------------------------

  _post: ([_post,lval,_space,op]) => ['Post'+op,lval],
	fun: (array) => ['Fun',array[1],...array[3].slice(1)],
  mem: (array) => ['Mem'+array[3], array[1], array[5]],
  _sub: (array) => array[4],
  sub: ([_sub,rval,_space1,idx0,[_rept,...idxs]]) => {
    const a = ['Sub',rval,idx0]
    for (const i in idxs) a.push(idxs[i])
    return a
  },

  // operator precedence 3 -----------------------------------------------------

  _rpre: ([_pre,op,_space,rval]) => ['Pre'+op,rval],
  _lpre: ([_pre,op,_space,lval]) => ['Pre'+op,lval],
  _ref: ([_ref,op,_space,rval]) => ['Ref'+op,rval],
  _sizeof: (array) => ['Sizeof',array[3]],

  // operator precedence 16 ----------------------------------------------------

  _op16: ([_op16,[op]]) => op,
  ltrn: (array) => ['Trn',array[1],array[5],array[9]],
  rtrn: (array) => ['Trn',array[1],array[5],array[9]],
  _mid16: (array) => [array[3],array[1],array[5]],

	scope: ([_scope,...subs]) => {
		const a = ['Scope']
		for (const i in subs) a.push(subs[i][2])
		return a
	}
}
for (let i = 1; i < 17; ++i) {
  simpmap['lval' + i] = simpmap['rval' + i] = _simp
}
for (const i in midfx) {
  const ops = midfx[i].split(' ')
  simpmap['_mid'+i] = (array) => {
    let op = array[3][0], l = array[1], r = array[5]
    const stack = []
    while (true) {
      let flag = false
      for (const i in ops) if (ops[i] == r[0]) { flag = true; break }
      if (flag) { stack.push(r); r = r[1] }
      else break
    }
    while (stack.length) {
      const [_op,_l,_r] = stack.pop()
      l = [op,l,r]; op = _op; r = _r
    }
    return [op,l,r]
  }
}

// simpmap = {}
function simp(a) {
	const simp = simpmap[a[0]]
	a = simp ? simp(a) : a
	// log('simp',a)
	return a
}
