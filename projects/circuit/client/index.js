const module = {
	set exports(
		get_constructor, // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Circuit)
		Circuit[constructor.name] = constructor
	}
}

function Circuit() {

	const {log} = console;

	document.onkeyup = e => {

	};


	// on mouse movement
	$(document).mousemove(e => {
		// log(e);
	});

	// on mouse up
	$(document).mouseup(e => {
		log(e);
	});

	// on mouse up
	$(document).linkon(e => {
		log(e);
	});


	tick();
	function tick() {

		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth - 20;
		canvas.height = window.innerHeight - 22;


		
		window.requestAnimationFrame(tick);
	}

}