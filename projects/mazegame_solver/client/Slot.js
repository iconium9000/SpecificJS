module.exports = Solver => class Slot extends Solver.Lock {

  get color() { return 'grey' }
  get is_slot() { return true }
  get type() { return 0 }


  get is_open() {
    const {_key} = this
    return _key ? _key.can_slot : false
  }

}
