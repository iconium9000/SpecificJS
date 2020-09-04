module.exports = (project) => {

	const {log} = console;
	const filename = __dirname + "/levels.json";
	log("MazeGame Solver: server.js");

	const fs = require('fs')

	project.socket.on("connection", socket => {

		socket.on("request levels",() => {
			const level_objects = JSON.parse(fs.readFileSync(filename).toString('utf8'));
			socket.emit("send levels", level_objects);
		});

		socket.on("send levels", level_objects => {
			fs.writeFileSync(filename, JSON.stringify(level_objects, null, " "));
		});

	});

}