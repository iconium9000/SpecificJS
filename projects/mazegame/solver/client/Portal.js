module.exports = MazeGameSolver => class Portal extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","portals"]; }

	locks = [];
	slots = [];

	constructor(id, rooms, { x,y, roomid }) {
		super(id,x,y);

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