module.exports = MazeGameSolver => class Door extends MazeGameSolver.Item {

	static get searchmask() { return ["doors","rooms"]; }

	locks = [];

	constructor(rooms, {x,y,rooma,roomb}) {
		super(x,y);
		
		this.rooma = rooms[rooma];
		this.rooma.doors.push(this);

		this.roomb = rooms[roomb];
		this.roomb.doors.push(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			rooma: this.rooma.room_id,
			roomb: this.roomb.room_id
		}
	}
}