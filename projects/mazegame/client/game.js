module.exports = (project_name, Lib) => {

  const MazeGame = {}

  const door_speed = 1
  const jack_speed = 1

  const min_wall_long = 1
  const door_short = 2
  const half_door_short = door_short / 2
  const min_door_long = 3
  const lock_long = 2

  const portal_long = 4
  const half_portal_long = portal_long / 2
  const quarter_portal_long = portal_long / 4
  const portal_short = 1

  const jack_size = 0.9
  const jack_lock_long = jack_size + lock_long
  const door_lock_long = half_door_short + lock_long

  // half, spot, short, long
  const door_lock_names = {
    short_root_lock: [ 1, 0, 1, 0 ],
    long_root_lock:  [ 1, 0, 0, 1 ],
    short_spot_lock: [-1, 1,-1, 0 ],
    long_spot_lock:  [-1, 1, 0,-1 ],
  }

  // Getters
  {
    /* Get Game ()
      Return: Game

      Game: copy_game.Game
    */
    MazeGame.get_game = get_game
    function get_game() {

      const new_game = {
        walls: [],
        doors: [],
        portals: [],
        open_portals: [],
        locks: [],
        keys: [],
        jacks: [],
        editors: [],

        is_open: true,
      }

      return new_game
    }

    /* Get Editor (game: Game, client: Client)
      Return: Editor

      Socket
        id: ID
      Client
        name: String
        socket: Socket
      Editor: copy_editor.Editor
      Game: copy_game.Game
    */
    MazeGame.get_editor = get_editor
    function get_editor(game, client) {
      const editor = game.editors[client.socket.id]
      if (editor) {
        return editor
      }

      const new_editor = {
        id: client.socket.id,
        name: client.name,
        state: 'wall',
      }
      game.editors[new_editor.id] = new_editor

      return new_editor
    }
  }

  // copyers
  {

    /* Copy Editor (
        game_copy: Game
        old_editor: Editor
        spot_copy: Spot
      )
      Return: Editor

      Game: copy_game.Game
      Spot: Object
        editor: Editor,Null
        root_x,root_y: Float
        is_open,change_open: Boolean
      Editor: Object
        id: ID
        name: String
        state: ['wall','door','portal','lock','key','jack','game']
        spot: Spot,Null
        spot_x,spot_y: Float
    */
    function copy_editor(game_copy, old_editor, spot_copy) {
      const editor_copy = {
        id: old_editor.id,
        name: old_editor.name,
        state: old_editor.state,
        spot: spot_copy,
        spot_x: old_editor.spot_x,
        spot_y: old_editor.spot_y,
      }
      if (spot_copy) {
        spot_copy.editor = editor_copy
      }
      game_copy.editors[editor_copy.id] = editor_copy
      return editor_copy
    }

    /* Copy Wall (
        game_copy: Game
        old_wall: Wall
      )
      Return: Wall

      Game: copy_game.Game
      Wall: copy_editor.Spot
        long_x,long_y: Float
    */
    function copy_wall(game_copy, old_wall) {

      const wall_copy = {
        root_x: old_wall.root_x, root_y: old_wall.root_y,
        long_x: old_wall.long_x, long_y: old_wall.long_y,
      }
      game_copy.walls.push(wall_copy)

      if (old_wall.editor) {
        copy_editor(game_copy, old_wall.editor, wall_copy)
      }

      const abs_long_x = Math.abs(wall_copy.long_x)
      const abs_long_y = Math.abs(wall_copy.long_y)

      if (abs_long_x < abs_long_y) {
        wall_copy.long_x = 0
        if (abs_long_y < min_wall_long) {
          wall_copy.long_y = min_wall_long * (wall_copy.long_y > 0 ? 1 : -1)
        }
      }
      else {
        wall_copy.long_y = 0
        if (abs_long_x < min_wall_long) {
          wall_copy.long_x = min_wall_long * (wall_copy.long_x > 0 ? 1 : -1)
        }
      }

      return copy_wall
    }

    /* Copy Jack (
        game_copy: Game,
        old_jack: Jack,
        key_copy: Key,
        lock_copy: Lock,Null
      )
      Return: Jack

      Game: copy_game.Game
      Key: copy_key.Key
      Lock: copy_lock.Lock
      Path TODO
      Jack: copy_wall.Wall
        lock: Lock
        key: Key
    */
    function copy_jack(game_copy, old_jack, key_copy, lock_copy) {

      const jack_copy = {
        root_x: key_copy.root_x,
        root_y: key_copy.root_y,
        key: key_copy,
      }
      game_copy.jacks.push(jack_copy)

      // TODO PATH

      jack_copy.is_open = !old_jack.editor
      if (!jack_copy.is_open) {
        copy_editor(game_copy, old_jack.editor, jack_copy)
      }
      jack_copy.change_open = jack_copy.is_open != old_jack.is_open

      if (lock_copy) {
        jack_copy.lock = lock_copy
        jack_copy.long_x = lock_copy.long_x
        jack_copy.long_y = lock_copy.long_y
      }
      else {
        if (jack_copy.editor) {
          jack_copy.long_x = jack_copy.editor.spot_x - jack_copy.root_x
          jack_copy.long_y = jack_copy.editor.spot_y - jack_copy.root_y
        }
        else {
          jack_copy.long_x = old_jack.long_x
          jack_copy.long_y = old_jack.long_y
        }
        const length = jack_lock_long / Math.sqrt(
          jack_copy.long_x*jack_copy.long_x +
          jack_copy.long_y*jack_copy.long_y
        )
        jack_copy.long_x *= length
        jack_copy.long_y *= length

        jack_copy.lock = lock_copy(
          game_copy, old_jack.lock, jack_copy,
          jack_copy.root_x + jack_copy.long_x,
          jack_copy.root_y + jack_copy.long_y,
          -jack_copy.long_x, -jack_copy.long_y,
        )
      }

      return jack_copy
    }

    /* Copy Key (
        game_copy: Game
        old_key: Key
        lock_copy: Lock,Null
        root_x,root_y: Float
      )
      Return: Key

      Game: copy_game.Game
      Spot: copy_editor.Spot
      Lock: copy_lock.Lock
      Jack: copy_jack.Jack
      Key: Spot
        jack: Jack,Null
        lock: Lock,Null
    */
    function copy_key(game_copy, old_key, lock_copy, root_x, root_y ) {
      const key_copy = {
        root_x: root_x, root_y: root_y,
        lock: lock_copy,
      }
      game_copy.keys.push(key_copy)

      if (lock_copy) {
        lock_copy.key = key_copy
      }

      if (old_key.editor) {
        copy_editor(game_copy, old_key.editor, key_copy)
      }

      if (old_key.jack) {
        const jack_copy = copy_jack(
          game_copy, old_key.jack, key_copy, lock_copy,
        )
        key_copy.is_open = jack_copy.is_open
        key_copy.change_open = key_copy.is_open != old_key.is_open
      }
      else {
        key_copy.is_open = old_key.is_open
        key_copy.change_open = false
      }

      return key_copy
    }

    /* Copy Lock (
        game_copy: Game
        old_lock: Lock
        spot_copy: Spot,Null
        root_x,root_y,spot_x,spot_y,long: Float
      )
      Return: Lock

      Game: copy_game.Game
      Spot: copy_editor.Spot
      Editor: copy_editor.Editor
      Key: copy_key.Key
      Lock: copy_wall.Wall
        key: Key,Null
        spot: Spot
    */
    function copy_lock(
      game_copy, old_lock, spot_copy,
      root_x, root_y, long_x, long_y,
    ) {
      const lock_copy = {
        spot: spot_copy,
        root_x: root_x, root_y: root_y,
        long_x: long_x, long_y: long_y,
      }
      game_copy.locks.push(lock_copy)

      if (old_lock.editor) {
        copy_editor(game_copy, old_lock.editor, lock_copy)
      }

      if (old_lock.key) {
        const key_copy = copy_key(
          game_copy, old_lock.key, lock_copy,
          root_x, root_y,
        )
        lock_copy.is_open = key_copy.is_open
      }
      else {
        lock_copy.is_open = false
      }

      lock_copy.change_open = lock_copy.is_open != old_lock.is_open
      return lock_copy
    }

    /* Copy Door (
        game_copy: Game
        old_door: Door
      )
      Return: Door

      Game: copy_game.Game
      Lock: copy_lock.Lock
      Path TODO
      Door: copy_wall.Wall
        short_x,short_y,long: Float
        [door_lock_names]: Lock,Null
    */
    function copy_door(game_copy, old_door) {
      const door_copy = {
        root_x: old_door.root_x,
        root_y: old_door.root_y,
        is_open: true,
      }
      game_copy.doors.push(door_copy)

      if (old_door.editor) {
        copy_editor(game_copy, old_door.editor, door_copy)
      }

      if (Math.abs(old_door.long_x) < Math.abs(old_door.long_y)) {
        door_copy.long_y = old_door.long_y > 0 ? 1 : -1
        door_copy.long = door_copy.long_y * old_door.long_y * old_door.long
        door_copy.short_x = old_door.short_x > 0 ? 1 : -1
        door_copy.short_y = door_copy.long_x = 0
      }
      else {
        door_copy.long_x = old_door.long_x > 0 ? 1 : -1
        door_copy.long = door_copy.long_x * old_door.long_x * old_door.long
        door_copy.short_y = old_door.short_y > 0 ? 1 : -1
        door_copy.short_x = door_copy.long_y = 0
      }

      if (door_copy.long < min_door_long) {
        door_copy.long = min_door_long
      }

      for (const lock_name in door_lock_names) {
        const old_lock = old_door[lock_name]
        if (old_lock) {
          const [ half, spot, short, long ] = door_lock_names[lock_name]

          const long_x = door_lock_long * (
            door_copy.short_x * short + door_copy.long_x * long
          )
          const long_y = door_lock_long * (
            door_copy.short_y * short + door_copy.long_y * long
          )
          const long_mul = half * half_door_short + spot * door_copy.long

          const lock_copy = copy_lock(
            game_copy, old_lock, door_copy, (
              door_copy.root_x - long_x +
              door_copy.short_x * half_door_short +
              door_copy.long_x * long_mul +
            ), (
              door_copy.root_y - long_y +
              door_copy.short_y * half_door_short +
              door_copy.long_y * long_mul +
            ), long_x, long_y,
          )
          door_copy[lock_name] = lock_copy
          if (!lock_copy.is_open) {
            door_copy.is_open = false
          }
        }
      }

      door_copy.change_open = door_copy.is_open != old_door.is_open
      return door_copy
    }

    /* Copy Portal (
        game_copy: Game
        old_portal: Portal
      )
      Return: Portal

      Game: copy_game.Game
      Lock: copy_lock.Lock
      Portal: copy_wall.Wall
        short_x,short_y: Float
        root_lock,spot_lock: Lock,Null
    */
    function copy_portal(game_copy, old_door) {
      const portal_copy = {
        root_x: old_portal.root_x,
        root_y: old_portal.root_y,
        is_open: true,
      }
      game_copy.portals.push(portal_copy)

      if (old_portal.editor) {
        copy_editor(game_copy, old_portal.editor, portal_copy)
      }

      if (Math.abs(old_portal.long_x) < Math.abs(old_portal.long_y)) {
        portal_copy.long_y = old_portal.long_y > 0 ? 1 : -1
        portal_copy.short_x = old_portal.short_x > 0 ? 1 : -1
        portal_copy.short_y = portal_copy.long_x = 0
      }
      else {
        portal_copy.long_x = old_portal.long_x > 0 ? 1 : -1
        portal_copy.short_y = old_portal.short_y > 0 ? 1 : -1
        portal_copy.short_x = portal_copy.long_y = 0
      }

      const lock_root_x = (
        portal_copy.root_x + portal_copy.long_x * half_portal_long
      )
      const lock_root_y = (
        portal_copy.root_y + portal_copy.long_y * half_portal_long
      )
      const lock_long_x = -portal_copy.short_x * lock_long
      const lock_long_y = -portal_copy.short_y * lock_long

      if (old_portal.root_lock && old_portal.spot_lock) {

        portal_copy.root_lock = copy_lock(
          game_copy, old_portal.root_lock, portal_copy,
          lock_root_x - portal_copy.long_x * quarter_portal_long,
          lock_root_y - portal_copy.long_y * quarter_portal_long,
          lock_long_x, lock_long_y,
        )

        portal_copy.spot_lock = copy_lock(
          game_copy, old_portal.spot_lock, portal_copy,
          lock_root_x + portal_copy.long_x * quarter_portal_long,
          lock_root_y + portal_copy.long_y * quarter_portal_long,
          lock_long_x, lock_long_y,
        )

        portal_copy.is_open = (
          portal_copy.root_lock.is_open &&
          portal_copy.spot_lock.is_open
        )
      }
      else {

        const old_lock = old_portal.root_lock || old_portal.spot_lock
        if (old_lock) {
          portal_copy.root_lock = copy_lock(
            game_copy, old_lock, portal_copy
            lock_root_x, lock_root_y, lock_long_x, lock_long_y,
          )
        }
        else {

          // NEW LOCK
          const new_lock = {
            root_x: lock_root_x, root_y: lock_root_y,
            long_x: lock_long_x, long_y: lock_long_y,
            spot: portal_copy, is_open: false, change_open: false,
          }
          portal_copy.root_lock = new_lock
          game_copy.locks.push(new_lock)
        }

        portal_copy.is_open = portal_copy.root_lock.is_open
      }

      portal_copy.change_open = portal_copy.is_open != old_portal.is_open
      return portal_copy
    }

    /* Copy Game (
        old_game: Game
      )
      Return: Game

      Spot: copy_editor.Spot
      Wall: copy_wall.Wall
      Door: copy_door.Door
      Portal: copy_portal.Portal
      Lock: copy_lock.Lock
      Key: copy_key.Key
      Jack: copy_jack.Jack
      Editor: copy_editor.Editor
      Game: Spot
        walls: Wall[]
        doors: Door[]
        portals,open_portals: Portal[]
        locks: Locks[]
        keys: Key[]
        jacks: Jack[]
        editors: Editor{ID}
    */
    MazeGame.copy_game = copy_game
    function copy_game(old_game, start_time, current_time) {

      const game_copy = {
        walls: [],
        doors: [],
        portals: [],
        open_portals: [],
        locks: [],
        keys: [],
        jacks: [],
        editors: [],

        is_open: true,
      }

      if (old_game.editor) {
        copy_editor(game_copy, old_game.editor, game_copy)
      }

      // copy walls
      for (const wall_idx in old_game.walls) {
        const old_wall = old_game.walls[wall_idx]

        copy_wall(game_copy, old_wall)
      }

      // copy doors
      for (const door_idx in old_game.doors) {
        const old_door = old_game.doors[door_idx]

        copy_door(game_copy, old_door)
      }

      // copy portals
      {
        for (const portal_idx in old_game.portals) {
          const old_portal = old_game.portals[portal_idx]

          const portal_copy = copy_portal(game_copy, old_portal)
          if (portal_copy.is_open) {
            game_copy.open_portals.push(portal_copy)
          }
        }

        if (game_copy.open_portals.length != 2) {
          for (const portal_idx in game_copy.open_portals) {
            const portal_copy = game_copy.open_portals[portal_idx]
            portal_copy.is_open = false
            portal_copy.change_open = !portal_copy.change_open
          }
        }
      }

      for (const lock_idx in old_game.locks) {
        const old_lock = old_game.locks[lock_idx]

        if (old_lock.spot == old_game) {
          copy_lock(
            game_copy, old_lock, game_copy,
            old_lock.root_x, old_lock.root_y,
            old_lock.long_x, old_lock.long_y,
          )
        }
      }

      for (const key_idx in old_game.keys) {
        const old_key = old_game.keys[key_idx]

        if (!old_key.lock) {
          copy_key(game_copy, old_key, null, old_key.root_x, old_key.root_y)
        }
      }

      for (const editor_idx in old_game.editors) {
        const old_editor = old_game.editors[editor_idx]

        if (!old_editor.spot) {
          copy_editor(game_copy, old_editor)
        }
      }


    }
  }






  return MazeGame
}
