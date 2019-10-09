module.exports = (project_name, Lib) => {

  const MazeGame = {}

  const door_speed = 1
  const jack_speed = 1

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

    function copy_editor(old_editor, game_copy) {
      const editor_copy = {
        id: old_editor.id,
        name: old_editor.name,
      }
      game_copy.editors[editor_copy.id] = editor_copy
      return editor_copy
    }

    function copy_key(old_key, game_copy, root_x, root_y) {
      const key_copy = {
        root_x: root_x, root_y: root_y,
      }
      if (old_key.editor) {
        const editor_copy = copy_editor(old_key.editor, game_copy)
        editor_copy.key = key_copy
        key_copy.editor = editor_copy
      }
      game_copy.keys.push(key_copy)
      return key_copy
    }

    function copy_jack(old_jack, game_copy, start_time, current_time) {
      const jack_copy = {

      }

      if (old_jack.key) {
        const key_copy = copy_key(
          old_jack.key, game_copy,
          jack_copy.spot_x, jack_copy.spot_y,
        )
        key_copy.jack = jack_copy
        jack_copy.key = key_copy
      }

      if (old_jack.editor) {
        const editor_copy = copy_editor(old_jack.editor, game_copy)
        editor_copy.jack = jack_copy
        jack_copy.editor = editor_copy
      }
      game_copy.keys.push(key_copy)
      return key_copy
    }

    function copy_lock(old_lock, game_copy) {

    }

    function copy_wall(old_wall, game_copy) {
      const wall_copy = {
        root_x: old_wall.root_x,
        root_y: old_wall.root_y,
        long_x: old_wall.long_x || 0,
        long_y: old_wall.long_y || 0,
      }

      if (Math.abs(wall_copy.long_x) < Math.abs(wall_copy.long_y)) {
        wall_copy.long_x = 0
      }
      else {
        wall_copy.long_y = 0
      }

      if (old_wall.editor) {
        const editor_copy = copy_editor(old_wall.editor, game_copy)
        editor_copy.wall = wall_copy
        wall_copy.editor = editor_copy
      }
      game_copy.walls.push(wall_copy)
      return wall_copy
    }
    }

    function copy_door(old_door, game_copy, start_time, current_time) {

    }

    function copy_portal(old_portal, game_copy) {

    }

    /* Copy Game (old_game: Game)

      State: String
        'wall','lock','door','portal','jack','key','game'
      Wall
        root_x,root_y: Float
        long_x,long_y: Float
      Door: Wall
        [door_lock_names]: Lock,Null
        is_open,change_open: Boolean
      Portal: Wall
        root_lock,spot_lock: Lock,Null
        is_open,change_open: Boolean
      Lock
        root_x,root_y: Float
        key: Key,Null
        jack: Jack, door: Door, portal: Portal
      Key
        root_x,root_y: Float
        jack: Jack,Null
        lock: Lock,Null
      Jack
        root_x,root_y: Float
        handle: Handle
        key: Key
      Mass
        root_x,root_y: Float
        jack: Jack,Null
      Editor
        spot_x,spot_y: Float

        name: String
        state: State
        wall: Wall,Null
        door: Door,Null
        portal: Portal,Null
        lock: Locks,Null
        jack: Jack,Null
        key: Key,Null
      Game
        walls: Wall[]
        doors: Door[]
        portals: Portal[]
        locks: Locks[]
        jacks: Jack[]
        keys: Key[]
        editors: Editor[]
        path: Path,Null
    */
    MazeGame.copy_game = copy_game
    function copy_game(old_game, start_time, current_time) {

      const game_copy = {
        walls: [],
        portals: [],
        doors: [],
        locks: [],
        keys: [],
        jacks: [],
        editors: {},
      }

      for (const wall_idx in old_game.walls) {
        const old_wall = old_game.walls[wall_idx]


      }

      for (const door_idx in old_game.doors) {
        const old_door = old_game.doors[door_idx]


      }

      for (const portal_idx in old_game.portals) {
        const old_portal = old_game.portals[portal_idx]


      }

      for (const jack_idx in old_game.jacks) {
        const old_jack = old_game.jacks[jack_idx]


      }
      for (const key_idx in old_game.keys) {
        const old_key = old_game.keys[key_idx]


      }

      for (const editor_id in old_game.editors) {
        const old_editor = old_game.editors[editor_id]
        if (
          old_editor.wall || old_editor.portal || old_editor.door ||
          old_editor.lock || old_editor.jack || old_editor.key
        ) {
          return
        }
        copy_editor(old_editor, game_copy)
      }
    }
  }






  return MazeGame
}
