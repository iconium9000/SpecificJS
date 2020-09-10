module.exports = MazeGameSolver => class Lock extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","doors","portals"]; }

	key = null;
	jack = null;

	constructor(id, rooms, gates, { x,y, roomid, gateid }) {
		super(id,x,y);

		
		this.room = rooms[roomid];
		this.room.locks.push(this);

		this.gate = gates[gateid];
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
			roomid: this.room.id,
			gateid: this.gate.id
		}
	}
}