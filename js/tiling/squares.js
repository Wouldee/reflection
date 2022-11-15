
// A tiling of squares
// Rows and columns, +/- y between north and south faces, x +/- y between the east and west faces
// There are 2 squares per row and column per size increment
// Every x,y combination is a tile
// Horizontal and vertical can both be either continuous or not

function Squares (shapes) {
	this.name = "Square Tiling";
	this.id = "squares";
	this.no = 2;
	this.xContinuous = null;
	this.yContinuous = null;
	this.filters = null;
	this.prisms = false;
	this.faces = 4.0;
	this.complexity = 3.0;
	this.square = shapes.square;
}

Squares.prototype = new Tiling();

Squares.prototype.x_pixels = function (yPixels, size) {
	return yPixels;
}

Squares.prototype.y_pixels = function (xPixels, size) {
	return xPixels;
}

Squares.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
Squares.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

Squares.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.square = this.square.newSquare(grid);
	return shapes;
}

Squares.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels / (2*grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels / (2*grid.size);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		//grid.columnLocations.push(this.columnLocations(column));
		grid.columnLocations.push(column*tilePixels + tilePixels/2);
	}

	this.rowLocations = [];
	for (var row = 0; row <= grid.yMax; row++) {
		//grid.rowLocations.push(this.rowLocations(row));
		grid.rowLocations.push(row*tilePixels + tilePixels/2);
	}
}

Squares.prototype.shape = function (shapes, x, y) {
	return shapes.square;
}

Squares.prototype.orientation = function (x, y) {
	return "straight";
}

Squares.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n": y--; break;
		case "e": x++; break;
		case "s": y++; break;
		case "w": x--; break;
	}

	return [x,y];
}

// return the x,y of the tile that the pixel position is inside of
Squares.prototype.tile_at = function (grid, xPixel, yPixel) {
	var x = Math.floor((grid.xMax + 1)*xPixel/grid.xPixels - grid.xScroll);
	var y = Math.floor((grid.yMax + 1)*yPixel/grid.yPixels - grid.yScroll);
	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
Squares.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	return xScroll*tilePixels;
}

// return the vertical offset in pixels
// based on the current scroll position
Squares.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	return yScroll*tilePixels;
}