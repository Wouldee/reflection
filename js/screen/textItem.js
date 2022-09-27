
function TextItem (screen, text, x, y, alignment, size, maxWidth) {
	this.screen = screen;
	this.text = text;
	this.x = x;
	this.y = y;
	this.alignment = alignment;
	this.size = size;
	this.maxWidth = maxWidth || 0.99;

	this.position = {};
	this.position.x = screen.horizontal(x);
	this.position.y = screen.vertical(y);

	this.dimensions = {};
	this.dimensions.size = parseInt(screen.vertical(size));
	this.dimensions.maxWidth = screen.horizontal(this.maxWidth);

	this.colour = '#ffffff'
	this.font = 'Segoe UI'

	this.applyMaxWidth();
	this.draw();

	//console.log(this);
}

TextItem.prototype.resize = function () {
	this.position.x = this.screen.horizontal(this.x);
	this.position.y = this.screen.vertical(this.y);
	// resize font?....
	this.dimensions.size = parseInt(this.screen.vertical(this.size));
	this.dimensions.maxWidth = this.screen.horizontal(this.maxWidth);
	this.applyMaxWidth();

	//console.log(this.text,"position",this.position,"dimensions",this.dimensions);
}

TextItem.prototype.applyMaxWidth = function () {
	this.screen.context.save();

	var size = this.dimensions.size;
	var metrics;
	while (true && size > 0) {
		this.screen.context.font = size + 'pt ' + this.font;
		metrics = this.screen.context.measureText(this.text);
		if (metrics.width < this.dimensions.maxWidth) break;
		size--;
	}
	this.dimensions.size = size;

	this.screen.context.restore();
}


TextItem.prototype.draw = function () {
	this.screen.drawText(this.text,this.position.x,this.position.y,
		this.alignment,this.dimensions.size,this.font,this.colour);
}

TextItem.prototype.remove = function () {
	var dimensions = this.coordinates();
	var x = dimensions[0];
	var y = dimensions[1];
	var width = dimensions[2] - x;
	var height = dimensions[3] - y;
	this.screen.context.fillStyle = this.screen.colour;
	this.screen.context.fillRect(x,y,width,height);
}

TextItem.prototype.update = function (text) {
	this.remove();
	this.text = text;
	this.applyMaxWidth();
	this.draw();
}

TextItem.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.remove();
		this.x = arguments[0];
		this.y = arguments[1];
		this.resize();
		this.draw();
	} else {
		// get the metrics object for the text
		this.screen.context.save();
		this.screen.context.font = this.dimensions.size + 'pt ' + this.font;
		var metrics = this.screen.context.measureText(this.text);
		this.screen.context.restore();

		var x1 = this.position.x;
		var y1 = this.position.y - this.dimensions.size;
		var x2 = x1 + metrics.width;
		var y2 = y1 + this.size*1.4;

		switch (this.alignment) {
			case 'center': 
				x1 -= metrics.width/2;
				x2 -= metrics.width/2;
				break;
			case 'right':
				x2 = x1;
				x1 -= metrics.width;
				break;
		}

		return [x1, y1, x2, y2];
	}
}
