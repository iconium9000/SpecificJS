const _simp = ([_s,s]) => s
let simpmap = {

  // operator precedence 0 -----------------------------------------------------


  // space/comment
  _space: () => 'space',
  space: () => 'space',
  rspace: () => 'space',

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

	// Bracket
	_halftuple: ([_halftuple,...halves]) => {
		const a = ['_Halftuple']
		for (const i in halves) a.push(halves[i][4])
		return a
	},
	_nulltuple: () => ['_Nulltuple'],
	_tuple: (array) => ['_Tuple',array[3],...array[4].slice(1)],
	tuple: ([_tuple,[_Tuple,...vals]]) => ['Tuple',...vals],
	_subscript: ([_subscript,...subs]) => {
		const a = ['_Subscript']
		for (const i in subs) a.push(subs[i][4])
		return a
	},
	subscript: (array) => ['Subscript',array[3],...array[4].slice(1)],
	subscope: (array) => ['Subscope',...array[3].slice(1)],

  ltuple: (array) => array[3],

  // operator precedence 2 -----------------------------------------------------

  _post: ([_post,lval,_space,op]) => ['Post'+op,lval],
	fun: (array) => ['Fun',array[1],...array[3].slice(1)],

	// Scope
	scope: ([_scope,...subs]) => {
		const a = ['Scope']
		for (const i in subs) a.push(subs[i][2])
		return a
	}
}
for (let i = 1; i < 17; ++i) {
  simpmap['lval' + i] = simpmap['rval' + i] = _simp
}

// simpmap = {}
function simp(a) {
	const simp = simpmap[a[0]]
	a = simp ? simp(a) : a
	// log('simp',a)
	return a
}
