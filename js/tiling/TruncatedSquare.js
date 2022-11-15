
function TruncatedSquare (shapes) {
	this.name = "Truncated Square Tiling";
	this.id = "truncated-square";
	this.no = 9;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6;
	this.complexity = 17/3;
	this.square = shapes.square;
	this.octagon = shapes.octagon;
}

TruncatedSquare.prototype = new Tiling();

TruncatedSquare.prototype.x_pixels = function (yPixels, size) { return yPixels }

TruncatedSquare.prototype.y_pixels = function (xPixels, size) { return xPixels }

TruncatedSquare.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TruncatedSquare.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

TruncatedSquare.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.square = this.square.newSquare(grid);
	shapes.octagon = this.octagon.newOctagon(grid);
	return shapes;
}

// calculate the xPixels, yPixels, tilePixels column and row locations
TruncatedSquare.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
	}
	tilePixels = Q2*grid.xPixels/(2*(Q2 + 1)*grid.size + 1);
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - tilePixels/Q2;
	grid.scrollHeight = grid.yPixels - tilePixels/Q2;

	grid.columnLocations = [];
	// calculate the location of every column and row for efficiency
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = tilePixels*(column*(Q2 + 2) + Q2 + 1)/2;
		grid.columnLocations.push(columnLocation);
	}

	grid.rowLocations = [];
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = tilePixels*(row*(Q2 + 2) + Q2 + 1)/2;
		grid.rowLocations.push(rowLocation);
	}
}

TruncatedSquare.prototype.shape = function (shapes, x, y) {
	if (modulo(x + y,2) == 0) {
		return shapes.octagon;
	} else {
		return shapes.square;
	}
}

TruncatedSquare.prototype.orientation = function (x, y) {
	return "straight";
}

TruncatedSquare.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "nw": x--;	y--; break;
		case "n":       y--; break;
		case "ne": x++; y--; break;
		case "e":  x++;      break;
		case "se": x++; y++; break;
		case "s":       y++; break;
		case "sw": x--; y++; break;
		case "w":  x--;      break;
	}

	return [x,y];
}

// return the x,y of the tile that the pixel position is inside of
TruncatedSquare.prototype.tile_at = function (grid, xPixel, yPixel) {
	// identify the column & row
	var scrollCellSize = (1/Q2 + 1)*grid.tilePixels;
	var column = Math.floor(xPixel/scrollCellSize);
	var row = Math.floor(yPixel/scrollCellSize);

	var columnPixel = column*scrollCellSize;
	var rowPixel = row*scrollCellSize;

	// the location relative to the row&column area
	xPixel -= columnPixel;
	yPixel -= rowPixel;

	var x = column;
	var y = row;

	// check whether the area contains a square or not
	if (modulo(column - grid.xScroll + row + grid.yScroll, 2) == 0) {
		// no square
		// cell almost entirely filled by one octagon
		// top left corner is another octagon
		if ((xPixel + yPixel) < grid.tilePixels/Q2) {
			x--;
			y--;
		}
	} else {
		// square in the bottom right corner
		// octagon on the left, another at the top
		if (xPixel > grid.tilePixels/Q2 && yPixel > grid.tilePixels/Q2) {
			// square
		} else if (xPixel > yPixel) {
			// top octagon
			y--;
		} else {
			// left octagon
			x--;
		}
	}

	//console.log("tile is",x,y);
	x -= grid.xScroll;
	y -= grid.yScroll;

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
TruncatedSquare.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	return xScroll*(1/Q2 + 1)*tilePixels;
}

// return the vertical offset in pixels
// based on the current scroll position
TruncatedSquare.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	return yScroll*(1/Q2 + 1)*tilePixels;
}