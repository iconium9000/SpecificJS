//------------------------------------------------------------
// Copyright (c) 2016 John J FitzGerald
// No authorized copying or modification.
//------------------------------------------------------------
var devMode = false
//------------------------------------------------------------
// POINT.JS
//------------------------------------------------------------
function notEqualOrZero(a, b) {
	return a != b && a != 0 && b != 0
}

function side(a, b, p) {
	var A = (p.x - b.x) * (a.y - b.y)
	var B = (p.y - b.y) * (a.x - b.x)
	if (A == B)
		return 0
	else
		return A > B ? 1 : -1
}
var Point = function() {
	x = 0
	y = 0
	return this
}
Point.prototype.set = function(x, y) {
	this.x = x
	this.y = y
	return this
}
Point.prototype.setAngle = function(a) {
	this.x = Math.cos(a)
	this.y = Math.sin(a)
	return this
}
Point.prototype.copy = function(p) {
	this.x = p.x
	this.y = p.y
	return this
}
Point.prototype.sum = function(p) {
	this.x += p.x
	this.y += p.y
	return this
}
Point.prototype.sub = function(p) {
	this.x -= p.x
	this.y -= p.y
	return this
}
Point.prototype.scale = function(f) {
	this.x *= f
	this.y *= f
	return this
}
Point.prototype.factor = function(f) {
	this.x /= f
	this.y /= f
	return this
}
Point.prototype.unit = function(f) {
	var l = (f == null ? 1 : f) / this.length()
	this.x *= l
	this.y *= l
	return this
}
Point.prototype.length = function() {
	var nx = this.x
	var ny = this.y
	return Math.sqrt(nx * nx + ny * ny)
}
Point.prototype.equals = function(p) {
	return this.x == p.x && this.y == p.y
}
Point.prototype.inverse = function() {
	var temp = this.x
	this.x = this.y
	this.y = -temp
	return this
}
Point.prototype.dist = function(p) {
	var nx = p.x - this.x
	var ny = p.y - this.y
	return Math.sqrt(nx * nx + ny * ny)
}
Point.prototype.print = function() {
	console.log(x + ", " + y)
}
freePoint = new Point
freeAPoint = new Point
freeBPoint = new Point
Point.prototype.free = function() {
	return freePoint.copy(this)
}
Point.prototype.freeA = function() {
	return freeAPoint.copy(this)
}
Point.prototype.freeB = function() {
	return freeBPoint.copy(this)
}
Point.prototype.drawCircle = function(g, r) {
	g.beginPath()
	g.arc(this.x, this.y, r, 0, Math.PI * 2, true)
	g.closePath()
	g.stroke()
}
Point.prototype.fillCircle = function(g, r) {
	g.beginPath()
	g.arc(this.x, this.y, r, 0, Math.PI * 2, true)
	g.closePath()
	g.fill()
}
Point.prototype.drawSquare = function(g, r) {
	g.beginPath()
	g.rect(this.x - r, this.y - r, 2 * r, 2 * r)
	g.closePath()
	g.stroke()
}
Point.prototype.fillSquare = function(g, r) {
	g.beginPath()
	g.rect(this.x - r, this.y - r, 2 * r, 2 * r)
	g.closePath()
	g.fill()
}
Point.prototype.drawLine = function(g, p) {
	g.beginPath()
	g.moveTo(this.x, this.y)
	g.lineTo(p.x, p.y)
	g.stroke()
}
//------------------------------------------------------------
// LINE.JS
//------------------------------------------------------------
var Line = function(pa, pb) {
	this.a = pa
	this.b = pb
	this.v = new Point().copy(pb).sub(pa)
}
Line.prototype.length = function() {
	return this.a.dist(this.b)
}
Line.prototype.draw = function(g) {
	g.beginPath()
	g.moveTo(this.a.x, this.a.y)
	g.lineTo(this.b.x, this.b.y)
	g.stroke()
}
Line.prototype.lineCross = function(la, lb) {
	var a = this.a
	var b = this.b
	return notEqualOrZero(side(a, b, la), side(a, b, lb)) && notEqualOrZero(side(la, lb, a), side(la, lb, b))
}
Line.prototype.dist = function(p) {
	var a = this.a
	var b = this.b
	var v = this.v
	var adist = p.dist(a)
	var bdist = p.dist(this.b)
	var dist = this.a.dist(this.b)
	if (adist > dist) {
		return bdist
	} else if (bdist > dist) {
		return adist
	} else {
		v.copy(b).sub(a).inverse().unit()
		return Math.abs(v.dot(p) - v.dot(a))
	}
}
//------------------------------------------------------------
// LIST.JS
//------------------------------------------------------------
var ListNode = function(l, v) {
	this.list = l
	this.val = v
	this.prev = l.tail
	this.next = null
}
ListNode.prototype.kill = function() {
	if (this.prev == null) {
		this.list.head = this.next
	} else {
		this.prev.next = this.next
	}
	if (this.next == null) {
		this.list.tail = this.prev
	} else {
		this.next.prev = this.prev
	}
}
var List = function() {
	this.head = null
	this.tail = null
}
List.prototype.isEmpty = function() {
	return this.head == null
}
List.prototype.clear = function() {
	this.head = this.tail = null
}
List.prototype.contains = function(v) {
	for (var n = this.head; n; n = n.next)
		if (n.val == v) {
			return true
		}
	return false
}
List.prototype.add = function(v) {
	if (this.head == null) {
		this.head = this.tail = new ListNode(this, v)
	} else {
		this.tail = this.tail.next = new ListNode(this, v)
	}
	return this
}
List.prototype.remove = function(v) {
	for (var n = this.head; n; n = n.next)
		if (n.val == v) {
			return n.kill()
		}
	return null
}
List.prototype.addAll = function() {
	for (var i = 0; i < arguments.length; ++i) {
		this.add(arguments[i])
	}
	return this
}
List.prototype.addArray = function(a) {
	for (var i = 0; i < a.length; ++i) {
		this.add(a[i])
	}
	return this
}
List.prototype.addList = function(l) {
	for (var n = l.head; n; n = n.next) {
		this.add(n.val)
	}
	return this
}
List.prototype.foreach = function(f) {
	for (var n = this.head; n; n = n.next) {
		f(n.val)
	}
	return this
}
List.prototype.foreach2 = function(f) {
	for (var a = this.head; a; a = a.next) {
		for (var b = a.next; b; b = b.next) {
			f(a.val, b.val)
		}
	}
	return this
}
List.prototype.sortif = function(f) {
	for (var a = this.head; a; a = a.next) {
		for (var b = a.next; b; b = b.next) {
			if (f(a.val, b.val)) {
				var v = a.val
				a.val = b.val
				b.val = v
			}
		}
	}
	return this
}
List.prototype.findif = function(f) {
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			return true
		}
	}
	return false
}
List.prototype.returnif = function(f) {
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			return n.val
		}
	}
	return null
}
List.prototype.returnallif = function(f) {
	var list = new List
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			list.add(n.val)
		}
	}
	return list
}
List.prototype.removeif = function(f) {
	var a = []
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			a.push(n.kill())
		}
	}
	return a
}
List.prototype.alltrue = function(f) {
	for (var n = this.head; n; n = n.next) {
		if (!f(n.val)) {
			return false
		}
	}
	return true
}
List.prototype.allfalse = function(f) {
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			return false
		}
	}
	return true
}
List.prototype.countif = function(f) {
	var i = 0
	for (var n = this.head; n; n = n.next) {
		if (f(n.val)) {
			i++
		}
	}
	return i
}
List.prototype.size = function() {
	var i = 0
	for (var n = this.head; n; n = n.next) {
		i++
	}
	return i
}
//------------------------------------------------------------
// STRINGIO.JS
//------------------------------------------------------------
var StringIO = function(a) {
	this.array = a
	this.index = 0
}
StringIO.prototype.readString = function() {
	var s = this.array[this.index]
	//     console.log("readString " + s)
	this.index++
		return s
}
StringIO.prototype.readInteger = function() {
	var s = this.array[this.index]
	var i = parseInt(s)
	//     console.log("readInteger " + s + " " + i)
	this.index++
		return i
}
StringIO.prototype.readFloat = function() {
	var s = this.array[this.index]
	var i = parseFloat(s)
	//     console.log("readFloat " + s + " " + i)
	this.index++
		return i
}
StringIO.prototype.readBoolean = function() {
	var s = this.array[this.index]
	var i = s == "true"
	//     console.log("readBoolean " + s + " " + i + " ")
	this.index++
		return i
}
StringIO.prototype.readPoint = function() {
	return new Point().set(this.readFloat(), this.readFloat())
}
//------------------------------------------------------------
// NODE.JS
//------------------------------------------------------------
var Node = function(p) {
	this.point = p
	this.links = new List
	this.targets = new List
	this.gate = null
}

function drawNode(n) {
	if (n.gate == null || n.links.allfalse(function(l) {
			return l.gate == null
		})) {
		return
	}
	var g = Game.g
	var r = Game.lvl.val.radius / Game.wallWidthFactor
	g.fillStyle = n.gate.isOpen() ? n.gate.color : Game.closedColor
	n.point.fillCircle(g, r)
}
//------------------------------------------------------------
// GATE.JS
//------------------------------------------------------------
var Gate = function(m) {
	this.master = m
	this.color = m ? Game.portalColor : Game.doorColor
	this.targets = new List
}
Gate.prototype.isOpen = function() {
	if (this.targets.alltrue(isActive)) {
		return this.master == null || this.master.countif(isPortalActive) == 2
	} else {
		return
	}
}
//------------------------------------------------------------
// LINK.JS
//------------------------------------------------------------
var Link = function(l, a, b, d) {
	this.line = new Line(a.point, b.point)
	this.nodes = new List().addAll(a, b)
	this.isLaser = d && l
	this.a = a
	this.b = b
	a.links.add(this)
	b.links.add(this)
	if (d) {
		this.resetGate()
	}
}

function drawLink(l) {
	var g = Game.g
	var r = Game.lvl.val.radius
	if (l.gate == null) {
		g.strokeStyle = Game.wallColor
		g.lineWidth = r / Game.wallWidthFactor
		g.setLineDash([])
	} else {
		if (l.isLaser) {
			g.strokeStyle = l.gate.isOpen() ? l.gate.color : Game.closedColor
			g.setLineDash([1, 4 * r / Game.doorWidthFactor])
		} else if (l.isOpen()) {
			g.strokeStyle = Game.doorColor
			g.setLineDash([r / Game.wallWidthFactor])
		} else {
			g.strokeStyle = Game.closedColor
			g.setLineDash([])
		}
		g.lineWidth = r / Game.doorWidthFactor
	}
	l.line.draw(g)
}
Link.prototype.isOpen = function() {
	return this.gate && this.gate.isOpen()
}
Link.prototype.checkGate = function() {
	if (this.gate == null)
		return
	var link = this
	var mn = this.nodes.returnif(function(n) {
		return n.gate != null && n.gate.master != null
	})
	if (mn) {
		this.gate = mn.gate;
	}
	link.nodes.foreach(function(n) {
		if (n.gate == link.gate)
			return
		n.gate = link.gate
		n.targets.foreach(function(t) {
			if (t.handle) {
				t.handle.gate = link.gate
			} else if (t.portal) {
				t.portal.gate = link.gate
			}
			link.gate.targets.add(t)
		})
		n.links.foreach(function(l) {
			if (l.gate && l.gate != link.gate) {
				l.setGate(link.gate)
			}
		})
	})
}
Link.prototype.setGate = function(g) {
	this.gate = g
	this.checkGate()
}
Link.prototype.resetGate = function() {
	var na = this.a.gate
	var nb = this.b.gate
	if (na == null) {
		this.gate = nb == null ? new Gate() : nb;
	} else if (nb == null) {
		this.gate = na;
	} else if (nb.master == null) {
		this.gate = na;
	} else {
		this.gate = nb;
	}
	this.checkGate()
}
//------------------------------------------------------------
// PORTAL.JS
//------------------------------------------------------------
var Portal = function(lvl) {
	this.gate = new Gate(lvl.portals)
	//     this.turn = Math.random() * Math.PI
	this.nodes = new List
}
Portal.prototype.addNode = function(n, tar) {
	if (this.nodes.contains(n)) {
		return
	}
	var gate = this.gate
	n.targets.foreach(function(t) {
		if (t.handle) {
			t.handle.gate = gate
		} else if (t.portal) {
			t.portal.gate = gate
		}
	})
	n.targets.add(tar)
	this.nodes.add(n)
	n.gate = gate
	n.links.foreach(function(l) {
		l.checkGate()
	})
}

function drawPortal(t) {
	var p = t.portal
	if (p == null)
		return
	var r = Game.lvl.val.radius
	var g = Game.g
	g.fillStyle = Game.backGroundColor
	g.strokeStyle = p.gate.isOpen() ? Game.portalColor : Game.closedColor
	g.lineWidth = r / Game.doorWidthFactor
	g.setLineDash([1, 4 * r / Game.doorWidthFactor])

	p.nodes.foreach(function(n) {
		n.point.drawLine(Game.g, t.point)
	})
	g.setLineDash([3 * r / Game.doorWidthFactor, 2 * r / Game.doorWidthFactor])
	var r = t.level.radius * Math.abs(Math.cos(p.turn))
	t.point.fillCircle(g, r)
	t.point.drawCircle(g, r)
	p.turn += window.elapsed * Game.pulseSpeed
	p.turn %= Math.PI * 2
}
//------------------------------------------------------------
// PLAYER.JS
//------------------------------------------------------------
var Player = function(lvl, tar) {
	this.level = lvl
	tar.playerHome = this
	this.turn = 0
	this.home = tar
}

function drawPlayer(tar) {
	var player = tar.player
	if (player == null || player.index == Game.drawIndex) {
		return
	}
	player.index = Game.drawIndex
	var g = Game.g
	var path = tar.level.path
	var r = tar.level.radius
	if (tar == Game.lvl.val.sel) {
		player.turn += window.elapsed * Game.turnSpeed
		player.turn %= Math.PI * 2
		g.strokeStyle = 'orange'
	} else {
		g.strokeStyle = Game.wallColor
	}
	g.lineWidth = r / Game.doorWidthFactor
	g.setLineDash([])
	freePoint.setAngle(2 * player.turn * Math.PI).scale(r)
	tar.point.freeA().sum(freePoint)
	tar.point.freeB().sub(freePoint)
	freeAPoint.drawLine(g, freeBPoint)
	freePoint.inverse()
	tar.point.freeA().sum(freePoint)
	tar.point.freeB().sub(freePoint)
	freeAPoint.drawLine(g, freeBPoint)
}
//------------------------------------------------------------
// KEY.JS
//------------------------------------------------------------
var Key = function(tar, is) {
	this.isSquare = is
	tar.keyHome = this
	this.home = tar
}

function drawKey(t) {
	var key = t.key
	if (key == null) {
		return
	}
	var g = Game.g
	var r = t.level.radius
	g.lineWidth = r / Game.doorWidthFactor
	g.setLineDash([])
	g.strokeStyle = Game.wallColor
	if (key.isSquare) {
		t.point.drawSquare(g, r / Game.keyRadiusFactor)
	} else {
		t.point.drawCircle(g, r / Game.keyRadiusFactor)
	}
}
//------------------------------------------------------------
// HANDLE.JS
//------------------------------------------------------------
var Handle = function(node, han, is) {
	this.gate = node.gate
	node.targets.add(han)
	this.node = node
	this.gate.targets.add(han)
	this.isSquare = is
}

function deleteHandle(t) {}

function drawHandle(t) {
	var h = t.handle
	if (h == null) {
		return
	}
	var g = Game.g
	var r = Game.lvl.val.radius
	g.strokeStyle = g.fillStyle = h.gate.isOpen() ? h.gate.color : Game.closedColor
	g.fillStyle = Game.backGroundColor
	g.lineWidth = r / Game.doorWidthFactor
	g.setLineDash([1, 4 * r / Game.doorWidthFactor])
	t.point.drawLine(g, h.node.point)
	g.setLineDash([])
	r /= Game.handleRadiusFactor
	if (h.isSquare) {
		t.point.fillSquare(g, r)
		t.point.drawSquare(g, r)
	} else {
		t.point.fillCircle(g, r)
		t.point.drawCircle(g, r)
	}
}
//------------------------------------------------------------
// TARGET.JS
//------------------------------------------------------------
var Target = function(lvlOrTar, p) {
	this.handle = null
	this.portal = null
	this.player = null
	this.key = null
	this.playerHome = null
	this.keyHome = null
	this.point = p
	this.level = lvlOrTar
}

function isActive(t) {
	var h = t.handle
	var p = t.player
	var k = t.key
	return h && (p || k) && (!k || k.isSquare == h.isSquare)
}

function isPortalActive(t) {
	return t.portal && t.portal.gate.targets.alltrue(isActive)
}
Target.prototype.linkCross = function(b) {
	if (a == b) {
		return new List
	}
	var a = this
	var pa = a.point
	var pb = b.point
	var lvl = a.level
	return lvl.links.returnallif(function(l) {
		if (l.isLaser) {
			return false
		} else if (!l.line.lineCross(pa, pb)) {
			return false
		} else if (l.gate == null || !l.gate.isOpen()) {
			return true
		} else if (a.handle == null) {
			return false
		} else if (a.handle.gate == l.gate) {
			if (a.key == null) {
				return true
			} else if (Game.releaseKey) {
				return false
			} else {
				return true
			}
		} else {
			return false
		}
	})
}
Target.prototype.isValidPortal = function() {
	return this.portal && this.portal.gate.isOpen()
}
Target.prototype.isEmpty = function() {
	return this.handle == null && this.portal == null && this.key == null && this.player == null
}
Target.prototype.movePlayerFrom = function(target) {
	if (this.player) {
		return false
	}
	var wasEmpty = this.isEmpty()
	this.player = target.player
	target.player = null
	this.level.sel = this
	if (this.key == null && !Game.releaseKey) {
		this.key = target.key
		target.key = null
	}
	if (target.isEmpty())
		target.level.targets.remove(target)
	if (wasEmpty && !this.isEmpty())
		this.level.targets.add(this)
	return true
}
Target.prototype.drag = function(a, b) {
	this.sum(a).sub(b)
	if (portal)
		portal.forEach(function(t) {
			t.drag(a, b)
		})
	if (handle)
		handle.update(this)
}
//------------------------------------------------------------
// PATH.JS (start, transport, end, isValid, isPortal)
//------------------------------------------------------------
var Path = function(start, end) {
	this.start = start
	this.end = end
	this.next = null
	this.isPortal = start.isValidPortal() && end.isValidPortal()
	this.transport = null
}
Path.prototype.startPath = function() {
	var lvl = this.start.level
	var p = new Point().copy(this.start.point)
	this.links = this.start.linkCross(this.end)
	if (!this.links.isEmpty()) {
		var startPortal = lvl.getNearestActivePortal(this.start)
		var endPortal = lvl.getNearestActivePortal(this.end)
		if (startPortal && endPortal) {
			this.isPortal = startPortal == this.start
			if (endPortal != this.end) {
				this.next = this.end
			}
			this.end = this.isPortal ? endPortal : startPortal
			this.links.clear()
		}
	}
	if (this.end == null || this.end.player) {
		return
	} else if (this.start.key && this.end.key) {
		Game.releaseKey = true
	}
	this.transport = new Target(lvl, p)
	this.transport.movePlayerFrom(this.start)
	this.dist = this.start.point.dist(this.end.point)
	this.startTime = Game.now
}
Path.prototype.draw = function(g) {
	g.strokeStyle = Game.wallColor
	g.setLineDash([10])
	g.lineWidth = 4
	var lvl = Game.lvl.val
	if (this.transport) {
		drawKey(this.transport)
		drawPlayer(this.transport)
		var trav = this.transport.point.dist(this.start.point)
		var d = Game.playerSpeed * window.elapsed * this.dist
		if (trav + d > this.dist) {
			var onNode = lvl.getNearestNode(this.end.point).point.dist(this.end.point) < lvl.radius / Game.nodeRadiusFactor
			if (!this.links.isEmpty() || (this.transport.key && this.end.key) || onNode) {
				var temp = this.end
				this.end = this.start
				this.start = temp
				this.next = null
				this.links.clear()
				return
			}
			var key = this.transport.key
			var han = this.end.handle
			this.end.movePlayerFrom(this.transport)
			Game.releaseKey = han && key && han.isSquare == key.isSquare
			if (!this.isPortal && this.end.isValidPortal()) {
				var po = this.end.level.getOtherPortal(this.end)
				if (po.player) {
					this.transport = null
					return
				}
				this.start = this.end
				this.end = po
				this.isPortal = true
				this.startPath()
			} else if (this.next && this.end.isValidPortal()) {
				this.start = this.end
				this.end = this.next
				this.isPortal = false
				this.next = null
				this.startPath()
			} else {
				this.transport = null
			}
		} else {
			var a = this.transport.point
			var b = freePoint.copy(a).sum(this.end.point.freeA().sub(this.start.point).unit(d))
			if (this.links.findif(function(l) {
					return !l.isOpen() && l.line.lineCross(a, b)
				})) {
				var temp = this.end
				this.end = this.start
				this.start = temp
				this.dist = this.end.point.dist(this.start.point)
				this.links.clear()
				this.next = null
				if (a.dist(this.start.point) == 0.0)
					a.copy(b)
			} else {
				a.copy(b)
			}
		}
	} else if (this.isValid) {}
}
//------------------------------------------------------------
// LEVEL.JS
//------------------------------------------------------------
var Level = function(n, s, i) {
	this.name = n
	this.score = 0
	this.defScore = s
	this.index = i
	this.radius = 28
	this.nodes = new List
	this.links = new List
	this.portals = new List
	this.targets = new List
	this.homes = new List
	this.path = null
	this.sel = null
	this.isUnlocked = false
	this.minPoint = new Point().set(1e10, 1e10)
	this.maxPoint = new Point().set(0, 0)
}
Level.prototype.setMinMax = function(p) {
	var min = this.minPoint
	var max = this.maxPoint
	if (p.x < min.x) {
		min.x = p.x
	}
	if (p.x > max.x) {
		max.x = p.x
	}
	if (p.y < min.y) {
		min.y = p.y
	}
	if (p.y > max.y) {
		max.y = p.y
	}
}
Level.prototype.draw = function() {
	var g = Game.g
	Game.drawIndex++
		this.targets.foreach(drawHandle)
	this.targets.foreach(drawPortal)
	this.targets.foreach(drawKey)
	this.targets.foreach(drawPlayer)
	if (this.path)
		this.path.draw(Game.g)
	if (this.sel && this.sel.key && !Game.releaseKey) {
		g.fillStyle = Game.backGroundColor
		if (this.sel.key.isSquare) {
			this.sel.point.fillSquare(g, this.radius / Game.nodeRadiusFactor)
		} else {
			this.sel.point.fillCircle(g, this.radius / Game.nodeRadiusFactor)
		}
	}
	this.links.foreach(drawLink)
	this.nodes.foreach(drawNode)
	var n = this.finalNode
	var p = this.finalPoint
	g.strokeStyle = n.gate.isOpen() ? n.gate.master ? Game.portalColor : Game.doorColor : Game.closedColor
	g.lineWidth = this.radius / Game.doorWidthFactor
	g.setLineDash([])
	n = n.point
	p.drawLine(g, n)
	var fa = p.freeA().sub(n).unit(this.radius / Game.handleRadiusFactor)
	var fb = fa.freeB().inverse()
	p.free().sub(fa).sum(fb).drawLine(g, p)
	p.free().sub(fa).sub(fb).drawLine(g, p)
}
Level.prototype.resize = function(w, h) {
	var lvl = this
	var min = this.minPoint
	var max = this.maxPoint
	var pad = this.pad
	var x = w / 20
	var y = h / 8
	w -= x
	h -= y
	var index = Game.levelResetIndex++
		var swap = (w - x > h - y) != (max.x - min.x > max.y - min.y)
	var scale = function(n) {
		if (n == null || n.index == index)
			return
		var p = n.point
		n.index = index
		p.x = (p.x - min.x) / (max.x - min.x)
		p.y = (p.y - min.y) / (max.y - min.y)
		if (swap) {
			var u = p.x
			p.x = p.y
			p.y = u
		}
		p.x = p.x * (w - x) + x
		p.y = p.y * (h - y) + y
	}
	this.nodes.foreach(scale)
	this.targets.foreach(scale)
	this.homes.foreach(scale)
	scale({
		point: this.finalPoint
	})
	if (this.path) {
		scale(this.path.transport)
	}
	min.set(x, y)
	max.set(w, h)
	this.radius = Game.radius * this.maxPoint.length() / this.startSize
	var n = this.finalNode.point
	var p = this.finalPoint
	p.sub(n).scale(1.5 * this.radius / p.length()).sum(n)
	this.targets.foreach(function(tar) {
		var han = tar.handle
		if (han || tar.portal) {
			var src
			if (tar.portal && tar.portal.nodes.size() == 1) {
				src = tar.portal.nodes.head.val.point
			} else if (tar.handle) {
				src = tar.handle.node.point
			} else {
				src = lvl.getNearestNode(tar.point)
				if (src) {
					src = src.point
				} else {
					return
				}
			}
			tar.point.sub(src).scale(1.5 * lvl.radius / tar.point.length()).sum(src)
		}
	})
}
Level.prototype.resetLevel = function() {
	if (this.path && this.path.transport) {
		return
	}
	var targets = this.targets
	this.score = 0
	targets.removeif(function(t) {
		if (t.player) {
			if (t.player.home.isEmpty()) {
				targets.add(t.player.home)
			}
			t.player.home.player = t.player
			t.player = t.playerHome
		}
		if (t.key) {
			if (t.key.home.isEmpty()) {
				targets.add(t.key.home)
			}
			t.key.home.key = t.key
			t.key = t.keyHome
		}
		return t.isEmpty()
	})
	this.sel = null
	this.path = null
}
Level.prototype.getOtherPortal = function(t) {
	return this.portals.returnif(function(tar) {
		return tar.portal && tar.portal.gate.isOpen() && t != tar
	})
}
Level.prototype.getNearestActivePortal = function(tar) {
	if (tar.isValidPortal()) {
		return tar
	} else {
		return this.portals.returnif(function(t) {
			return t.portal && t.portal.gate.isOpen() && tar.linkCross(t).isEmpty()
		})
	}
}
Level.prototype.getNodeAt = function(p) {
	var r = this.radius
	return this.nodes.returnif(function(n) {
		return n.point.equals(p)
	})
}
Level.prototype.getNearestNode = function(p) {
	var r = 1e10
	var node = null
	this.nodes.foreach(function(n) {
		var d = n.point.dist(p)
		if (d < r) {
			node = n
			r = d
		}
	})
	return node
}
Level.prototype.getTarget = function(p) {
	var r = this.radius
	return this.targets.returnif(function(n) {
		return n.point.dist(p) < r
	})
}
Level.prototype.setTarget = function(p) {
	if (this.finalPoint.dist(p) < this.radius && Game.lvl.next && (devMode || Game.lvl.val.isUnlocked)) {
		Game.lvl = Game.lvl.next
		return
	}

	++this.score
	var tar = this.getTarget(p)
	if (this.sel == null) {
		if (tar && tar.player) {
			this.sel = tar
		}
		return
	}
	if (this.sel == null) {
		return
	}
	if (this.path && this.path.transport) {
		return
	} else if (tar == null)
		tar = new Target(this, new Point().copy(p))
	else if (tar.player) {
		if (tar == this.sel) {
			Game.releaseKey = !Game.releaseKey
		} else {
			this.sel = tar
			this.path = new Path(tar, tar)
			Game.releaseKey = true
		}
		return
	}
	this.path = new Path(this.sel, tar)
	this.path.startPath()
}
//------------------------------------------------------------
// WINDOW.JS
//------------------------------------------------------------
var Game = {
	wallColor: 'white',
	backGroundColor: 'black',
	doorColor: '#00FF00',
	portalColor: '#FF00FF',
	closedColor: '#FF3311',
	radius: 24,
	padFactor: 2e4,
	wallWidthFactor: 3,
	doorWidthFactor: 7,
	handleRadiusFactor: 3,
	nodeRadiusFactor: 2.5,
	keyRadiusFactor: 2,
	playerSpeed: 0.007,
	pulseSpeed: 0.002,
	turnSpeed: 0.001,
	canvas: null,
	menuBar: 60,
	levelResetIndex: 0,
	drawIndex: 0,
	g: null,
	now: 0,
	src: "mazeGame/mazeGame.txt",
	lastTime: 0,
	releaseKey: false,
	levels: new List,
	lvl: null,
	stringIO: null,
	mouseDown: false,
	mouse: new Point,
	events: new List().addAll(),
	textOut: function(startX, startY, shiftX, shiftY, strings) {
		Game.g.font = '10pt Verdana'
		Game.g.fillStyle = Game.wallColor
		for (var i = 0; i < strings.length; i++) {
			Game.g.fillText(strings[i], startX += shiftX, startY += shiftY)
		}
	},
	readLevels: function(s) {
		var index = 0
		while (s.readBoolean()) {
			// Level
			var lvl = new Level(s.readString(), s.readInteger(), ++index)
			Game.levels.add(lvl)
			while (s.readBoolean()) {
				var n = new Node(s.readPoint())
				lvl.nodes.add(n)
				lvl.setMinMax(n.point)
			}
			lvl.finalNode = lvl.getNodeAt(s.readPoint())
			lvl.setMinMax(lvl.finalPoint = s.readPoint())
			while (s.readBoolean()) {
				var l = s.readBoolean()
				var a = lvl.getNodeAt(s.readPoint())
				var b = lvl.getNodeAt(s.readPoint())
				lvl.links.add(new Link(l, a, b, s.readBoolean()))
			}
			while (s.readBoolean()) {
				// Target
				var tar = new Target(lvl, s.readPoint())
				lvl.setMinMax(tar.point)
				tar.isAnchor = s.readBoolean()
				lvl.targets.add(tar)
				if (s.readBoolean()) {
					tar.key = new Key(tar, s.readBoolean())
				}
				if (s.readBoolean()) {
					tar.player = new Player(lvl, tar)
				}
				if (s.readBoolean()) {
					tar.portal = new Portal(lvl)
					lvl.portals.add(tar)
					while (s.readBoolean()) {
						tar.portal.addNode(lvl.getNodeAt(s.readPoint()), tar)
					}
				}
				if (tar.player || tar.key) {
					lvl.homes.add(tar)
				}
				if (s.readBoolean()) {
					// Handle
					var p = s.readPoint()
					var n = lvl.getNodeAt(p)
					if (n) {
						tar.handle = new Handle(n, tar, s.readBoolean())
					} else {
						s.readBoolean()
					}
				}
			}
			lvl.startSize = lvl.maxPoint.length()
			lvl.pad = Game.padFactor / lvl.startSize
			lvl.resize(Game.canvas.width, Game.canvas.height)
			console.log(lvl.targets.size() + "\t\t" + lvl.name)
			var i = 0.0
			var l = Math.PI / lvl.portals.size()
			lvl.portals.foreach(function(t) {
				t.portal.turn = i * l
				i++
			})
		}
		Game.lvl = Game.levels.head
	}
}
//------------------------------------------------------------
// MAIN.JS
//------------------------------------------------------------
function tick() {
	Game.now = (new Date()).getTime()
	window.elapsed = Game.now - Game.lastTime
	Game.lastTime = Game.now
	var g = Game.g
	var w = canvas.width
	var h = canvas.height
	g.fillStyle = Game.backGroundColor
	g.lineCap = 'round'
	g.fillRect(0, 0, w, h)
	Game.lvl.val.draw()
	var min = Game.lvl.val.minPoint
	var max = Game.lvl.val.maxPoint
	var r = max.y + min.y * 0.8
	this.fontSize = parseInt(min.y / 2)
	var name = Game.lvl.val.name
	var temp = parseInt(1 * w / name.length)
	this.fontSize = (temp > this.fontSize ? this.fontSize : temp)
	g.font = this.fontSize + 'pt Verdana'
	g.strokeStyle = g.fillStyle = Game.wallColor
	g.textAlign = 'center'
	var lvl = Game.lvl.val
	g.fillText(lvl.score + " / " + lvl.defScore, w / 2, min.y / 1.5)
	if (Game.lvl.prev) {
		g.fillText("<", min.x, r)
	}
	if (!Game.lvl.val.isUnlocked && Game.lvl.val.finalNode.gate.isOpen()) {
		Game.lvl.val.isUnlocked = true
	}
	if (Game.lvl.next && (devMode || Game.lvl.val.isUnlocked)) {
		g.fillText(">", max.x, r)
	}
	g.fillText(name, w / 2, r)
	window.requestAnimFrame(tick)
}
var cheatCodes = [0, 0, 0, 1, 1, -1, -1, -1, 0, 0, -1, 0, 1]
var cheatIndex = 0

function mousePressed(e) {
	Game.mouseDown = true
	if (e.clientY > Game.lvl.val.maxPoint.y) {
		var x = e.clientX
		var width = Game.canvas.width
		var w = width / 9
		var out
		if (x < w) {
			if (Game.lvl.prev) {
				Game.lvl = Game.lvl.prev
			}
			out = -1
		} else if (x > width - w) {
			if (Game.lvl.next && (devMode || Game.lvl.val.isUnlocked)) {
				Game.lvl = Game.lvl.next
			}
			out = 1
		} else {
			Game.lvl.val.resetLevel()
			out = 0
		}
		if (devMode) {
			return
		} else if (cheatCodes[cheatIndex] == out) {
			if (++cheatIndex == cheatCodes.length) {
				devMode = true
				console.log("Unlocked Cheatmode")
			}
		} else {
			cheatIndex = 0
		}
	} else {
		Game.mouse.set(e.clientX, e.clientY)
		Game.lvl.val.setTarget(Game.mouse)
		cheatIndex = 0
	}
}

function mouseDragged(e) {
	if (e.clientY + Game.menuBar > Game.canvas.height) {
		return
	}
	var f = Game.mouse.freeA()
	var n = Game.mouse.set(e.clientX, e.clientY)
	var lvl = Game.lvl.val
	if (lvl.path == null || lvl.path.transport == null) {}
}

function mouseReleased(e) {
	Game.mouseDown = false
}

function resize(e) {
	var w = Game.canvas.width = window.innerWidth
	var h = Game.canvas.height = window.innerHeight
	Game.levels.foreach(function(l) {
		l.resize(w, h)
	})
}

function get_cookie(name) {
  return document.cookie.
    replace(
      new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*\\=\\s*([^;]*).*$)|^.*$`
    ), '$1')
}

function init() {
	Game.canvas = document.getElementById('canvas')
	Game.g = canvas.getContext("2d")
	Game.canvas.width = window.innerWidth
	Game.canvas.height = window.innerHeight
	// 	Game.canvas.addEventListener("touchstart", mousePressed, false)
	Game.canvas.addEventListener("mousedown", mousePressed, false)
	// 	Game.canvas.addEventListener("touchmove", mouseDragged, false)
	//     Game.canvas.addEventListener("mousemove", mousePressed, false)
	// 	Game.canvas.addEventListener("touchend", mouseReleased, false)
	//     Game.canvas.addEventListener("mouseup", mouseReleased, false)
	// 	Game.canvas.addEventListener("touchcancel", mouseReleased, false)
	$(window).resize(resize)
	// 	$( document ).keypress( keyPress )
	var x = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP")
	x.onreadystatechange = function() {
		if (x.readyState == 4) {
			Game.readLevels(new StringIO(x.responseText.split("\n")))
			document.getElementById('loadingMsg').style.visibility = 'hidden'
			document.getElementById('canvas').style.visibility = 'visible'
			tick()
		}
	}
	x.open("GET", Game.src, true)
	x.send()

	const client_socket = io('/mazegame')

	client_socket.on('connect', () => {
	  name = null
	  if (typeof document.cookie == 'string') {
	    name = get_cookie('name')
	  }

	  // if no name is found in cookies, get one from the user
	  while (!name || name == 'null') {
	    name = prompt('Choose a name:', name)
	    document.cookie = `name=${name}`
	  }

	  // reply to server with name
	  client_socket.emit('client name', {name: name})
	})

}
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
		window.setTimeout(callback, 30)
	}
})()
