
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

Squares.prototype.yPixels = function (xPixels, size) {
	return xPixels;
}

Squares.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
Squares.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

Squares.prototype.maxSize = function (xPixels,yPixels) {
	var tilePixels = 10; // tile size should not be less than 10

	if (this.x_pixels(yPixels,size) < xPixels) {
		// size is restricted by the screen height
		return Math.floor(yPixels / (2*tilePixels));
	} else {
		// size is restricted by screen width
		return Math.floor(xPixels / (2*tilePixels));
	}
}

Squares.prototype.newGrid = function (grid) {
	return new SquaresGrid(grid,this);
}

function SquaresGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	this.calculateDimensions();
	this.square = tiling.square.newSquare(grid);
	this.shapes = [this.square];
}

SquaresGrid.prototype = new TilingGrid();

SquaresGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels / (2*grid.size);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels / (2*grid.size);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		//grid.columnLocations.push(this.columnLocations(column));
		this.columnLocations.push(column*tilePixels + tilePixels/2);
	}

	this.rowLocations = [];
	for (var row = 0; row <= grid.yMax; row++) {
		//grid.rowLocations.push(this.rowLocations(row));
		this.rowLocations.push(row*tilePixels + tilePixels/2);
	}
}


SquaresGrid.prototype.resizeShapes = function () {
	this.square.resize();
}

SquaresGrid.prototype.shape = function () {
	return this.square;
}

SquaresGrid.prototype.orientation = function () {
	return "straight";
}

SquaresGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: direction
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = this.grid.yMax;
			}
			neighbour.direction = "s";
			break;

		case "e":
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = 0;
			}
			neighbour.direction = "w";
			break;

		case "s":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = 0;
			}
			neighbour.direction = "n";
			break;

		case "w":
			neighbour.x--;
			if (neighbour.x < 0) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = this.grid.xMax;
			}
			neighbour.direction = "e";
			break;
	}

	return neighbour;
}

// return the x,y of the tile that the pixel position is inside of
SquaresGrid.prototype.tileAt = function (xPixel,yPixel) {
	var xPixels = this.grid.xPixels;
	var yPixels = this.grid.yPixels;
	var xMax = this.grid.xMax;
	var yMax = this.grid.yMax;
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	var x;
	var y;

	// check we are inside the grid
	if (xPixel < 0)                   return []; // beyond the left edge
	if (xPixel > xPixels)             return []; // beyond the right edge
	if (yPixel < 0)                   return []; // beyond the top edge
	if (yPixel > yPixels)             return []; // beyond the bottom edge

	x = Math.floor((xMax + 1)*xPixel/xPixels - xScroll);
	y = Math.floor((yMax + 1)*yPixel/yPixels - yScroll);

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));

	return [x,y];
}

SquaresGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	this.grid.xScrollPixel = xScroll*this.grid.tilePixels;
	this.grid.yScrollPixel = yScroll*this.grid.tilePixels;

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
