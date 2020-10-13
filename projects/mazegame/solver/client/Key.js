module.exports = MazeGameSolver => class Key extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","locks","keys"]; }

	constructor(homes, {x,y,home}) {
		super(x,y);

		this.home = homes[home];
		this.home.addkey(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			home: this.home.home_id
		}
	}
}