
// A tiling of squares and triangles - twice as many triangles as squares
// triangles point to the left or right in equal numbers
// Alternating columns of squares and triangles
// In square columns, y increases by 2 every tile, in triangle columns, y increases by only 1
// x increases by 1 per column
// every second column of squares will be offset by the previous by +/- 1
//   column 0 starts at y = 0, whereas column 2 starts at 1. Column 4 starts at zero again etc
// There are 4 columns per size increment, 6 rows
// Not every x,y combination is a tile - x%4 == 0 && y%2 == 1 is invalid, as is x%4 == 2 && y%2 == 0
// Vertical must be continuous, horizontal is optional

function ElongatedTriangular (shapes) {
	this.name = "Elongated Triangular Tiling";
	this.id = "elongated-triangular";
	this.no = 3;
	this.xContinuous = null;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = false;
	this.faces = 10.0/3.0;
	this.complexity = 2.4;
	this.triangle = shapes.triangle;
	this.square = shapes.square;
}

ElongatedTriangular.prototype = new Tiling();

ElongatedTriangular.prototype.x_pixels = function (yPixels, size) {
	return 2*yPixels*size*(Q3 + 2)/(6*size + 1);
}

ElongatedTriangular.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(6*size + 1)/(2*size*(Q3 + 2))
}

ElongatedTriangular.prototype.tiles = function (size) {
	return (18 * size**2);
}

// return the size that will give the number of tiles closest to the given number
ElongatedTriangular.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/18));
}

// create sized shapes for a new grid
ElongatedTriangular.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.square = this.square.newSquare(grid);
	return shapes;
}

ElongatedTriangular.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
	grid.yMax = 6*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels / (6*grid.size + 1);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels / (grid.size*(Q3 + 2));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	grid.columnLocations = {square: {straight: []}, triangle: {right: [], left: []}};
	grid.rowLocations = [];

	var triangleHeight = Q3*tilePixels/2;
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = Math.floor(column/2)*(tilePixels + triangleHeight);

		// even-numbered columns contain squares, triangles in the odd-numbered columns
		if (modulo(column,2) == 0) {
			grid.columnLocations.square.straight.push(columnLocation + tilePixels/2);
			grid.columnLocations.triangle.right.push(null);
			grid.columnLocations.triangle.left.push(null);
		} else {
			columnLocation += tilePixels;
			grid.columnLocations.square.straight.push(null);
			grid.columnLocations.triangle.right.push(columnLocation + triangleHeight/3);
			grid.columnLocations.triangle.left.push(columnLocation + 2*triangleHeight/3);
		}
	}

	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = (row + 1)*tilePixels/2;
		grid.rowLocations.push(rowLocation);
	}
}


// return the shape of the tile at the given location
ElongatedTriangular.prototype.shape = function (shapes, x, y) {
	if (modulo(x,2) == 0) {
		return shapes.square;
	} else {
		return shapes.triangle;
	}
}

// return the orientation of the tile at the given location
ElongatedTriangular.prototype.orientation = function (x, y) {
	if (modulo(x,2) == 0) {
		return "straight";
	} else if (modulo(x,4) == 1) {
		if (modulo(y,2) == 0) return "right";
		return "left";
	} else {
		if (modulo(y,2) == 0) return "left";
		return "right";
	}
}

// columns containing squares only have alternating values of y
// if the column is a multiple of 4, then only even numbers, otherwise odd
ElongatedTriangular.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if (modulo(x,4) == 0 && modulo(y,2) == 1) continue;
		if (modulo(x,4) == 2 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

ElongatedTriangular.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n":   y -= 2; break;
		case "nne": y--;    break;
		case "e":   x++;    break; 
		case "sse": y++;    break;
		case "s":   y += 2; break;
		case "ssw": y++;    break;
		case "w":   x--;    break;
		case "nnw": y--;    break;
	}

	return [x,y];
}

ElongatedTriangular.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var x = 0; x <= maxX; x++) {
		var yInit = modulo(x,4) == 2 ? 1 : 0;
		var yIncr = modulo(x,2) == 0 ? 2 : 1;
		for (var y = yInit; y <= maxY; y += yIncr) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
ElongatedTriangular.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[shape.name][orientation][x];
	var yPixel = grid.rowLocations[y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
ElongatedTriangular.prototype.tile_at = function (grid, xPixel,yPixel) {
	var triangleHeight = Q3*grid.tilePixels/2;

	var column = 2*Math.floor(xPixel/(grid.tilePixels + triangleHeight));
	var columnPixel = column*(grid.tilePixels + triangleHeight)/2;

	if (modulo(grid.xScroll,2) == 0 && xPixel - columnPixel > grid.tilePixels) {
		column++;
		columnPixel += grid.tilePixels;
	} else if (modulo(grid.xScroll,2) == 1 && xPixel - columnPixel > triangleHeight) {
		column++;
		columnPixel += triangleHeight;
	}

	var row = Math.floor(2*yPixel/grid.tilePixels);
	var rowPixel = row*grid.tilePixels/2;

	// pixel location within column & row
	xPixel -= columnPixel;
	yPixel -= rowPixel;

	// apply scroll to column,, row
	column = modulo(column - grid.xScroll,4*grid.size);
	row = modulo(row - grid.yScroll,6*grid.size);

	var x = column;
	var y = row;

	if (modulo(column,2) == 0) {
		// square
		if ((modulo(column,4) == 0 && modulo(row,2) == 1)
		 || (modulo(column,4) == 2 && modulo(row,2) == 0)) {
			y--;
		}
	} else {
		// triangle
		if ((modulo(column,4) == 1 && modulo(row,2) == 0)
		 || (modulo(column,4) == 3 && modulo(row,2) == 1)) {
			// left triangle to the top-right
			if (xPixel/Q3 > yPixel) y--;
		} else {
			// right triangle to the top-left
			if (xPixel/Q3 + yPixel < grid.tilePixels/2) y--;
		}
	}

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
ElongatedTriangular.prototype.x_scroll_pixel = function (xScroll, tilePixels) {
	return Math.floor(xScroll/2)*tilePixels + Math.floor((xScroll + 1)/2)*tilePixels*Q3/2;
}

// return the vertical offset in pixels
// based on the current scroll position
ElongatedTriangular.prototype.y_scroll_pixel = function (yScroll, tilePixels) {
	return yScroll*tilePixels/2;
}