
function Tiling () {
	this.name = "Generic Tiling";
	this.xContinuous = null;
	this.yContinuous = null;
	this.filters = null;
	this.prisms = null;
	this.faces = 0.0;
	this.complexity = 0.0;
}

Tiling.prototype.level_button = function () {
	throw "level_button function not defined for "+this.name;
}

Tiling.prototype.size_number = function (sizeDescription) {
	// determine offset by how many + or - are suffixed:
	var offset = 0;
	while (true) {
		last = sizeDescription.slice(-1);
		if (last == "+") {
			offset++;
		} else if (last == "-") {
			offset--;
		} else {
			break;
		}

		sizeDescription = sizeDescription.slice(0,-1);
	}

	// determine bounds:
	var min;
	var max;
	switch (sizeDescription) {
		case "tiny" :
			min = 6;
			max = 20;
			break;
		case "small" :
			min = 21;
			max = 50;
			break;
		case "medium" :
			min = 51;
			max = 120;
			break;
		case "large" :
			min = 121;
			max = 250;
			break;
		case "huge" :
			min = 251;
			max = 500;
			break;
	}

	var middle = min + (max - min)/2;
	var size = this.closest_size(middle)

	// if there is an offset, try increasing / decreasing the score until
	// either the offset is used, or we exceed the min / max
	increment = (offset > 0 ? 1 : -1)
	while (offset != 0) {
		var tiles = this.tiles(size + increment);
		if (tiles < min) break;
		if (tiles > max) break;

		size += increment;
		offset += (0 - increment);
	}

	return size;
}

Tiling.prototype.x_pixels = function (yPixels, size) {
	return yPixels;
}

Tiling.prototype.y_pixels = function (xPixels, size) {
	return xPixels;
}

// return what the x continuous should be
// can not always be whatever the caller wants
// a lot of tilings have restrictions
// e.g bounded triangular must be false, hexagonal must be true
Tiling.prototype.x_continuous = function (xContinuous) {
	return (this.xContinuous == null ? xContinuous : this.xContinuous);
}

// see x_continuous
Tiling.prototype.y_continuous = function (yContinuous) {
	return (this.yContinuous == null ? yContinuous : this.yContinuous);
}


Tiling.prototype.tiles = function (size) {
	throw "tiles function not defined for "+this.name;
}

Tiling.prototype.closest_size = function (tiles) {
	throw "closest_size function not defined for "+this.name;
}

Tiling.prototype.newGrid = function (grid) {
	throw "newGrid function not defined for "+this.name;
}


function TilingGrid () {
	this.columnLocations = [];
	this.rowLocations = [];
	this.shapes = [];
}

TilingGrid.prototype.resize = function () {
	this.calculateDimensions();
	this.resizeShapes();
}

// calculate the xPixels, yPixels, tilePixels column and row locations
TilingGrid.prototype.calculateDimensions = function () {
	throw "calculateDimensions function not defined for "+this.tiling.name+" grid";
}

TilingGrid.prototype.resizeShapes = function () {
	throw "resizeShapes function not defined for "+this.tiling.name+" grid";
}

// return the shape of the tile at the given location
TilingGrid.prototype.shape = function (x,y) {
	throw "shape function not defined for "+this.tiling.name+" grid";
}

// return the orientation of the tile at the given location
TilingGrid.prototype.orientation = function (x,y) {
	throw "orientation function not defined for "+this.tiling.name+" grid";
}

TilingGrid.prototype.newTile = function (tile) {
	tile.orientation = this.orientation(tile.x,tile.y);
	var shape = this.shape(tile.x,tile.y);
	shape.newTile(tile);
}

// generic random tile function for most tilings
// tiling needs a specific function where it does not use all values
// of x,y
TilingGrid.prototype.randomTile = function () {
	var x = Math.floor(Math.random()*(this.grid.xMax + 1));
	var y = Math.floor(Math.random()*(this.grid.yMax + 1));
	return [x,y];
}

// return x,y of the tile of the specified shape that is closest to the centre
TilingGrid.prototype.centre_tile = function () {
	return this.tileAt(this.grid.xPixels/2,this.grid.yPixels/2);
}

TilingGrid.prototype.randomRotation = function (x,y) {
	return Math.floor(Math.random()*this.shape(x,y).sides);
}

// return a neighbour object containing x,y,direction of the face of the
// tile touching the given tile face
TilingGrid.prototype.neighbour = function (x,y,direction) {
	throw "neighbour function not defined for "+this.tiling.name+" grid";
}

// similar to randomTile, tiling needs a 
// specific function where it does not use all values of x,y
TilingGrid.prototype.eachTile = function (tileFunction) {
	for (var x = 0; x <= this.grid.xMax; x++) {
		for (var y = 0; y <= this.grid.yMax; y ++) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
TilingGrid.prototype.tileLocation = function (x,y,rotation) {
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[y];
	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TilingGrid.prototype.tileAt = function (xPixel,yPixel) {
	throw "tileAt function not defined for "+this.tiling.name+" grid";
}

TilingGrid.prototype.updateScroll = function () {
	throw "updateScroll function not defined for "+this.tiling.name+" grid";
}

TilingGrid.prototype.clearScreen = function () {
	this.clipScreen();
	this.unclipScreen();
}

TilingGrid.prototype.clipScreen = function () {
	var outer = this.grid.outerDimensions;
	var screen = this.grid.screen;

	// clear the outer area
	var x = outer.x1;
	var y = outer.y1;
	var width = outer.x2 - outer.x1;
	var height = outer.y2 - outer.y1;

	// clip the area
	screen.context.save();
	screen.context.beginPath();
	screen.context.moveTo(x,y);
	screen.context.lineTo(x + width,y);
	screen.context.lineTo(x + width,y + height);
	screen.context.lineTo(x,y + height);
	screen.context.lineTo(x,y);
	screen.context.clip();

	screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	screen.context.fillStyle = screen.colour;
	screen.context.fillRect(x,y,width,height);
}

TilingGrid.prototype.unclipScreen = function () {
	this.grid.screen.context.restore();
}

TilingGrid.prototype.imagesLoaded = function () {
	var imagesLoaded = true;
	for (var shape of this.shapes) {
		if (!shape.imagesLoaded()) imagesLoaded = false;
	}
	return imagesLoaded;
}