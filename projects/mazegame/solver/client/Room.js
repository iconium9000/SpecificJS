module.exports = MazeGameSolver => class Room {

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

	constructor(id, { x,y }) {
		this.id = id;
		this.x = x;
		this.y = y;
	}

	get object() {
		return {
			x: this.x,
			y: this.y 
		}
	}
}