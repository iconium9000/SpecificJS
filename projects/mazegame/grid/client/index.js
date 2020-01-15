const {log} = console
const module = {
  set exports(
    get_constructor // (Function{Function.name}) => Function
  ) {
    const constructor = get_constructor(MazeGame)
		MazeGame[constructor.name] = constructor
  }
}

module.exports = g => {

  const idx = {
    name: 'idx',

    socket: io('/mazegame_grid'),

    // set: send
    set: {
      handShake: () => {
        for (const i in idx.set) {
          window[i] = idx.set[i]
        }
        const f = i => idx.socket.on(i, idx.get[i])
        for (const i in idx.get) {
          f(i)
        }

        let name = null

        if (typeof document.cookie == 'string') {
    	    name = g.Lib.get_cookie('name')
    	  }

    	  // if no name is found in cookies, get one from the user
    	  while (!name || name == 'null') {
    	    name = prompt('Choose a name:', name)
    	    document.cookie = `name=${name}`
    	  }

        idx.socket.emit( 'handShake', name )
      },

      status: s => {
        idx.socket.emit('status', s)
      },

      msg: msg => {
        idx.socket.emit('msg', msg)
      },
      save: msg => {
        idx.socket.emit('save', msg)
      }
    },

    // get: rcv
    get: {

      // TODO
      handShake: info => {
        const {gw,mg} = g

        idx.name = info.name
        idx.id = info.id

        gw.tick(gw, idx, mg.init, mg.tick)
      },

      // TODO
      status: status => {
        const {tf,cell} = g.mg

        const flag = {}
        const map = cell.set.status(status)

        // update each of the modified cells
        tf.updateBrushMap(map)

        // TODO
        tf.spread(map, flag)
      },

      msg: console.log

    }
  }

  return idx
}

function MazeGame() {
  console.log('index.html: init')

	document.body.style.backgroundColor = 'black'

	MazeGame.idx.set.handShake()
}
