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
	this.no = 6;
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

// create sized shapes for a new grid
BoundedTriHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.hexagon = this.hexagon.newHexagon(grid);
	return shapes;
}

BoundedTriHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size;
	grid.yMax = 4*grid.size;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(Q3*2*(2*grid.size + 1));
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = grid.xPixels/(2*(2*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels;
	grid.scrollHeight = grid.yPixels;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		grid.columnLocations.push((column + 1)*tilePixels);
	}

	grid.rowLocations = {hexagon: {flat: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = Math.floor(row*Q3*tilePixels);

		grid.rowLocations.hexagon.flat.push(rowLocation + Q3*tilePixels/2);
		grid.rowLocations.triangle.down.push(rowLocation + tilePixels/(2*Q3));
		grid.rowLocations.triangle.up.push(rowLocation + 5*tilePixels/(2*Q3));
	}
}

BoundedTriHexagonal.prototype.shape = function (shapes, x, y) {
	if (modulo(x - y,3) == 0) {
		return shapes.hexagon;
	} else {
		return shapes.triangle;
	}
}

// all hexagons are flat
BoundedTriHexagonal.prototype.orientation = function (x, y) {
	switch (modulo(x - y,3)) {
		case 0: return "flat";
		case 1: return "up";
		case 2: return "down";
	}
}

BoundedTriHexagonal.prototype.random_tile = function (maxX, maxY) {
	var size = maxX/4;

	while (true) {
		// will never choose a tile with a negative coord, which is possible on this tiling
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if (x + y/2 + 1 <= 3*size/2 || x + y/2 - 1 >= 9*size/2) continue;
		if (x/2 + y + 1 <= 3*size/2 || x/2 + y - 1 >= 9*size/2) continue;
		if (x - y - 1 > 3*size || y - x - 1 > 3*size) continue;
		break;
	}

	return [x,y];
}

BoundedTriHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	// check boundary violations - not as simple as checking if e.g x > maxX
	switch (direction) {
		case "n":
			y--;
			if (x/2 + y + 1 <= 3*gridSize/2) return null;
			break;
		case "nee":
			x++;
			y--;
			if (x - y - 1 > 3*gridSize) return null;
			break;
		case "see": 
			x++;
			if (x + y/2 - 1 >= 9*gridSize/2) return null;
			break;
		case "s":
			y++;
			if (x/2 + y - 1 >= 9*gridSize/2) return null;
			break;
		case "sww":
			x--;
			y++;
			if (y - x - 1 > 3*gridSize) return null;
			break;
		case "nww":
			x--;
			if (x + y/2 + 1 <= 3*gridSize/2) return null;
			break;
	}

	return [x,y];
}

BoundedTriHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	var size = maxX/4;
	for (var x = 0; x <= maxX; x ++) {
		for (var y = 0; y <= maxY; y ++) {
			if (x + y/2 + 1 <= 3*size/2 || x + y/2 - 1 >= 9*size/2) continue;
			if (x/2 + y + 1 <= 3*size/2 || x/2 + y - 1 >= 9*size/2) continue;
			if (x - y - 1 > 3*size || y - x - 1 > 3*size) continue;
			tileFunction(x,y);
		}
	}
}

BoundedTriHexagonal.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	var column = x;
	var row = Math.floor((x + 2*y + 1)/3) - grid.size;

	// get pixels based on row and column
	var xPixel = grid.columnLocations[column];
	var yPixel = grid.rowLocations[shape.name][orientation][row];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
BoundedTriHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	// check we are inside the (hexagonal-shaped) grid
	if (xPixel + yPixel/Q3 < grid.xPixels/4)                                   return []; // beyond the upper left edge
	if (xPixel + (grid.yPixels - yPixel)/Q3 < grid.xPixels/4)                  return []; // beyond the lower left edge
	if ((grid.xPixels - xPixel) + yPixel/Q3 < grid.xPixels/4)                  return []; // beyond the upper right edge
	if ((grid.xPixels - xPixel) + (grid.yPixels - yPixel)/Q3 < grid.xPixels/4) return []; // beyond the lower right edge

	// determine the x,y,z of the triangle
	// same as for triangular
	// in this case, each triangle either corresponds to one triangle tile,
	//    or one-sixth of a hexagon tile
	var xTriangle = Math.floor((xPixel + yPixel/Q3 - grid.xPixels/4)/grid.tilePixels);
	var yTriangle = Math.floor(2*yPixel/(Q3*grid.tilePixels));
	var zTriangle = Math.floor(((grid.xPixels - xPixel) + yPixel/Q3 - grid.xPixels/4)/grid.tilePixels);

	var x;
	var y;
	if (modulo(xTriangle,2) == 0 && modulo(yTriangle,2) == 1 && modulo(zTriangle,2) == 0) {
		// up triangle
		y = Math.floor((yTriangle + zTriangle)/2);
		x = (xTriangle - zTriangle)/2 + 2*grid.size;

	} else if (modulo(xTriangle,2) == 1 && modulo(yTriangle,2) == 0 && modulo(zTriangle,2) == 1) {
		// down triangle
		y = Math.floor((yTriangle + zTriangle)/2);
		x = (xTriangle - zTriangle)/2 + 2*grid.size;

	} else {
		// hexagon
		y = Math.floor((yTriangle + zTriangle)/2);
		switch (modulo(xTriangle,4)) {
			case 0: case 1: if (modulo(y,2) != modulo(grid.size,2)) y--; break;
			case 2: case 3: if (modulo(y,2) == modulo(grid.size,2)) y--; break;
		}

		x = Math.floor((xTriangle - zTriangle)/2 + 2*grid.size);
		switch (modulo(yTriangle,4)) {
			case 0: case 1: if (modulo(x,2) != modulo(grid.size,2)) x++; break;
			case 2: case 3: if (modulo(x,2) == modulo(grid.size,2)) x++; break;
		}
	}

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
BoundedTriHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {}

// return the vertical offset in pixels
// based on the current scroll position
BoundedTriHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {}

BoundedTriHexagonal.prototype.clip_perimeter = function (grid) {
	// clear the outer area
	var x = grid.x;
	var y = grid.y;
	var width = grid.xPixels;
	var height = grid.yPixels;

	// clip the area
	grid.screen.context.save();
	grid.screen.context.beginPath();
	grid.screen.context.moveTo(x + width/4,y);
	grid.screen.context.lineTo(x + 3*width/4,y);
	grid.screen.context.lineTo(x + width,y + height/2);
	grid.screen.context.lineTo(x + 3*width/4,y + height);
	grid.screen.context.lineTo(x + width/4,y + height);
	grid.screen.context.lineTo(x,y + height/2);
	grid.screen.context.lineTo(x + width/4,y);
	grid.screen.context.clip();

	grid.screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	grid.screen.context.fillStyle = grid.screen.colour;
	grid.screen.context.fillRect(x,y,width,height);
}
