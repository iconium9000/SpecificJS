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
			const {Lib,Parse,Tok,Tok2,Act,Print,PrintStr} = Circuit
			const json_mch = TOK3
			const parser_str = TOK2
			log(json_mch)
			const json = Act(json_mch)
			log(json)
			const json_str = Print(json_mch)
			log(json_str)
			let json_prs = Parse.init(parser_str,json)
			log(json_prs)
			const parser_mch = json_prs._ret
			const parser = Act(parser_mch,'regx')
			log(parser)
			const gen_str = Print(parser_mch)
			log(gen_str)

			socket.emit('writefile','cfg/cfg.json',JSON.stringify(parser_mch))
			socket.emit('writefile','cfg/cfg.cfg',gen_str)
			socket.emit('writefile','cfg/simp_cfg.json',JSON.stringify(json_mch))
			socket.emit('writefile','cfg/simp_cfg.cfg',json_str)
			socket.emit('writefile','cfg/simp_cfg.scfg',parser_str)

			const gen_prs = Parse.init(gen_str,parser)
			log(gen_prs)

			const gen_mch = gen_prs._ret
			const gen_str2 = Print(gen_mch)
			log(gen_str2)
			log(gen_str == gen_str2)
		}
		catch (e) {
			error('index.js',e)
		}

		log('time',Circuit.Lib.time - time)

  })

}
