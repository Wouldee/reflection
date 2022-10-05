
function TruncatedTriHexagonal (shapes) {
	this.name = "Truncated Tri-hexagonal Tiling";
	this.id = "truncated-trihexagonal";
	this.no = 11;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6.0;
	this.complexity = 8.0;
	this.square = shapes.square;
	this.hexagon = shapes.hexagon;
	this.dodecagon = shapes.dodecagon;
}

TruncatedTriHexagonal.prototype = new Tiling();

TruncatedTriHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*Q3*size + 1)/(6*size + 1);
}

TruncatedTriHexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(6*size + 1)/(4*Q3*size + 1);
}

TruncatedTriHexagonal.prototype.tiles = function (size) {
	return (24 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TruncatedTriHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/24));
}

TruncatedTriHexagonal.prototype.newGrid = function (grid) {
	return new TruncatedTriHexagonalGrid(grid,this);
}

function TruncatedTriHexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 8*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	this.calculateDimensions();
	this.square = this.tiling.square.newSquare(grid);
	this.hexagon = this.tiling.hexagon.newHexagon(grid);
	this.dodecagon = this.tiling.dodecagon.newDodecagon(grid);
	this.shapes = [this.square,this.hexagon,this.dodecagon];
}

TruncatedTriHexagonalGrid.prototype = new TilingGrid();

TruncatedTriHexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/((6*grid.size + 1)*(Q3 + 1));
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/((4*Q3*grid.size + 1)*(Q3 + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels*(Q3 + 1)/2;
	grid.scrollHeight = grid.yPixels - tilePixels*(Q3 + 1)/2;

	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnWidth = (Q3 + 1)*Q3*tilePixels/4;
		var columnLocation = column*columnWidth + (Q3 + 2)*tilePixels/2;
		this.columnLocations.push(columnLocation);

		// even-numbered columns contain dodecagons, straight squares and hexagons
		// right and left squares are in the odd-numbered columns
	}

	this.rowLocations = {dodecagon: {straight: []}, square: {straight: [], right: [], left: []}, hexagon: {high: [], low: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowHeight = 3*tilePixels*(Q3 + 1)/4
		var rowLocation = row*rowHeight + (Q3 + 2)*tilePixels/2;

		this.rowLocations.dodecagon.straight.push(rowLocation);
		this.rowLocations.square.straight.push(rowLocation);
		this.rowLocations.square.right.push(rowLocation);
		this.rowLocations.square.left.push(rowLocation);
		this.rowLocations.hexagon.high.push(rowLocation - tilePixels*(Q3 + 1)/4);
		this.rowLocations.hexagon.low.push(rowLocation + tilePixels*(Q3 + 1)/4);
	}
}

TruncatedTriHexagonalGrid.prototype.resizeShapes = function () {
	this.square.resize();
	this.hexagon.resize();
	this.dodecagon.resize();
}

// hexagons in the odd-numbered rows
TruncatedTriHexagonalGrid.prototype.shape = function (x,y) {
	if (modulo(x,2) == 1 || modulo(x + y,4) == 2) {
		return this.square;
	} else if (modulo(x + y,4) == 0) {
		return this.dodecagon;
	} else {
		return this.hexagon;
	}
}

// all hexagons are flat
TruncatedTriHexagonalGrid.prototype.orientation = function (x,y) {
	if (modulo(y,2) == 0) {
		// dodecagons & (straight) squares
		return "straight";
	} else if (modulo(x,2) == 0) {
		// (flat) hexagons (and also dodecagons & straight squares)
		return "flat";
	} else if (modulo(x - y,4) == 0) {
		return "left";
	} else {
		return "right";
	}
}

// odd numbered rows only use every second column
TruncatedTriHexagonalGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

TruncatedTriHexagonalGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	// directions nee, see, sww, nww have two different cases depending on shape and position
	// either border is between dodecagon & hexagon, or square and hexagon
	// two different types of hexagon, low and high
	// low hexagons at 0,1 2,3 4,1 etc (x - y)%4 is 3
	// high hexagons at 0,3 2,1 4,3 etc (x - y)%4 is 1

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "nne":
			neighbour.x++;
			neighbour.y--;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "nee":
			if (modulo(x,2) == 1 || modulo(x - y,4) == 3) {
				// square | low hexagon
				neighbour.x++;
				if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			} else {
				// dodecagon | high hexagon
				neighbour.x+=2;
				neighbour.y--;
				if (neighbour.x > this.grid.xMax) neighbour.x -= (this.grid.xMax + 1);
				if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			}
			break;
		case "e": 
			neighbour.x+=2;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			break;
		case "see":
			if (modulo(x,2) == 1 || modulo(x - y,4) == 1) {
				// square | high hexagon
				neighbour.x++;
				if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			} else {
				// dodecagon | low hexagon
				neighbour.x+=2;
				neighbour.y++;
				if (neighbour.x > this.grid.xMax) neighbour.x -= (this.grid.xMax + 1);
				if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			}
			break;
		case "sse":
			neighbour.x++;
			neighbour.y++;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "ssw":
			neighbour.x--;
			neighbour.y++;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "sww":
			if (modulo(x,2) == 1 || modulo(x - y,4) == 1) {
				// square | high hexagon
				neighbour.x--;
				if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			} else {
				// dodecagon | low hexagon
				neighbour.x-=2;
				neighbour.y++;
				if (neighbour.x < 0) neighbour.x += (this.grid.xMax + 1);
				if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			}
			break;
		case "w":
			neighbour.x-=2;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax - 1;
			break;
		case "nww":
			if (modulo(x,2) == 1 || modulo(x - y,4) == 3) {
				// square | low hexagon
				neighbour.x--;
				if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			} else {
				// dodecagon | high hexagon
				neighbour.x-=2;
				neighbour.y--;
				if (neighbour.x < 0) neighbour.x += (this.grid.xMax + 1);
				if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			}
			break;
		case "nnw":
			neighbour.x--;
			neighbour.y--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
	}

	//console.log("neighbour of",x,y,direction,"is",neighbour.x,neighbour.y,neighbour.direction);
	return neighbour;
}

TruncatedTriHexagonalGrid.prototype.eachTile = function (tileFunction) {
	for (var y = 0; y <= this.grid.yMax; y ++) {
		var xIncr = modulo(y,2) == 1 ? 1 : 2;
		for (var x = 0; x <= this.grid.xMax; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TruncatedTriHexagonalGrid.prototype.tileLocation = function (x,y) {
	var shape = this.shape(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[x];
	if (shape.name == "hexagon") {
		var position = modulo(x - y,4) == 1 ? "high" : "low";
		var yPixel = this.rowLocations[shape.name][position][y];
	} else {
		var orientation = this.orientation(x,y);
		var yPixel = this.rowLocations[shape.name][orientation][y];
	}

	//console.log("tile",x,y,"is at",xPixel,yPixel);
	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TruncatedTriHexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	var columnWidth = tileSize*Q3*(Q3 + 1)/2
	var rowHeight = tileSize*3*(Q3 + 1)/4

	var column = Math.floor(xPixel/columnWidth);
	var row = Math.floor(yPixel/rowHeight);
	//var row = Math.floor((yPixel - tileSize/4)/rowHeight) + 1;
	// console.log(xPixel,yPixel,"is in column",column,"row",row);

	var columnPixel = column*columnWidth;
	var rowPixel = row*rowHeight;

	xPixel -= columnPixel;
	yPixel -= rowPixel;

	switch (modulo(2*(column - xScroll) + row - yScroll,4)) {
		case 0:
			// dodecagon occupies majority; top-left corner features a hexagon to the left and a left-square to the top
			// assume dodecagon:
			//console.log("top left");
			x = 2*column;
			y = row;
			if (xPixel + Q3*yPixel < tileSize*(Q3 + 1)/2 && Q3*xPixel > yPixel + tileSize*(Q3 - 1)/2) {
				// square
				x--;
				y--;
			} else if (Q3*xPixel + yPixel < tileSize*(Q3 + 1)/2) {
				// hexagon
				x-=2;
				y--;
			}
			break;
		case 1:
			// dodecagon occupies the top, right-square to the bottom
			// two hexagons, one on the left and one in the bottom right corner
			//console.log("bottom left");
			x = 2*column;
			y = row - 1;
			if (yPixel > tileSize*(Q3 + 5)/4 && Q3*xPixel + yPixel > tileSize*(3*Q3 + 11)/4) {
				// hexagon in the bottom left
				y++;
			} else if (xPixel + tileSize*(3*Q3 + 1)/4 < Q3*yPixel && Q3*xPixel + yPixel > 3*tileSize*(Q3 + 1)/4) {
				// square
				x--;
				y++;
			} else if (Q3*xPixel + Q3*tileSize*(Q3 - 1)/4 < yPixel) {
				// hexagon on the left
				y++;
				x-=2;
			}
			break;
		case 2:
			// dodecagon to the bottom left, hexagon to the top right
			// a straight-square in the bottom right and a right-square in the top left
			// assume dodecagon:
			//console.log("top right");
			x = 2*(column - 1);
			y = row;
			if (xPixel > tileSize*(Q3 + 1)/2 && yPixel > tileSize*(Q3 + 1)/2) {
				// straight-square
				x+=2; 
			} else if (Q3*xPixel > yPixel + tileSize && Q3*xPixel + yPixel > 2*tileSize) {
				// hexagon
				x+=2;
				y--;
			} else if (xPixel > Q3*yPixel) {
				// right-square
				x++;
				y--;
			}
			break;
		case 3:
			// dodecagon top left corner, hexagon bottom right
			// straight square top right and left square bottom left
			// also a smidgeon of another hexagon in the bottom left corner
			//console.log("bottom right");
			x = 2*(column - 1);
			y = row - 1;
			if (xPixel > tileSize*(Q3 + 1)/2 && yPixel < Q3*tileSize*(Q3 - 1)/4) {
				// straight-square
				x+=2;
			} else if (Q3*xPixel + yPixel > tileSize*(Q3 + 9)/4 && Q3*xPixel > yPixel + Q3*tileSize*(Q3 - 1)/4) {
				// hexagon
				x+=2;
				y++;
			} else if (xPixel + Q3*yPixel > Q3*tileSize*(Q3 + 5)/4 && Q3*xPixel + tileSize*(Q3 + 5)/4 > yPixel) {
				// left-square
				x++;
				y++;
			} else if (yPixel > tileSize*(Q3 + 5)/4) {
				// hexagon smidgeon
				y++;
			}
			break;
	}

	x = modulo(x - 2*xScroll,(xMax + 1));
	y = modulo(y - yScroll,(yMax + 1));
	// console.log("tile @",x,y);

	return [x,y];
}

TruncatedTriHexagonalGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	var columnWidth = this.grid.tilePixels*Q3*(Q3 + 1)/2
	var rowHeight = this.grid.tilePixels*3*(Q3 + 1)/4

	this.grid.xScrollPixel = xScroll*columnWidth;
	this.grid.yScrollPixel = yScroll*rowHeight;

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
