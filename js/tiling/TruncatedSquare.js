
function TruncatedSquare (shapes) {
	this.name = "Truncated Square Tiling";
	this.id = "truncated-square";
	this.no = 9;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6;
	this.complexity = 17/3;
	this.square = shapes.square;
	this.octagon = shapes.octagon;
}

TruncatedSquare.prototype = new Tiling();

TruncatedSquare.prototype.x_pixels = function (yPixels, size) { return yPixels }

TruncatedSquare.prototype.y_pixels = function (xPixels, size) { return xPixels }

TruncatedSquare.prototype.tiles = function (size) {
	return (4 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TruncatedSquare.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/4));
}

TruncatedSquare.prototype.newGrid = function (grid) {
	return new TruncatedSquareGrid(grid,this);
}

function TruncatedSquareGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 2*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	this.calculateDimensions();
	this.square = this.tiling.square.newSquare(grid);
	this.octagon = this.tiling.octagon.newOctagon(grid);
	this.shapes = [this.square,this.octagon];
}

TruncatedSquareGrid.prototype = new TilingGrid();

// calculate the xPixels, yPixels, tilePixels column and row locations
TruncatedSquareGrid.prototype.calculateDimensions = function () {
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
	tilePixels = Q2*grid.xPixels/(2*(Q2 + 1)*grid.size + 1);
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - tilePixels/Q2;
	grid.scrollHeight = grid.yPixels - tilePixels/Q2;

	this.columnLocations = [];
	// calculate the location of every column and row for efficiency
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = tilePixels*(column*(Q2 + 2) + Q2 + 1)/2;
		this.columnLocations.push(columnLocation);
	}

	this.rowLocations = [];
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = tilePixels*(row*(Q2 + 2) + Q2 + 1)/2;
		this.rowLocations.push(rowLocation);
	}
}

TruncatedSquareGrid.prototype.resizeShapes = function () {
	this.square.resize();
	this.octagon.resize();
}

TruncatedSquareGrid.prototype.shape = function (x,y) {
	if (modulo(x + y,2) == 0) {
		return this.octagon;
	} else {
		return this.square;
	}
}

TruncatedSquareGrid.prototype.orientation = function (x,y) {
	return "straight";
}

// odd-numbered columns only contain even rows (and vice-versa obv)
// left&right triangles are in the odd rows
// up&down triangles are in the odd columns
TruncatedSquareGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 1) continue;
		break;
	}
	return [x,y];
}

TruncatedSquareGrid.prototype.neighbour = function (x,y,direction) {
	var xMax = this.grid.xMax;
	var yMax = this.grid.yMax;

	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "nw":
			neighbour.x--;
			if (neighbour.x < 0) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = this.grid.xMax;
			}

		case "n":
			neighbour.y--;
			if (neighbour.y < 0) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = this.grid.yMax;
			}
			break;

		case "ne":
			neighbour.y--;
			if (neighbour.y < 0) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = this.grid.yMax;
			}

		case "e":
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = 0;
			}
			break;

		case "se":
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = 0;
			}
		case "s":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = 0;
			}
			break;

		case "sw":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) {
				if (!this.grid.yContinuous) return null;
				neighbour.y = 0;
			}
		case "w":
			neighbour.x--;
			if (neighbour.x < 0) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = this.grid.xMax;
			}
			break;
	}

	return neighbour;
}

// return the x,y of the tile that the pixel position is inside of
TruncatedSquareGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	// identify the column & row
	var scrollCellSize = (1/Q2 + 1)*tileSize;
	var column = Math.floor(xPixel/scrollCellSize);
	var row = Math.floor(yPixel/scrollCellSize);

	var columnPixel = column*scrollCellSize;
	var rowPixel = row*scrollCellSize;

	// the location relative to the row&column area
	xPixel -= columnPixel;
	yPixel -= rowPixel;

	// apply scroll to row & column
	//column = modulo(column - xScroll, 2*gridSize);
	//row = modulo(row - yScroll, 2*gridSize);

	x = column;
	y = row;

	// check whether the area contains a square or not

	if (modulo(column - xScroll + row + yScroll, 2) == 0) {
		// no square
		// cell almost entirely filled by one octagon
		// top left corner is another octagon
		if ((xPixel + yPixel) < tileSize/Q2) {
			x--;
			y--;
		}
	} else {
		// square in the bottom right corner
		// octagon on the left, another at the top
		if (xPixel > tileSize/Q2 && yPixel > tileSize/Q2) {
			// square
		} else if (xPixel > yPixel) {
			// top octagon
			y--;
		} else {
			// left octagon
			x--;
		}
	}

	//console.log("tile is",x,y);
	x = modulo(x - xScroll,(xMax + 1));
	y = modulo(y - yScroll,(yMax + 1));

	return [x,y];
}

TruncatedSquareGrid.prototype.updateScroll = function (direction) {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	var scrollCellSize = (1/Q2 + 1)*this.grid.tilePixels;
	this.grid.xScrollPixel = xScroll*scrollCellSize;
	this.grid.yScrollPixel = yScroll*scrollCellSize;

	// console.log("scroll @",xScroll,yScroll,"pixel @ ",this.grid.xScrollPixel,this.grid.yScrollPixel);

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
