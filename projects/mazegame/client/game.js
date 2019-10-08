module.exports = (project_name, Lib) => {

  const MazeGame = {}

  const min_wall_long = 1
  const door_short = 2
  const half_door_short = door_short / 2
  const min_door_long = 3
  const lock_size = 2

  const portal_long = 4
  const half_portal_long = portal_long / 2
  const quarter_portal_long = portal_long / 4
  const portal_short = 1

  const jack_size = 0.9
  const jack_lock_size = jack_size + lock_size


  // root, spot, short, long
  const door_lock_names = {
    short_root_lock: [ 1, 0, 1, 0],
    long_root_lock:  [ 1, 0, 0, 1],
    short_spot_lock: [ 0,-1,-1, 0],
    long_spot_lock:  [ 0,-1, 0,-1],
  }

  // Getters
  {
    /* Get Game ()
      Return: Game

      Game
        nodes,walls,portals,doors,locks,keys,masss,jacks: Object[]
        editors: Object{}
    */
    MazeGame.get_game = get_game
    function get_game() {

      const new_game = {
        walls: [],
        portals: [],
        doors: [],
        locks: [],
        masss: [],
        keys: [],
        jacks: [],
        editors: {},
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
      Editor
        name: String
      Game
        editors: Editor{ID}
    */
    MazeGame.get_editor = get_editor
    function get_editor(game, client) {
      const editor = game.editors[client.socket.id]
      if (editor) {
        return editor
      }

      const new_editor = {
        name: client.name,
        state: 'wall',
        root: false,
      }
      game.editors[client.socket.id] = new_editor

      return new_editor
    }
  }

  // manip
  {

    /* Copy Game (old_game: Game)

      Int:
        float that may needs to be floored to the next int
      State: String
        'wall','lock','door','portal','jack','key','game'
      Wall
        root_x,root_y,spot_x,spot_y: Int
      Lock
        root_x,root_y,spot_x,spot_y: Int
        key: Key,Null
        jack: Jack,Null
      Door
        long_x,long_y,
        root_x,root_y,spot_x,spot_y: Int
        short_root_lock,long_root_lock: Lock,Null
        short_spot_lock,long_spot_lock: Lock,Null
        is_open,change_open: Boolean
      Portal
        root_x,root_y,spot_x,spot_y: Int
        root_lock,spot_lock: Lock,Null
        is_open,change_open: Boolean
      Jack
        root_x,root_y: Float
        spot_x,spot_y: Float
        editor: Editor,Null
        key: Key,Null
        mass: Mass,Null
        lock: Lock,Null
      Key
        jack: Jack,Null
        lock: Lock,Null
        root_x,root_y: Float
      Mass
        jack: Jack,Null
        root_x,root_y: Float
      Editor
        root: Boolean
        root_x,root_y: Float
        state: State
        wall: Wall,Null
        door: Door,Null
        portal: Portal,Null
        lock: Locks,Null
        jack: Jack,Null
        key: Key,Null
        mass: Mass,Null
      Path
        root_x,root_y,spot_x,spot_y: Float
        mid_x,mid_y: Float
        jack: Jack
        spot_key: Key,Null
        spot_lock: Lock,Null
        spot_portal: Portal,Null
      Game
        walls: Wall[]
        doors: Door[]
        portals: Portal[]
        locks: Locks[]
        jacks: Jack[]
        keys: Key[]
        masss: Mass[]
        editors: Editor[]
        path: Path,Null
    */
    MazeGame.copy_game = copy_game
    function copy_game(old_game) {

      // clear idxs
      {
        for (const jack_idx in old_game.jacks) {
          const old_jack = old_game.jacks[jack_idx]
          if (old_jack.lock) old_jack.lock.idx = -1
          if (old_jack.mass) old_jack.mass.idx = -1
          if (old_jack.key) {
            old_jack.key.idx = -1
            if (old_jack.key.lock) old_jack.key.lock.idx = -1
          }
        }

        for (const key_idx in old_game.keys) {
          const old_key = old_game.keys[key_idx]
          if (old_key.lock) old_key.lock.idx = -1
        }

        for (const editor_id in old_game.editors) {
          const old_editor = old_game.editors[editor_id]
          if (old_editor.wall) old_key.wall.idx = -1
          if (old_editor.door) old_key.door.idx = -1
          if (old_editor.portal) old_key.portal.idx = -1
          if (old_editor.lock) old_key.lock.idx = -1
          if (old_editor.jack) old_key.jack.idx = -1
          if (old_editor.key) old_key.key.idx = -1
          if (old_editor.mass) old_key.mass.idx = -1
        }
      }

      const game_copy = {
        walls: [],
        doors: [],
        portals: [],
        locks: [],
        masss: [],
        keys: [],
        jacks: [],
        editors: {},
      }

      // copy walls
      for (const wall_idx in old_game.walls) {
        const old_wall = old_game.walls[wall_idx]
        old_wall.idx = -1

        const dif_x = old_door.spot_x - old_door.root_x
        const dif_y = old_door.spot_y - old_door.root_y

        let wall_long, long_x, long_y

        if (Math.abs(dif_x) < Math.abs(dif_y)) {
          long_y = 0 < dif_y ? 1 : -1
          wall_long = dif_y * long_y
          long_x = 0
        }
        else {
          long_x = 0 < dif_x ? 1 : -1
          wall_long = dif_x * long_x
          long_y = 0
        }

        if (wall_long < min_long_wall) {
          continue
        }

        const wall_copy = {
          long_x: long_x, long_y: long_y, long: wall_long,
          root_x: old_wall.root_x, root_y: old_wall.root_y,
          spot_x: old_wall.root_x + long_x * wall_long,
          spot_y: old_wall.root_y + long_y * wall_long,
        }
        old_wall.idx = game_copy.walls.length
        game_copy.walls.push(wall_copy)
      }

      // copy doors
      for (const door_idx in old_game.doors) {
        const old_door = old_game.doors[door_idx]
        old_door.idx = -1

        for (const lock_name in door_lock_names) {
          const old_lock = old_door[lock_name]
          old_lock.idx = -1
        }

        const dif_x = old_door.spot_x - old_door.root_x
        const dif_y = old_door.spot_y - old_door.root_y

        let short_x, short_y, long_x, long_y
        let door_long

        if (Math.abs(dif_x) < Math.abs(dif_y)) {
          short_x = 0 < dif_x ? 1 : -1
          long_y = 0 < dif_y ? 1 : -1
          door_long = dif_y * long_y
          short_y = long_x = 0
        }
        else {
          short_y = 0 < dif_y ? 1 : -1
          long_x = 0 < dif_x ? 1 : -1
          door_long = dif_x * long_x
          short_x = long_y = 0
        }

        if (door_long < min_door_long) {
          continue
        }

        const door_copy = {
          short_x: short_x, short_y: short_y,
          long_x: long_x, long_y: long_y,
          long: door_long,
          root_x: old_door.root_x, root_y: old_door.root_y,
          spot_x: old_door.root_x + short_x * door_short + long_x * door_long,
          spot_y: old_door.root_y + short_y * door_short + long_y * door_long,
        }
        old_door.idx = game_copy.doors.length
        game_copy.doors.push(door_copy)


        for (const lock_name in door_lock_names) {
          const old_lock = old_door[lock_name]
          if (old_lock) {
            const [root, spot, short, long] = door_lock_names[lock_name]
            const root_x = door_copy.root_x * root + door_copy.spot_x * spot +
              (short * short_x + long * long_x) * half_door_short
            const root_y = door_copy.root_y * root + door_copy.spot_y * spot +
              (short * short_y + long * long_y) * half_door_short
            const lock_copy = {
              root_x: root_x, root_y: root_y,
              spot_x: root_x - (long * short_x + short * long_x) * lock_size,
              spot_y: root_y - (long * short_y + short * long_y) * lock_size,
              door: door_copy,
            }
            old_lock.idx = game_copy.locks.length
            door_copy[lock_name] = lock_copy
            game_copy.locks.push(lock_copy)
          }
        }
      }

      // copy portals
      for (const portal_idx in old_game.portals) {
        const old_portal = old_game.portals[portal_idx]

        const dif_x = old_door.spot_x - old_door.root_x
        const dif_y = old_door.spot_y - old_door.root_y

        let short_x, short_y, long_x, long_y

        if (Math.abs(dif_x) < Math.abs(dif_y)) {
          short_x = dif_x > 0 ? 1 : -1
          long_y = dif_y > 0 ? 1 : -1
          short_y = long_x = 0
        }
        else {
          short_y = dif_y > 0 ? 1 : -1
          long_x = dif_x > 0 ? 1 : -1
          short_x = long_y = 0
        }

        const portal_copy = {
          short_x: short_x, short_y: short_y, long_x: long_x, long_y: long_y,
          root_x: old_portal.root_x, root_y: old_portal.root_y,
          spot_x: old_portal.root_x + short_x * portal_short + long_x * portal_long,
          spot_y: old_portal.root_y + short_y * portal_short + long_y * portal_long,
        }
        old_portal.idx = game_copy.portals.length
        game_copy.portals.push(portal_copy)

        let root_x = portal_copy.root_x
        let root_y = portal_copy.root_y

        if (old_portal.root_lock && old_portal.spot_lock) {
          root_x += long_x * quarter_portal_long
          root_y += long_y * quarter_portal_long

          const lock_copy = {
            root_x: root_x, root_y: root_y,
            spot_x: root_x - short_x * lock_size,
            spot_y: root_y - short_y * lock_size,
            portal: portal_copy,
          }
          old_portal.root_lock.idx = game_copy.locks.length
          game_copy.locks.push(lock_copy)
        }

        root_x += long_x * half_portal_long
        root_y += long_y * half_portal_long
        const lock_copy = {
          root_x: root_x, root_y: root_y,
          spot_x: root_x - short_x * lock_size,
          spot_y: root_y - short_y * lock_size,
          portal: portal_copy,
        }
        if (old_portal.spot_lock) {
          old_portal.spot_lock.idx = game_copy.locks.length
        }
        else if (old_portal.root_lock) {
          old_portal.root_lock.idx = game_copy.locks.length
        }
        game_copy.locks.push(lock_copy)
      }

      // copy jack
      for (const jack_idx in old_game.jacks) {
        const old_jack = old_game.jacks[jack_idx]

        const jack_copy = {}

        let root = true
        jack_copy.root_x = old_jack.root_x
        jack_copy.root_y = old_jack.root_y

        if (old_jack.lock) {
          const lock_copy = game_copy.locks[old_jack.lock.idx]
          if (!lock_copy || lock_copy.jack || lock_copy.key) {
            continue
          }

          lock_copy.jack = jack_copy
          jack_copy.lock = lock_copy

          jack_copy.root_x = lock_copy.spot_x
          jack_copy.root_y = lock_copy.spot_y
        }
        else if (old_jack.mass) {
          const mass_copy = {}

          mass_copy.jack = jack_copy
          jack_copy.mass = mass_copy
          old_jack.mass.idx = game_copy.masss.length
          game_copy.masss.push(mass_copy)
        }
        else if (old_jack.key) {
          const key_copy = {}

          root = !old_jack.key.lock
          if (!root) {
            const lock_copy = game_copy.locks[old_jack.key.lock.idx]
            if (!lock_copy || lock_copy.jack || lock_copy.key) {
              continue
            }

            jack_copy.spot_x = lock_copy.spot_x
            jack_copy.spot_y = lock_copy.spot_y

            key_copy.lock = lock_copy
            lock_copy.key = key_copy
            old_jack.key.idx = game_copy.keys.length
            game_copy.keys.push(key_copy)
          }

          key_copy.jack = jack_copy
          jack_copy.key = key_copy
        }

        if (root) {
          const dif_x = old_jack.spot_x - jack_copy.root_x
          const dif_y = old_jack.spot_y - jack_copy.root_y
          const length = Math.sqrt(dif_x*dif_x + dif_y*dif_y)

          jack_copy.spot_x = jack_copy.root_x + dif_x / length * jack_lock_size
          jack_copy.spot_y = jack_copy.root_y + dif_y / length * jack_lock_size
        }
        else {
          const dif_x = old_jack.root_x - jack_copy.spot_x
          const dif_y = old_jack.root_y - jack_copy.spot_y
          const length = Math.sqrt(dif_x*dif_x + dif_y*dif_y)

          jack_copy.root_x = jack_copy.spot_x + dif_x / length * jack_lock_size
          jack_copy.root_y = jack_copy.spot_y + dif_y / length * jack_lock_size
        }

        if (jack_copy.mass) {
          jack_copy.mass.spot_x = jack_copy.spot_x
          jack_copy.mass.spot_y = jack_copy.spot_y
        }
        else if (jack_copy.key) {
          jack_copy.key.spot_x = jack_copy.spot_x
          jack_copy.key.spot_y = jack_copy.spot_y
        }
      }

      // copy masss
      for (const mass_idx in old_game.masss) {
        const old_mass = old_game.masss[mass_idx]

        if (old_mass.jack) {
          continue
        }

        const mass_copy = {
          root_x: old_mass.root_x,
          root_y: old_mass.root_y,
        }
        old_mass.idx = game_copy.masss.length
        game_copy.masss.push(mass_copy)
      }

      // copy keys
      for (const key_idx in old_game.keys) {
        const old_key = old_game.keys[key_idx]

        if (old_key.jack) {
          continue
        }

        const key_copy = {
          root_x: old_key.root_x,
          root_y: old_key.root_y,
        }
        if (old_key.lock) {
          const lock_copy = game_copy.locks[old_key.lock.idx]
          if (!lock_copy || lock_copy.jack || lock_copy.key) {
            continue
          }
          key_copy.root_x = lock_copy.spot_x
          key_copy.root_y = lock_copy.spot_y
          key_copy.lock = lock_copy
          lock_copy.key = key_copy
        }

        old_key.idx = game_copy.keys.length
        game_copy.keys.push(key_copy)
      }

      // detect door open
      for (const door_idx in old_game.doors) {
        const old_door = old_game.doors[door_idx]
        const door_copy = game_copy.doors[old_door.idx]

        if (!door_copy) {
          continue
        }

        door_copy.is_open = true
        for (const lock_name in door_lock_names) {
          const lock_copy = door_copy[lock_name]
          if (!lock_copy.key && !lock_copy.jack) {
            door_copy.is_open = false
            break
          }
        }

        door_copy.change_open = door_copy.is_open != old_door.is_open
      }

      // detect portal open
      for (const portal_idx in old_game.portals) {
        const old_portal = old_game.portals[portal_idx]
        const portal_copy = game_copy.portals[old_portal.idx]

        if (!portal_copy) {
          continue
        }

        portal_copy.is_open = true
        if (portal.root_lock) {
          if (!portal.root_lock.key && !portal.root_lock.jack) {
            portal_copy.is_open = false
          }
        }
        if (portal.spot_lock) {
          if (!portal.spot_lock.key && !portal.spot_lock.jack) {
            portal_copy.is_open = false
          }
        }

        portal_copy.change_open = portal_copy.is_open != old_portal.is_open
      }

      // copy editors
      for (const editor_id in old_game.editors) {
        const old_editor = old_game.editors[editor_id]

        const editor_copy = {
          name: old_editor.name,
          state: old_editor.state,
          root: old_editor.root, root_x: old_editor.root_x, spot_x: old_editor.root_y,
          wall: old_editor.wall && game_copy.walls[old_editor.wall.idx],
          door: old_editor.door && game_copy.doors[old_editor.door.idx],
          portal: old_editor.portal && game_copy.portals[old_editor.portal.idx],
          lock: old_editor.lock && game_copy.locks[old_editor.lock.idx],
          jack: old_editor.jack && game_copy.jacks[old_editor.jack.idx],
          key: old_editor.key && game_copy.keys[old_editor.key.idx],
          mass: old_editor.mass && game_copy.masss[old_editor.mass.idx],
        }

        if (editor_copy.jack) {
          if (editor_copy.jack.editor) {
            editor_copy.jack = null
          }
          else {
            editor_copy.jack.editor = editor_copy
          }
        }

        old_editor.id = editor_id
        game_copy.editors[editor_id] = editor_copy
      }
    }
  }






  return MazeGame
}
