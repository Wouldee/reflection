// A tiling of hexagons, points up and down, flat to the left & right
// Rows and columns, x changes by two moving east/west, moving any other direction changes x & y by 1
// There are 2 hexagons per row per size increment, only 1 per column, although you do get two rows
// Only half of the x,y combinations are a tile - (x + y)%2 == 1 is invalid
// Must be continuous in both directions

function Hexagonal (shapes) {
	this.name = "Hexagonal Tiling";
	this.id = "hexagonal";
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

Hexagonal.prototype.newGrid = function (grid) {
	return new HexagonalGrid(grid,this);
}


function HexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 4*grid.size - 1;
	grid.yMax = 2*grid.size - 1;

	this.calculateDimensions();
	this.hexagon = this.tiling.hexagon.newHexagon(grid);
	this.shapes = [this.hexagon];
}

HexagonalGrid.prototype = new TilingGrid();

HexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(6*grid.size + 1);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/(Q3*(4*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels - Q3*tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = Q3*(column + 1)*tilePixels/2;
		this.columnLocations.push(columnLocation);
	}

	this.rowLocations = [];
	for (var row = 0; row <= grid.xMax; row++) {
		var rowLocation = (3*row + 2)*tilePixels/2;
		this.rowLocations.push(rowLocation);
	}
}


HexagonalGrid.prototype.resizeShapes = function () {
	this.hexagon.resize();
}

HexagonalGrid.prototype.shape = function (x,y) {
	return this.hexagon;
}

HexagonalGrid.prototype.orientation = function (x,y) {
	return "standing";
}

// return random tile
// hexagonal tiling x & y must both be even or both be odd
HexagonalGrid.prototype.randomTile = function () {
	var x = Math.floor(Math.random()*(this.grid.xMax + 1));
	var y = 2*Math.floor(Math.random()*(this.grid.yMax + 1)/2) + modulo(x,2);
	return [x,y];
}

HexagonalGrid.prototype.neighbour = function (x,y,direction) {
	var xMax = this.grid.xMax;
	var yMax = this.grid.yMax;

	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "nne":
			neighbour.x ++;
			neighbour.y --;
			if (neighbour.x > xMax) neighbour.x = 0;
			if (neighbour.y < 0) neighbour.y = yMax;
			break;
		case "e":
			neighbour.x += 2;
			if (neighbour.x > xMax) neighbour.x = modulo(neighbour.x,xMax + 1);
			break;
		case "sse":
			neighbour.x ++;
			neighbour.y ++;
			if (neighbour.x > xMax) neighbour.x = 0;
			if (neighbour.y > yMax) neighbour.y = 0;
			break;
		case "ssw":
			neighbour.x --;
			neighbour.y ++;
			if (neighbour.x < 0) neighbour.x = xMax;
			if (neighbour.y > yMax) neighbour.y = 0;
			break;
		case "w":
			neighbour.x -= 2;
			if (neighbour.x < 0) neighbour.x = modulo(neighbour.x,xMax + 1);
			break;
		case "nnw":
			neighbour.x --;
			neighbour.y --;
			if (neighbour.x < 0) neighbour.x = xMax;
			if (neighbour.y < 0) neighbour.y = yMax;
			break;
	}

	return neighbour;
}

HexagonalGrid.prototype.eachTile = function (tileFunction) {
	for (var x = 0; x <= this.grid.xMax; x++) {
		var yInit = modulo(x,2) == 0 ? 0 : 1;
		for (var y = yInit; y <= this.grid.yMax; y += 2) {
			tileFunction(x,y);
		}
	}
}

// return the x,y of the tile that the pixel position is inside of
HexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	// to find out which hexagon the pixel is in, we need to take three measurements
	// first is just the x location (tx)
	// second is how far in from the top left corner, along the line given by y = x/sqrt(3) (ty)
	// third is the reverse, i.e how far in from the top right corner along the line given by y = (width-x)/sqrt(3) (tz)
	// this will narrow the location down to a triangle. Each hexagon in the grid is made of 6 such triangles
	var xTriangle = Math.floor(2*xPixel/(Q3*tileSize) - xScroll);
	var yTriangle = Math.floor((xPixel + Q3*yPixel)/(Q3*tileSize) - xScroll/2 - 3*yScroll/2 - 1/2);
	var zTriangle = Math.floor((xPixels - xPixel + Q3*yPixel)/(Q3*tileSize) + xScroll/2 - 3*yScroll/2);
	//console.log("triangles",xTriangle,yTriangle,zTriangle);


	x = xTriangle;
	y = Math.floor((yTriangle + zTriangle - 2*gridSize)/3);
	if (modulo(x,2) != modulo(y,2)) x--;

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));
	//console.log("tile is",x,y,"(",yTriangle,"+",zTriangle,"- 2 * ",gridSize,")");

	return [x,y];
}

HexagonalGrid.prototype.updateScroll = function (direction) {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	var scrollCellSize = (Q3 + 1)*this.grid.tilePixels/2;
	this.grid.xScrollPixel = xScroll*Q3*this.grid.tilePixels/2;
	this.grid.yScrollPixel = yScroll*3*this.grid.tilePixels/2;

	// console.log("scroll @",xScroll,yScroll,"pixel @ ",this.grid.xScrollPixel,this.grid.yScrollPixel);

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
