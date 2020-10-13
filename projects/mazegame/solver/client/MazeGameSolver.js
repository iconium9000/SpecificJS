const {log} = console

function MazeGameSolver() {

	const socket = io("/mazegame_solver");
	const {Lib,Level} = MazeGameSolver;
	let levels = {};
	let selected_level = null;
	let selected_item = null;
	let previous_mouse = { offsetX:0, offsetY:0 };
	let moved_mouse = false;

	let mode = MazeGameSolver.Room;
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
			const level = new Level(level_objects[levelname]);

			levels[levelname] = level;

			if (level.selected) {
				selected_level = level;
				delete level.selected;
			}
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

				if (selected_level) selected_level.selected = true;
				for (const levelname in levels) {
					level_objects[levelname] = levels[levelname].object;
				}
				if (selected_level) delete selected_level.selected;

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

		let newmode = MazeGameSolver[modemap[e.key]];
		if (newmode && newmode != mode) {
			mode = newmode;
			log("Set mode as", mode.name);
		}


		Tick();
	};


	function search(e, group) {

		const {searchmask} = mode;

		let mindist = Infinity;
		let minitem = null;

		for (const i in searchmask) {

			const group = selected_level[searchmask[i]];
			for (const id in group) {
			
				const dist = group[id].find(e);
				if (dist < mindist) {
					mindist = dist;
					minitem = group[id];
				}
			}
		}

		if (mindist < 1) {
			selected_item = minitem;
		}
	}
	
	$(document).mousedown(e => {
		if (selected_level == null) return;

		moved_mouse = false;
		previous_mouse = e;
	});

	$(document).mousemove(e => {
		if (selected_level == null) return;

		const x = e.offsetX - previous_mouse.offsetX;
		const y = e.offsetY - previous_mouse.offsetY;
		
		moved_mouse = true;
		previous_mouse = e;
	});

	$(document).mouseup(e => {
		if (selected_level == null) return;

		if (moved_mouse == false) {
			mode.mouseup(e.offsetX, e.offsetY, selected_level, selected_item);
		}

		previous_mouse = e;
	});

	function Tick() {

		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d') // CanvasRenderingContext2D;
		canvas.width = window.innerWidth - 20;
		canvas.height = window.innerHeight - 20;
		window.requestAnimationFrame(Tick);

		if (selected_level) selected_level.draw(ctx);
	}

}