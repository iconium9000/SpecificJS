module.exports = MazeGame => {
	const {pt,fu} = MazeGame, gw = {
		name: 'gw',
		keys: {
			isDown: [],
			hasDown: [],
			hasUp: [],
			update: e => {
				e.hasDown = []
				e.hasUp = []
			}
		},
		events: {
			queue: [],
			tick: 0,
			now: null,
			dt: null,
			last: null,
			active: false,
			update: e => {
				e.now = (new Date()).getTime()
				e.dt = e.now - e.last
				e.last = e.now
				for (const i in e.queue) {
					e.queue[i]()
				}
				++e.tick
				e.queue = []
			}
		},
		display: {
			canvas: document.getElementById('canvas'),
			width: 0,
			height: 0,
			update: e => {
				e.width = e.canvas.width = window.innerWidth - 20
				e.heigth = e.canvas.height = window.innerHeight - 22
			}
		},
		mouse: {
			x: 0,
			y: 0,
			z: 0,
			prev: {
				x: 0,
				y: 0,
				z: 0,
				isDown: false
			},
			token: 'mouse',
			isDown: false,
			hasDown: false,
			hasDragged: false,
			hasUp: false,
			update: e => {
				e.hasDown = e.hasDragged = e.hasUp = false
				e.prev = pt.copy(e)
				e.prev.isDown = e.isDown
			}
		},
		tick: (e, x, i, f) => {
			e.display.g = e.display.canvas.getContext('2d')
			e.mouse.mouse = e.mouse
			e.events.active = true

			$(canvas).css('cursor', 'none')

			i(e, x)
			tick()

			function tick() {
				e.display.update(e.display)

				f(e, x)

				e.mouse.update(e.mouse)
				e.keys.update(e.keys)
				e.events.update(e.events)

				if (e.events.active) {
					$(canvas).css('cursor', 'none')
					reqFrame(tick)
				} else {
					$(canvas).css('cursor', 'default')
				}
			}

		}
	}

	const reqFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
		window.msRequestAnimationFrame || ((callback) => window.setTimeout(callback, 30))
	// --------------------------------------------
	// Mouse controls
	// --------------------------------------------

	function setMouse(e) {
		gw.mouse.x = e.clientX - 7
		gw.mouse.y = e.clientY - 7
	}
	$(document).mousemove(e => gw.events.queue.push(() => {
		setMouse(e)
		gw.mouse.hasDragged = gw.mouse.isDown
	}))
	$(document).mousedown(e => gw.events.queue.push(() => {
		setMouse(e)
		gw.mouse.hasDragged = false
		gw.mouse.isDown = true
		gw.mouse.hasDown = true
	}))
	$(document).mouseup(e => gw.events.queue.push(() => {
		setMouse(e)
		gw.mouse.isDown = false
		gw.mouse.hasUp = true
	}))
	// --------------------------------------------
	// Keyboard controls
	// --------------------------------------------
	function etochar(e) {
		return String.fromCharCode(e.which | 0x20)
	}
	$(document).keypress(e => gw.events.queue.push(() => {
		const c = etochar(e)
		gw.keys.isDown[c] = true
		gw.keys.hasDown[c] = true
	}))
	$(document).keyup(e => {
		gw.events.queue.push(() => {
			const c = etochar(e)
			gw.keys.isDown[c] = false
			gw.keys.hasUp[c] = true
		})
	})
	document.onkeydown = e => gw.events.queue.push(() => gw.keys.hasDown[e.key] = true)

	return gw
}
