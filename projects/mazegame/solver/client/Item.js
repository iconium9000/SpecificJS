module.exports = MazeGameSolver => class Item {

	get radius() { return 10; }

	find(e) {

		const x = this.x - e.offsetX;
		const y = this.y - e.offsetY;

		return Math.sqrt(x*x + y*y) / this.radius;
	}

	constructor(id,x,y) {

		this.id = id;
		this.x = x;
		this.y = y;
	}


}