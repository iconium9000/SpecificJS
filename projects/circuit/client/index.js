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
	let string,cfg,prog

	let flag = false
	function launch() {
		if (flag) return
		if (cfg == undefined) return
		if (string == undefined) return
		flag = true
		// if (prog == undefined) return

		const {time} = Circuit.Lib
		// log(Circuit.Print(cfg))
		const act = Circuit.Act(cfg)
		// log(act)
		const lex = Circuit.Lex.init(string,act)
		const c_cfg = lex._ret
		// log(lex)
		const string2 = Circuit.Print(c_cfg)
		log(string2)
		// socket.emit('writefile','c.json',JSON.stringify(c_cfg))
		const act2 = Circuit.Act(c_cfg)
		log(act2.act,act2.start)
		log(Circuit.ActComp(act2))
		// log(act2)
		// const lex2 = Circuit.Lex.Info.init(prog,act2)
		// log(lex2)
		// log(lex2._ret,lex2._const.act)

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
  // socket.on('connect', () => {
	// 	readfile('cfg.json',file => launch(cfg = JSON.parse(file)))
	// 	readfile('c.cfg',file => launch(string = file))
	// 	readfile('test.c',file => launch(prog = file))
  // })
	socket.on('connect', () => {
		readfile('cfg.json',file => launch(cfg = JSON.parse(file)))
		readfile('test.cfg',file => launch(string = file))
  })

}
