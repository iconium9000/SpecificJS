module.exports = MazeGameSolver => class Mass extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","locks","masses"]; }

	constructor(homes, {x,y,home}) {
		super(x,y);

		this.home = homes[home];
		this.home.addmass(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			home: this.home.home_id
		}
	}
}