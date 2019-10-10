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


  // root, spot, short, long
  const door_lock_names = {
    short_root_lock: [ 0, 1, 0 ],
    long_root_lock:  [ 0, 0,-1 ],
    short_spot_lock: [ 1,-1, 0 ],
    long_spot_lock:  [ 1, 0, 1 ],
  }

  // Getters
  {
    /* Get Game ()
      Return: Game

      Game
        nodes,walls,portals,doors,locks,keys,jacks: Object[]
        editors: Object{}
    */
    MazeGame.get_game = get_game
    function get_game() {

      const new_game = {
        walls: [],
        portals: [],
        doors: [],
        locks: [],
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
      }
      game.editors[client.socket.id] = new_editor

      return new_editor
    }
  }

  // copyers
  {

    /* Copy Editor (game_copy: Game, old_editor: Editor, spot_copy: Spot)
      Return: Editor

      Game: copy_game.Game
      Spot: Object
        editor: Editor
        root_x,root_y: Float
        is_open,change_open: Boolean
      Editor: Object
        id: ID
        name: String
        spot: Spot,Null
        state: ['wall','door','portal','lock','key','jack','game']
        spot_x,spot_y: Float
    */
    function copy_editor(game_copy, old_editor, spot_copy) {
      const editor_copy = {
        id: old_editor.id,
        name: old_editor.name,
        spot: spot_copy,
        spot_x: old_editor.spot_x,
        spot_y: old_editor.spot_y,
      }
      spot.editor = editor_copy
      game_copy.editors[editor_copy.id] = editor_copy
      return editor_copy
    }

    /* Copy Wall (game_copy: Game, old_wall: Wall)
      Return: Wall

      Wall: copy_editor.Spot
        long_x,long_y: Float
      Game
        MOD walls: Wall[]
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
        game_copy: Game, old_jack: Jack, key_copy: Key, lock_copy: Lock,Null
      )

      Game: copy_game.Game
      Key: copy_key.Key
      Lock: copy_lock.Lock
      Path TODO
      Jack: copy_editor.Spot
        lock: Lock
        key: Key
        spot_x,spot_y: Float
    */
    function copy_jack(game_copy, old_jack, key_copy, lock_copy) {

      const jack_copy = {
        root_x: key_copy.root_x,
        root_y: key_copy.root_y,
        key: key_copy,
      }
      game_copy.jacks.push(jack_copy)

      // TODO

      if (old_jack.editor) {
        copy_editor(game_copy, old_jack.editor, jack_copy)
      }

      if (lock_copy) {
        jack_copy.lock = lock_copy
        jack_copy.spot_x = lock_copy.spot_x
        jack_copy.spot_y = lock_copy.spot_y
      }
      else {
        if (jack_copy.editor) {
          jack_copy.spot_x = jack_copy.editor.spot_x
          jack_copy.spot_y = jack_copy.editor.spot_y
        }
        else {
          jack_copy.spot_x = old_jack.spot_x
          jack_copy.spot_y = old_jack.spot_y
        }
        const length = Math.sqrt(
          jack_copy.spot_x*jack_copy.spot_x +
          jack_copy.spot_y*jack_copy.spot_y
        )
        jack_copy.spot_x *= jack_lock_long / length
        jack_copy.spot_y *= jack_lock_long / length

        jack_copy.lock = copy_lock(
          game_copy, old_jack.lock, jack_copy,
          jack_copy.spot_x, jack_copy.spot_y,
          jack_copy.root_x, jack_copy.root_y,
        )
      }

      return jack_copy
    }

    /* Copy Key (
        game_copy: Game, old_key: Key, lock_copy: Lock,Null,
        root_x,root_y: Float
      )

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

      if (old_key.editor) {
        copy_editor(game_copy, old_key.editor, key_copy)
      }

      const old_jack = old_key.jack
      if (old_jack) {
        const jack_copy = copy_jack(
          game_copy, old_key.jack, key_copy, lock_copy,
        )
        key_copy.is_open = !jack_copy.editor
        key_copy.change_open = key_copy.is_open != old_key.is_open
      }
      else {
        key_copy.is_open = old_key.is_open
        key_copy.change_open = false
      }

      return key_copy
    }

    /* Copy Lock (
        game_copy: Game, old_lock: Lock, spot_copy: Spot,Null,
        root_x,root_y,spot_x,spot_y: Float
      )

      Game: copy_game.Game
      Spot: copy_editor.Spot
      Editor: copy_editor.Editor
      Key: copy_key.Key
      Lock: Spot
        spot_x,spot_y: Float
        key: Key,Null
        spot: Spot
    */
    function copy_lock(
      game_copy, old_lock, spot_copy,
      root_x, root_y, spot_x, spot_y,
    ) {
      const lock_copy = {
        spot: spot_copy,
        root_x: root_x, root_y: root_y,
        spot_x: spot_x, spot_y: spot_y,
      }
      game_copy.locks.push(lock_copy)

      if (old_lock.editor) {
        copy_editor(game_copy, old_lock.editor, lock_copy)
      }

      if (old_lock.key) {
        const key_copy = copy_key(
          game_copy, old_lock.key, old_lock, root_x, root_y,
        )
        lock_copy.is_open = key_copy.is_open
      }
      else {
        lock_copy.is_open = false
      }

      lock_copy.change_open = lock_copy.is_open != old_lock.is_open
      return lock_copy
    }

    /* Copy Door (game_copy: Game, old_door: Door)

      Game: copy_game.Game
      Lock: copy_lock.Lock
      Path TODO
      Door: copy_wall.Wall
        short_x,short_y,long: Float
        [door_lock_names]: Lock,Null
    */
    function copy_door(game_copy, old_door) {
      const door_copy = {
        root_x: old_door.root_x, root_y: old_door.root_y,
        is_open: true,
      }
      game_copy.doors.push(door_copy)

      if (old_door.editor) {
        const editor_copy = {
          id: old_door.editor.id,
          name: old_door.editor.name,
          spot: door_copy,
          door: door_copy,
        }
        door_copy.editor = editor_copy
        game_copy.editors[editor_copy.id] = editor_copy
      }

      if (Math.abs(old_door.long_x) < Math.abs(old_door.long_y)) {
        door_copy.long_y = old_door.long_y > 0 ? 1 : -1
        door_copy.long = door_copy.long_y * old_door.long_y * old_door.long
        door_copy.short_x = door_copy.short_x > 0 ? 1 : -1
        door_copy.short_y = door_copy.long_x = 0
      }
      else {
        door_copy.long_x = old_door.long_x > 0 ? 1 : -1
        door_copy.long = door_copy.long_x * old_door.long_x * old_door.long
        door_copy.short_y = door_copy.short_y > 0 ? 1 : -1
        door_copy.short_x = door_copy.long_y = 0
      }

      if (door_copy.long < min_door_long) {
        door_copy.long = min_door_long
      }

      for (const lock_name in door_lock_names) {
        const old_lock = old_door[lock_name]
        if (old_lock) {
          const [ spot, short, long ] = door_lock_names[lock_name]

          const spot_x = door_copy.root_x +
            (door_copy.short_x + door_copy.long_x) * half_door_short +
            door_copy.long_x * (door_copy.long - door_short) * spot
          const spot_y = door_copy.root_y +
            (door_copy.short_y + door_copy.long_y) * half_door_short +
            door_copy.long_y * (door_copy.long - door_short) * spot
          const root_x = spot_x +
            door_copy.short_x * door_lock_long * short +
            door_copy.long_x * door_lock_long * long
          const root_y = spot_y +
            door_copy.short_y * door_lock_long * short +
            door_copy.long_y * door_lock_long * long

          const lock_copy = copy_lock(
            game_copy, old_lock, door_copy,
            root_x, root_y, spot_x, spot_y,
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

    /* Copy Game (old_game: Game)

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
        portals: Portal[]
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
        locks: [],
        keys: [],
        jacks: [],
        editors: [],
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
    }
  }






  return MazeGame
}
