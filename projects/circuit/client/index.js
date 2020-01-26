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
	range: (s,i,t,low,high) => {
		const c = s[i]
		return low <= c && c <= high ? [i+1,simp([t,c])] : null
	},
	comp: (s,i,t,...toks) => {
		for (const j in toks) {
			const a = parse(s,i,toks[j])
			// log('comp',a)
			if (a) return [a[0],simp([t,simp(a[1])])]
		}
	},
	repf: (s,i,t,f,...args) => {
		const array = [t]
		while (i < s.length) {
			const a = fmap[f](s,i,f,...args)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	rept: (s,i,t,tok) => {
		const array = [t]
		while (i < s.length) {
			const a = parse(s,i,tok)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return [i,simp(array)]
		}
		return [i,simp(array)]
	},
	regx: (s,i,t,...exps) => {
		const array = [t]
		for (const e in exps) {
			const exp = exps[e]
			let a = null
			// log('regx',s,i,exp)
			if (typeof exp == 'string') a = parse(s,i,exp)
			else a = fmap[exp[0]](s,i,...exp)
			if (a) { i = a[0]; array.push(simp(a[1])) }
			else return null
		}
		return [i,simp(array)]
	},
}
function parse(s,i,tok) {
	if (tokmap[tok]) {
		const [f,...args] = tokmap[tok]
		return fmap[f](s,i,tok,...args)
	}
	else if (s[i] == tok) return [i+1,tok]
}
const tokmap = {
	_space: ['comp',' ', '\t','\n'],
	rspace: ['rept','_space'],
	space: ['regx','_space',['rept','_space']],
	_dig: ['range','0','9'],
	_hex: ['comp',...'0123456789abcdefABCDEF'.split('')],
	hex: ['regx','0',['comp','x','X'],'_hex',['rept','_hex']],
	float: ['regx',['rept','_dig'],'.','_dig',['rept','_dig']],
	oct: ['regx','0',['rept','_dig']],
	int: ['regx','_dig',['rept','_dig']],
	num: ['comp','hex','float','oct','int'],
	__lowltr: ['range','a','z'],
	__highltr: ['range','A','Z'],
	_ltr: ['comp','__lowltr','__highltr'],
	var: ['regx','_ltr',['repf','comp','_','_dig','_ltr']],
	val: ['comp','num','var'],
	_midfx: ['comp',...'-+*/^%.'.split('')],
	_lmidfix: ['comp','val'],
	_rmidfix: ['comp','midfix','val',],
	midfix: ['regx','_lmidfix','rspace','_midfx','rspace','_rmidfix'],
}
const _simp = ([_s,s]) => s
const simpmap = {
	_space: () => 'space',
	space: () => 'space',
	rspace: () => 'space',
	_hex: _simp, _dig: _simp, num: _simp,
	__lowltr: _simp, __highltr: _simp, _ltr: _simp,
	comp: _simp, range: _simp, _midfx: _simp,
	hex: ([_hex,_0,_x,hex,[_rept,...hexs]]) => {
		let str = '0x' + hex
		for (const i in hexs) str += hexs[i]
		return ['Hex',str]
	},
	float: ([_float,[_pre,...pre],_dot,dig,[_post,...post]]) => {
		let str = ''
		for (const i in pre) str += pre[i]; str += '.' + dig
		for (const i in post) str += post[i]
		return ['Float',str]
	},
	oct: ([_oct,_0,[_rept,...octs]]) => {
		let str = '0'
		for (const i in octs) str += octs[i]
		return ['Oct',str]
	},
	int: ([_int,_dig,[_rept,...digs]]) => {
		let str = _dig
		for (const i in digs) str += digs[i]
		return ['Int',str]
	},
	var: ([_var,_ltr,[_repf,...chars]]) => {
		let str = _ltr
		for (const i in chars) str += chars[i]
		return ['Var',str]
	},
	midfix: ([_midfx,l,lspc,op,rspc,r]) => [op,l,r],
}
function simp(a) {
	const simp = simpmap[a[0]]
	return simp ? simp(a) : a
}
const a = parse('asd-7 +7.6',0,'midfix')
if (a) log('print',...a)

function Circuit() {

  const socket = io('/circuit')

  socket.on('connect', () => {
    log('hello world')

    socket.emit('update')

  })

  socket.on('update', string => {
    log(string)
  })

}
