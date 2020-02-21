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
			const {Parse,Tok,Tok2} = Circuit
			const prg1 = Tok2().mch('start')
			log(prg1)
		}
		catch (e) {
			error(e)
			// if (e._error) {
			// 	log(e)
			// 	// error(e._error)
			// }
			// else error(e)
		}

		log('time',Circuit.Lib.time - time)

  })

}
