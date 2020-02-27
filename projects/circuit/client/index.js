const {log,error} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Circuit)
		Circuit[constructor.name] = constructor
	}
}

function CircuitTest(socket) {
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

		socket.emit('writefile','cfg.json',JSON.stringify(parser_mch))
		socket.emit('writefile','cfg.cfg',gen_str)
		socket.emit('writefile','simp_cfg.json',JSON.stringify(json_mch))
		socket.emit('writefile','simp_cfg.cfg',json_str)
		socket.emit('writefile','simp_cfg.scfg',parser_str)

		const gen_prs = Parse.Info.init(gen_str,parser)
		log(gen_prs)

		const gen_mch = gen_prs._ret
		const gen_str2 = Print(gen_mch)
		log(gen_str2)
		log(gen_str == gen_str2)
	}
	catch (e) {
		error('index.js',e)
	}
	log('time',Circuit.Lib.time-time)
}

function Circuit() {

  const socket = io('/circuit')
	let string,cfg,prog

	function launch() {
		if (cfg == undefined) return
		if (string == undefined) return
		if (prog == undefined) return

		const {time} = Circuit.Lib
		log(Circuit.Print(cfg))
		const act = Circuit.Act(cfg)
		log(act)
		const prs = Circuit.Parse.Info.init(string,act)
		const c_cfg = prs._ret
		log(prs)
		const string2 = Circuit.Print(c_cfg)
		log(string2)
		socket.emit('writefile','c.json',JSON.stringify(c_cfg))
		const act2 = Circuit.Act(c_cfg)
		log(act2)
		const prs2 = Circuit.Parse.init(prog,act2)
		log(prs2)
		log(prs2._ret,prs2._const.act)

		log('time',Circuit.Lib.time - time)
	}

	function readfile(name,fun) {
		socket.emit('readfile',name)
		readfile[name] = fun
	}
	socket.on('readfile',(filename,file) => {
		let fun = readfile[filename]
		if (typeof fun == 'function') fun(file)
	})
  socket.on('connect', () => {
		readfile('cfg.json',file => launch(cfg = JSON.parse(file)))
		readfile('c.cfg',file => launch(string = file))
		readfile('test.c',file => launch(prog = file))
  })

}
