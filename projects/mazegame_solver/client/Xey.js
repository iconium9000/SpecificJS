module.exports = Solver => class Xey extends Solver.Key {

  get color() { return 'black' }
  get lineWidth() { return 3 }
  get can_lock() { return false }
  get can_slot() { return true }

}
