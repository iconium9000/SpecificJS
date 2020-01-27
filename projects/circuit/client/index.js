const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Circuit)
		Circuit[constructor.name] = constructor
	}
}

const fmap = {
	range: (m,i,t,low,high) => {
		const c = m.s[i]
		return low <= c && c <= high ? [i+1,simp([t,c])] : null
	},
	endat: (m,i,t,tok,skip) => {
		let str = ''
		while (i < m.s.length) {
			if (m.s[i] == skip) { str == m.s[++i]; ++i }
			else if (m.s.slice(i,i+tok.length) == tok) {
				return [i+tok.length,simp([t,str])]
			}
			else str += m.s[i++]
		}
	},
	comp: (m,i,t,...toks) => {
		for (const j in toks) {
			const a = parse(m,i,toks[j])
			if (a) return [a[0],simp([t,simp(a[1])])]
		}
	},
	repf: (m,i,t,f,...args) => {
		const array = [t]
		while (i < m.s.length) {
			const a = fparse(f,m,i,f,...args)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	rept: (m,i,t,tok) => {
		const array = [t]
		while (i < m.s.length) {
			const a = parse(m,i,tok)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	regx: (m,i,t,...exps) => {
		const array = [t]
		for (const e in exps) {
			const exp = exps[e]
			let a = null
			if (typeof exp == 'string') a = parse(m,i,exp)
			else a = fparse(exp[0],m,i,...exp)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return null
		}
		return [i,simp(array)]
	},
}
function fparse(f,m,i,...args) {
	return fmap[f](m,i,...args)
}
function parse(m,i,tok) {
	if (i >= m.s.length) return null

	const k = i
	if (m.map[k] && m.map[k][tok] != undefined) return m.map[k][tok]

	++parse.total
	parse.count[k] = 1 + (parse.count[k] || 0)

	let ans = null
	if (tokmap[tok]) {
		const [f,...args] = tokmap[tok]
		ans = fparse(f,m,i,tok,...args)
	}
	else {
		for (const j in tok) if (m.s[i++] != tok[j]) { ans = true; break }
		ans = ans ? null : [i,simp([tok])]
	}

	if (!m.map[k]) m.map[k] = {}
	m.map[k][tok] = ans || null
	return ans
}
const tokmap = {
	// operator precedence 0 -----------------------------------------------------

	// space/comment
	_commentsl: 'regx // [endat \n]',
	_commentml: 'regx /* [endat */]',
	_space: 'comp _commentsl _commentml $  \t \n',
	'space*': 'rept _space',
	'space+': 'regx _space space*',

	// num
	_intdig: 'range 0 9', _octdig: 'range 0 7',
	_hexdig: 'comp _intdig a b c d e f A B C D E F',
	hex: 'regx 0 [comp x X] _hexdig [rept _hexdig]',
	float: 'regx [rept _intdig] . _intdig [rept _intdig]',
	oct: 'regx 0 [rept _octdig]',
	int: 'regx _intdig [rept _intdig]',
	num: 'comp hex float oct int',

	// var
	_lowltr: 'range a z',
	_highltr: 'range A Z',
	_ltr: 'comp _lowltr _highltr',
	var: 'regx _ltr [repf comp _ _intdig _ltr]',

	// string

	// operator precedence 1 -----------------------------------------------------

	// bracket
	_nulltuple: 'regx ( space* )',
	_halftuple: 'repf regx space* , space* rval16',
	_tuple: 'regx ( space* rval16 _halftuple space* )',
	tuple: 'comp _tuple _nulltuple',
	_array: 'repf regx space* , space* rval16',
	array: 'regx $[ space* rval16 _array space* $]',
	subscope: 'regx { space* scope space* }',
	rval1: 'comp var num tuple array subscope',

	ltuple: 'regx ( space* lval16 space* )',
	def: 'regx var space+ var',
	lval1: 'comp def var ltuple',

	// operator precedence 2 -----------------------------------------------------

	_post: 'regx lval1 space* [comp ++ --]',
	fun: 'regx rval1 space* tuple',
	mem: 'regx rval1 space* [comp . ->] space* var',
	_sub: 'regx space* $[ space* rval16 space* $]',
	sub: 'regx rval1 space* _sub [rept _sub]',

	rval2: 'comp _post fun sub mem rval1',
	lval2: 'comp mem sub lval1',

	// operator precedence 3 -----------------------------------------------------

	_rpre: 'regx [comp + - ! ~] space* rval3',
	_lpre: 'regx [comp ++ --] space* lval3',
	_ref: 'regx [comp * &] space* rval3',
	_sizeof: 'regx sizeof space+ var',

	rval3: 'comp _lpre _rpre _sizeof _ref rval2',
	lval3: 'comp _ref lval2',

	// operator precedence 16 ----------------------------------------------------

	ltrn: 'regx rval15 space* ? space* lval16 space* : space* lval16',
	rtrn: 'regx rval15 space* ? space* rval16 space* : space* rval16',
	throw: 'regx throw space+ rval15',
	_op16: 'comp = += -= *= /= %= <<= >>= &= ^= |=',
	_mid16: 'regx lval15 space* _op16 space* rval16',
	rval16: 'comp rtrn _mid16 rval15',
	lval16: 'comp ltrn lval15',

	// scope
	scope: 'repf regx space* [comp rval16 lval16] space* ;',
}

const midfx = {
	4: '.* ->*',
	5: '* / %',
	6: '+ -',
	7: '<< >>',
	8: '<=>',
	9: '< <= > >=',
	10: '== !=',
	11: '&',
	12: '^',
	13: '|',
	14: '&&',
	15: '||',
}

for (const i in midfx) {
	const j = parseInt(i)-1
	tokmap['_mid'+i] = `regx rval${j} space* [comp ${midfx[i]}] space* rval${i}`
	tokmap['rval'+i] = `comp _mid${i} rval${j}`
	tokmap['lval'+i] = `comp lval${j}`
}

for (const i in tokmap) {
	const string = tokmap[i], stack = []
	let scope = [], word = ''

	for (let j = 0; j < string.length; ++j) switch (string[j]) {
		case ' ': if (word) scope.push(word); word = ''; break
		case '[':
			if (word) scope.push(word); word = ''
			stack.push(scope); scope = []; break
		case ']':
			if (word) scope.push(word); word = ''
			const temp = stack.pop(); temp.push(scope); scope = temp
			break
		case '$': ++j
		default: word += string[j]; break
	}
	if (word) scope.push(word)
	tokmap[i] = scope
}

function Circuit() {

  const socket = io('/circuit')

  socket.on('connect', () => {
    // log('hello world')

    socket.emit('update')

  })

  socket.on('update', string => {
		const {Lib} = Circuit
		parse.count = []
		parse.total = 0
		const m = {
			map: [],
			s: string,
			count: [],
		}
		const a = parse(m,0,'scope')
		log(string.length,string)
		if (a) log('print',a,Lib.stringify(a))
		else log('error')

		function count(a) { let c = 0; for (const i in a) ++c; return c }

		m.total = 0
		for (const i in m.map) m.total += m.count[i] = count(m.map[i])

		log('parse.count',parse.count,parse.total,m,parse.push)
  })

}
