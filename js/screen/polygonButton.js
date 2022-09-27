
function PolygonButton (screen, coords, fill, border, action, origin) {
	this.screen = screen;
	this.action = action;
	var polygon = screen.polygon(coords,fill,border,origin);
	this.polygon = polygon;

	var x1 = polygon.x;
	var y1 = polygon.y;
	var x2 = polygon.x + polygon.width;
	var y2 = polygon.y + polygon.height;
	this.listener = screen.addListener(x1,y1,x2,y2,this);

	this.listener.inside = function (x,y) {
		return polygon.inside(x,y);
	}

	this.away = { fill: {}, border: border };
	this.away.fill.colour = fill.colour || "#ffffff";
	this.away.fill.alpha = fill.alpha || 1;

	this.over = {fill: {}, border: border};
	if (this.away.fill.alpha == 1) {
		// increase the colour....
		this.over.fill.colour = xxx;
	} else {
		// increase the alpha
		this.over.fill.colour = this.away.fill.colour;
		this.over.fill.alpha = Math.min(1,this.away.fill.alpha*2);
	}

	this.down = {fill: this.over.fill, burder: border};
}

PolygonButton.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.polygon.coordinates.apply(this.polygon,arguments);
		this.resize();
	} else {
		return this.polygon.coordinates();
	}
}

PolygonButton.prototype.resize = function () {
	var x1 = this.polygon.x;
	var y1 = this.polygon.y;
	var x2 = this.polygon.x + this.polygon.width;
	var y2 = this.polygon.y + this.polygon.height;
	this.listener.coordinates(x1,y1,x2,y2);
}

PolygonButton.prototype.redraw = function () {
	this.polygon.redraw();
}

PolygonButton.prototype.mouseIn = function () {
	this.screen.canvas.style.cursor="pointer"
	this.polygon.fillColour(this.over.fill.colour);
	this.polygon.fillAlpha(this.over.fill.alpha);
}

PolygonButton.prototype.mouseOut = function () {
	this.screen.canvas.style.cursor="auto"
	this.polygon.fillColour(this.away.fill.colour);
	this.polygon.fillAlpha(this.away.fill.alpha);
	game_log("screen",1,'Outof button');
}

PolygonButton.prototype.click = function (x,y,button,down) {
	if (button == "left") {
		if (down) {
			// change colour...
		} else {
			this.action();
		}
	}
}
