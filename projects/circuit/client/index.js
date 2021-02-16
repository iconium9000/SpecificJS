const module = {
	set exports(
		get_constructor, // (Function{Function.name}) => Function
	) {
		const constructor = get_constructor(Circuit);
		Circuit[constructor.name] = constructor;
	}
};

function Circuit() {

	const {log} = console;

	let eID = 0;
	const allfunes = {};
	const allentities = {};

	class Entity {
		constructor() {
			this.id = ++eID;
			allentities[this.id] = this;
		}
		remove() {
			delete allentities[this.id];
		}
	}
	
	class Fune extends Entity {
		constructor() {
			super();
			this.subfunes = {};
			this.subfunes_ofme = {};
			this.virfunes_ofme = {};

			this.nodes = {};
			this.ports = {};
			this.wires = {};

			allfunes[this.id] = this;
			this.virfune = new VirFune(this,null,null);
		}
		remove() {
			for (const id in this.ports)
				this.ports[id].remove();
			for (const id in this.subfunes)
				this.subfunes[id].remove();
			for (const id in this.subfunes_ofme)
				this.subfunes_ofme[id].remove();
			for (const id in this.virfunes_ofme)
				this.virfunes_ofme[id].remove();
			delete allfunes[this.id];
			super.remove();
		}
	}

	class SubFune extends Entity {
		constructor(parent_fune,src_fune) {
			super();
			this.virfunes_ofme = {};
			this.subports = {};

			src_fune.subfunes_ofme[this.id] = this;
			this.src_fune = src_fune;

			parent_fune.subfunes[this.id] = this;
			this.parent_fune = parent_fune;

			for (const id in parent_fune.ports)
				new SubPort(parent_fune.ports[id], parent_fune);
			for (const id in parent_fune.virfunes_ofme)
				new VirFune(src_fune, parent_fune.virfunes_ofme[id], this);
			
			this.virfune = parent_fune.virfune.subfunes[this.id];
		}
		remove() {
			for (const id in this.subports)
				this.subports[id].remove();
			for (const id in this.virfunes_ofme)
				this.virfunes_ofme[id].remove();

			delete this.src_fune.subfunes_ofme[this.id];
			delete this.parent_fune.subfunes[this.id];
			super.remove();
		}
	}

	class VirFune extends Entity {
		constructor(src_fune,parent_virfune,parent_subfune) {
			super();
			this.subfunes = {}; // virfunes
			this.ports = {}; // virports

			this.src_fune = src_fune;
			this.parent_virfune = parent_virfune;
			this.parent_subfune = parent_subfune;

			src_fune.virfunes_ofme[this.id] = this;
			if (parent_virfune) {
				parent_virfune.subfunes[parent_subfune.id] = this;
				parent_subfune.virfunes_ofme[this.id] = this;
			}

			for (const id in src_fune.ports)
				new VirPort(src_fune.ports[id], this);
			for (const id in src_fune.subfunes) {
				const subfune = src_fune.subfunes[id];
				new VirFune(subfune.src_fune, this, subfune);
			}
		}
		remove() {
			for (const id in this.ports)
				this.ports[id].remove();
			for (const id in this.subfunes)
				this.subfunes[id].remove();

			delete this.src_fune.virfunes_ofme[this.id];
			super.remove();

			if (this.parent_virfune) {
				delete this.parent_virfune.subfunes[this.parent_subfune.id];
				delete this.parent_subfune.virfunes_ofme[this.id];
			}
		}
	}

	class Line extends Entity {
		constructor(parent_fune) {
			super();
			parent_fune.lines[this.id]
			this.nodes = {};
			this.parent_fune = parent_fune;
		}
		remove() {
			for (const id in this.nodes)
				this.nodes[id].line = null;
			delete this.parent_fune.lines[this.id];
			this.parent_fune = null;
			super.remove();
		}
		spread(node) {
			if (node.line == this) return;
			if (node.line != null) node.line.remove();
			node.line = this;
			this.nodes[node.id] = node;
			for (const id in node.wires) {
				const wire = node.wires[id];
				if (wire.line == this) continue;
				wire.line = this;
				this.spread(wire.nodea == this ? wire.nodeb : wire.nodea);
			}
		}
	}

	class Node extends Entity {
		constructor(x,y,parent_fune) {
			super();
			this.x = x;
			this.y = y;
			this.wires = {};
			this.line = null;
			new Line(parent_fune).spread(this);

			parent_fune.nodes[this.id] = this;
			this.parent_fune = parent_fune;
		}
		remove() {
			for (const id in this.wires)
				this.wires[id].remove();
			this.line.remove();
			super.remove();
		}
	}

	class Wire extends Entity {
		constructor(nodea,nodeb,parent_fune) {
			super();
			this.parent_fune = parent_fune;
			this.nodea = nodea;
			this.nodeb = nodeb;

			parent_fune.wires[this.id] = this;
			nodea.wires[nodeb.id] = this;
			nodeb.wires[nodea.id] = this;

			this.line = nodea.line;
			this.line.spread(nodeb);
		}
		remove() {
			delete this.parent_fune.wires[this.id];
			delete this.nodea.wires[this.nodeb.id];
			delete this.nodeb.wires[this.nodea.id];
			const newline = new Line(this.parent_fune);
			newline.spread(this.nodea);
			if (this.nodeb.line != newline)
				new Line(this.parent_fune).spread(this.nodeb);
			super.remove();
		}
	}

	class Port extends Node {
		constructor(x,y,parent_fune) {
			super(x,y,parent_fune);
			this.virports_ofme = {};
			this.subports_ofme = {};

			parent_fune.ports[this.id] = this;

			for (const id in parent_fune.virfunes_ofme)
				new VirPort(this, parent_fune.virfunes_ofme[id]);
			for (const id in parent_fune.subfunes_ofme)
				new SubPort(this, parent_fune.subfunes_ofme[id]);
			this.virport = parent_fune.virfune.ports[this.id];
		}
		remove() {
			for (const id in this.virports_ofme)
				this.virports_ofme[id].remove();
			for (const id in this.subports_ofme)
				this.subports_ofme[id].remove();
			delete this.parent_fune.ports[this.id];
			super.remove();
		}
	}
	class SubPort extends Node {
		constructor(port, parent_subfune) {
			super(port.x,port.y,parent_subfune.parent_fune);
			this.port = port;
			this.parent_subfune = parent_subfune;
			parent_subfune.subports[port.id] = this;
			port.subports_ofme[this.id] = this;
			this.virports = parent_subfune.virfune.subports[this.id];
		}
		remove() {
			delete this.parent_subfune.subports[this.port.id];
			delete this.port.subports_ofme[this.id];
			super.remove();
		}
	}
	class VirPort extends Entity {
		constructor(port, parent_virfune) {
			this.port = port;
			this.parent_virfune = parent_virfune;

			parent_virfune.ports[port.id] = this;
			port.virports_ofme[this.id] = this;
		}
		remove() {
			delete this.parent_virfune.ports[this.port.id];
			delete this.port.virports_ofme[this.id];
			super.remove();
		}
	}

	document.onkeyup = e => {

	};

	document.onkeydown = e => {

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
	$(document).mousedown(e => {
		log(e);
	});


	tick();
	function tick() {

		const canvas = document.getElementById('canvas');
		const ctx = canvas.getContext('2d');
		canvas.width = window.innerWidth - 20;
		canvas.height = window.innerHeight - 22;

		ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(200, 200, 100, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();
		
		window.requestAnimationFrame(tick);
	}

}