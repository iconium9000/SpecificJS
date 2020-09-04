module.exports = MazeGameSolver => class Portal {

	locks = [];
	slots = [];

	constructor(id, rooms, { x,y, roomid }) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.room = rooms[roomid];
		this.room.portals.push(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			roomid: this.room.id
		}
	}
}