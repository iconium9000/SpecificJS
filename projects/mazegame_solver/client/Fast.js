module.exports = Solver => class Fast {

  _root = null
  _hash = {}
  _hash_array = []
  _wins = []
  _solve = []
  _queue = []
  _lock_rooms = []
  _room_locks = []
  _lock_gates = []
  _room_doors = []
  _portal_rooms = []
  _gate_spec = []
  _gate_count = []
  _key_parents = []

  _iSlot = 0
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

  _key_map = {}
  _key_array = []

  get toString() {
    const {
      _iSlot,_iLock,_iRoom,
      _iJack,_iKey,_iXey,
      _iPortal,_iDoor,_iHeader,
      _key_parents,
      _lock_rooms,_room_locks,_lock_gates,_room_doors,_portal_rooms,
      _gate_spec,_gate_count,
    } = this
    let txt = `   ${_iSlot} ${_iLock} ${_iRoom}`
    txt += `   ${_iJack} ${_iKey} ${_iXey}`
    txt += `   ${_iPortal} ${_iDoor} ${_iHeader}`
    txt += `\n  `
    for (const i in _key_parents) txt += ` ${_key_parents[i]}`
    txt += `\n  `
    for (const i in _portal_rooms) txt += ` ${_portal_rooms[i]}`
    txt += `\n  `
    for (const i in _lock_rooms) txt += ` ${_lock_rooms[i]}`
    txt += `\n  `
    for (const i in _lock_gates) txt += ` ${_lock_gates[i]}`
    txt += `\n  `
    for (const i in _gate_spec) txt += ` ${_gate_spec[i]}`
    txt += `\n `
    for (const i in _room_locks) {
      const iLocks = _room_locks[i]
      txt += `  ${iLocks.length}`
      for (const j in iLocks) txt += ` ${iLocks[j]}`
    }
    txt += `\n`
    for (const i in _room_doors) {
      const doors = _room_doors[i]
      txt += `   ${doors.length}`
      for (const j in doors) txt += `  ${doors[j][0]} ${doors[j][1]}`
    }
    return txt
  }

  constructor(
    level, // Level
  ) {
    this._level = level
    const {Jack,Key,Xey,Door,Room,Portal} = Solver
    const {_nodes,_rooms,_locks,_doors,_keys,_portals,_headers} = level

    const {
      _hash,_queue,_wins,_solve,
      _lock_rooms,_room_locks,_lock_gates,_room_doors,_portal_rooms,
      _key_parents,_gate_count,_gate_spec,links,_hash_array,
      _parent_map,_parent_array,_gate_map,_gate_array,
      _key_array,_key_map,
    } = this

    this.array_map(_gate_map,_gate_array,_portals,_doors,_headers,)

    for (const id in _locks) {
      const {type,_room,_parent,is_slot} = _locks[id]
      let iLock
      if (_locks[id].is_slot) {
        iLock = this._iSlot++
        ++this._iLock
      }
      else {
        iLock = this._iLock++
      }
      _parent_array.splice(iLock,0,_locks[id])
    }

    for (const i in _rooms) _parent_array.push(_rooms[i])
    this._iRoom = _parent_array.length

    const {_iSlot,_iLock,_iRoom} = this
    for (let iParent = 0; iParent < _iRoom; ++iParent) {
      _parent_map[_parent_array[iParent]._id] = iParent
    }

    for (let iLock = 0; iLock < _iLock; ++iLock) {
      const {_parent,_room} = _parent_array[iLock]
      _lock_gates.push(_gate_map[_parent._id])
      _lock_rooms.push(_parent_map[_room._id])
    }
    for (let iRoom = _iLock; iRoom < _iRoom; ++iRoom) {
      const {_locks,_doors} = _parent_array[iRoom]

      const _iLocks = [], _iDoors = []
      _room_locks.push(_iLocks)
      _room_doors.push(_iDoors)

      for (const id in _locks) _iLocks.push(_parent_map[id])
      for (const id in _doors) {
        const {_door,_room} = _doors[id]
        _iDoors.push([_gate_map[_door._id],_parent_map[_room._id]])
      }
    }

    for (const i in _parent_array) _parent_array[i]._txt = `R${i}`
    for (const i in _gate_array) _gate_array[i]._txt = `G${i}`

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
      _gate_count.push(0)
    }
    this._iHeader = _gate_array.length
    _gate_spec.push(2)
    _gate_count.push(oPortal)

    const {_iHeader,_iPortal,} = this
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
        const iGate = _lock_gates[iParent]
        ++_gate_count[iGate]
        if (iGate < _iPortal && _gate_count[iGate] == _gate_spec[iGate]) {
          ++_gate_count[_iHeader]
        }
      }
      _key_parents.splice(iKey,0,iParent)
      _key_array.splice(iKey,0,_keys[id])
    }
    for (let iKey = 0; iKey < this._iXey; ++iKey) {
      _key_map[_key_array[iKey]._id] = iKey
    }

    log(this.toString)
    const root = this.set_hash(_key_parents, _gate_count, 0)
    _queue.push(root)
  }

  solve_queue(count) {
    const {
      _hash,_queue,_wins,_solve,
      _lock_rooms,_room_locks,_lock_gates,_room_doors,_portal_rooms,
      _key_parents,_gate_count,_gate_spec,links,_hash_array,
      _parent_map,_parent_array,_gate_map,_gate_array,
      _key_array,_key_map,
    } = this

    let i = 0
    while (i < count && i < _queue.length) this.solve(_queue[i++])
    if (i < _queue.length) throw `stack overflow! ${_queue.length - i}`

    let _win = null, _depth = Infinity
    for (const i in _wins) {
      const win = _wins[i]
      if (win.depth < _depth) {
        _win = win
        _depth = win.depth
      }
    }
    if (!_win) throw `victory is impossible :(`

    _solve.push(_win)
    for (let i = 0; i < _depth; ++i) {
      let {links,depth} = _win
      for (const j in links) {
        let win = links[j]
        if (win.depth < depth) {
          _win = win
          depth = win.depth
        }
      }
      _solve.push(_win)
    }
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
    depth, // Number
  ) {
    let {_hash,_hash_array} = this
    for (const i in key_parents) {
      const l = key_parents[i]
      if (_hash[l]) _hash = _hash[l]
      else _hash = _hash[l] = {}
    }
    _hash.key_parents = key_parents
    _hash.gate_count = gate_count
    _hash.links = {}
    _hash.depth = depth
    _hash.id = _hash_array.length
    _hash_array.push(_hash)
    return _hash
  }
  move(
    hash,
    iParentA,iParentB,
    ...iKeys
  ) {
    const {_iJack,_iKey,_iXey} = this
    const {key_parents,gate_count,links} = hash
    const _key_parents = key_parents.slice()

    for (const i in iKeys) {
      let iKey = iKeys[i]

      let low,high
      if (iKey < _iJack) { low = 0; high = _iJack-1 }
      else if (iKey < _iKey) { low = _iJack; high = _iKey-1 }
      else { low = _iKey; high = _iXey-1 }

      while (low < iKey && iParentB < _key_parents[iKey-1]) {
        _key_parents[iKey] = _key_parents[--iKey]
      }
      while (high > iKey && iParentB > _key_parents[iKey+1]) {
        _key_parents[iKey] = _key_parents[++iKey]
      }
      _key_parents[iKey] = iParentB
    }

    let _hash = this.get_hash(_key_parents)
    if (!_hash) {
      const {
        _iPortal,_iLock,_iDoor,_iHeader,
        _lock_gates,_room_doors,_gate_spec,_wins
      } = this

      const _gate_count = gate_count.slice()
      const nKeys = iKeys.length
      if (iParentA < _iLock) {
        const iGate = _lock_gates[iParentA]
        if (iGate < _iPortal && _gate_count[iGate] == _gate_spec[iGate]) {
          --_gate_count[_iHeader]
        }
        _gate_count[iGate] -= nKeys
      }

      if (iParentB < _iLock) {
        const iGate = _lock_gates[iParentB]
        _gate_count[iGate] += nKeys
        if (iGate < _iPortal && _gate_count[iGate] == _gate_spec[iGate]) {
          ++_gate_count[_iHeader]
        }
      }

      _hash = this.set_hash(_key_parents,_gate_count,hash.depth+1)
      this._queue.push(_hash)
      if (_gate_count[_iDoor] == _gate_spec[_iDoor]) _wins.push(_hash)
    }
    links[_hash.id] = _hash
  }

  solve(
    hash
  ) {
    const {
      _iJack,_iKey,_iXey,
      _iSlot,_iLock,
      _iPortal,_iHeader,
      _room_locks,_lock_rooms,_lock_gates,_room_doors,_gate_spec,
      _portal_rooms,
    } = this
    const { key_parents, gate_count, links, } = hash

    const iJack_parents = {}, iKey_parents = {}, iXey_parents = {}
    for (let iKey = 0; iKey < _iXey; ++iKey) {
      const iParent = key_parents[iKey]
      if (iKey < _iJack) iJack_parents[iParent] = iKey
      else if (iKey < _iKey) iKey_parents[iParent] = iKey
      else iXey_parents[iParent] = iKey
    }

    if (gate_count[_iHeader] == _gate_spec[_iHeader]) {
      let iPortalA = null, iPortalB
      for (let iPortal = 0; iPortal < _iPortal; ++iPortal) {
        if (gate_count[iPortal] == _gate_spec[iPortal]) {
          if (iPortalA == null) iPortalA = iPortal
          else iPortalB = iPortal
        }
      }

      const iRoomA = _portal_rooms[iPortalA]
      const iRoomB = _portal_rooms[iPortalB]

      const iJackA = iJack_parents[iRoomA]
      if (iJackA != null) {
        this.move(hash, iRoomA, iRoomB, iJackA)

        const iKey = iKey_parents[iRoomA]
        if (iKey != null) this.move(hash,iRoomA,iRoomB,iJackA,iKey)

        const iXey = iXey_parents[iRoomA]
        if (iXey != null) this.move(hash,iRoomA,iRoomB,iJackA,iXey)
      }

      const iJackB = iJack_parents[iRoomB]
      if (iJackB != null) {
        this.move(hash, iRoomB, iRoomA, iJackB)

        const iKey = iKey_parents[iRoomB]
        if (iKey != null) this.move(hash,iRoomB,iRoomA,iJackB,iKey)

        const iXey = iXey_parents[iRoomB]
        if (iXey != null) this.move(hash,iRoomB,iRoomA,iJackB,iXey)
      }
    }

    for (let iParentA in iJack_parents) {
      iParentA = parseInt(iParentA)
      let iJack = iJack_parents[iParentA]
      if (iParentA < _iLock) {
        const iParentB = _lock_rooms[iParentA]
        this.move(hash, iParentA, iParentB, iJack)
      }
      else {
        const locks = _room_locks[iParentA - _iLock]
        for (const i in locks) {
          const iParentB = locks[i]
          if (iJack_parents[iParentB] != null) continue

          const _iKey_parents = iParentB < _iSlot ? iXey_parents : iKey_parents

          const iKeyB = _iKey_parents[iParentB]
          if (iKeyB == null) {
            this.move(hash, iParentA, iParentB, iJack)

            const iKeyA = _iKey_parents[iParentA]
            if (iKeyA != null) this.move(hash, iParentA, iParentB, iKeyA)
          }
          else this.move(hash, iParentB, iParentA, iKeyB)
        }
        const doors = _room_doors[iParentA - _iLock]
        for (const i in doors) {
          const [iGate,iParentB] = doors[i]
          if (_gate_spec[iGate] == gate_count[iGate]) {
            this.move(hash, iParentA, iParentB, iJack)

            const iKey = iKey_parents[iParentA]
            if (iKey != null) this.move(hash,iParentA,iParentB,iJack,iKey)

            const iXey = iXey_parents[iParentA]
            if (iXey != null) this.move(hash,iParentA,iParentB,iJack,iXey)
          }
        }
      }
    }
  }

  pop() {
    if (!this._solve.length) return
    const {
      _iJack,_iKey,_iXey,
      _key_array,_parent_map,_parent_array,
    } = this
    const {key_parents} = this._solve.pop()

    for (const iKey in _key_array) {
      const key = _key_array[iKey]
      const iParentB = key_parents[iKey]
      const parentA = key._parent
      const parentB = _parent_array[iParentB]
      key._point = key._point.sub(parentA._point).sum(parentB._point)
      key._parent = parentB

      if (parentA._keys) delete parentA._keys[key._id]
      else parentA._key = null

      if (parentB._keys) parentB._keys[key._id] = key
      else parentB._key = key
    }
  }
}
