
// A tiling of squares and triangles. Twice as many triangles (4 orientations) as squares (2 orientations), 
// Rows and columns, sort of. Easiest to imagine a regular square tiling that's chequred 
//    black & white, like a chess board. Now imagine the white squares rotated 30 degrees clockwise
//    and the black tiles rotated 30 degrees widdershins. Now there's diamond shaped gaps
//    between the squares that we fill with equalateral triangles, base to base
// There are 4 tiles per (even-numbered) column and row per size increment
// Squares occur when x%2 == 0 && y%2 == 0
// Even numbered columns contain alternating squares and left/right pointing triangles
// Even numbered rows contain alternating squares and up/down pointing triangles
// Odd numbered rows and columns only contain triangles every second x/y when %2 == 0
// 0,0 is a left-oriented square (30 degrees widdershins)
// Not every x,y combination is a tile - x and y both odd is invalid
// must be continuous horizontal and vertical

function SnubSquare (shapes) {
	this.name = "Snub Square Tiling";
	this.id = "snub-square";
	this.no = 4;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = false;
	this.faces = 10.0/3.0;
	this.complexity = 2.4;
	this.triangle = shapes.triangle;
	this.square = shapes.square;
}

SnubSquare.prototype = new Tiling();

SnubSquare.prototype.x_pixels = function (yPixels, size) { return yPixels }

SnubSquare.prototype.y_pixels = function (xPixels, size) { return xPixels }

SnubSquare.prototype.tiles = function (size) {
	return (12 * size**2);
}

// return the size that will give the number of tiles closest to the given number
SnubSquare.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/12));
}

// create sized shapes for a new grid
SnubSquare.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.square = this.square.newSquare(grid);
	return shapes;
}

SnubSquare.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
	}
	tilePixels = 2*grid.xPixels/(2*(Q3 + 1)*grid.size + 1);
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	grid.columnLocations = {square: {right: [], left: []}, triangle: {up: [], right: [], down: [], left: []}};
	grid.rowLocations = {square: {right: [], left: []}, triangle: {up: [], right: [], down: [], left: []}};

	var triangleHeight = Q3*tilePixels/2;
	var scrollCellSize = (Q3 + 1)*tilePixels/2;

	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = column*scrollCellSize/2;

		// even-numbered columns contain squares and left and right triangles
		// up and down triangles in the odd-numbered columns
		if (modulo(column,2) == 0) {
			grid.columnLocations.square.right.push(columnLocation + scrollCellSize/2);
			grid.columnLocations.square.left.push(columnLocation + scrollCellSize/2);
			grid.columnLocations.triangle.up.push(null);
			grid.columnLocations.triangle.right.push(columnLocation + triangleHeight/3);
			grid.columnLocations.triangle.down.push(null);
			grid.columnLocations.triangle.left.push(columnLocation + tilePixels/2 + 2*triangleHeight/3);
		} else {
			grid.columnLocations.square.right.push(null);
			grid.columnLocations.square.left.push(null);
			grid.columnLocations.triangle.up.push(columnLocation + scrollCellSize/2);
			grid.columnLocations.triangle.right.push(null);
			grid.columnLocations.triangle.down.push(columnLocation + scrollCellSize/2);
			grid.columnLocations.triangle.left.push(null);
		}
	}

	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = row*scrollCellSize/2;

		// even-numbered rows contain squares and up and down triangles
		// left & right triangles in the odd-numbered rows
		if (modulo(row,2) == 0) {
			grid.rowLocations.square.right.push(rowLocation + scrollCellSize/2);
			grid.rowLocations.square.left.push(rowLocation + scrollCellSize/2);
			grid.rowLocations.triangle.down.push(rowLocation + triangleHeight/3);
			grid.rowLocations.triangle.right.push(null);
			grid.rowLocations.triangle.up.push(rowLocation + tilePixels/2 + 2*triangleHeight/3);
			grid.rowLocations.triangle.left.push(null);
		} else {
			grid.rowLocations.square.right.push(null);
			grid.rowLocations.square.left.push(null);
			grid.rowLocations.triangle.up.push(null);
			grid.rowLocations.triangle.right.push(rowLocation + scrollCellSize/2);
			grid.rowLocations.triangle.down.push(null);
			grid.rowLocations.triangle.left.push(rowLocation + scrollCellSize/2);
		}
	}
}

SnubSquare.prototype.shape = function (shapes, x, y) {
	if (modulo(x + y,2) == 0) {
		return shapes.square;
	} else {
		return shapes.triangle;
	}
}

SnubSquare.prototype.orientation = function (x, y) {
	switch (modulo(x + y,4)) {
		case 0: return "left";
		case 2: return "right";
		case 1: return (modulo(x,2) == 0) ? "left" : "down";
		case 3: return (modulo(x,2) == 0) ? "right" : "up";
	}
}

// odd-numbered columns only contain even rows (and vice-versa obv)
// left&right triangles are in the odd rows
// up&down triangles are in the odd columns
SnubSquare.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 1) continue;
		break;
	}
	return [x,y];
}

SnubSquare.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n":           y -= 2; break;
		case "nne":         y--;    break;
		case "nee": x++;            break;
		case "e":   x += 2;         break;
		case "see": x++;            break;
		case "sse":         y++;    break;
		case "s":           y += 2; break;
		case "ssw":         y++;    break;
		case "sww": x--;            break;
		case "w":   x -= 2;         break;
		case "nww": x--;            break;
		case "nnw":         y--;    break;
	}

	return [x,y];
}

SnubSquare.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var x = 0; x <= maxX; x++) {
		var yIncr = modulo(x,2) == 0 ? 1 : 2;
		for (var y = 0; y <= maxY; y += yIncr) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
SnubSquare.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[shape.name][orientation][x];
	var yPixel = grid.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
SnubSquare.prototype.tile_at = function (grid, xPixel, yPixel) {
	var scrollCellSize = (Q3 + 1)*grid.tilePixels/2;
	var triangleHeight = Q3*grid.tilePixels/2;

	// which (scroll) row, column the click was inside
	var column = Math.floor(xPixel/scrollCellSize);
	var row = Math.floor(yPixel/scrollCellSize);

	// the top left corner of the area defined by the row & column
	var columnPixel = column*scrollCellSize;
	var rowPixel = row*scrollCellSize;

	// the location relative to the row&column area
	xPixel -= columnPixel;
	yPixel -= rowPixel;

	// apply scroll to row & column
	column = modulo(column - grid.xScroll, 2*grid.size);
	row = modulo(row - grid.yScroll, 2*grid.size);

	var x = column*2;
	var y = row*2;

	// the square cell defined by the row and column
	// contains a square tile, tilted either to the left or right
	// the corners of the square tile touch the sides of the square cell
	// the corners of the cell are each filled with half of a triangle tile
	if (modulo(column + row, 2) == 0) {
		// cell contains a left-tilted square
		if (xPixel + Q3*yPixel < triangleHeight) {
			// left-pointing triangle in top left corner: y - 1
			y--;
		} else if (Q3*(scrollCellSize - xPixel) + yPixel < triangleHeight) {
			// downward-pointing triangle in top right corner: x + 1
			x++;
		} else if ((scrollCellSize - xPixel) + Q3*(scrollCellSize - yPixel) < triangleHeight) {
			// right-pointing triangle in bottom right corner: y + 1
			y++;
		} else if (Q3*xPixel + (scrollCellSize - yPixel) < triangleHeight) {
			// upward-pointing triangle in bottom left corner: x - 1
			x--;
		} else {
			// left-tilted square, in the middle
		}
	} else {
		// cell contains a right-tilted square
		if ((scrollCellSize - xPixel) + Q3*yPixel < triangleHeight) {
			// right-pointing triangle in top right corner: y - 1
			y--;
		} else if (Q3*(scrollCellSize - xPixel) + (scrollCellSize - yPixel) < triangleHeight) {
			// upward-pointing triangle in bottom right corner: x + 1
			x++;
		} else if (xPixel + Q3*(scrollCellSize - yPixel) < triangleHeight) {
			// left-pointing triangle in bottom left corner: y + 1
			y++;
		} else if (Q3*xPixel + yPixel < triangleHeight) {
			// downward-pointing triangle in top left corner: x - 1
			x--;
		} else {
			// right-tilted square, in the middle
		}
	}

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
SnubSquare.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	return xScroll*(Q3 + 1)*tilePixels/2;
}

// return the vertical offset in pixels
// based on the current scroll position
SnubSquare.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	return yScroll*(Q3 + 1)*tilePixels/2;
}
