module.exports = MazeGameSolver => class Level {

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

	constructor({ name, rooms, goalid, doors, portals, locks, keys, masses, jacks }) {

		const { Room, Door, Portal, Lock, Key, Mass, Jack } = MazeGameSolver;

		this.name = name;

		for (const id in rooms) {
			const room = new Room(id, rooms[id])
			this.rooms.push(room);
			this.homes.push(room);
		}

		this.goal = this.rooms[goalid];
		if (this.goal == null) {
			this.goal = new Room(this.rooms.length, { x:100, y:100 });
			this.rooms.push(this.goal);
			this.homes.push(this.goal);
		}

		for (const id in doors) {
			const door = new Door(id, this.rooms, doors[id]);
			this.doors.push(door);
			this.gates.push(door);
		}

		for (const id in portals) {
			const portal = new Portal(id, this.rooms, portals[id]);
			this.portals.push(portal);
			this.gates.push(portal);
		}

		for (const id in locks) {
			const lock = new Lock(id, this.rooms, this.gates, locks[id]);
			this.locks.push(lock);
			this.homes.push(lock);
		}

		for (const id in keys) {
			const key = new Key(id, this.homes, keys[id]);
			this.keys.push(key);
			this.pieces.push(key);
		}

		for (const id in masses) {
			const mass = new Mass(id, this.homes, masses[id]);
			this.masses.push(mass);
			this.pieces.push(mass);
		}

		for (const id in jacks) {
			const jack = new Jack(id, this.homes, jacks[id]);
			this.jacks.push(jack);
			this.pieces.push(jack);
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

		const names = ["rooms","doors","portals","locks","keys","masses","jacks"];
		for (const id in names) {
			o[names[id]].push(this[names[id]].object);
		}

		return o;
	}
}