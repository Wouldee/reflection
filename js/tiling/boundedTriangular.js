// A bounded tiling of triangles, within a downward-pointing triangular shape
// Tile numbering works outward from the top left corner
//   each "rank" of triangle starts at n,0 where n is the tile distance from 0,0
//   the y value increases as we move down the rank, until we get to the centre triangle, which is n,n
//   from then on, x decreases as we move towards the left-hand edge of the triangle, finishing with 0,n
// There are 4 triangles per row per size, 2 triangles per column
// There's more downward ppointing triangles than upward-pointing, 
//   the counts of each are consecutive triangular numbers
//   if the minimum of x & y modulo 2 is zero, then the triangle is downward-pointing
// Every x,y combination is a tile
// Not continuous at all

function BoundedTriangular (shapes) {
	this.name = "(Bounded) Triangular Tiling";
	this.id = "bounded-triangular";
	this.xContinuous = false;
	this.yContinuous = false;
	this.filters = false;
	this.prisms = false;
	this.faces = 3.0;
	this.complexity = 2.0;
	this.triangle = shapes.triangle;
}

BoundedTriangular.prototype = new Tiling();

//...what is this for...
Tiling.prototype.level_button = function () {
	throw "level_button function not defined for "+this.name;
}

BoundedTriangular.prototype.x_pixels = function (yPixels, size) {
	return 2*yPixels/Q3;
}

BoundedTriangular.prototype.y_pixels = function (xPixels, size) {
	return Q3*xPixels/2;
}

BoundedTriangular.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
BoundedTriangular.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

BoundedTriangular.prototype.maxSize = function (xPixels,yPixels) {
	if (this.x_pixels(yPixels,size) < xPixels) {
		// tile size is restricted by the screen height
		tilePixels = 2 * grid.yPixels/(2*Q3*grid.size);
		return Math.floor(yPixels / (Q3*tilePixels));
	} else {
		return Math.floor((2*xPixels/tilePixels - 1) / 4);
	}
}

BoundedTriangular.prototype.newGrid = function (grid) {
	return new BoundedTriangularGrid(grid,this);
}

function BoundedTriangularGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	// ensure continuous x & y are set to false
	grid.xContinuous = false;
	grid.yContinuous = false;

	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.shapes = [this.triangle];
}

BoundedTriangularGrid.prototype = new TilingGrid();

BoundedTriangularGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels/(Q3*grid.size);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(2*grid.size);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	this.columnLocations = [];
	for (var column = 0; column <= 2*grid.xMax; column++) {
		var x = tilePixels*(column + 1)/2;
		this.columnLocations.push(x);
	}

	this.rowLocations = [];
	for (var row = 0; row <= 2*grid.yMax; row++) {
		if (row%2 == 0) {
			var y = tilePixels*(3*row + 2)/(4*Q3);
		} else {
			var y = tilePixels*(3*row + 1)/(4*Q3);
		}
		this.rowLocations.push(y);
	}
}


BoundedTriangularGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
}

BoundedTriangularGrid.prototype.shape = function () {
	return this.triangle;
}

BoundedTriangularGrid.prototype.orientation = function (x,y) {
	if (Math.min(x,y) % 2 == 0) {
		// point is downward
		return 'down';
	} else {
		// point is upward
		return 'up';
	}
}

// xCont
BoundedTriangularGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: direction
	}

	switch (direction) {
		case "n":
			if (x < y) {
				neighbour.x++;
			} else {
				neighbour.y--;
				if (neighbour.y < 0) return null;
			}
			neighbour.direction = "s";
			break;
		case "see": 
			neighbour.x++;
			neighbour.y++;
			if (neighbour.x > this.grid.xMax || neighbour.y > this.grid.yMax) return null;
			neighbour.direction = "nww";
			break;
		case "sww":
			if (y < x) {
				neighbour.y++;
			} else {
				neighbour.x--;
				if (neighbour.x < 0) return null;
			}
			neighbour.direction = "nee";
			break;
		case "nww":
			neighbour.x--;
			neighbour.y--;
			neighbour.direction = "see";
			break;
		case "nee":
			if (x < y) {
				neighbour.x++;
			} else {
				neighbour.y--;
			}
			neighbour.direction = "sww";
			break;
		case "s":
			if (y < x) {
				neighbour.y++;
			} else {
				neighbour.x--;
			}
			neighbour.direction = "n";
			break;
	}

	return neighbour;
}

// xCont
// return the x y pixel at the centre of the tile
BoundedTriangularGrid.prototype.tileLocation = function (x,y,rotation) {

	if (x > y) {
		var column = Math.floor((4*x - y)/2);
		var row = y;
	} else {
		var column = Math.floor(x/2) + y;
		var row = (2*y - x);
	}

	// get pixels based on row and column...
	var xPixel = this.columnLocations[column];
	var yPixel = this.rowLocations[row];

	return [xPixel,yPixel];
}

// xCont
// return the x,y of the tile that the pixel position is inside of
BoundedTriangularGrid.prototype.tileAt = function (xPixel,yPixel) {
	var size = this.grid.size;
	var xPixels = this.grid.xPixels;
	var yPixels = this.grid.yPixels;

	var x;
	var y;

	// check we are inside the (triangular-shaped) grid
	if (yPixel < 0)                     return []; // beyond the top
	if (yPixel > Q3*xPixel)             return []; // beyond the left edge
	if (yPixel > Q3*(xPixels - xPixel)) return []; // beyond the right edge

	// determine the rank and depth of the tile
	// depth is basically which row
	var depth = Math.floor(2*size*yPixel/yPixels);

	// rank is which 'coloumn', i.e distance from the top-left corner
	var rank = Math.floor(2*size*(Q3*xPixel + yPixel)/(2*yPixels))

	// now determine whether this is the up or the down triangle inside the diamond
	if (yPixel <= Q3*(xPixel - (xPixels*(rank - depth)/(2*size)))) {
		// down
		if (rank >= 2*depth) {
			x = rank;
			y = 2*depth;
		} else {
			x = 2*(rank - depth);
			y = rank;
		}
	} else {
		// up
		if (rank >= 2*depth + 1) {
			x = rank;
			y = 2*depth + 1;
		} else {
			x = 2*(rank - depth) - 1;
			y = rank;
		}
	}

	return [x,y];
}

BoundedTriangularGrid.prototype.updateScroll = function () {}

BoundedTriangularGrid.prototype.clipScreen = function () {
	var grid = this.grid;
	var screen = this.grid.screen;

	// clear the outer area
	var x = grid.x;
	var y = grid.y;
	var width = grid.xPixels;
	var height = grid.yPixels;

	// clip the area
	screen.context.save();
	screen.context.beginPath();
	screen.context.moveTo(x,y);
	screen.context.lineTo(x + width,y);
	screen.context.lineTo(x + width/2,y + height);
	screen.context.lineTo(x,y);
	screen.context.clip();

	screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	screen.context.fillStyle = screen.colour;
	screen.context.fillRect(x,y,width,height);
}
