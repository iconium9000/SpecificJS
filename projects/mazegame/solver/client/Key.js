module.exports = MazeGameSolver => class Key extends MazeGameSolver.Item {

	static get searchmask() { return ["rooms","locks","keys"]; }

	constructor(id, homes, { x,y, homeid }) {
		super(id,x,y);

		this.home = homes[homeid];
		this.home.addkey(this);
	}

	get object() {
		return {
			x: this.x,
			y: this.y,
			homeid: this.home.id
		}
	}
}