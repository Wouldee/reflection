
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

ElongatedTriangular.prototype.newGrid = function (grid) {
	return new ElongatedTriangularGrid(grid,this);
}

function ElongatedTriangularGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 4*grid.size - 1;
	grid.yMax = 6*grid.size - 1;

	this.calculateDimensions();
	// load the shapes
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.square = this.tiling.square.newSquare(grid);
	this.shapes = [this.triangle,this.square];
}

ElongatedTriangularGrid.prototype = new TilingGrid();

ElongatedTriangularGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels / (6*grid.size + 1);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels / (grid.size*(Q3 + 2));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// calculate the location of every column and row for efficiency
	this.columnLocations = {square: {straight: []}, triangle: {right: [], left: []}};
	this.rowLocations = [];

	var triangleHeight = Q3*tilePixels/2;
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = Math.floor(column/2)*(tilePixels + triangleHeight);

		// even-numbered columns contain squares, triangles in the odd-numbered columns
		if (modulo(column,2) == 0) {
			this.columnLocations.square.straight.push(columnLocation + tilePixels/2);
			this.columnLocations.triangle.right.push(null);
			this.columnLocations.triangle.left.push(null);
		} else {
			columnLocation += tilePixels;
			this.columnLocations.square.straight.push(null);
			this.columnLocations.triangle.right.push(columnLocation + triangleHeight/3);
			this.columnLocations.triangle.left.push(columnLocation + 2*triangleHeight/3);
		}
	}

	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = (row + 1)*tilePixels/2;
		this.rowLocations.push(rowLocation);
	}
}


ElongatedTriangularGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.square.resize();
}

// return the shape of the tile at the given location
ElongatedTriangularGrid.prototype.shape = function (x,y) {
	if (modulo(x,2) == 0) {
		return this.square;
	} else {
		return this.triangle;
	}
}

// return the orientation of the tile at the given location
ElongatedTriangularGrid.prototype.orientation = function (x,y) {
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
ElongatedTriangularGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (modulo(x,4) == 0 && modulo(y,2) == 1) continue;
		if (modulo(x,4) == 2 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

ElongatedTriangularGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y -= 2;
			if (neighbour.y < 0) neighbour.y += this.grid.yMax + 1;
			break;

		case "nne":
			neighbour.y--;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
			break;

		case "e":
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = 0;
			}
			break;

		case "sse":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;

		case "s":
			neighbour.y += 2;
			if (neighbour.y > this.grid.yMax) neighbour.y -= this.grid.yMax + 1;
			break;

		case "ssw":
			neighbour.y++;
			if (neighbour.y > this.grid.yMax) neighbour.y = 0;
			break;

		case "w":
			neighbour.x--;
			if (neighbour.x < 0) {
				if (!this.grid.xContinuous) return null;
				neighbour.x = this.grid.xMax;
			}
			break;

		case "nnw":
			neighbour.y--;
			if (neighbour.y < 0) neighbour.y = this.grid.yMax;
	}

	return neighbour;
}

ElongatedTriangularGrid.prototype.eachTile = function (tileFunction) {
	for (var x = 0; x <= this.grid.xMax; x++) {
		var yInit = modulo(x,4) == 2 ? 1 : 0;
		var yIncr = modulo(x,2) == 0 ? 2 : 1;
		for (var y = yInit; y <= this.grid.yMax; y += yIncr) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
ElongatedTriangularGrid.prototype.tileLocation = function (x,y) {
	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[shape.name][orientation][x];
	var yPixel = this.rowLocations[y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
ElongatedTriangularGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	var triangleHeight = Q3*tileSize/2;

	var column = 2*Math.floor(xPixel/(tileSize + triangleHeight));
	var columnPixel = column*(tileSize + triangleHeight)/2;

	if (modulo(xScroll,2) == 0 && xPixel - columnPixel > tileSize) {
		column++;
		columnPixel += tileSize;
	} else if (modulo(xScroll,2) == 1 && xPixel - columnPixel > triangleHeight) {
		column++;
		columnPixel += triangleHeight;
	}

	var row = Math.floor(2*yPixel/tileSize);
	var rowPixel = row*tileSize/2;

	// pixel location within column & row
	xPixel -= columnPixel;
	yPixel -= rowPixel;

	// apply scroll to column,, row
	column = modulo(column - xScroll,4*gridSize);
	row = modulo(row - yScroll,6*gridSize);

	// console.log("click was in column",column,"row",row);

	x = column;
	y = row;

	if (modulo(column,2) == 0) {
		// square
		//console.log("tile is a square");
		if ((modulo(column,4) == 0 && modulo(row,2) == 1)
		 || (modulo(column,4) == 2 && modulo(row,2) == 0)) {
			y--;
		}
	} else {
		// triangle
		if ((modulo(column,4) == 1 && modulo(row,2) == 0)
		 || (modulo(column,4) == 3 && modulo(row,2) == 1)) {
			//console.log("tile is a left-pointing triangle");
			// left triangle to the top-right
			if (xPixel/Q3 > yPixel) y--;
		} else {
			//console.log("tile is a right-pointing triangle");
			// right triangle to the top-left
			if (xPixel/Q3 + yPixel < tileSize/2) y--;
		}
	}

	//console.log("tile is",x,y);
	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));

	return [x,y];
}

ElongatedTriangularGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	this.grid.xScrollPixel = Math.floor(xScroll/2)*this.grid.tilePixels
							+ Math.floor((xScroll + 1)/2)*this.grid.tilePixels*Q3/2;

	this.grid.yScrollPixel = yScroll*this.grid.tilePixels/2;

	// console.log("scroll @",xScroll,yScroll,"pixel @ ",this.grid.xScrollPixel,this.grid.yScrollPixel);

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
