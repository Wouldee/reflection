
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

// not used~~~
Triangular.prototype.maxSize = function (xPixels,yPixels) {
	if (this.x_pixels(yPixels,size) < xPixels) {
		// tile size is restricted by the screen height
		return Math.floor(yPixels / (Q3*tilePixels));
	} else {
		return Math.floor((2*xPixels/tilePixels - 1) / 4);
	}
}

// create sized shapes for a new grid...
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

Triangular.prototype.shape = function (grid, x, y) {
	return grid.shapes.triangle;
}

Triangular.prototype.orientation = function (grid, x, y) {
	if (modulo(x + y,2) == 0) {
		// point is downward
		return "down";
	} else {
		// point is upward
		return "up";
	}
}

Triangular.prototype.neighbour = function (grid, x, y, direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) {
				if (!grid.yContinuous) return null;
				neighbour.y = grid.yMax;
			}
			break;
		case "nee":
		case "see": 
			neighbour.x++;
			if (neighbour.x > grid.xMax) neighbour.x = 0;
			break;
		case "nww":
		case "sww":
			neighbour.x--;
			if (neighbour.x < 0) neighbour.x = grid.xMax;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.y > grid.yMax) {
				if (!grid.yContinuous) return null;
				neighbour.y = 0
			}
			break;
	}

	return neighbour;
}

// return the x y pixel at the centre of the tile
Triangular.prototype.tile_location = function (grid, x, y, rotation) {
	var orientation = this.orientation(grid, x, y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[orientation][y];

	return [xPixel,yPixel];
}

// xCont
// return the x,y of the tile that the pixel position is inside of
Triangular.prototype.tile_at = function (grid, xPixel, yPixel) {
	var gridSize = grid.size;
	var tileSize = this.tilePixels;
	var xPixels = this.xPixels;
	var yPixels = this.yPixels;
	var xMax = this.xMax;
	var yMax = this.yMax;
	var xScroll = this.xScroll;
	var yScroll = this.yScroll;

	var x;
	var y;

	// check we are inside the grid
	if (xPixel < 0)                        return []; // beyond the left edge
	if (xPixel > grid.xPixels)             return []; // beyond the right edge
	if (yPixel < 0)                        return []; // beyond the top edge
	if (yPixel > grid.yPixels)             return []; // beyond the bottom edge

	// determine the x,y,z of the triangle
	// vertical scroll affects x & z as well as y
	// the effect of horizontal scroll is reversed on z
	var xTriangle = Math.floor((xPixel + yPixel/Q3)/grid.tilePixels - grid.xScroll - grid.yScroll/2);
	var yTriangle = Math.floor(2*yPixel/(Q3*grid.tilePixels)) - grid.yScroll;
	var zTriangle = Math.floor(((grid.xPixels - xPixel) + yPixel/Q3)/grid.tilePixels + 1/2 + grid.xScroll - grid.yScroll/2);
	// console.log("triangle @",xTriangle,yTriangle,zTriangle);

	x = xTriangle - zTriangle + 2*grid.size;
	y = yTriangle;

	x = modulo(x,(grid.xMax + 1));
	y = modulo(y,(grid.yMax + 1));

	return [x,y];
}

Triangular.prototype.update_scroll = function () {
	var xScroll = grid.xScroll;
	var yScroll = grid.yScroll;

	xScroll = modulo(xScroll,grid.xMax + 1);
	yScroll = modulo(yScroll,grid.yMax + 1);

	grid.xScrollPixel = xScroll*grid.tilePixels;
	grid.yScrollPixel = yScroll*Q3*grid.tilePixels/2;

	grid.xScroll = xScroll;
	grid.yScroll = yScroll;
}
