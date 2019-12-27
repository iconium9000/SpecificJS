module.exports = Solver => class Fast {

  _tally = 0
  _root = null
  _hash = {}
  _stack = []
  _parent_lock_rooms = []
  _parent_gates = []
  _parent_types = []
  _portal_rooms = []
  _gate_spec = []
  _gate_null = []

  _iLock = 0
  _iRoom = 0

  _iJack = 0
  _iKey = 0
  _iXey = 0

  _iPortal = 0
  _iDoor = 0
  _iHeader = 0

  _parent_map = {}
  _parent_array = []
  _gate_map = {}
  _gate_array = []

  constructor(
    level, // Level
    count, // Number
  ) {
    const {Jack,Key,Xey,Door,Room,Portal} = Solver
    const {_nodes,_rooms,_locks,_doors,_keys,_portals,_headers} = level

    const {
      _hash,_stack,
      _parent_lock_rooms,_parent_gates,_portal_rooms,
      _parent_types,
      _gate_spec,_gate_null,
      _parent_map,_parent_array,_gate_map,_gate_array,
    } = this

    this.array_map(_parent_map, _parent_array, _locks, _rooms)
    this.array_map(_gate_map,_gate_array,_portals,_doors,_headers,)

    for (const i in _parent_array) {
      const {type,_locks,_doors,_room,_parent} = _parent_array[i]
      _parent_types.push(type)
      if (_parent) {
        ++this._iLock
        _parent_gates.push(_gate_map[_parent._id])
      }

      if (_locks) {
        const _iLocks = [], _iDoors = []
        for (const id in _locks) _iLocks.push(_parent_map[id])
        for (const id in _doors) {
          const {_door,_room} = _doors[id]
          _iDoors.push([_gate_map[_door._id],_parent_map[_room._id]])
        }
        _parent_gates.push(_iDoors)
        _parent_lock_rooms.push(_iLocks)
      }
      else if (_room) {
        _parent_lock_rooms.push(_parent_map[_room._id])
      }
    }
    this._iRoom = _parent_array.length

    let oPortal = 0
    for (const i in _gate_array) {
      const {_locks,_parent,constructor} = _gate_array[i]

      let count = 0
      for (const j in _locks) ++count

      if (constructor == Portal) {
        ++this._iPortal
        ++this._iDoor
        _portal_rooms.push(_parent_map[_parent._id])
        if (count == 0) ++oPortal
      }
      else if (constructor == Door) ++this._iDoor
      _gate_spec.push(count)
      _gate_null.push(0)
    }
    this._iHeader = _gate_array.length
    _gate_spec.push(2)
    _gate_null.push(oPortal)

    const {_iLock,_iHeader,_iPortal,} = this
    const _key_parents = [], _gate_count = _gate_null.slice()
    for (const id in _keys) {
      const {_parent,constructor} = _keys[id]
      const iParent = _parent_map[_parent._id]
      let iKey = 0
      if (constructor == Jack) {
        while (iKey < this._iJack && iParent > _key_parents[iKey]) ++iKey
        ++this._iJack
        ++this._iKey
        ++this._iXey
      }
      else if (constructor == Key) {
        iKey = this._iJack
        while (iKey < this._iKey && iParent > _key_parents[iKey]) ++iKey
        ++this._iKey
        ++this._iXey
      }
      else {
        iKey = this._iKey
        while (iKey < this._iXey && iParent > _key_parents[iKey]) ++iKey
        ++this._iXey
      }
      if (iParent < _iLock) {
        const iGate = _parent_gates[iParent]
        ++_gate_count[iGate]
        if (iGate < _iPortal && _gate_count[iGate] == _gate_spec[iGate]) {
          ++_gate_count[_iHeader]
        }
      }
      _key_parents.splice(iKey,0,iParent)
    }

    _stack.push(this._root = this.set_hash(_key_parents, _gate_count))
    while (count-- > 0 && _stack.length) this.solve(_stack.pop())
  }

  array_map(
    map, // Number{}
    array, // Object[]
    ...objects // Object{}
  ) {
    for (const i in objects) {
      const object = objects[i]
      for (const j in object) map[j] = array.push(object[j]) - 1
    }
  }

  get_hash(
    key_parents, // TODO
  ) {
    let {_hash} = this
    for (const i in key_parents) {
      _hash = _hash[key_parents[i]]
      if (!_hash) return _hash
    }
    return _hash
  }
  set_hash(
    key_parents, // TODO
    gate_count, // TODO
  ) {
    let {_hash} = this
    for (const i in key_parents) {
      const l = key_parents[i]
      if (_hash[l]) _hash = _hash[l]
      else _hash = _hash[l] = {}
    }
    _hash.key_parents = key_parents
    _hash.gate_count = gate_count
    _hash.links = {}
    _hash.id = ++this._tally
    return _hash
  }
  move(
    key_parents,
    iKey,
    iParent,
  ) {
    const {_iJack,_iKey,_iXey} = this

    let low,high
    if (iKey < _iJack) { low = 0; high = _iJack-1 }
    else if (iKey < _iKey) { low = _iJack; high = _iKey-1 }
    else { low = _iKey; high = _iXey-1 }

    while (low < iKey && iParent < key_parents[iKey-1]) {
      key_parents[iKey] = key_parents[--iKey]
    }
    while (high > iKey && iParent > key_parents[iKey+1]) {
      key_parents[iKey] = key_parents[++iKey]
    }
    key_parents[iKey] = iParent

    return key_parents
  }
  set_gates(
    key_parents,
    gate_count,
    iKey,
    iParentA,
  ) {
    const {_iPortal,_iLock,_parent_gates,_gate_spec,_iHeader} = this
    if (iParentA < _iLock) {
      const iGate = _parent_gates[iParentA]
      if (iGate < _iPortal && gate_count[iGate] == _gate_spec[iGate]) {
        --gate_count[_iHeader]
      }
      --gate_count[iGate]
    }

    const iParentB = key_parents[iKey]
    if (iParentB < _iLock) {
      const iGate = _parent_gates[iParentB]
      ++gate_count[iGate]
      if (iGate < _iPortal && gate_count[iGate] == _gate_spec[iGate]) {
        ++gate_count[_iHeader]
      }
    }

    return gate_count
  }

  solve(
    hash
  ) {
    const {
      _iJack,_iKey,_iXey,
      _iLock,
      _parent_lock_rooms,
    } = this
    const { key_parents, gate_count, links, } = hash

    let tParent = -1
    for (let iJack = 0; iJack < _iJack; ++iJack) {
      const iParentA = key_parents[iJack]
      if (tParent == iParentA);
      else if (iParentA < _iLock) {
        const iParentB = _parent_lock_rooms[iParentA]
        const _key_parents = this.move(key_parents.slice(), iJack, iParentB)
        let _hash = this.get_hash(_key_parents)
        if (!_hash) {
          const _gate_count = this.set_gates(
            _key_parents, gate_count.slice(),
            iJack, iParentA
          )
          _hash = this.set_hash(_key_parents,_gate_count)
          this._stack.push(_hash)
        }
        links[_hash.id] = _hash
      }
      tParent = iParentA
    }
  }

}
