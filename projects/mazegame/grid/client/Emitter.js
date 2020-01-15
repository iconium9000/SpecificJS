module.exports = MazeGame => class Emitter {
	constructor() {
		this.events = []
	}
	on(type, listener) {
		this.events[type] = this.events[type] || []
		this.events[type].push(listener)
	}
	emit(type, parameter) {
		if (this.events[type]) {
			this.events[type].forEach(function (listener) {
				listener(parameter)
			})
		}
	}
}
