module.exports = MazeGameSolver => class Portal extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","portals"]; }

	locks = [];
	slots = [];

	constructor(rooms, {x,y, room}) {
		super(x,y);

		this.room = rooms[room];
		this.room.portals.push(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			room: this.room.room_id
		}
	}
}