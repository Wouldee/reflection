// A tiling of hexagons, points up and down, flat to the left & right
// Rows and columns, x changes by two moving east/west, moving any other direction changes x & y by 1
// There are 2 hexagons per row per size increment, only 1 per column, although you do get two rows
// Only half of the x,y combinations are a tile - (x + y)%2 == 1 is invalid
// Must be continuous in both directions

function Hexagonal (shapes) {
	this.name = "Hexagonal Tiling";
	this.id = "hexagonal";
	this.no = 5;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6.0;
	this.complexity = 5.0;
	this.hexagon = shapes.hexagon;
}

Hexagonal.prototype = new Tiling();

Hexagonal.prototype.x_pixels = function (yPixels, size) {
	return Q3*yPixels*(4*size + 1)/(6*size + 1);
}

Hexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(6*size + 1)/(Q3*(4*size + 1));
}

Hexagonal.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
Hexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

// create sized shapes for a new grid
Hexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.hexagon = this.hexagon.newHexagon(grid);
	return shapes;
}

Hexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(6*grid.size + 1);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/(Q3*(4*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - Q3*tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = Q3*(column + 1)*tilePixels/2;
		grid.columnLocations.push(columnLocation);
	}

	this.rowLocations = [];
	for (var row = 0; row <= grid.xMax; row++) {
		var rowLocation = (3*row + 2)*tilePixels/2;
		grid.rowLocations.push(rowLocation);
	}
}

Hexagonal.prototype.shape = function (shapes, x, y) {
	return shapes.hexagon;
}

Hexagonal.prototype.orientation = function (x, y) {
	return "standing";
}

// return random tile
// hexagonal tiling x & y must both be even or both be odd
Hexagonal.prototype.random_tile = function (maxX, maxY) {
	var x = Math.floor(Math.random()*(maxX + 1));
	var y = 2*Math.floor(Math.random()*(maxY + 1)/2) + modulo(x,2);
	return [x,y];
}

Hexagonal.prototype.neighbour = function (x,y,direction, gridSize) {
	switch (direction) {
		case "nne": x++;    y--; break;
		case "e":   x += 2;      break;
		case "sse": x++;    y++; break;
		case "ssw": x--;    y++; break;
		case "w":   x -= 2;      break;
		case "nnw": x--;    y--; break;
	}

	return [x,y];
}

Hexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var x = 0; x <= maxX; x++) {
		var yInit = modulo(x,2) == 0 ? 0 : 1;
		for (var y = yInit; y <= maxY; y += 2) {
			tileFunction(x,y);
		}
	}
}

// return the x,y of the tile that the pixel position is inside of
Hexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	// to find out which hexagon the pixel is in, we need to take three measurements
	// first is just the x location (tx)
	// second is how far in from the top left corner, along the line given by y = x/sqrt(3) (ty)
	// third is the reverse, i.e how far in from the top right corner along the line given by y = (width-x)/sqrt(3) (tz)
	// this will narrow the location down to a triangle. Each hexagon in the grid is made of 6 such triangles
	var xTriangle = Math.floor(2*xPixel/(Q3*grid.tilePixels) - grid.xScroll);
	var yTriangle = Math.floor((xPixel + Q3*yPixel)/(Q3*grid.tilePixels) - grid.xScroll/2 - 3*grid.yScroll/2 - 1/2);
	var zTriangle = Math.floor((grid.xPixels - xPixel + Q3*yPixel)/(Q3*grid.tilePixels) + grid.xScroll/2 - 3*grid.yScroll/2);
	//console.log("triangles",xTriangle,yTriangle,zTriangle);

	var x = xTriangle;
	var y = Math.floor((yTriangle + zTriangle - 2*grid.size)/3);
	if (modulo(x,2) != modulo(y,2)) x--;

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
Hexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	return xScroll*Q3*tilePixels/2;
}

// return the vertical offset in pixels
// based on the current scroll position
Hexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	return yScroll*3*tilePixels/2;
}