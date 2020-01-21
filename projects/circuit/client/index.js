const {log} = console
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
    log('hello world')

    socket.emit('update')

  })

  socket.on('update', string => {
    log(string)
  })


}
