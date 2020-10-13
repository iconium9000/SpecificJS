module.exports = MazeGameSolver => class Item {

	static mouseup(x,y,level,item) {
		console.log("Item mouseup",level,item);
	}

	draw(ctx) {}

	get radius() { return 10; }

	find(e) {

		const x = this.x - e.offsetX;
		const y = this.y - e.offsetY;

		return Math.sqrt(x*x + y*y) / this.radius;
	}

	constructor(x,y) {

		this.x = x;
		this.y = y;
	}

	get object() {
		return { x:this.x, y:this.y };
	}


}