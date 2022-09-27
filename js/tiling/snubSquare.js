
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

SnubSquare.prototype.newGrid = function (grid) {
	return new SnubSquareGrid(grid,this);
}


function SnubSquareGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.square = this.tiling.square.newSquare(grid);
	this.shapes = [this.triangle,this.square];
}

SnubSquareGrid.prototype = new TilingGrid();

SnubSquareGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
	}
	tilePixels = 2*grid.xPixels/(2*(Q3 + 1)*grid.size + 1);
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	this.columnLocations = {square: {right: [], left: []}, triangle: {up: [], right: [], down: [], left: []}};
	this.rowLocations = {square: {right: [], left: []}, triangle: {up: [], right: [], down: [], left: []}};

	var triangleHeight = Q3*tilePixels/2;
	var scrollCellSize = (Q3 + 1)*tilePixels/2;

	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = column*scrollCellSize/2;

		// even-numbered columns contain squares and left and right triangles
		// up and down triangles in the odd-numbered columns
		if (modulo(column,2) == 0) {
			this.columnLocations.square.right.push(columnLocation + scrollCellSize/2);
			this.columnLocations.square.left.push(columnLocation + scrollCellSize/2);
			this.columnLocations.triangle.up.push(null);
			this.columnLocations.triangle.right.push(columnLocation + triangleHeight/3);
			this.columnLocations.triangle.down.push(null);
			this.columnLocations.triangle.left.push(columnLocation + tilePixels/2 + 2*triangleHeight/3);
		} else {
			this.columnLocations.square.right.push(null);
			this.columnLocations.square.left.push(null);
			this.columnLocations.triangle.up.push(columnLocation + scrollCellSize/2);
			this.columnLocations.triangle.right.push(null);
			this.columnLocations.triangle.down.push(columnLocation + scrollCellSize/2);
			this.columnLocations.triangle.left.push(null);
		}
	}

	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = row*scrollCellSize/2;

		// even-numbered rows contain squares and up and down triangles
		// left & right triangles in the odd-numbered rows
		if (modulo(row,2) == 0) {
			this.rowLocations.square.right.push(rowLocation + scrollCellSize/2);
			this.rowLocations.square.left.push(rowLocation + scrollCellSize/2);
			this.rowLocations.triangle.down.push(rowLocation + triangleHeight/3);
			this.rowLocations.triangle.right.push(null);
			this.rowLocations.triangle.up.push(rowLocation + tilePixels/2 + 2*triangleHeight/3);
			this.rowLocations.triangle.left.push(null);
		} else {
			this.rowLocations.square.right.push(null);
			this.rowLocations.square.left.push(null);
			this.rowLocations.triangle.up.push(null);
			this.rowLocations.triangle.right.push(rowLocation + scrollCellSize/2);
			this.rowLocations.triangle.down.push(null);
			this.rowLocations.triangle.left.push(rowLocation + scrollCellSize/2);
		}
	}
}

SnubSquareGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.square.resize();
}

SnubSquareGrid.prototype.shape = function (x,y) {
	if (modulo(x + y,2) == 0) {
		return this.square;
	} else {
		return this.triangle;
	}
}

SnubSquareGrid.prototype.orientation = function (x,y) {

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
SnubSquareGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 1) continue;
		break;
	}
	return [x,y];
}

SnubSquareGrid.prototype.neighbour = function (x,y,direction) {
	var xMax = this.grid.xMax;
	var yMax = this.grid.yMax;

	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	var shape = this.shape(x,y).name;
	var orientation = this.orientation(x,y);

	switch (shape+"-"+orientation+"-"+direction) {
		case "square-left-nnw":
		case "square-right-nne":
			neighbour.y --;
			if (neighbour.y < 0) neighbour.y = yMax;
			break;
		case "square-left-nee":
		case "square-right-see":
			neighbour.x ++;
			break;
		case "square-left-sse":
		case "square-right-ssw":
			neighbour.y ++;
			break;
		case "square-left-sww":
		case "square-right-nww":
			neighbour.x --;
			if (neighbour.x < 0) neighbour.x = xMax;
			break;
		case "triangle-left-e":
			neighbour.x += 2;
			if (neighbour.x > xMax) neighbour.x = 0;
			break;
		case "triangle-right-w":
			neighbour.x -= 2;
			if (neighbour.x < 0) neighbour.x = xMax - 1;
			break;
		case "triangle-right-nne":
		case "triangle-left-nnw":
			neighbour.y --;
			break;
		case "triangle-right-sse":
		case "triangle-left-ssw":
			neighbour.y ++;
			if (neighbour.y > yMax) neighbour.y = 0;
			break;
		case "triangle-down-n":
			neighbour.y -= 2;
			if (neighbour.y < 0) neighbour.y = yMax - 1;
			break;
		case "triangle-up-s":
			neighbour.y += 2;
			if (neighbour.y > yMax) neighbour.y = 0;
			break;
		case "triangle-down-see":
		case "triangle-up-nee":
			neighbour.x ++;
			if (neighbour.x > xMax) neighbour.x = 0;
			break;
		case "triangle-down-sww":
		case "triangle-up-nww":
			neighbour.x --;
			break;
	}

	return neighbour;
}

SnubSquareGrid.prototype.eachTile = function (tileFunction) {
	for (var x = 0; x <= this.grid.xMax; x++) {
		var yIncr = modulo(x,2) == 0 ? 1 : 2;
		for (var y = 0; y <= this.grid.yMax; y += yIncr) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
SnubSquareGrid.prototype.tileLocation = function (x,y,rotation) {

	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[shape.name][orientation][x];
	var yPixel = this.rowLocations[shape.name][orientation][y];

	//console.log("location of",shape.name,orientation,x,y,"is",xPixel,yPixel);

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
SnubSquareGrid.prototype.tileAt = function (xPixel,yPixel) {
	var gridSize = this.grid.size;
	var tileSize = this.grid.tilePixels;
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

	var scrollCellSize = (Q3 + 1)*tileSize/2;
	var triangleHeight = Q3*tileSize/2;

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
	column = modulo(column - xScroll, 2*gridSize);
	row = modulo(row - yScroll, 2*gridSize);

	x = column*2;
	y = row*2;

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

	//console.log("tile is",x,y);
	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));

	return [x,y];
}

SnubSquareGrid.prototype.updateScroll = function (direction) {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	var scrollCellSize = (Q3 + 1)*this.grid.tilePixels/2;
	this.grid.xScrollPixel = xScroll*scrollCellSize;
	this.grid.yScrollPixel = yScroll*scrollCellSize;

	// console.log("scroll @",xScroll,yScroll,"pixel @ ",this.grid.xScrollPixel,this.grid.yScrollPixel);

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
