
// A tiling of hexagons and triangles
// Rows and columns, +/- y between north and south faces, x +/- y between the other faces
// Each row contains an alternating series of up or down pointing triangles
// Each coloumn also alternates
// There are 4 triangles per row per size, 2 triangles per column
// Triangle at 0,0 points downwards
// Every x,y combination is a tile
// Horizontal must be continuous, vertical is optional

function TriHexagonal (shapes) {
	this.name = "Tri-hexagonal Tiling";
	this.id = "trihexagonal";
	this.no = 7;
	this.xContinuous = true;
	this.yContinuous = null;
	this.filters = null;
	this.prisms = null;
	this.faces = 4.0;
	this.complexity = 3.5;
	this.triangle = shapes.triangle;
	this.hexagon = shapes.hexagon;
}

TriHexagonal.prototype = new Tiling();

TriHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*size + 1)/(2*Q3*size);
}

TriHexagonal.prototype.y_pixels = function (xPixels, size) {
	return 2*Q3*xPixels*size/(4*size + 1);
}

TriHexagonal.prototype.tiles = function (size) {
	return (12 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TriHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/12));
}

// create sized shapes for a new grid
TriHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.hexagon = this.hexagon.newHexagon(grid);
	return shapes;
}

TriHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels/(2*Q3*grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(4*grid.size + 1);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels;
	grid.scrollHeight = grid.yPixels;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		grid.columnLocations.push((column + 1)*tilePixels);
	}

	grid.rowLocations = {hexagon: {flat: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels/2);

		grid.rowLocations.hexagon.flat.push(rowLocation);
		grid.rowLocations.triangle.down.push(rowLocation + tilePixels/(2*Q3));

		// the up triangles in row 0 actually appear at the bottom
		// so this bit is messy but it makes other things cleaner
		if (row == 0) {
			grid.rowLocations.triangle.up.push(grid.yPixels - tilePixels/(2*Q3));
		} else {
			grid.rowLocations.triangle.up.push(rowLocation - tilePixels/(2*Q3));
		}
	}
}

// hexagons in the odd-numbered rows
TriHexagonal.prototype.shape = function (shapes, x, y) {
	if (modulo(y,2) == 0) {
		return shapes.triangle;
	} else {
		return shapes.hexagon;
	}
}

// all hexagons are flat
// up and down triangles alternate
TriHexagonal.prototype.orientation = function (x ,y) {
	if (modulo(y,2) == 1) {
		return "flat";
	} else if (modulo(x + y/2,2) == 0) {
		return "up";
	} else {
		return "down";
	}
}

// odd numbered rows only use every second column
TriHexagonal.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if ((modulo(x,2) == 1 && modulo(y,4) == 1) || 
			(modulo(x,2) == 0 && modulo(y,4) == 3)) continue;
		break;
	}
	return [x,y];
}

TriHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	/* See also truncated hexagonal
	the northward pointing triangles in row 0 are actually at the bottom of the screen
	so if we've gone north and arrived at y = 0, then we crossed the edge, 
	and vice-versa when travelling south and arriving at y == 1
	in both of these cases, increase y by maxY + 1, so that grid.neighbour
	knows we've crossed the edge (continuous v non-continuous behaviour)
	similarly, when travelling sww or see and arriving at maxY + 1, we haven't
	actually crossed the edge, so set y to be zero, and vice versa when travelling
	nee or nww and arriving at -1 */
	var maxY = 4*gridSize - 1

	switch (direction) {
		case "n":        y--; if (y == 0)        y = maxY + 1; break;
		case "nee": x++; y--; if (y == -1)       y = maxY;     break;
		case "see": x++; y++; if (y == maxY + 1) y = 0;        break;
		case "s":        y++; if (y == 1)        y = maxY + 2; break;
		case "sww": x--; y++; if (y == maxY + 1) y = 0;        break;
		case "nww": x--; y--; if (y == -1)       y = maxY;     break;
	}

	return [x,y];
}

TriHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var y = 0; y <= maxY; y ++) {
		var xInit = modulo(y,4) == 3 ? 1 : 0;
		var xIncr = modulo(y,2) == 0 ? 1 : 2;
		for (var x = xInit; x <= maxX; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TriHexagonal.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TriHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	// determine the x,y,z of the triangle
	// same as for triangular
	// in this case, each triangle either corresponds to one triangle tile,
	//    or one-sixth of a hexagon tile
	var xTriangle = Math.floor((xPixel + yPixel/Q3)/grid.tilePixels + 1/2 - grid.xScroll - grid.yScroll/2);
	var yTriangle = Math.floor(2*yPixel/(Q3*grid.tilePixels)) - grid.yScroll;
	var zTriangle = Math.floor(((grid.xPixels - xPixel) + yPixel/Q3)/grid.tilePixels + 1/2 + grid.xScroll - grid.yScroll/2);

	var x;
	var y;
	if (modulo(xTriangle,2) == 1 && modulo(yTriangle,2) == 1 && modulo(zTriangle,2) == 0) {
		// up triangle
		y = yTriangle + 1;
		x = 2*((xTriangle - zTriangle - 1)/4 + grid.size);
	} else if (modulo(xTriangle,2) == 0 && modulo(yTriangle,2) == 0 && modulo(zTriangle,2) == 1) {
		// down triangle
		y = yTriangle;
		x = 2*((xTriangle - zTriangle - 1)/4 + grid.size);
	} else {
		// hexagon
		y = modulo(yTriangle,2) == 0 ? yTriangle + 1 : yTriangle;
		x = Math.floor(2*((xTriangle - zTriangle)/4 + grid.size));

		if ((modulo(y,4) == 1 && modulo(x,2) == 1)
		  || modulo(y,4) == 3 && modulo(x,2) == 0) {
			x--;
		}
	}

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
TriHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	return xScroll*tilePixels;
}

// return the vertical offset in pixels
// based on the current scroll position
TriHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	return yScroll*Q3*tilePixels/2;
}