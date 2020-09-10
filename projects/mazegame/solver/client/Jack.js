module.exports = MazeGameSolver => class Jack extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","locks","jacks"]; }

	constructor(id, homes, { x,y, homeid }) {
		super(id,x,y);

		this.home = homes[homeid];
		this.home.addjack(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			homeid: this.home.id
		}
	}
}