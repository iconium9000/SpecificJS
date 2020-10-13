module.exports = MazeGameSolver => class Room extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms"]; }

	static mouseup(x,y,level,item) {

		if (item) {

		}
		else {
			const room = new Room(level.rooms.length, {x:x, y:y});
			level.rooms.push(room);
			level.homes.push(room);
		}
	}

	doors = [];
	portals = [];
	locks = [];

	keys = [];
	masses = [];
	jacks = [];

	addkey(key) {
		this.keys.push(key);
	}
	
	addmass(mass) {
		this.masses.push(mass);
	}

	addjack(jack) {
		this.jacks.push(jack);
	}

	constructor({x,y}) {
		super(x,y);
	}

	get object() {
		return {
			x: this.x,
			y: this.y 
		}
	}
}