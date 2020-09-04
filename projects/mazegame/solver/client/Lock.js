module.exports = MazeGameSolver => class Lock {

	key = null;
	jack = null;

	constructor(id, rooms, gates, { x,y, roomid, gateid }) {
		this.id = id;
		this.x = x;
		this.y = y;
		
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