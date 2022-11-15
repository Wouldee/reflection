
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

// create sized shapes for a new grid
TruncatedHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.dodecagon = this.dodecagon.newDodecagon(grid);
	return shapes;
}

TruncatedHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 4*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/(2*Q3*grid.size*(Q3 + 2) + 1);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/((Q3 + 2)*(4*grid.size + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels*(Q3 + 2)/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnLocation = (column + 1)*tilePixels*(Q3 + 2)/2;
		grid.columnLocations.push(columnLocation);
	}

	grid.rowLocations = {dodecagon: {straight: []}, triangle: {down: [], up: []}};
	for (var row = 0; row <= grid.yMax; row++) {

		var rowLocation = tilePixels*(row*Q3*(Q3 + 2) + 1)/4;

		grid.rowLocations.dodecagon.straight.push(rowLocation);
		grid.rowLocations.triangle.down.push(rowLocation + tilePixels*(Q3 + 2)/(4*Q3));

		// the up triangles in row 0 actually appear at the bottom
		// so this bit is messy but it makes other things cleaner
		if (row == 0) {
			grid.rowLocations.triangle.up.push(grid.yPixels - 2*tilePixels*(Q3 + 1)/(4*Q3));
		} else {
			grid.rowLocations.triangle.up.push(rowLocation - tilePixels*(Q3 + 2)/(4*Q3));
		}
	}
}

// dodecagons in the odd-numbered rows
TruncatedHexagonal.prototype.shape = function (shapes, x, y) {
	if (modulo(y,2) == 0) {
		return shapes.triangle;
	} else {
		return shapes.dodecagon;
	}
}

// up and down triangles alternate
TruncatedHexagonal.prototype.orientation = function (x,y) {
	if (modulo(y,2) == 1) {
		return "straight";
	} else if (modulo(x + y/2,2) == 0) {
		return "up";
	} else {
		return "down";
	}
}

// odd numbered rows only use every second column
TruncatedHexagonal.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if ((modulo(x,2) == 1 && modulo(y,4) == 1) || 
			(modulo(x,2) == 0 && modulo(y,4) == 3)) continue;
		break;
	}
	return [x,y];
}

TruncatedHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	/* See also trihexagonal
	the northward pointing triangles in row 0 are actually at the bottom of the screen
	so if we've gone north and arrived at y = 0, then we crossed the edge, 
	and vice-versa when travelling south and arriving at y == 1
	in both of these cases, increase y by maxY + 1, so that grid.neighbour
	knows we've crossed the edge (continuous v non-continuous behaviour)
	similarly, when travelling sww or see and arriving at maxY + 1, we haven't
	actually crossed the edge, so set y to be zero, and vice versa when travelling
	nee or nww and arriving at -1 */
	var maxY = 4*gridSize - 1

	switch (direction) {
		case "n":         y--;  if (y == 0)        y = maxY + 1; break;
		case "nne": x++;  y-=2;                                  break;
		case "nee": x++;  y--;  if (y == -1)       y = maxY;     break;
		case "e":   x+=2;                                        break;
		case "see": x++;  y++;  if (y == maxY + 1) y = 0;        break;
		case "sse": x++;  y+=2;                                  break;
		case "s":         y++;  if (y == 1)        y = maxY + 2; break;
		case "ssw": x--;  y+=2;                                  break;
		case "sww": x--;  y++;  if (y == maxY + 1) y = 0;        break;
		case "w":   x-=2;                                        break;
		case "nww": x--;  y--;  if (y == -1)       y = maxY;     break;
		case "nnw": x--;  y-=2;                                  break;
	}

	return [x,y];
}

TruncatedHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var y = 0; y <= maxY; y ++) {
		var xInit = modulo(y,4) == 3 ? 1 : 0;
		var xIncr = modulo(y,2) == 0 ? 1 : 2;
		for (var x = xInit; x <= maxX; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TruncatedHexagonal.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[shape.name][orientation][y];

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TruncatedHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	var tileSize = grid.tilePixels;
	var columnWidth = tileSize*(Q3 + 2)/2;
	var rowHeight = tileSize*Q3*(Q3 + 2)/4;

	var column = Math.floor(xPixel/columnWidth);
	var row = Math.floor((yPixel - tileSize/4)/rowHeight) + 1;

	var columnPixel = column*columnWidth;
	var rowPixel = (row - 1)*rowHeight + tileSize/4;

	xPixel -= columnPixel;
	yPixel -= rowPixel;

	var x;
	var y;
	switch (modulo(2*(column - grid.xScroll) + row - grid.yScroll,4)) {
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

	x -= grid.xScroll;
	y -= grid.yScroll;

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
TruncatedHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	return xScroll*tilePixels*(Q3 + 2)/2;
}

// return the vertical offset in pixels
// based on the current scroll position
TruncatedHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	return yScroll*tilePixels*Q3*(Q3 + 2)/4;
}
