
// A tiling of triangles
// Rows and columns, +/- y between north and south faces, x +/- y between the other faces
// Each row contains an alternating series of up or down pointing triangles
// Each coloumn also alternates
// There are 4 triangles per row per size, 2 triangles per column
// Triangle at 0,0 points downwards
// Every x,y combination is a tile
// Horizontal must be continuous, vertical is optional

function Triangular (shapes) {
	this.name = "Triangular Tiling";
	this.id = "triangular";
	this.no = 1;
	this.xContinuous = true;
	this.yContinuous = null;
	this.filters = false;
	this.prisms = false;
	this.faces = 3.0;
	this.complexity = 2.0;
	this.triangle = shapes.triangle;
}

Triangular.prototype = new Tiling();

Triangular.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*size + 1)/(2*Q3*size);
}

Triangular.prototype.y_pixels = function (xPixels, size) {
	return 2*Q3*xPixels*size/(4*size + 1);
}

Triangular.prototype.tiles = function (size) {
	return (8 * size**2);
}

// return the size that will give the number of tiles closest to the given number
Triangular.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/8));
}

// not used~~~
Triangular.prototype.maxSize = function (xPixels,yPixels) {
	if (this.x_pixels(yPixels,size) < xPixels) {
		// tile size is restricted by the screen height
		return Math.floor(yPixels / (Q3*tilePixels));
	} else {
		return Math.floor((2*xPixels/tilePixels - 1) / 4);
	}
}

Triangular.prototype.newGrid = function (grid) {
	return new TriangularGrid(grid,this);
}

function TriangularGrid () {
	// call generic initialise function in grid.js
	this.initialise(...arguments);

	this.xMax = 4*this.size - 1;
	this.yMax = 2*this.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(this);
	this.shapes = [this.triangle];
}

TriangularGrid.prototype = new Grid();

TriangularGrid.prototype.calculateDimensions = function () {
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(this.yPixels,this.size) < this.xPixels) {
		// tile size is restricted by the screen height
		this.xPixels = tiling.x_pixels(this.yPixels,this.size);
		tilePixels = this.yPixels/(Q3*this.size);
	} else {
		this.yPixels = tiling.y_pixels(this.xPixels,this.size);
		tilePixels = 2*this.xPixels/(4*this.size + 1);
	}
	this.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	this.scrollWidth = this.xPixels - tilePixels/2;
	this.scrollHeight = this.yPixels;

	this.columnLocations = [];
	for (var column = 0; column <= this.xMax; column++) {
		this.columnLocations.push((column + 1)*tilePixels/2);
	}

	this.rowLocations = {down: [], up: []};
	for (var row = 0; row <= this.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels/2);
		this.rowLocations.down.push(rowLocation + tilePixels/(2*Q3));
		this.rowLocations.up.push(rowLocation + tilePixels/Q3);
	}
}

TriangularGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
}

TriangularGrid.prototype.shape = function () {
	return this.triangle;
}

TriangularGrid.prototype.orientation = function (x,y) {
	if (modulo(x + y,2) == 0) {
		// point is downward
		return "down";
	} else {
		// point is upward
		return "up";
	}
}

// xCont
TriangularGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.y < 0) {
				if (!this.yContinuous) return null;
				neighbour.y = this.yMax;
			}
			break;
		case "nee":
		case "see": 
			neighbour.x++;
			if (neighbour.x > this.xMax) neighbour.x = 0;
			break;
		case "nww":
		case "sww":
			neighbour.x--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.y > this.yMax) {
				if (!this.yContinuous) return null;
				neighbour.y = 0
			}
			break;
	}

	return neighbour;
}

// return the x y pixel at the centre of the tile
TriangularGrid.prototype.tileLocation = function (x,y,rotation) {
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[orientation][y];

	return [xPixel,yPixel];
}

// xCont
// return the x,y of the tile that the pixel position is inside of
TriangularGrid.prototype.tileAt = function (xPixel,yPixel) {
	var gridSize = this.size;
	var tileSize = this.tilePixels;
	var xPixels = this.xPixels;
	var yPixels = this.yPixels;
	var xMax = this.xMax;
	var yMax = this.yMax;
	var xScroll = this.xScroll;
	var yScroll = this.yScroll;

	var x;
	var y;

	// check we are inside the grid
	if (xPixel < 0)                   return []; // beyond the left edge
	if (xPixel > xPixels)             return []; // beyond the right edge
	if (yPixel < 0)                   return []; // beyond the top edge
	if (yPixel > yPixels)             return []; // beyond the bottom edge

	// determine the x,y,z of the triangle
	// vertical scroll affects x & z as well as y
	// the effect of horizontal scroll is reversed on z
	var xTriangle = Math.floor((xPixel + yPixel/Q3)/tileSize - xScroll - yScroll/2);
	var yTriangle = Math.floor(2*yPixel/(Q3*tileSize)) - yScroll;
	var zTriangle = Math.floor(((xPixels - xPixel) + yPixel/Q3)/tileSize + 1/2 + xScroll - yScroll/2);
	// console.log("triangle @",xTriangle,yTriangle,zTriangle);

	x = xTriangle - zTriangle + 2*gridSize;
	y = yTriangle;

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));

	return [x,y];
}

TriangularGrid.prototype.updateScroll = function () {
	var xScroll = this.xScroll;
	var yScroll = this.yScroll;

	xScroll = modulo(xScroll,this.xMax + 1);
	yScroll = modulo(yScroll,this.yMax + 1);

	this.xScrollPixel = xScroll*this.tilePixels;
	this.yScrollPixel = yScroll*Q3*this.tilePixels/2;

	this.xScroll = xScroll;
	this.yScroll = yScroll;
}
