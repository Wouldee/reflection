
function RectangleItem (screen, x, y, width, height, fill, border, origin) {
	this.screen = screen;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.fill = fill || {};
	this.border = border || {};
	this.origin = origin || {};
	this.position = {};
	this.dimensions = {};
	this.orientation = {x: 1, y: 1};

	if (this.border.margin == undefined) this.border.margin = 0;
	if (this.fill.margin == undefined) this.fill.margin = 0;

	if (this.origin.x == undefined) this.origin.x = 0;
	if (this.origin.y == undefined) this.origin.y = 0;
	this.calculateDimensions();

	this.underneath = null;
	this.redrawCount = 0;

	this.redraw();
}

RectangleItem.prototype.calculateDimensions = function () {
	var x1 = this.screen.horizontal(this.origin.x) + this.screen.horizontal(this.x);
	var y1 = this.screen.vertical(this.origin.y) + this.screen.vertical(this.y);
	var x2 = x1 + this.screen.horizontal(this.width);
	var y2 = y1 + this.screen.vertical(this.height);
	// console.log("calculate rectangle dimensions:",x1,y1,x2,y2);

	if (x1 < x2) {
		this.position.x = x1;
		this.dimensions.width = x2 - x1;
		this.orientation.x = 1;
	} else {
		this.position.x = x2;
		this.dimensions.width = x1 - x2;
		this.orientation.x = -1;
	}
	if (y1 < y2) {
		this.position.y = y1;
		this.dimensions.height = y2 - y1;
		this.orientation.y = 1;
	} else {
		this.position.y = y2;
		this.dimensions.height = y1 - y2;
		this.orientation.y = -1;
	}
}

RectangleItem.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.remove();
		this.x = arguments[0];
		this.y = arguments[1];
		this.width = arguments[2];
		this.height = arguments[3];
		this.resize();
		//this.draw();
		this.redraw();
	} else {
		return [this.position.x,this.position.y,
			this.position.x + this.dimensions.width, this.position.y + this.dimensions.height];
	}
}

RectangleItem.prototype.remove = function () {
	// clear/redisplay underneath~~~
	if (this.border.thickness != undefined) {
		var x = this.position.x + (this.border.margin - this.border.thickness/2)*this.orientation.x;
		var y = this.position.y + (this.border.margin - this.border.thickness/2)*this.orientation.y;
		var width = this.dimensions.width - 2*this.border.margin + this.border.thickness;
		var height = this.dimensions.height - 2*this.border.margin + this.border.thickness;
	} else {
		var x = this.position.x + (this.border.margin + this.fill.margin)*this.orientation.x;
		var y = this.position.y + (this.border.margin + this.fill.margin)*this.orientation.y;
		var width = this.dimensions.width - 2*this.border.margin - 2*this.fill.margin;
		var height = this.dimensions.height - 2*this.border.margin - 2*this.fill.margin;
	}
	this.screen.drawRectangle(x,y,width,height,this.screen.colour);
}

RectangleItem.prototype.resize = function () {
	this.calculateDimensions();
	//underneath image needs to be resized also~~~
}

// public function
// redisplay the button
// should only be called if the button is currently not displayed~~~
RectangleItem.prototype.redraw = function () {
	if (this.dimensions.width > 0 && this.dimensions.height > 0) {
		// grab an image of the canvas area currently occupying the button's area
		// will be used if the transparency of the rectangle changes
		delete this.underneath;
		this.underneath = document.createElement("canvas");
		this.underneath.width = this.dimensions.width;
		this.underneath.height = this.dimensions.height;
		this.underneath.getContext("2d").drawImage(this.screen.canvas,this.position.x + 1,this.position.y + 1,
				this.dimensions.width,this.dimensions.height,0,0,this.dimensions.width,this.dimensions.height);
	}

	this.redrawCount++;
	this.draw();
}

// internal function
// display the button on the screen
RectangleItem.prototype.draw = function () {
	if (this.fill.colour != undefined) {
		this.screen.context.save();
		if (this.fill.alpha != undefined) {
			// redisplay the underneath
			this.screen.context.drawImage(this.underneath,this.position.x,this.position.y);
			this.screen.context.globalAlpha = this.fill.alpha;
		}

		var x = this.position.x + (this.border.margin + this.fill.margin)*this.orientation.x;
		var y = this.position.y + (this.border.margin + this.fill.margin)*this.orientation.y;
		var width = this.dimensions.width - 2*this.border.margin - 2*this.fill.margin;
		var height = this.dimensions.height - 2*this.border.margin - 2*this.fill.margin;
		this.screen.drawRectangle(x,y,width,height,this.fill.colour);

		this.screen.context.restore();
		//if (this.fill.alpha != undefined) this.screen.context.globalAlpha = 1;
	}

	if (this.border.colour != undefined) {
		var x = this.position.x + this.border.margin*this.orientation.x;
		var y = this.position.y + this.border.margin*this.orientation.y;
		var width = this.dimensions.width - 2*this.border.margin;
		var height = this.dimensions.height - 2*this.border.margin;
		this.screen.drawRectangleOutline(x,y,width,height,this.border.colour,this.border.thickness);
	}
}

RectangleItem.prototype.fillColour = function (colour) {
	if (colour != undefined) {
		this.fill.colour = colour;
		this.draw();
	}
	return this.fill.colour;
}

RectangleItem.prototype.fillAlpha = function (alpha) {
	if (alpha != undefined) {
		this.fill.alpha = alpha;
		this.draw();
	}
	return this.fill.alpha;
}

RectangleItem.prototype.borderColour = function (colour) {
	if (colour != undefined) {
		this.border.colour = colour;
		this.draw();
	}
	return this.border.colour;
}

RectangleItem.prototype.borderThickness = function (thickness) {
	if (thickness != undefined) {
		this.border.thickness = thickness;
		this.draw();
	}
	return this.border.thickness;
}
