module.exports = MazeGameSolver => class Room extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms"]; }

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
		super(id,x,y);

	}

	get object() {
		return {
			x: this.x,
			y: this.y 
		}
	}
}