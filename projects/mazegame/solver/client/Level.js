module.exports = MazeGameSolver => class Level {

	static get searchmask() { return ["rooms"]; }

	rooms = [];
	doors = [];
	portals = [];
	locks = [];
	keys = [];
	masses = [];
	jacks = [];

	gates = [];
	homes = [];
	pieces = [];

	constructor({ selected, name, rooms, goalid, doors, portals, locks, keys, masses, jacks }) {

		const { Room, Door, Portal, Lock, Key, Mass, Jack } = MazeGameSolver;

		this.name = name;
		if (selected) this.selected = true;

		for (const id in rooms) {
			const room = new Room(rooms[id])
			room.room_id = this.rooms.push(room)-1;
			room.home_id = this.homes.push(room)-1;
		}

		this.goal = this.rooms[goalid];
		if (this.goal == null) {
			const room = new Room(this.rooms.length, { x:100, y:100 });
			this.goal = room;
			room.room_id = this.rooms.push(this.goal)-1;
			room.home_id = this.homes.push(this.goal)-1;
		}

		for (const id in doors) {
			const door = new Door(this.rooms, doors[id]);
			door.door_id = this.doors.push(door)-1;
			door.gate_id = this.gates.push(door)-1;
		}

		for (const id in portals) {
			const portal = new Portal(this.rooms, portals[id]);
			portal.portal_id = this.portals.push(portal)-1;
			portal.gate_id = this.gates.push(portal)-1;
		}

		for (const id in locks) {
			const lock = new Lock(this.rooms, this.gates, locks[id]);
			lock.lock_id = this.locks.push(lock)-1;
			lock.home_id = this.homes.push(lock)-1;
		}

		for (const id in keys) {
			const key = new Key(this.homes, keys[id]);
			key.key_id = this.keys.push(key)-1;
			key.piece_id = this.pieces.push(key)-1;
		}

		for (const id in masses) {
			const mass = new Mass(this.homes, masses[id]);
			mass.mass_id = this.masses.push(mass)-1;
			mass.piece_id = this.pieces.push(mass)-1;
		}

		for (const id in jacks) {
			const jack = new Jack(this.homes, jacks[id]);
			jack.jack_id = this.jacks.push(jack)-1;
			jack.piece_id = this.pieces.push(jack)-1;
		}

	}

	get object() {
		
		const o = {
			name: this.name,
			goalid: this.goal.id,
			rooms: [],
			doors: [],
			portals: [],
			locks: [],
			keys: [],
			masses: [],
			jacks: []
		};

		if (this.selected) o.selected = true;

		this.homes = [];
		this.gates = [];
		this.pieces = [];
		for (const id in this.rooms) {
			const room = this.rooms[id];
			room.room_id = o.rooms.push(room.object);
			room.home_id = this.homes.push(room);
		}
		for (const id in this.doors) {
			const door = this.doors[id];
			door.door_id = o.doors.push(door.object);
			door.gate_id = this.gates.push(door);
		}
		for (const id in this.portals) {
			const portal = this.portals[id];
			portal.portal_id = o.portals.push(portal.object);
			portal.gate_id = this.gates.push(portal);
		}
		for (const id in this.locks) {
			const lock = this.locks[id];
			lock.lock_id = o.locks.push(lock.object);
			lock.home_id = this.homes.push(lock);
		}
		for (const id in this.keys) {
			const key = this.keys[id];
			key.key_id = o.keys.push(key.object);
			key.piece_id = this.pieces.push(key);
		}
		for (const id in this.masses) {
			const mass = this.masses[id];
			mass.mass_id = o.masses.push(mass.object);
			mass.piece_id = this.pieces.push(mass);
		}
		for (const id in this.jacks) {
			const jack = this.jacks[id];
			jack.jack_id = o.jacks.push(jack.object);
			jack.piece_id = this.pieces.push(jack);
		}
		return o;
	}
}