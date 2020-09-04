module.exports = MazeGameSolver => class Jack {

	constructor(id, homes, { x,y, homeid }) {
		this.id = id;
		this.x = x;
		this.y = y;

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