const {log,error} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Circuit)
		Circuit[constructor.name] = constructor
	}
}

function Circuit() {

  const socket = io('/circuit')

  socket.on('connect', () => {
    // log('hello world')

    socket.emit('update')

  })

	Circuit.locked = false
  socket.on('update', string => {

		if (Circuit.locked) return
		else Circuit.locked = true

		let {time} = Circuit.Lib
		try {
			const {Parse,Tok,Tok2,Act,Print} = Circuit
			let mch = TOK3
			let ary = [], map = {}, start = Act(mch,'start',ary,map)
			log(ary,start,map,mch)
			let prs = Parse.init(TOK2,ary,map).parse(start)
			mch = prs._const.mch
			log(prs)
			ary = []; map = {}, start = Act(mch,'regx',ary,map)
			log(ary,start,map,mch)
			log(Print(mch))
			// prs = Parse.init(TOK,ary,map).parse(start)
			// log(prs)
			// ary = []; map = {}, start = Act(prs._const.mch,'regx',ary,map)
			// log(ary,start,map)
		}
		catch (e) {
			error('index.js',e)
		}

		log('time',Circuit.Lib.time - time)

  })

}
