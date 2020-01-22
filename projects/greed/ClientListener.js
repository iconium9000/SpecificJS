const _functions = [
  'client name','disconnect',
  '#roll#','#filter#','#pass#',
]
const functions = {}
for (const i in _functions) {
  functions[_functions[i]] = require(`${__dirname}/server/${_functions[i]}.js`)
}

const get_score = require(__dirname + '/client/get_score.js')

module.exports = class ClientListener {

  randtime () { return 500 + Math.random() * 2000 }

  emit(...argv) {
    this._game_socket.emit(...argv)
    this.client_socket.emit(...argv)
  }

  update() { this.emit('update', this.game) }

  yeet() {
    this.index = 'index'
    this.emit('yeet')
  }

  reset() {
    this.roll_score = this.turn_score = 0
    this.dice = [0,0,0, 0,0,0]
  }

  clear() {
    const {dice} = this
    if (dice.length == 0) return this.dice = [0,0,0, 0,0,0]
    else for (const die in dice) dice[die] = 0
    return dice
  }

  roll() {
    const {dice} = this
    for (const die in dice) dice[die] = Math.ceil(Math.random()*6)
    return dice
  }

  next(client_id) {
    const {client_queue,game} = this
    client_queue.push(client_id)
    const {length} = client_queue, {clients} = game
    while (++this.client_idx < length) {
      const _client_id = client_queue[this.client_idx]
      const _client = clients[_client_id]
      if (_client) {
        game.turn = _client_id
        game.msg += `, now ${_client.name}'s turn`
        _client.state = game.state = '#rollwait#'
        this.update()
        return
      }
    }
    this.yeet() // should never happen
  }

  connect(socket) {
    const client_id = socket.id.split('#').pop()
    for (const token in functions) socket.on(token, (...argv) => {
      functions[token](this,client_id,...argv)
    })
  }

  constructor(
    _game_socket,
    client_socket,
  ) {
    this.index = 'greed'
    this.client_idx = 0
    this.client_queue = []
    this._game_socket = _game_socket
    this.client_socket = client_socket
    this.get_score = get_score

    this.game = {
      clients: {},
      state: '#wait#',
    }

    this.connect(_game_socket)
    client_socket.on('connection',_client_socket=>this.connect(_client_socket))
  }
}
