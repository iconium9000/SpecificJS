module.exports = MazeGameSolver => class Door {

	locks = [];

	constructor(id, rooms, { x,y, roomaid, roombid }) {
		this.id = id;
		this.x = x;
		this.y = y;
		
		this.rooma = rooms[roomaid];
		this.rooma.doors.push(this);

		this.roomb = rooms[roombid];
		this.roomb.doors.push(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			rooma: this.rooma.id,
			roomb: this.roomb.id
		}
	}
}