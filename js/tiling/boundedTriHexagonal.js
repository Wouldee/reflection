// A tiling of hexagons and triangles, within a hexagonal shape. Hexagons lie flat, points to the side
// Each hexagon is bordered by up to six triangles, which point up or down in equal number
// Always an odd number of hexagons, one in the centre. Almost twice as many triangles
// Coordinate system is a bit odd - there is no 0,0 or maxX,maxY (max X & Y is 4*size)
// Top left hexagon is size,size, bottom right is size*3,size*3. Centre hex is size*2,size*2.
// The top right hexagon is size*3,0; far left is 0,size*3; far right is size*4,size, bottom left is size,size*4
// So each row of hexagons, x increases by two every hexagon, but y decreases by 1
// Each column of hexagon-triangle-triangle-hexagon etc, y increases by 1
// Every x,y combination within a certain range is a valid tile, but the shape of the range is not a square
// E.g Here is the range of valid x,y values for size = 2 (hexagons are O, triangles are V or A):
//     0  1  2  3  4  5  6  7  8
//  0                 V  O  A  
//  1           V  O  A  V  O  A
//  2        O  A  V  O  A  V  O
//  3     A  V  O  A  V  O  A  V
//  4     O  A  V  O  A  V  O  
//  5  A  V  O  A  V  O  A  V  
//  6  O  A  V  O  A  V  O     
//  7  V  O  A  V  O  A        
//  8     V  O  A              
// See randomTile for the exact calculations
// Not continuous

function BoundedTriHexagonal (shapes) {
	this.name = "(Bounded) Tri-hexagonal Tiling";
	this.id = "bounded-trihexagonal";
	this.xContinuous = false;
	this.yContinuous = false;
	this.filters = null;
	this.prisms = null;
	this.faces = 4.0;
	this.complexity = 3.5;
	this.triangle = shapes.triangle;
	this.hexagon = shapes.hexagon;
}

BoundedTriHexagonal.prototype = new Tiling();

BoundedTriHexagonal.prototype.x_pixels = function (yPixels, size) {
	return 2*yPixels/Q3;
}

BoundedTriHexagonal.prototype.y_pixels = function (xPixels, size) {
	return Q3*xPixels/2;
}

BoundedTriHexagonal.prototype.tiles = function (size) {
	return (9*size*(size + 1) + 1);
}

// return the size that will give the number of tiles closest to the given number
BoundedTriHexagonal.prototype.closest_size = function (tiles) {
	return Math.round((Math.sqrt(4*(tiles - 1)/9 + 1) - 1)/2);
}

BoundedTriHexagonal.prototype.newGrid = function (grid) {
	return new BoundedTriHexagonalGrid(grid,this);
}


function BoundedTriHexagonalGrid (grid,tiling) {
	this.grid = grid;
	this.tiling = tiling;

	// ensure continuous x & y are set to false
	grid.xContinuous = false;
	grid.yContinuous = false;

	grid.xMax = 4*grid.size;
	grid.yMax = 4*grid.size;

	this.calculateDimensions();
	this.triangle = this.tiling.triangle.newTriangle(grid);
	this.hexagon = this.tiling.hexagon.newHexagon(grid);
	this.shapes = [this.triangle,this.hexagon];
}

BoundedTriHexagonalGrid.prototype = new TilingGrid();

BoundedTriHexagonalGrid.prototype.calculateDimensions = function () {
	var grid = this.grid;
	var tiling = this.tiling;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (tiling.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = tiling.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(Q3*2*(2*grid.size + 1));
	} else {
		grid.yPixels = tiling.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(2*(2*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	this.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		this.columnLocations.push((column + 1)*tilePixels);
	}

	this.rowLocations = {hexagon: {flat: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels);

		this.rowLocations.hexagon.flat.push(rowLocation + Q3*tilePixels/2);
		this.rowLocations.triangle.down.push(rowLocation + tilePixels/(2*Q3));
		this.rowLocations.triangle.up.push(rowLocation + 5*tilePixels/(2*Q3));
	}

}

BoundedTriHexagonalGrid.prototype.resizeShapes = function () {
	this.triangle.resize();
	this.hexagon.resize();
}

BoundedTriHexagonalGrid.prototype.shape = function (x,y) {
	if (modulo(x - y,3) == 0) {
		return this.hexagon;
	} else {
		return this.triangle;
	}
}

// all hexagons are flat
BoundedTriHexagonalGrid.prototype.orientation = function (x,y) {
	switch (modulo(x - y,3)) {
		case 0: return "flat";
		case 1: return "up";
		case 2: return "down";
	}
}

BoundedTriHexagonalGrid.prototype.randomTile = function () {
	var size = this.grid.size;

	// var tileNo = Math.floor(Math.random()*this.tiling.tiles(this.size))


	while (true) {
		// will never choose a tile with a negative coord, which is possible on this tiling
		var x = Math.floor(Math.random()*(this.grid.xMax + 1));
		var y = Math.floor(Math.random()*(this.grid.yMax + 1));
		if (x + y/2 + 1 <= 3*size/2 || x + y/2 - 1 >= 9*size/2) continue;
		if (x/2 + y + 1 <= 3*size/2 || x/2 + y - 1 >= 9*size/2) continue;
		if (x - y - 1 > 3*size || y - x - 1 > 3*size) continue;
		break;
	}
	//console.log("random tile",x,y);
	return [x,y];
}

BoundedTriHexagonalGrid.prototype.neighbour = function (x,y,direction) {
	//console.log("neighbour of",x,y,direction);
	var size = this.grid.size;

	var neighbour = {
		x: x,
		y: y,
		direction: opposite_direction(direction)
	}

	switch (direction) {
		case "n":
			neighbour.y--;
			if (neighbour.x/2 + neighbour.y + 1 <= 3*size/2) return null;
			break;
		case "nee":
			neighbour.x++;
			neighbour.y--;
			if (neighbour.x - neighbour.y - 1 > 3*size) return null;
			break;
		case "see": 
			neighbour.x++;
			if (neighbour.x + neighbour.y/2 - 1 >= 9*size/2) return null;
			break;
		case "s":
			neighbour.y++;
			if (neighbour.x/2 + neighbour.y - 1 >= 9*size/2) return null;
			break;
		case "sww":
			neighbour.x--;
			neighbour.y++;
			if (neighbour.y - neighbour.x - 1 > 3*size) return null;
			break;
		case "nww":
			neighbour.x--;
			if (neighbour.x + neighbour.y/2 + 1 <= 3*size/2) return null;
			break;
	}

	//console.log("neighbour is",neighbour.x,neighbour.y,neighbour.direction);
	return neighbour;
}

BoundedTriHexagonalGrid.prototype.eachTile = function (tileFunction) {
	var size = this.grid.size;
	for (var x = 0; x <= this.grid.xMax; x ++) {
		for (var y = 0; y <= this.grid.yMax; y ++) {
			if (x + y/2 + 1 <= 3*size/2 || x + y/2 - 1 >= 9*size/2) continue;
			if (x/2 + y + 1 <= 3*size/2 || x/2 + y - 1 >= 9*size/2) continue;
			if (x - y - 1 > 3*size || y - x - 1 > 3*size) continue;
			tileFunction(x,y);
		}
	}
}

BoundedTriHexagonalGrid.prototype.tileLocation = function (x,y,rotation) {
	var shape = this.shape(x,y);
	var orientation = this.orientation(x,y);

	var column = x;
	var row = Math.floor((x + 2*y + 1)/3) - this.grid.size;

	// get pixels based on row and column
	var xPixel = this.columnLocations[column];
	var yPixel = this.rowLocations[shape.name][orientation][row];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
BoundedTriHexagonalGrid.prototype.tileAt = function (xPixel,yPixel) {
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
	if (xPixel + yPixel/Q3 < xPixels/4)                         return []; // beyond the upper left edge
	if (xPixel + (yPixels - yPixel)/Q3 < xPixels/4)             return []; // beyond the lower left edge
	if ((xPixels - xPixel) + yPixel/Q3 < xPixels/4)             return []; // beyond the upper right edge
	if ((xPixels - xPixel) + (yPixels - yPixel)/Q3 < xPixels/4) return []; // beyond the lower right edge
	if (yPixel < 0)                                             return []; // beyond the bottom edge
	if (yPixel > yPixels)                                       return []; // beyond the bottom edge

	// determine the x,y,z of the triangle
	// same as for triangular
	// in this case, each triangle either corresponds to one triangle tile,
	//    or one-sixth of a hexagon tile
	var xTriangle = Math.floor((xPixel + yPixel/Q3 - xPixels/4)/tileSize);
	var yTriangle = Math.floor(2*yPixel/(Q3*tileSize));
	var zTriangle = Math.floor(((xPixels - xPixel) + yPixel/Q3 - xPixels/4)/tileSize);
	// console.log("triangle @",xTriangle,yTriangle,zTriangle);

	if (modulo(xTriangle,2) == 0 && modulo(yTriangle,2) == 1 && modulo(zTriangle,2) == 0) {
		// up triangle
		y = Math.floor((yTriangle + zTriangle)/2);
		x = (xTriangle - zTriangle)/2 + 2*gridSize;
		// console.log("up triangle @",x,y);
	} else if (modulo(xTriangle,2) == 1 && modulo(yTriangle,2) == 0 && modulo(zTriangle,2) == 1) {
		// down triangle
		y = Math.floor((yTriangle + zTriangle)/2);
		x = (xTriangle - zTriangle)/2 + 2*gridSize;
		// console.log("down triangle @",x,y);
	} else {
		// hexagon
		y = Math.floor((yTriangle + zTriangle)/2);
		switch (modulo(xTriangle,4)) {
			case 0: case 1: if (modulo(y,2) != modulo(gridSize,2)) y--; break;
			case 2: case 3: if (modulo(y,2) == modulo(gridSize,2)) y--; break;
		}

		x = Math.floor((xTriangle - zTriangle)/2 + 2*gridSize);
		switch (modulo(yTriangle,4)) {
			case 0: case 1: if (modulo(x,2) != modulo(gridSize,2)) x++; break;
			case 2: case 3: if (modulo(x,2) == modulo(gridSize,2)) x++; break;
		}
		// console.log("hexagon @",x,y);
	}

	x = modulo(x,(xMax + 1));
	y = modulo(y,(yMax + 1));
	// console.log("tile @",x,y);

	// fill 

	return [x,y];
}

BoundedTriHexagonalGrid.prototype.updateScroll = function () {}

BoundedTriHexagonalGrid.prototype.clipScreen = function () {
	var grid = this.grid;
	var screen = this.grid.screen;

	// clear the outer area
	var x = grid.x;
	var y = grid.y;
	var width = grid.xPixels;
	var height = grid.yPixels;

	// clip the area
	screen.context.save();
	screen.context.beginPath();
	screen.context.moveTo(x + width/4,y);
	screen.context.lineTo(x + 3*width/4,y);
	screen.context.lineTo(x + width,y + height/2);
	screen.context.lineTo(x + 3*width/4,y + height);
	screen.context.lineTo(x + width/4,y + height);
	screen.context.lineTo(x,y + height/2);
	screen.context.lineTo(x + width/4,y);
	screen.context.clip();

	screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	screen.context.fillStyle = screen.colour;
	screen.context.fillRect(x,y,width,height);
}
