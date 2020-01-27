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
	range: (m,s,i,t,low,high) => {
		const c = s[i]
		return low <= c && c <= high ? [i+1,simp([t,c])] : null
	},
	endat: (m,s,i,t,tok,skip) => {
		let str = ''
		while (i < s.length) {
			if (s[i] == skip) { str == s[++i]; ++i }
			else if (s.slice(i,i+tok.length) == tok) {
				return [i+tok.length,simp([t,str])]
			}
			else str += s[i++]
		}
	},
	comp: (m,s,i,t,...toks) => {
		for (const j in toks) {
			const a = parse(m,s,i,toks[j])
			if (a) return [a[0],simp([t,simp(a[1])])]
		}
	},
	repf: (m,s,i,t,f,...args) => {
		const array = [t]
		while (i < s.length) {
			const a = fmap[f](m,s,i,f,...args)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	rept: (m,s,i,t,tok) => {
		const array = [t]
		while (i < s.length) {
			const a = parse(m,s,i,tok)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	regx: (m,s,i,t,...exps) => {
		const array = [t]
		for (const e in exps) {
			const exp = exps[e]
			let a = null
			if (typeof exp == 'string') a = parse(m,s,i,exp)
			else a = fmap[exp[0]](m,s,i,...exp)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return null
		}
		return [i,simp(array)]
	},
}
function parse(m,s,i,tok) {
	const k = i
	if (m[i] && m[i][tok] != undefined) return m[i][tok]

	++parse.count
	let ans = null
	if (tokmap[tok]) {
		const [f,...args] = tokmap[tok]
		ans = fmap[f](m,s,i,tok,...args)
	}
	else {
		for (const j in tok) if (s[i++] != tok[j]) { ans = true; break }
		ans = ans ? null : [i,simp([tok])]
	}
	if (tok == 'fun') {
		log('parse',tok,ans)
	}

	if (!m[k]) m[k] = {}
	m[k][tok] = ans || null
	return ans
}
const tokmap = {
	// operator precedence 0 -----------------------------------------------------

	// space/comment
	_commentsl: 'regx // [endat \n]',
	_commentml: 'regx /* [endat */]',
	_space: 'comp _commentsl _commentml $  \t \n',
	'space*': 'rept _space',
	space: 'regx _space space*',

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
	_subscript: 'repf regx space* , space* rval16',
	subscript: 'regx $[ space* rval16 _subscript space* $]',
	subscope: 'regx { space* scope space* }',
	rval1: 'comp var num tuple subscript subscope',

	ltuple: 'regx ( space* lval16 space* )',
	lval1: 'comp var ltuple',

	// operator precedence 2 -----------------------------------------------------

	_post: 'regx lval1 space* [comp ++ --]',
	fun: 'regx rval1 space* tuple',
	mem: 'regx rval1 space* [comp . ->] space* var',
	sub: 'regx rval1 space* $[ space* rval16 space* $]',

	rval2: 'comp _post fun sub mem rval1',
	lval2: 'comp mem sub lval1',

	// operator precedence 3 -----------------------------------------------------

	_pre: 'regx [comp ++ -- + - ! ~] space* lval1',
	_ref: 'regx [comp * &] space* lval1',
	_sizeof: 'regx sizeof space var',

	rval3: 'comp _pre _sizeof _ref rval2',
	lval3: 'comp _ref lval2',

	// operator precedence 15 ----------------------------------------------------

	rval15: 'comp rval3',
	lval15: 'comp lval3',

	// operator precedence 16 ----------------------------------------------------

	ltrn: 'regx rval15 space* ? space* lval space* : space* lval',
	rtrn: 'regx rval15 space* ? space* rval16 space* : space* rval16',
	rval16: 'comp rtrn rval15 lval15',
	lval16: 'comp ltrn lval15',

	// scope
	scope: 'repf regx space* rval16 space* ;',
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
		parse.count = 0
		const m = {}
		const a = parse(m,string,0,'scope')
		log(string.length,string)
		if (a) log('print',a,Lib.stringify(a))
		else log('error')
		log('parse.count',parse.count,m,parse.push)
  })

}
