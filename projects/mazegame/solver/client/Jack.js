module.exports = MazeGameSolver => class Jack extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","locks","jacks"]; }

	constructor(homes, {x,y,home}) {
		super(x,y);

		this.home = homes[home];
		this.home.addjack(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			home: this.home.home_id
		}
	}
}