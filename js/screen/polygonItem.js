
function PolygonItem (screen,coords,fill,border,origin) {
	this.screen = screen;
	this.coords = coords;
	this.fill = fill;
	this.border = border;
	this.origin = origin || {};

	if (this.origin.x == undefined) this.origin.x = 0;
	if (this.origin.y == undefined) this.origin.y = 0;
	this.calculateDimensions();

	this.underneath = null;

	this.redraw();
}

PolygonItem.prototype.calculateDimensions = function () {
	var xOrigin = this.screen.horizontal(this.origin.x);
	var yOrigin = this.screen.vertical(this.origin.y);
	var xMin = xOrigin + this.screen.width;
	var yMin = yOrigin + this.screen.height;
	var xMax = 0;
	var yMax = 0;

	for (var i = 0; i < this.coords.length; i+=2) {
		var x = xOrigin + this.screen.horizontal(this.coords[i]);
		var y = yOrigin + this.screen.vertical(this.coords[i+1]);
		xMin = Math.min(x,xMin);
		yMin = Math.min(y,yMin);
		xMax = Math.max(x,xMax);
		yMax = Math.max(y,yMax);
	}

	this.x = xMin;
	this.y = yMin;
	this.width = xMax - xMin;
	this.height = yMax - yMin;
}

PolygonItem.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.remove();
		this.coords = arguments[0];
		this.resize();
		//this.draw();
		this.redraw();
	} else {
		var xOrigin = this.screen.horizontal(this.origin.x);
		var yOrigin = this.screen.vertical(this.origin.y);

		var coords = [];
		for (var i = 0; i < this.coords.length; i+=2) {
			var x = xOrigin + this.screen.horizontal(this.coords[i]);
			var y = yOrigin + this.screen.vertical(this.coords[i+1]);
			coords.push(x,y);
		}

		return coords;
	}
}

PolygonItem.prototype.remove = function () {
	this.screen.context.save();
	this.screen.context.fillStyle = this.screen.colour;

	this.screen.context.beginPath();
	var xOrigin = this.screen.horizontal(this.origin.x);
	var yOrigin = this.screen.vertical(this.origin.y);
	var x = xOrigin + this.screen.horizontal(this.coords[0]);
	var y = yOrigin + this.screen.vertical(this.coords[1]);
	this.screen.context.moveTo(x,y);
	for (var i = 2; i < this.coords.length; i+=2) {
		x = xOrigin + this.screen.horizontal(this.coords[i]);
		y = yOrigin + this.screen.vertical(this.coords[i+1]);
		this.screen.context.lineTo(x,y);
	}
	this.screen.context.closePath();
	this.screen.context.clip();
	this.screen.context.fillRect(this.x,this.y,this.width,this.height);

	this.screen.context.restore();
}

PolygonItem.prototype.resize = function () {
	this.calculateDimensions();
	//underneath image needs to be resized also...
}

// public function
// redisplay the button
// should only be called if the button is currently not displayed...
PolygonItem.prototype.redraw = function () {
	// grab an image of the canvas area currently occupying the button's area
	// will be used if the transparency of the rectangle changes
	this.underneath = document.createElement("canvas");
	this.underneath.width = this.width;
	this.underneath.height = this.height;
	this.underneath.getContext("2d").drawImage(this.screen.canvas,this.x+1,this.y+1,this.width,this.height,0,0,this.width,this.height);
	this.draw();
}

PolygonItem.prototype.draw = function () {

	this.screen.context.save();

	if (this.fill != null) {
		this.screen.context.fillStyle = this.fill.colour;
		this.screen.context.beginPath();
		var xOrigin = this.screen.horizontal(this.origin.x);
		var yOrigin = this.screen.vertical(this.origin.y);
		var x = xOrigin + this.screen.horizontal(this.coords[0]);
		var y = yOrigin + this.screen.vertical(this.coords[1]);
		this.screen.context.moveTo(x,y);
		for (var i = 2; i < this.coords.length; i+=2) {
			x = xOrigin + this.screen.horizontal(this.coords[i]);
			y = yOrigin + this.screen.vertical(this.coords[i+1]);
			this.screen.context.lineTo(x,y);
		}
		this.screen.context.closePath();
		this.screen.context.clip();

		if (this.fill.alpha != undefined) {
			// redisplay the underneath
			this.screen.context.drawImage(this.underneath,this.x,this.y);
			this.screen.context.globalAlpha = this.fill.alpha;
		}

		this.screen.context.fillRect(this.x,this.y,this.width,this.height);

		if (this.fill.alpha != undefined) this.screen.context.globalAlpha = 1;
	}

	if (this.border != null) {
		// unsupported...
	}

	this.screen.context.restore();
}

PolygonItem.prototype.fillColour = function (colour) {
	if (colour != undefined) {
		this.fill.colour = colour;
		this.draw();
	}
	return this.fill.colour;
}

PolygonItem.prototype.fillAlpha = function (alpha) {
	if (alpha != undefined) {
		this.fill.alpha = alpha;
		this.draw();
	}
	return this.fill.alpha;
}


PolygonItem.prototype.inside = function (x,y) {
	// check if it's inside the bounding rectangle first
	if ( x < this.x || y < this.y || x > (this.x + this.width) || y > (this.y + this.height)) {
		return false;
	}

	// check how many times a horzontal line from -inf,y to x,y would cross the edges of the polygon
	var xOrigin = this.screen.horizontal(this.origin.x);
	var yOrigin = this.screen.vertical(this.origin.y);
	var x1 = xOrigin + this.screen.horizontal(this.coords[this.coords.length - 2]);
	var y1 = yOrigin + this.screen.vertical(this.coords[this.coords.length - 1]);
	var x2;
	var y2;

	var crossings = 0;
	for (var i = 0; i < this.coords.length; i += 2) {
		x2 = xOrigin + this.screen.horizontal(this.coords[i]);
		y2 = yOrigin + this.screen.vertical(this.coords[i+1]);

		// if both points are above the line, or both below the line, or both to the right of x, then ignore
		if (((y1 < y && y2 >= y) || (y2 < y && y1 >= y)) && (x1 <= x || x2 <= x)) {
			// check if the line between the two points crosses the horizontal line
			if (x1 + (y - y1)*(x2 - x1)/(y2 - y1) < x) crossings++;
		}

		x1 = x2;
		y1 = y2;
	}

	// if there were an odd nujmber of crossings, then x,y is inside the polygon
	return modulo(crossings,2) == 1;
}
