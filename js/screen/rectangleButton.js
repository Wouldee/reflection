
function RectangleButton (screen, x, y, width, height, fill, border, action, origin) {
	this.screen = screen;
	this.action = action;
	this.rectangle = screen.rectangle(x,y,width,height,fill,border,origin);

	x = this.rectangle.position.x;
	y = this.rectangle.position.y;
	width = this.rectangle.dimensions.width;
	height = this.rectangle.dimensions.height;
	this.listener = screen.addListener(x,y,x+width,y+height,this);

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

RectangleButton.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.rectangle.coordinates.apply(this.rectangle,arguments);
		this.resize();
	} else {
		return this.rectangle.coordinates();
	}
}

RectangleButton.prototype.resize = function () {
	var x = this.rectangle.position.x;
	var y = this.rectangle.position.y;
	var width = this.rectangle.dimensions.width;
	var height = this.rectangle.dimensions.height;
	this.listener.coordinates(x,y,x+width,y+height);
}

RectangleButton.prototype.redraw = function () {
	this.rectangle.redraw();
}

RectangleButton.prototype.mouseIn = function () {
	this.screen.canvas.style.cursor="pointer"
	this.rectangle.fillColour(this.over.fill.colour);
	this.rectangle.fillAlpha(this.over.fill.alpha);
}

RectangleButton.prototype.mouseOut = function () {
	this.screen.canvas.style.cursor="auto"
	this.rectangle.fillColour(this.away.fill.colour);
	this.rectangle.fillAlpha(this.away.fill.alpha);
	game_log("screen",1,'Outof button');
}

RectangleButton.prototype.click = function (x,y,button,down) {
	if (button == "left") {
		if (down) {
			// change colour...
		} else {
			this.action();
		}
	}
}
