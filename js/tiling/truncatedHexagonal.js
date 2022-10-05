
function TruncatedHexagonal (shapes) {
	this.name = "Truncated THexagonal Tiling";
	this.id = "truncated-hexagonal";
	this.no = 10;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6.0;
	this.complexity = 8.0;
	this.triangle = shapes.triangle;
	this.dodecagon = shapes.dodecagon;
}

TruncatedHexagonal.prototype = new Tiling();

TruncatedHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(Q3 + 2)*(4*size + 1)/(2*Q3*size*(Q3 + 2) + 1);
}

TruncatedHexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(2*Q3*size*(Q3 + 2) + 1)/((Q3 + 2)*(4*size + 1));
}

TruncatedHexagonal.prototype.tiles = function (size) {
	return (12 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TruncatedHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/12));
}

TruncatedHexagonal.prototype.newGrid = function (grid) {
	return new TruncatedHexagonalGrid(grid,this);
}

function TruncatedHexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.dodecagon = this.tiling.dodecagon.newDodecagon(grid);
	this.shapes = [this.triangle,this.dodecagon];
}

TruncatedHexagonalGrid.prototype = new TilingGrid();

TruncatedHexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(2*Q3*grid.size*(Q3 + 2) + 1);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/((Q3 + 2)*(4*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels*(Q3 + 2)/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = (column + 1)*tilePixels*(Q3 + 2)/2;
		this.columnLocations.push(columnLocation);
	}

	this.rowLocations = {dodecagon: {straight: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {

		var rowLocation = tilePixels*(row*Q3*(Q3 + 2) + 1)/4;

		this.rowLocations.dodecagon.straight.push(rowLocation);
		this.rowLocations.triangle.down.push(rowLocation + tilePixels*(Q3 + 2)/(4*Q3));

		// the up triangles in row 0 actually appear at the bottom
		// so this bit is messy but it makes other things cleaner
		if (row == 0) {
			this.rowLocations.triangle.up.push(grid.yPixels - 2*tilePixels*(Q3 + 1)/(4*Q3));
		} else {
			this.rowLocations.triangle.up.push(rowLocation - tilePixels*(Q3 + 2)/(4*Q3));
		}
	}
}

TruncatedHexagonalGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.dodecagon.resize();
}

// hexagons in the odd-numbered rows
TruncatedHexagonalGrid.prototype.shape = function (x,y) {
	if (modulo(y,2) == 0) {
		return this.triangle;
	} else {
		return this.dodecagon;
	}
}

// all hexagons are flat
// up and down triangles alternate
TruncatedHexagonalGrid.prototype.orientation = function (x,y) {
	if (modulo(y,2) == 1) {
		return "straight";
	} else if (modulo(x + y/2,2) == 0) {
		return "up";
	} else {
		return "down";
	}
}

// odd numbered rows only use every second column
TruncatedHexagonalGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if ((modulo(x,2) == 1 && modulo(y,4) == 1) || 
			(modulo(x,2) == 0 && modulo(y,4) == 3)) continue;
		break;
	}
	return [x,y];
}

TruncatedHexagonalGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			// the northward pointing triangles in row 0 are actually at the bottom of the screen so
			if (!this.grid.yContinuous && (neighbour.y == 0 || neighbour.y == this.grid.yMax)) return null;
			break;
		case "nne":
			neighbour.x++;
			neighbour.y-=2;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0; 
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "nee":
			neighbour.x++;
			neighbour.y--;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "e":
			neighbour.x+=2;
			if (neighbour.x > this.grid.xMax) neighbour.x -= this.grid.xMax + 1; 
			break;
		case "see": 
			neighbour.x++;
			neighbour.y++;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "sse":
			neighbour.x++;
			neighbour.y+=2;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0; 
			if (neighbour.y > this.grid.yMax) neighbour.y = 1;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			// the northward pointing triangles in row 0 are actually at the bottom of the screen so
			if (!this.grid.yContinuous && (neighbour.y == 0 || neighbour.y == 1)) return null;
			break;
		case "ssw":
			neighbour.x--;
			neighbour.y+=2;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax; 
			if (neighbour.y > this.grid.yMax) neighbour.y = 1;
			break;
		case "sww":
			neighbour.x--;
			neighbour.y++;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "w":
			neighbour.x-=2;
			if (neighbour.x < 0) neighbour.x += this.grid.xMax + 1; 
			break;
		case "nww":
			neighbour.x--;
			neighbour.y--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "nnw":
			neighbour.x--;
			neighbour.y-=2;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax; 
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
	}

	return neighbour;
}

TruncatedHexagonalGrid.prototype.eachTile = function (tileFunction) {
	for (var y = 0; y <= this.grid.yMax; y ++) {
		var xInit = modulo(y,4) == 3 ? 1 : 0;
		var xIncr = modulo(y,2) == 0 ? 1 : 2;
		for (var x = xInit; x <= this.grid.xMax; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TruncatedHexagonalGrid.prototype.tileLocation = function (x,y) {
	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[shape.name][orientation][y];

	//console.log("tile",x,y,"located @",xPixel,yPixel);
	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TruncatedHexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	var columnWidth = tileSize*(Q3 + 2)/2
	var rowHeight = tileSize*Q3*(Q3 + 2)/4

	var column = Math.floor(xPixel/columnWidth);
	var row = Math.floor((yPixel - tileSize/4)/rowHeight) + 1;

	var columnPixel = column*columnWidth;
	var rowPixel = (row - 1)*rowHeight + tileSize/4;

	xPixel -= columnPixel;
	yPixel -= rowPixel;

	switch (modulo(2*(column - xScroll) + row - yScroll,4)) {
		case 0:
			// console.log("case 0")
			// mostly top-left dodecagon, up triangle on the right, another dodecagon bottom right
			x = column - 1;
			y = row - 1;
			if (yPixel < tileSize*(Q3 + 1)/2 && yPixel - tileSize/2 > Q3*(columnWidth - xPixel)) {
				// up triangle
				x++;
				y++;
			} else if ((columnWidth - xPixel) + Q3*(rowHeight - yPixel) < tileSize*(Q3 + 2)/4) {
				//bottom right dodecagon
				x++;
				y+=2;
			}
			break;
		case 1:
			x = column;
			y = row;
			// mostly bottom-right dodecagon, down triangle on the left, another dodecagon top left
			if (yPixel > tileSize/4 && Q3*xPixel + yPixel < tileSize*(2*Q3 + 1)/4) {
				// down triangle
				x--;
				y--;
			} else if (xPixel + Q3*yPixel < tileSize*(Q3 + 2)/4) {
				//top left dodecagon
				x--;
				y-=2;
			}
			break;
		case 2:
			x = column;
			y = row - 1;
			// mostly top-right dodecagon, up triangle on the left, another dodecagon bottom left
			if (yPixel < tileSize*(Q3 + 1)/2 && yPixel - tileSize/2 > Q3*xPixel) {
				// up triangle
				x--;
				y++;
			} else if (xPixel + Q3*(rowHeight - yPixel) < tileSize*(Q3 + 2)/4) {
				//bottom left dodecagon
				x--;
				y+=2;
			}
			break;
		case 3:
			x = column - 1;
			y = row;
			// mostly bottom-left dodecagon, down triangle on the right, another dodecagon top right
			if (yPixel > tileSize/4 && Q3*(columnWidth - xPixel) + yPixel < tileSize*(2*Q3 + 1)/4) {
				// down triangle
				x++;
				y--;
			} else if ((columnWidth - xPixel) + Q3*yPixel < tileSize*(Q3 + 2)/4) {
				//top right dodecagon
				x++;
				y-=2;
			}
			break;
	}

	x = modulo(x - xScroll,(xMax + 1));
	y = modulo(y - yScroll,(yMax + 1));
	// console.log("tile @",x,y);

	return [x,y];
}

TruncatedHexagonalGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	var columnWidth = this.grid.tilePixels*(Q3 + 2)/2
	var rowHeight = this.grid.tilePixels*Q3*(Q3 + 2)/4

	this.grid.xScrollPixel = xScroll*columnWidth;
	this.grid.yScrollPixel = yScroll*rowHeight;

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
