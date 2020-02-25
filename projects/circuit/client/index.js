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
			const json_mch = TOK3
			const parser_str = TOK2
			const json = Act(json_mch,'start')
			log(json)
			let json_prs = Parse.init(parser_str,json)
			// mch = prs._const.mch
			log(json_prs)
			const parser_mch = json_prs._const.mch
			const parser = Act(parser_mch,'regx')
			log(parser)
			const gen_str = Print(parser_mch)
			log(gen_str)
			const gen_prs = Parse.init(gen_str,parser)
			log(gen_prs)
			const gen_mch = gen_prs._const.mch
			const gen_str2 = Print(gen_mch)
			log(gen_str2)

			log(gen_str == gen_str2)

			// log(str)
			// prs = Parse.init(str,ary,map).parse(start)
			// log(prs)
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
