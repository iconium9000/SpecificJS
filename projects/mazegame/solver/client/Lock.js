module.exports = MazeGameSolver => class Lock extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","doors","portals"]; }

	key = null;
	jack = null;

	constructor(rooms, gates, {x,y,room,gate}) {
		super(x,y);
		
		this.room = rooms[room];
		this.room.locks.push(this);

		this.gate = gates[gate];
		this.gate.locks.push(this);
	}

	addkey(key) {
		this.key = key;
	}

	addjack(jack) {
		this.jack = jack;
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			room: this.room.room_id,
			gate: this.gate.gate_id
		}
	}
}