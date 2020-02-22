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
			const ary = [], start = Act(TOK3,'start',ary)
			const prs1 = Parse.init(TOK2,ary).inst(start)
			log('index.js',prs1)
		}
		catch (e) {
			error('index.js',e)
		}

		log('time',Circuit.Lib.time - time)

  })

}
