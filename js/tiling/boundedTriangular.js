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
	this.no = 0;
	this.xContinuous = false;
	this.yContinuous = false;
	this.filters = false;
	this.prisms = false;
	this.faces = 3.0;
	this.complexity = 2.0;
	this.triangle = shapes.triangle;
}

BoundedTriangular.prototype = new Tiling();

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

// create sized shapes for a new grid
BoundedTriangular.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	return shapes;
}

BoundedTriangular.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels/(Q3*grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(2*grid.size);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	grid.columnLocations = [];
	for (var column = 0; column <= 2*grid.xMax; column++) {
		var x = tilePixels*(column + 1)/2;
		grid.columnLocations.push(x);
	}

	grid.rowLocations = [];
	for (var row = 0; row <= 2*grid.yMax; row++) {
		if (row%2 == 0) {
			var y = tilePixels*(3*row + 2)/(4*Q3);
		} else {
			var y = tilePixels*(3*row + 1)/(4*Q3);
		}
		grid.rowLocations.push(y);
	}
}

BoundedTriangular.prototype.shape = function (shapes, x, y) {
	return shapes.triangle;
}

BoundedTriangular.prototype.orientation = function (x, y) {
	if (Math.min(x,y) % 2 == 0) {
		// point is downward
		return 'down';
	} else {
		// point is upward
		return 'up';
	}
}

// return x, y of the tile neighbouring x, y in the given direction
BoundedTriangular.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n":   if (x <  y) x++; else y--; break;
		case "see":             x++;      y++; break;
		case "sww": if (x <= y) x--; else y++; break;
		case "nww":             x--;      y--; break;
		case "nee": if (x < y)  x++; else y--; break;
		case "s":   if (x <= y) x--; else y++; break;
	}

	return [x,y];
}

// xCont
// return the x y pixel at the centre of the tile
BoundedTriangular.prototype.tile_location = function (grid, x, y) {
	if (x > y) {
		var column = Math.floor((4*x - y)/2);
		var row = y;
	} else {
		var column = Math.floor(x/2) + y;
		var row = (2*y - x);
	}

	// get pixels based on row and column~~~
	var xPixel = grid.columnLocations[column];
	var yPixel = grid.rowLocations[row];

	return [xPixel,yPixel];
}

// xCont
// return the x,y of the tile that the pixel position is inside of
BoundedTriangular.prototype.tile_at = function (grid,xPixel,yPixel) {
	// check we are inside the (triangular-shaped) grid
	if (yPixel > Q3*xPixel)             return []; // beyond the left edge
	if (yPixel > Q3*(grid.xPixels - xPixel)) return []; // beyond the right edge

	// determine the rank and depth of the tile
	// depth is basically which row
	var depth = Math.floor(2*grid.size*yPixel/grid.yPixels);

	// rank is which 'coloumn', i.e distance from the top-left corner
	var rank = Math.floor(2*grid.size*(Q3*xPixel + yPixel)/(2*grid.yPixels))

	// now determine whether this is the up or the down triangle inside the diamond
	var x;
	var y;
	if (yPixel <= Q3*(xPixel - (grid.xPixels*(rank - depth)/(2*grid.size)))) {
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

// return the horizontal offset in pixels
// based on the current scroll position
BoundedTriangular.prototype.x_scroll_pixel = function (xScroll,tilePixels) {}

// return the vertical offset in pixels
// based on the current scroll position
BoundedTriangular.prototype.y_scroll_pixel = function (yScroll,tilePixels) {}

BoundedTriangular.prototype.clip_perimeter = function (grid) {
	// clear the outer area
	var x = grid.x;
	var y = grid.y;
	var width = grid.xPixels;
	var height = grid.yPixels;

	// clear a triangular shaped area
	grid.screen.context.save();
	grid.screen.context.beginPath();
	grid.screen.context.moveTo(x,y);
	grid.screen.context.lineTo(x + width,y);
	grid.screen.context.lineTo(x + width/2,y + height);
	grid.screen.context.lineTo(x,y);
	grid.screen.context.clip();

	grid.screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	grid.screen.context.fillStyle = grid.screen.colour;
	grid.screen.context.fillRect(x,y,width,height);
}
