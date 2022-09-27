
function RhombiTriHexagonal (shapes) {
	this.name = "Rhombi-tri-hexagonal Tiling";
	this.id = "rhombitrihexagonal";
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 4.0;
	this.complexity = 3.25;
	this.triangle = shapes.triangle;
	this.square = shapes.square;
	this.hexagon = shapes.hexagon;
}

RhombiTriHexagonal.prototype = new Tiling();

RhombiTriHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*size*(Q3 + 1) + Q3)/(2*size*(Q3 + 3) + 1);
}

RhombiTriHexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(2*size*(Q3 + 3) + 1)/(4*size*(Q3 + 1) + Q3);
}

RhombiTriHexagonal.prototype.tiles = function (size) {
	return (24 * size**2);
}

// return the size that will give the number of tiles closest to the given number
RhombiTriHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/24));
}

RhombiTriHexagonal.prototype.newGrid = function (grid) {
	return new RhombiTriHexagonalGrid(grid,this);
}

function RhombiTriHexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	grid.xMax = 8*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.square = this.tiling.square.newSquare(grid);
	this.hexagon = this.tiling.hexagon.newHexagon(grid);
	this.shapes = [this.triangle,this.square,this.hexagon];
}

RhombiTriHexagonalGrid.prototype = new TilingGrid();

RhombiTriHexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(2*grid.size*(Q3 + 3) + 1);
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/(4*grid.size*(Q3 + 1) + Q3);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - Q3*tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// this.columnLocations = {hexagon: {standing: []}, square: {straight: [], right: [], left: []}, triangle: {up: [], down: []}};
	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnWidth = (Q3 + 1)*tilePixels/4;
		var columnLocation = column*columnWidth + Q3*tilePixels/2;
		this.columnLocations.push(columnLocation);

		// even-numbered columns contain hexagons, straight squares and triangles
		// right and left squares are in the odd-numbered columns
	}

	this.rowLocations = {hexagon: {standing: []}, square: {straight: [], right: [], left: []}, triangle: {up: [], down: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = tilePixels*(row*(Q3 + 3)/4 + 1);

		this.rowLocations.hexagon.standing.push(rowLocation);
		this.rowLocations.square.straight.push(rowLocation);
		this.rowLocations.square.right.push(rowLocation);
		this.rowLocations.square.left.push(rowLocation);
		this.rowLocations.triangle.up.push(rowLocation + tilePixels*(Q3 - 1)/Q3);
		this.rowLocations.triangle.down.push(rowLocation - tilePixels*(Q3 - 1)/Q3);
	}
}

RhombiTriHexagonalGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.square.resize();
	this.hexagon.resize();
}

// hexagons in the odd-numbered rows
RhombiTriHexagonalGrid.prototype.shape = function (x,y) {
	if (modulo(x,2) == 1 || modulo(x + y,4) == 2) {
		return this.square;
	} else if (modulo(x + y,4) == 0) {
		return this.hexagon;
	} else {
		return this.triangle;
	}
}

// all hexagons are flat
// up and down triangles alternate
RhombiTriHexagonalGrid.prototype.orientation = function (x,y) {
	if (modulo(x,2) == 1 || modulo(x + y,4) == 2) {
		if (modulo(y,2) == 0) {
			return "straight";
		} else if (modulo(x - y,4) == 0) {
			return "left";
		} else {
			return "right";
		}
	} else if (modulo(x + y,4) == 0) {
		return "standing";
	} else {
		if (modulo(x + y,4) == 1) {
			return "up";
		} else {
			return "down";
		}
	}
}

// odd numbered rows only use every second column
RhombiTriHexagonalGrid.prototype.randomTile = function () {
	while (true) {
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

RhombiTriHexagonalGrid.prototype.neighbour = function (x,y,direction) {
	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

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
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			break;
		case "e": 
			neighbour.x+=2;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
			break;
		case "see":
			neighbour.x++;
			if (neighbour.x > this.grid.xMax) neighbour.x = 0;
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
			neighbour.x--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
			break;
		case "w":
			neighbour.x-=2;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax - 1;
			break;
		case "nww":
			neighbour.x--;
			if (neighbour.x < 0) neighbour.x = this.grid.xMax;
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

RhombiTriHexagonalGrid.prototype.eachTile = function (tileFunction) {
	for (var y = 0; y <= this.grid.yMax; y ++) {
		var xIncr = modulo(y,2) == 1 ? 1 : 2;
		for (var x = 0; x <= this.grid.xMax; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

RhombiTriHexagonalGrid.prototype.tileLocation = function (x,y,rotation) {
	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
RhombiTriHexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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

	// divide the grid into triangles, defined by tx, ty and tz
	var triangleSize = tileSize*(Q3 + 1)/Q3;
	var triangleHeight = tileSize*(Q3 + 1)/2;

	// determine the x,y,z of the triangle
	// x is which column, i.e distance from left side
	var xTrianglePixel = xTrianglePixel = xPixel + tileSize/2 - xScroll*triangleHeight;
	var xTriangle = Math.floor(xTrianglePixel/triangleHeight);

	// y is distance from the top left corner
	var yTrianglePixel = yPixel + xPixel/Q3 + tileSize*(2 - Q3)/(2*Q3);
	yTrianglePixel -= yScroll*triangleSize*3/4 + xScroll*triangleSize/2;
	var yTriangle = Math.floor(yTrianglePixel/triangleSize);

	// z is distance from top right corner
	var zTrianglePixel = yPixel + (xPixels - xPixel)/Q3 + tileSize/Q3;
	zTrianglePixel -= yScroll*triangleSize*3/4 - xScroll*triangleSize/2;
	var zTriangle = Math.floor(zTrianglePixel/triangleSize);
	//console.log("triangle @",xTriangle,yTriangle,zTriangle);

	// now find the x y of the hexagon closest to the click
	// and in which of the six triangles centred around the hexagon (sector)
	var sector = "";
	//y = modulo(2*Math.floor((yTriangle + zTriangle - 2*gridSize)/3),yMax + 1);
	y = 2*Math.floor((yTriangle + zTriangle - 2*gridSize)/3);
	if (modulo(y,4) == 0) {
		//x = modulo(4*Math.floor(xTriangle/2),xMax + 1);
		x = 4*Math.floor(xTriangle/2);
		sector += (modulo(xTriangle,2) == 1 ? "1" : "0");
	} else {
		//x = modulo(4*((xTriangle - 1)/2 + 2),xMax + 1);
		x = 4*Math.floor((xTriangle - 1)/2) + 2;
		sector += (modulo(xTriangle,2) == 0 ? "1" : "0");
	}
	sector += "-";
	sector += modulo(yTriangle + zTriangle - 2*gridSize,3);
	//console.log("sector",sector);

	// centre of the hexagon
	var columnWidth = (Q3 + 1)*tileSize/4;
	var xHexagonCentre = x*columnWidth + Q3*tileSize/2;
	var yHexagonCentre = tileSize*(y*(Q3 + 3)/4 + 1);

	xHexagonCentre += xScroll*tileSize*(Q3 + 1)/2;
	yHexagonCentre += yScroll*tileSize*(Q3 + 3)/4;
	//console.log("closest hexagon is",x,y,"@",xHexagonCentre,yHexagonCentre);

	this.grid.xScrollPixel = xScroll*this.grid.tilePixels*(Q3 + 1)/2;
	this.grid.yScrollPixel = yScroll*this.grid.tilePixels*(Q3 + 3)/4;

	xPixel -= xHexagonCentre;
	yPixel -= yHexagonCentre;
	//console.log("location is @",xPixel,yPixel,"relative to centre of hexagon");

	switch (sector) {
		case "0-0":
			// nw
			if (yPixel + xPixel/Q3 < 0 - tileSize) {
				// not the hexagon
				y--;
				if (yPixel - Q3*xPixel > tileSize) {
					// up triangle
					x-=2;
				} else if (yPixel - Q3*xPixel > 0 - tileSize) {
					// square
					x--;
				}
				// otherwise down triangle, leave x alone
			}
			break;
		case "0-1":
			// w
			if (xPixel < 0 - Q3*tileSize/2) {
				// not the hexagon
				x-=2;
				if (yPixel < 0 - tileSize/2) {
					// up triangle
					y--;
				} else if (yPixel > tileSize/2) {
					// down triangle
					y++;
				}
				// otherwise square, leave y alone
			}
			break;
		case "0-2":
			// sw
			if (yPixel - xPixel/Q3 > tileSize) {
				// not the hexagon
				y++;
				if (yPixel + Q3*xPixel < 0 - tileSize) {
					// down triangle
					x-=2;
				} else if (yPixel + Q3*xPixel < tileSize) {
					// square
					x--;
				}
				// otherwise up triangle, leave x alone
			}
			break;
		case "1-0":
			// ne
			if (yPixel - xPixel/Q3 < 0 - tileSize) {
				// not the hexagon
				y--;
				if (yPixel + Q3*xPixel > tileSize) {
					// up triangle
					x+=2;
				} else if (yPixel + Q3*xPixel > (0 - tileSize)) {
					// square
					x++;
				}
				// otherwise down triangle, leave x alone
			}
			break;
		case "1-1":
			// e
			if (xPixel > Q3*tileSize/2) {
				// not the hexagon
				x+=2;
				if (yPixel < 0 - tileSize/2) {
					// up triangle
					y--;
				} else if (yPixel > tileSize/2) {
					// down triangle
					y++;
				}
				// otherwise square, leave y alone
			}
			break;
		case "1-2":
			// se
			if (yPixel + xPixel/Q3 > tileSize) {
				// not the hexagon
				y++;
				if (yPixel - Q3*xPixel < 0 - tileSize) {
					// down triangle
					x+=2;
				} else if (yPixel - Q3*xPixel < tileSize) {
					// square
					x++;
				}
				// otherwise up triangle, leave x alone
			}
			break;
	}

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));
	//console.log("tile @",x,y);

	return [x,y];
}

RhombiTriHexagonalGrid.prototype.updateScroll = function () {
	var xScroll = this.grid.xScroll;
	var yScroll = this.grid.yScroll;

	xScroll = modulo(xScroll,this.grid.xMax + 1);
	yScroll = modulo(yScroll,this.grid.yMax + 1);

	this.grid.xScrollPixel = xScroll*this.grid.tilePixels*(Q3 + 1)/2;
	this.grid.yScrollPixel = yScroll*this.grid.tilePixels*(Q3 + 3)/4;

	this.grid.xScroll = xScroll;
	this.grid.yScroll = yScroll;
}
