const _functions = [
  'client name','disconnect',
  '#join#','#roll#','#filter#','#pass#',
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

  update() {
    this.emit('update', this.game)
  }

  yeet() {
    this.index = 'index'
    this.emit('yeet')
    delete this.game_names[this.game_id]
  }

  reset() {
    const {game} = this
    game.roll_score = game.turn_score = 0
    game.dice = [0,0,0, 0,0,0]
  }

  clear() {
    const {dice} = this.game
    if (dice.length == 0) return this.game.dice = [0,0,0, 0,0,0]
    else for (const die in dice) dice[die] = 0
    return dice
  }

  roll() {
    const {dice} = this.game
    for (const die in dice) dice[die] = Math.ceil(Math.random()*6)
    return dice
  }

  next() {
    const {game} = this, {clients,turn,client_queue} = game
    client_queue.push(turn)
    const {length} = client_queue
    while (++game.client_idx < length) {
      const _client_id = client_queue[game.client_idx]
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

  constructor(game_names, socket_io,_game_socket) {
    this.game_names = game_names
    this._game_socket = _game_socket
    this.game_id = '/' + _game_socket.id.split('#').pop()
    this.client_socket = socket_io.of(this.game_id)

    this.index = 'greed'
    this.get_score = get_score
    this.names = {}

    this.game = {
      client_idx: 0,
      client_queue: [],
      dice: [],
      clients: {},
      state: '#joinwait#',
    }

    this.connect(_game_socket)
    this.client_socket.on('connection', _client_socket => {
      this.connect(_client_socket)
    })
  }
}
