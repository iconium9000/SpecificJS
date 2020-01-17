module.exports = (project) => {

  const project_name = 'MazeGame Grid:'
  const log = (...msg) => console.log(project_name, ...msg)
  const fs = require('fs')
  const MazeGame = {}
  MazeGame.pt = require('./client/point.js')(MazeGame)
  MazeGame.fu = require('./client/functions.js')(MazeGame)
  MazeGame.Emitter = require('./client/Emitter.js')(MazeGame)
  MazeGame.mg = require('./client/game.js')(MazeGame)
  const file_name = __dirname + '/client/data.txt'

  const {pt,fu,Emitter,mg} = MazeGame

  log('server.js')

  const app = {
  	sockets: {},
  	init: () => {

  		project.socket.on('connection', socket => {
        socket.on('handShake', info => app.get.handShake(socket, info))
      })

  		mg.init()

  		app.set.reset('server')

  		// console.log('Server Active')
  	},

  	// Set (send)
  	set: {
  		console: (set) => {
  			// set: {<token>, <msg>}
  			if (app.set[set.token]) {
  				app.set[set.token]('server', set.msg)
  			}
  		},
  		handShake: (id, info) => {

  			// get socket from id
  			const s = app.sockets[info.id]

  			s.emit('handShake', info)

  			for (const i in mg.level) {

  				const l = mg.level[i].cell
  				const u = {}

  				for (const j in l) {
  					u[j] = mg.cell.get.status(l[j])
  				}

  				s.emit('status', u)
  			}

  			app.set.msg('server', `New Client '${s.name}'`)

  		},
  		emit: (token, msg, id) => {
  			for (const i in app.sockets) {
  				if (i != id) {
  					app.sockets[i].emit(token, msg)
  				}
  			}
  		},

  		reset: (id, msg) => {

  			app.set.msg('server', msg || 'Reseting level...')

  			const data = JSON.parse(fs.readFileSync(file_name))

  			// data is an array of objects
  			//	preferably (but not neccesarily) broken up into groups of levels
  			for (const i in data) {

  				// data[i] is a level in 'status' state

  				// get
  				const map = mg.cell.set.status(data[i])
  				const flag = {}

  				// update each of the modified cells
  				mg.tf.updateBrushMap(map)

  				// TODO
  				mg.tf.spread(map, flag)

  				// send status clients
  				app.set.emit('status', data[i])
  			}


  		},


  		msg: (id, msg) => {
  			// console.log(msg = `server: '${msg}'`)
  			app.set.emit('msg', msg)
  		},
  		print: (id, msg) => {
  			// eval(`console.log(${msg})`)
  		},
  		save: (id, msg) => {
  			app.set.msg('server', msg || 'Saving Game...')

  			const save = []

  			for (const i in mg.level) {
  				const l = mg.level[i].cell

  				const s = {}
  				for (const j in l) {
  					s[j] = mg.cell.get.status(l[j])
  				}

  				save.push(s)

  			}

  			const text = JSON.stringify(save).replace(/},"/g, '},\n"').replace(/}},/g,'}\n},\n')
  			fs.writeFile('data.txt', text)
  		},
  		kick: (id, msg) => {

  		}
  	},

  	// Get (Receive)
  	get: {
  		handShake: (socket, info) => {
  			app.sockets[socket.id] = socket
  			socket.name = info

  			info = {
  				id: socket.id,
  				name: socket.name
  			}

  			for (const i in app.get) {
  				socket.on(i, msg => app.get[i](socket, msg))
  			}

  			app.set.handShake('server', info)
  		},

  		disconnect: (socket) => {

  			app.set.msg('server', `Disconnected '${socket.name}'`)

  			delete app.sockets[socket.id]
  		},

  		msg: (socket, msg) => {
  			msg = `${socket.name}: '${msg}'`
  			// console.log(msg)
  			app.set.emit('msg', msg)
  		},

  		save: (socket, msg) => app.set.save(socket.id, msg),

  		status: (socket, status) => {

  			const flag = {}
  			const map = mg.cell.set.status(status)

  			// update each of the modified cells
  			mg.tf.updateBrushMap(map)

  			// TODO
  			mg.tf.spread(map, flag)

  			app.set.emit('status', status, socket.id)

  		}
  	}
  }

  app.init()

}
