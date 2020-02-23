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
			const {Parse,Tok,Tok2,Act} = Circuit
			const ary = [], map = {}, start = Act(TOK3,'ary',ary,map)
			log(ary,map)
			const tok = `[or " " "\t"]`
			const prs1 = Parse.init(tok,ary,map).inst(start)
			log('index.js',prs1)
			log(prs1._const.trace[0])
		}
		catch (e) {
			error('index.js',e)
		}

		log('time',Circuit.Lib.time - time)

  })

}
