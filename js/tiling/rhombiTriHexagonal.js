
function RhombiTriHexagonal (shapes) {
	this.name = "Rhombi-tri-hexagonal Tiling";
	this.id = "rhombitrihexagonal";
	this.no = 8;
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

// create sized shapes for a new grid
RhombiTriHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.square = this.square.newSquare(grid);
	shapes.hexagon = this.hexagon.newHexagon(grid);
	return shapes;
}

RhombiTriHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 8*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(2*grid.size*(Q3 + 3) + 1);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/(4*grid.size*(Q3 + 1) + Q3);
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - Q3*tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// this.columnLocations = {hexagon: {standing: []}, square: {straight: [], right: [], left: []}, triangle: {up: [], down: []}};
	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnWidth = (Q3 + 1)*tilePixels/4;
		var columnLocation = column*columnWidth + Q3*tilePixels/2;
		grid.columnLocations.push(columnLocation);

		// even-numbered columns contain hexagons, straight squares and triangles
		// right and left squares are in the odd-numbered columns
	}

	grid.rowLocations = {hexagon: {standing: []}, square: {straight: [], right: [], left: []}, triangle: {up: [], down: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowLocation = tilePixels*(row*(Q3 + 3)/4 + 1);

		grid.rowLocations.hexagon.standing.push(rowLocation);
		grid.rowLocations.square.straight.push(rowLocation);
		grid.rowLocations.square.right.push(rowLocation);
		grid.rowLocations.square.left.push(rowLocation);
		grid.rowLocations.triangle.up.push(rowLocation + tilePixels*(Q3 - 1)/Q3);
		grid.rowLocations.triangle.down.push(rowLocation - tilePixels*(Q3 - 1)/Q3);
	}
}

// hexagons in the odd-numbered rows
RhombiTriHexagonal.prototype.shape = function (shapes, x, y) {
	if (modulo(x,2) == 1 || modulo(x + y,4) == 2) {
		return shapes.square;
	} else if (modulo(x + y,4) == 0) {
		return shapes.hexagon;
	} else {
		return shapes.triangle;
	}
}

// all hexagons are flat
// up and down triangles alternate
RhombiTriHexagonal.prototype.orientation = function (x, y) {
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
RhombiTriHexagonal.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

RhombiTriHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	switch (direction) {
		case "n":           y--; break;
		case "nne": x++;    y--; break;
		case "nee": x++;         break;
		case "e":   x += 2;      break;
		case "see": x++;         break;
		case "sse": x++;    y++; break;
		case "s":           y++; break;
		case "ssw": x--;    y++; break;
		case "sww": x--;         break;
		case "w":   x -= 2;      break;
		case "nww": x--;         break;
		case "nnw": x--;    y--; break;
	}

	return [x,y];
}

RhombiTriHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var y = 0; y <= maxY; y ++) {
		var xIncr = modulo(y,2) == 1 ? 1 : 2;
		for (var x = 0; x <= maxX; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

RhombiTriHexagonal.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
RhombiTriHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	var x;
	var y;

	// divide the grid into triangles, defined by tx, ty and tz
	var triangleSize = grid.tilePixels*(Q3 + 1)/Q3;
	var triangleHeight = grid.tilePixels*(Q3 + 1)/2;

	// determine the x,y,z of the triangle
	// x is which column, i.e distance from left side
	var xTrianglePixel = xTrianglePixel = xPixel + grid.tilePixels/2 - grid.xScroll*triangleHeight;
	var xTriangle = Math.floor(xTrianglePixel/triangleHeight);

	// y is distance from the top left corner
	var yTrianglePixel = yPixel + xPixel/Q3 + grid.tilePixels*(2 - Q3)/(2*Q3);
	yTrianglePixel -= grid.yScroll*triangleSize*3/4 + grid.xScroll*triangleSize/2;
	var yTriangle = Math.floor(yTrianglePixel/triangleSize);

	// z is distance from top right corner
	var zTrianglePixel = yPixel + (grid.xPixels - xPixel)/Q3 + grid.tilePixels/Q3;
	zTrianglePixel -= grid.yScroll*triangleSize*3/4 - grid.xScroll*triangleSize/2;
	var zTriangle = Math.floor(zTrianglePixel/triangleSize);

	// now find the x y of the hexagon closest to the click
	// and in which of the six triangles centred around the hexagon (sector)
	var sector = "";
	//y = modulo(2*Math.floor((yTriangle + zTriangle - 2*gridSize)/3),yMax + 1);
	y = 2*Math.floor((yTriangle + zTriangle - 2*grid.size)/3);
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
	sector += modulo(yTriangle + zTriangle - 2*grid.size,3);
	//console.log("sector",sector);

	// centre of the hexagon
	var columnWidth = (Q3 + 1)*grid.tilePixels/4;
	var xHexagonCentre = x*columnWidth + Q3*grid.tilePixels/2;
	var yHexagonCentre = grid.tilePixels*(y*(Q3 + 3)/4 + 1);

	xHexagonCentre += grid.xScroll*grid.tilePixels*(Q3 + 1)/2;
	yHexagonCentre += grid.yScroll*grid.tilePixels*(Q3 + 3)/4;
	//console.log("closest hexagon is",x,y,"@",xHexagonCentre,yHexagonCentre);

	// delete~~~
	// grid.xScrollPixel = grid.xScroll*this.grid.tilePixels*(Q3 + 1)/2;
	// grid.yScrollPixel = grid.yScroll*this.grid.tilePixels*(Q3 + 3)/4;

	xPixel -= xHexagonCentre;
	yPixel -= yHexagonCentre;
	//console.log("location is @",xPixel,yPixel,"relative to centre of hexagon");

	switch (sector) {
		case "0-0":
			// nw
			if (yPixel + xPixel/Q3 < 0 - grid.tilePixels) {
				// not the hexagon
				y--;
				if (yPixel - Q3*xPixel > grid.tilePixels) {
					// up triangle
					x-=2;
				} else if (yPixel - Q3*xPixel > 0 - grid.tilePixels) {
					// square
					x--;
				}
				// otherwise down triangle, leave x alone
			}
			break;
		case "0-1":
			// w
			if (xPixel < 0 - Q3*grid.tilePixels/2) {
				// not the hexagon
				x-=2;
				if (yPixel < 0 - grid.tilePixels/2) {
					// up triangle
					y--;
				} else if (yPixel > grid.tilePixels/2) {
					// down triangle
					y++;
				}
				// otherwise square, leave y alone
			}
			break;
		case "0-2":
			// sw
			if (yPixel - xPixel/Q3 > grid.tilePixels) {
				// not the hexagon
				y++;
				if (yPixel + Q3*xPixel < 0 - grid.tilePixels) {
					// down triangle
					x-=2;
				} else if (yPixel + Q3*xPixel < grid.tilePixels) {
					// square
					x--;
				}
				// otherwise up triangle, leave x alone
			}
			break;
		case "1-0":
			// ne
			if (yPixel - xPixel/Q3 < 0 - grid.tilePixels) {
				// not the hexagon
				y--;
				if (yPixel + Q3*xPixel > grid.tilePixels) {
					// up triangle
					x+=2;
				} else if (yPixel + Q3*xPixel > (0 - grid.tilePixels)) {
					// square
					x++;
				}
				// otherwise down triangle, leave x alone
			}
			break;
		case "1-1":
			// e
			if (xPixel > Q3*grid.tilePixels/2) {
				// not the hexagon
				x+=2;
				if (yPixel < 0 - grid.tilePixels/2) {
					// up triangle
					y--;
				} else if (yPixel > grid.tilePixels/2) {
					// down triangle
					y++;
				}
				// otherwise square, leave y alone
			}
			break;
		case "1-2":
			// se
			if (yPixel + xPixel/Q3 > grid.tilePixels) {
				// not the hexagon
				y++;
				if (yPixel - Q3*xPixel < 0 - grid.tilePixels) {
					// down triangle
					x+=2;
				} else if (yPixel - Q3*xPixel < grid.tilePixels) {
					// square
					x++;
				}
				// otherwise up triangle, leave x alone
			}
			break;
	}

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
RhombiTriHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	return xScroll*tilePixels*(Q3 + 1)/2;
}

// return the vertical offset in pixels
// based on the current scroll position
RhombiTriHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	return yScroll*tilePixels*(Q3 + 3)/4;
}