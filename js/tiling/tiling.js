
function Tiling () {
	this.name = "Generic Tiling";
	this.id = "generic-tiling";

	// x & y continuous - booleans
	// false if the tiling cannot be continuous
	// true if the tiling must be continuous
	// null if it can be either
	this.xContinuous = null;
	this.yContinuous = null;

	// filters & prism - false if the tiling cannot have filters or prisms, null otherwise
	// check if these are actually used...delete if not...
	this.filters = null;
	this.prisms = null;

	// average number of faces per tile
	// used?~~~
	this.faces = 0.0;

	// used to compute difficulty of puzzle
	// average number of other faces per face
	// so for triangular tiling complexity is 2, square is 3, hexagonal is 5 etc
	// e.g truncated hexagonal tiling, there are 2 triangles for every dodecagon
	// each dodecagon's side has a complexity of 11, and the triangles each have a complexity of 2
	// there are 12 dodecagon sides for every 6 triangle sides, so we calculate as 12*11 + 6*2 (=144),
	// divided by 12 + 6, which comes out as exactly 8
	this.complexity = 0.0;
}

Tiling.prototype.level_button = function () {
	throw "level_button function not defined for "+this.name;
}

// return the size for this tiling that matches the description
// see globals.js, level size property
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

// minimum width required to fully display each tile
Tiling.prototype.x_pixels = function (yPixels, size) {
	return yPixels;
}

// minimum height required to fully display each tile
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

// calculate the xPixels, yPixels, tilePixels column and row locations
Tiling.prototype.calculate_dimensions = function (grid) {
	throw "calculateDimensions function not defined for "+this.name+" grid";
}

// return the shape of the tile at the given location
Tiling.prototype.shape = function (shapes, x, y) {
	throw "shape function not defined for "+this.name+" grid";
}

// return the orientation of the tile at the given location
Tiling.prototype.orientation = function (x, y) {
	throw "orientation function not defined for "+this.name+" grid";
}

// generic random tile function for most tilings
// tiling needs a specific function if it does not use all values
// of x,y
Tiling.prototype.random_tile = function (maxX, maxY) {
	var x = Math.floor(Math.random()*(maxX + 1));
	var y = Math.floor(Math.random()*(maxY + 1));
	return [x,y];
}

// return x,y of the tile of the specified shape that is closest to the centre
Tiling.prototype.centre_tile = function (grid) {
	return this.tile_at(grid, grid.xPixels/2, grid.yPixels/2);
}

// return a random rotation, between 0 and sides - 1
// depending on the shape @ x, y
Tiling.prototype.random_rotation = function (shapes, x, y) {
	return Math.floor(Math.random()*this.shape(shapes,x,y).sides);
}

// return a neighbour object containing x,y,direction of the face of the
// tile touching the given tile face
Tiling.prototype.neighbour = function (x, y, direction, gridSize) {
	throw "neighbour function not defined for "+this.name+" grid";
}

// similar to randomTile, tiling needs a 
// specific function where it does not use all values of x,y
Tiling.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var x = 0; x <= maxX; x++) {
		for (var y = 0; y <= maxY; y ++) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
Tiling.prototype.tile_location = function (grid, x, y) {
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[y];
	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
Tiling.prototype.tile_at = function (grid, xPixel, yPixel) {
	throw "tileAt function not defined for "+this.name+" grid";
}

// how many tiles per scroll, default 1
Tiling.prototype.x_scroll_increment = function () { return 1; }
Tiling.prototype.y_scroll_increment = function () { return 1; }

// return the horizontal offset in pixels
// based on the current scroll position
Tiling.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	throw "x_scroll_pixel function not defined for "+this.name+" grid";
}

// return the vertical offset in pixels
// based on the current scroll position
Tiling.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	throw "x_scroll_pixel function not defined for "+this.name+" grid";
}

Tiling.prototype.clip_perimeter = function (grid) {
	// clear the outer area
	var x = grid.outerDimensions.x1;
	var y = grid.outerDimensions.y1;
	var width = grid.outerDimensions.x2 - grid.outerDimensions.x1;
	var height = grid.outerDimensions.y2 - grid.outerDimensions.y1;

	grid.screen.context.save();
	grid.screen.context.beginPath();
	grid.screen.context.moveTo(x,y);
	grid.screen.context.lineTo(x + width,y);
	grid.screen.context.lineTo(x + width,y + height);
	grid.screen.context.lineTo(x,y + height);
	grid.screen.context.lineTo(x,y);
	grid.screen.context.clip();

	grid.screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	grid.screen.context.fillStyle = grid.screen.colour;
	grid.screen.context.fillRect(x,y,width,height);
}