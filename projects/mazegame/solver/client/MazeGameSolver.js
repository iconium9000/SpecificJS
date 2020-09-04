const {log} = console
const module = {
	set exports(
		get_constructor // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(MazeGameSolver)
		MazeGameSolver[constructor.name] = constructor
	}
}

function MazeGameSolver() {

	const socket = io("/mazegame_solver");
	const {Lib,Level} = MazeGameSolver;
	let levels = {};
	let selected_level = null;

	let mode = "Room";
	const modemap = {
		'r': "Room",
		'd': "Door",
		'p': "Portal",
		'l': "Lock",
		
		'k': "Key",
		'm': "Mass",
		'j': "Jack"
	};

	let client_name = Lib.get_cookie("name");
	while (!client_name || client_name == "null") {
		client_name = prompt("choose a name:", client_name);
	}
	Lib.set_cookie("name", client_name, 2);

	socket.on("connect", () => {

		socket.emit("client name", {name: client_name});
		socket.emit("request levels");

		log(client_name, "connect to server");
	});

	socket.on("send levels", level_objects => {
		levels = {};

		for (const levelname in level_objects) {
			levels[levelname] = new Level(level_objects[levelname]);
		}

		log("Received levels", levels);
	});

	log("Press E to reload levels");
	log("Press W to save levels");
	log("Press Q to load a level");

	document.onkeydown = e => {

		switch (e.key) {
			
			case 'e': {

				socket.emit("request levels");

				log("request levels");

				return;
			};

			case 'w': {

				const level_objects = {};

				for (const levelname in levels) {
					level_objects[levelname] = levels[levelname].object;
				}

				socket.emit("send levels", level_objects);
				log("Sent levels:", Object.keys(level_objects));

				return;
			};

			case 'q': {

				let levelname = selected_level ? selected_level.name : "new level";
				levelname = prompt("Select Level", levelname);

				selected_level = levels[levelname];
				if (!selected_level) {
					log("Created new level");
					selected_level = levels[levelname] = new Level({ name:levelname });
				}

				log("Selected Level:", selected_level);

				return;
			};
		
		}

		let newmode = modemap[e.key];
		if (newmode && newmode != mode) {
			mode = newmode;
			log("Set mode as", mode);
		}

	};

	$(document).mousemove(e => {
		// e.offsetX,e.offsetY
		
		
	});

	$(document).mousedown(e => {
		// e.offsetX,e.offsetY

		
	});

	$(document).mouseup(e => {
		// e.offsetX,e.offsetY


	});

}