
// A tiling of triangles
// Rows and columns, +/- y between north and south faces, x +/- y between the other faces
// Each row contains an alternating series of up or down pointing triangles
// Each coloumn also alternates
// There are 4 triangles per row per size, 2 triangles per column
// Triangle at 0,0 points downwards
// Every x,y combination is a tile
// Horizontal must be continuous, vertical is optional

function Triangular (shapes) {
	this.name = "Triangular Tiling";
	this.id = "triangular";
	this.no = 1;
	this.xContinuous = true;
	this.yContinuous = null;
	this.filters = false;
	this.prisms = false;
	this.faces = 3.0;
	this.complexity = 2.0;
	this.triangle = shapes.triangle;
}

Triangular.prototype = new Tiling();

Triangular.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*size + 1)/(2*Q3*size);
}

Triangular.prototype.y_pixels = function (xPixels, size) {
	return 2*Q3*xPixels*size/(4*size + 1);
}

Triangular.prototype.tiles = function (size) {
	return (8 * size**2);
}

// return the size that will give the number of tiles closest to the given number
Triangular.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/8));
}

// create sized shapes for a new grid
Triangular.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	return shapes;
}

Triangular.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
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
		tilePixels = 2*grid.xPixels/(4*grid.size + 1);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - tilePixels/2;
	grid.scrollHeight = grid.yPixels;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		grid.columnLocations.push((column + 1)*tilePixels/2);
	}

	grid.rowLocations = {down: [], up: []};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels/2);
		grid.rowLocations.down.push(rowLocation + tilePixels/(2*Q3));
		grid.rowLocations.up.push(rowLocation + tilePixels/Q3);
	}
}

Triangular.prototype.shape = function (shapes, x, y) {
	return shapes.triangle;
}

Triangular.prototype.orientation = function (x, y) {
	if (modulo(x + y,2) == 0) {
		// point is downward
		return "down";
	} else {
		// point is upward
		return "up";
	}
}

Triangular.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n":   y--; break;
		case "nee": x++; break;
		case "see": x++; break;
		case "nww": x--; break;
		case "sww": x--; break;
		case "s":   y++; break;
	}

	return [x,y];
}

// return the x y pixel at the centre of the tile
Triangular.prototype.tile_location = function (grid, x, y) {
	var orientation = this.orientation(x, y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[orientation][y];

	return [xPixel,yPixel];
}

// xCont
// return the x,y of the tile that the pixel position is inside of
Triangular.prototype.tile_at = function (grid, xPixel, yPixel) {
	// determine the x,y,z of the triangle
	// vertical scroll affects x & z as well as y
	// the effect of horizontal scroll is reversed on z
	var xTriangle = Math.floor((xPixel + yPixel/Q3)/grid.tilePixels - grid.xScroll - grid.yScroll/2);
	var yTriangle = Math.floor(2*yPixel/(Q3*grid.tilePixels)) - grid.yScroll;
	var zTriangle = Math.floor(((grid.xPixels - xPixel) + yPixel/Q3)/grid.tilePixels + 1/2 + grid.xScroll - grid.yScroll/2);
	// console.log("triangle @",xTriangle,yTriangle,zTriangle);

	var x = xTriangle - zTriangle + 2*grid.size;
	var y = yTriangle;

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
Triangular.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	return xScroll*tilePixels;
}

// return the vertical offset in pixels
// based on the current scroll position
Triangular.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	return yScroll*Q3*tilePixels/2;
}