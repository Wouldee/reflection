
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

TriHexagonal.prototype.newGrid = function (grid) {
	return new TriHexagonalGrid(grid,this);
}

function TriHexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.hexagon = this.tiling.hexagon.newHexagon(grid);
	this.shapes = [this.triangle,this.hexagon];
}

TriHexagonalGrid.prototype = new TilingGrid();

TriHexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = grid.yPixels/(2*Q3*grid.size);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(4*grid.size + 1);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels;
	grid.scrollHeight = grid.yPixels;

	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		this.columnLocations.push((column + 1)*tilePixels);
	}

	this.rowLocations = {hexagon: {flat: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels/2);

		this.rowLocations.hexagon.flat.push(rowLocation);
		this.rowLocations.triangle.down.push(rowLocation + tilePixels/(2*Q3));

		// the up triangles in row 0 actually appear at the bottom
		// so this bit is messy but it makes other things cleaner
		if (row == 0) {
			this.rowLocations.triangle.up.push(grid.yPixels - tilePixels/(2*Q3));
		} else {
			this.rowLocations.triangle.up.push(rowLocation - tilePixels/(2*Q3));
		}
	}
}

TriHexagonalGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.hexagon.resize();
}

// hexagons in the odd-numbered rows
TriHexagonalGrid.prototype.shape = function (x,y) {
	if (modulo(y,2) == 0) {
		return this.triangle;
	} else {
		return this.hexagon;
	}
}

// all hexagons are flat
// up and down triangles alternate
TriHexagonalGrid.prototype.orientation = function (x,y) {
	if (modulo(y,2) == 1) {
		return "flat";
	} else if (modulo(x + y/2,2) == 0) {
		return "up";
	} else {
		return "down";
	}
}

// odd numbered rows only use every second column
TriHexagonalGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if ((modulo(x,2) == 1 && modulo(y,4) == 1) || 
			(modulo(x,2) == 0 && modulo(y,4) == 3)) continue;
		break;
	}
	return [x,y];
}

TriHexagonalGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			// the northward pointing triangles in row 0 are actually at the bottom of the screen so			if (neighbour.y < 0) {
			if (!this.grid.yContinuous && (neighbour.y == 0 || neighbour.y == this.grid.yMax)) return null;
			break;
		case "nee":
			neighbour.x++;
			neighbour.y--;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
		case "see": 
			neighbour.x++;
			neighbour.y++;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			// the northward pointing triangles in row 0 are actually at the bottom of the screen so			if (neighbour.y < 0) {
			if (!this.grid.yContinuous && (neighbour.y == 0 || neighbour.y == 1)) return null;
			break;
		case "sww":
			neighbour.x--;
			neighbour.y++;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;
		case "nww":
			neighbour.x--;
			neighbour.y--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;
	}

	return neighbour;
}

TriHexagonalGrid.prototype.eachTile = function (tileFunction) {
	for (var y = 0; y <= this.grid.yMax; y ++) {
		var xInit = modulo(y,4) == 3 ? 1 : 0;
		var xIncr = modulo(y,2) == 0 ? 1 : 2;
		for (var x = xInit; x <= this.grid.xMax; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TriHexagonalGrid.prototype.tileLocation = function (x,y,rotation) {
	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TriHexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	// determine the x,y,z of the triangle
	// same as for triangular
	// in this case, each triangle either corresponds to one triangle tile,
	//    or one-sixth of a hexagon tile
	var xTriangle = Math.floor((xPixel + yPixel/Q3)/tileSize + 1/2 - xScroll - yScroll/2);
	var yTriangle = Math.floor(2*yPixel/(Q3*tileSize)) - yScroll;
	var zTriangle = Math.floor(((xPixels - xPixel) + yPixel/Q3)/tileSize + 1/2 + xScroll - yScroll/2);
	// console.log("triangle @",xTriangle,yTriangle,zTriangle);

	if (modulo(xTriangle,2) == 1 && modulo(yTriangle,2) == 1 && modulo(zTriangle,2) == 0) {
		// up triangle
		y = yTriangle + 1;
		x = 2*((xTriangle - zTriangle - 1)/4 + gridSize);
		// console.log("up triangle @",x,y);
	} else if (modulo(xTriangle,2) == 0 && modulo(yTriangle,2) == 0 && modulo(zTriangle,2) == 1) {
		// down triangle
		y = yTriangle;
		x = 2*((xTriangle - zTriangle - 1)/4 + gridSize);
		// console.log("down triangle @",x,y);
	} else {
		// hexagon
		y = modulo(yTriangle,2) == 0 ? yTriangle + 1 : yTriangle;
		x = Math.floor(2*((xTriangle - zTriangle)/4 + gridSize));

		if ((modulo(y,4) == 1 && modulo(x,2) == 1)
		  || modulo(y,4) == 3 && modulo(x,2) == 0) {
			x--;
		}
		// console.log("hexagon @",x,y);
	}

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));
	// console.log("tile @",x,y);

	return [x,y];
}

TriHexagonalGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	this.grid.xScrollPixel = xScroll*this.grid.tilePixels;
	this.grid.yScrollPixel = yScroll*Q3*this.grid.tilePixels/2;

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
