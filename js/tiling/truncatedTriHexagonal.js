
function TruncatedTriHexagonal (shapes) {
	this.name = "Truncated Tri-hexagonal Tiling";
	this.id = "truncated-trihexagonal";
	this.no = 11;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 6.0;
	this.complexity = 8.0;
	this.square = shapes.square;
	this.hexagon = shapes.hexagon;
	this.dodecagon = shapes.dodecagon;
}

TruncatedTriHexagonal.prototype = new Tiling();

TruncatedTriHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels*(4*Q3*size + 1)/(6*size + 1);
}

TruncatedTriHexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels*(6*size + 1)/(4*Q3*size + 1);
}

TruncatedTriHexagonal.prototype.tiles = function (size) {
	return (24 * size**2);
}

// return the size that will give the number of tiles closest to the given number
TruncatedTriHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/24));
}

// create sized shapes for a new grid
TruncatedTriHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.square = this.square.newSquare(grid);
	shapes.hexagon = this.hexagon.newHexagon(grid);
	shapes.dodecagon = this.dodecagon.newDodecagon(grid);
	return shapes;
}

TruncatedTriHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 8*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		tilePixels = 2*grid.yPixels/((6*grid.size + 1)*(Q3 + 1));
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		tilePixels = 2*grid.xPixels/((4*Q3*grid.size + 1)*(Q3 + 1));
	}
	grid.tilePixels = tilePixels;

	// size at which the tiling starts repeating
	// not used by triangular tiling, but needs to be set anyway
	grid.scrollWidth = grid.xPixels - tilePixels*(Q3 + 1)/2;
	grid.scrollHeight = grid.yPixels - tilePixels*(Q3 + 1)/2;

	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnWidth = (Q3 + 1)*Q3*tilePixels/4;
		var columnLocation = column*columnWidth + (Q3 + 2)*tilePixels/2;
		grid.columnLocations.push(columnLocation);

		// even-numbered columns contain dodecagons, straight squares and hexagons
		// right and left squares are in the odd-numbered columns
	}

	grid.rowLocations = {dodecagon: {straight: []}, square: {straight: [], right: [], left: []}, hexagon: {high: [], low: []}};
	for (var row = 0; row <= grid.yMax; row++) {
		var rowHeight = 3*tilePixels*(Q3 + 1)/4
		var rowLocation = row*rowHeight + (Q3 + 2)*tilePixels/2;

		grid.rowLocations.dodecagon.straight.push(rowLocation);
		grid.rowLocations.square.straight.push(rowLocation);
		grid.rowLocations.square.right.push(rowLocation);
		grid.rowLocations.square.left.push(rowLocation);
		grid.rowLocations.hexagon.high.push(rowLocation - tilePixels*(Q3 + 1)/4);
		grid.rowLocations.hexagon.low.push(rowLocation + tilePixels*(Q3 + 1)/4);
	}
}

// hexagons in the odd-numbered rows
TruncatedTriHexagonal.prototype.shape = function (shapes, x, y) {
	if (modulo(x,2) == 1 || modulo(x + y,4) == 2) {
		return shapes.square;
	} else if (modulo(x + y,4) == 0) {
		return shapes.dodecagon;
	} else {
		return shapes.hexagon;
	}
}

// all hexagons are flat
TruncatedTriHexagonal.prototype.orientation = function (x, y) {
	if (modulo(y,2) == 0) {
		// dodecagons & (straight) squares
		return "straight";
	} else if (modulo(x,2) == 0) {
		// (flat) hexagons (and also dodecagons & straight squares)
		return "flat";
	} else if (modulo(x - y,4) == 0) {
		return "left";
	} else {
		return "right";
	}
}

// odd numbered rows only use every second column
TruncatedTriHexagonal.prototype.random_tile = function (maxX, maxY) {
	while (true) {
		var x = Math.floor(Math.random()*(maxX + 1));
		var y = Math.floor(Math.random()*(maxY + 1));
		if (modulo(x,2) == 1 && modulo(y,2) == 0) continue;
		break;
	}
	return [x,y];
}

TruncatedTriHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	// directions nee, see, sww, nww have two different cases depending on shape and position
	// either border is between dodecagon & hexagon, or square and hexagon
	// two different types of hexagon, low and high
	// low hexagons at 0,1 2,3 4,1 etc (x - y)%4 is 3
	// high hexagons at 0,3 2,1 4,3 etc (x - y)%4 is 1
	var square_low  = (modulo(x,2) == 1 || modulo(x - y,4) == 3); // square or low hexagon
	var square_high = (modulo(x,2) == 1 || modulo(x - y,4) == 1); // square or high hexagon

	switch (direction) {
		case "n":           y--;                   break;
		case "nne": x++;    y--;                   break;
		case "nee": x++;           if (square_low) break;
			        x++;    y--;                   break;
		case "e":   x += 2;                        break;
		case "see": x++;          if (square_high) break;
			        x++;    y++;                   break;
		case "sse": x++;    y++;                   break;
		case "s":           y++;                   break;
		case "ssw": x--;    y++;                   break;
		case "sww": x--;          if (square_high) break;
			        x--;    y++;                   break;
		case "w":   x -= 2;                        break;
		case "nww": x--;          if (square_low)  break;
			        x--;    y--;                   break;
		case "nnw": x--;    y--;                   break;
	}

	return [x,y];
}

TruncatedTriHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var y = 0; y <= maxY; y ++) {
		var xIncr = modulo(y,2) == 1 ? 1 : 2;
		for (var x = 0; x <= maxX; x += xIncr) {
			tileFunction(x,y);
		}
	}
}

TruncatedTriHexagonal.prototype.tile_location = function (grid, x, y) {
	var shape = this.shape(grid.shapes,x,y);

	// get pixels based on row and column
	var xPixel = grid.columnLocations[x];
	if (shape.name == "hexagon") {
		var position = modulo(x - y,4) == 1 ? "high" : "low";
		var yPixel = grid.rowLocations[shape.name][position][y];
	} else {
		var orientation = this.orientation(x,y);
		var yPixel = grid.rowLocations[shape.name][orientation][y];
	}

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
TruncatedTriHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	var tileSize = grid.tilePixels;

	var columnWidth = tileSize*Q3*(Q3 + 1)/2
	var rowHeight = tileSize*3*(Q3 + 1)/4

	var column = Math.floor(xPixel/columnWidth);
	var row = Math.floor(yPixel/rowHeight);
	//var row = Math.floor((yPixel - tileSize/4)/rowHeight) + 1;
	// console.log(xPixel,yPixel,"is in column",column,"row",row);

	var columnPixel = column*columnWidth;
	var rowPixel = row*rowHeight;

	xPixel -= columnPixel;
	yPixel -= rowPixel;

	var x;
	var y;
	switch (modulo(2*(column - grid.xScroll) + row - grid.yScroll,4)) {
		case 0:
			// dodecagon occupies majority; top-left corner features a hexagon to the left and a left-square to the top
			// assume dodecagon:
			x = 2*column;
			y = row;
			if (xPixel + Q3*yPixel < tileSize*(Q3 + 1)/2 && Q3*xPixel > yPixel + tileSize*(Q3 - 1)/2) {
				// square
				x--;
				y--;
			} else if (Q3*xPixel + yPixel < tileSize*(Q3 + 1)/2) {
				// hexagon
				x-=2;
				y--;
			}
			break;
		case 1:
			// dodecagon occupies the top, right-square to the bottom
			// two hexagons, one on the left and one in the bottom right corner
			x = 2*column;
			y = row - 1;
			if (yPixel > tileSize*(Q3 + 5)/4 && Q3*xPixel + yPixel > tileSize*(3*Q3 + 11)/4) {
				// hexagon in the bottom left
				y++;
			} else if (xPixel + tileSize*(3*Q3 + 1)/4 < Q3*yPixel && Q3*xPixel + yPixel > 3*tileSize*(Q3 + 1)/4) {
				// square
				x--;
				y++;
			} else if (Q3*xPixel + Q3*tileSize*(Q3 - 1)/4 < yPixel) {
				// hexagon on the left
				y++;
				x-=2;
			}
			break;
		case 2:
			// dodecagon to the bottom left, hexagon to the top right
			// a straight-square in the bottom right and a right-square in the top left
			// assume dodecagon:
			x = 2*(column - 1);
			y = row;
			if (xPixel > tileSize*(Q3 + 1)/2 && yPixel > tileSize*(Q3 + 1)/2) {
				// straight-square
				x+=2; 
			} else if (Q3*xPixel > yPixel + tileSize && Q3*xPixel + yPixel > 2*tileSize) {
				// hexagon
				x+=2;
				y--;
			} else if (xPixel > Q3*yPixel) {
				// right-square
				x++;
				y--;
			}
			break;
		case 3:
			// dodecagon top left corner, hexagon bottom right
			// straight square top right and left square bottom left
			// also a smidgeon of another hexagon in the bottom left corner
			x = 2*(column - 1);
			y = row - 1;
			if (xPixel > tileSize*(Q3 + 1)/2 && yPixel < Q3*tileSize*(Q3 - 1)/4) {
				// straight-square
				x+=2;
			} else if (Q3*xPixel + yPixel > tileSize*(Q3 + 9)/4 && Q3*xPixel > yPixel + Q3*tileSize*(Q3 - 1)/4) {
				// hexagon
				x+=2;
				y++;
			} else if (xPixel + Q3*yPixel > Q3*tileSize*(Q3 + 5)/4 && Q3*xPixel + tileSize*(Q3 + 5)/4 > yPixel) {
				// left-square
				x++;
				y++;
			} else if (yPixel > tileSize*(Q3 + 5)/4) {
				// hexagon smidgeon
				y++;
			}
			break;
	}

	x -= 2*grid.xScroll;
	y -= grid.yScroll;
	// console.log("tile @",x,y);

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
TruncatedTriHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	return xScroll*tilePixels*Q3*(Q3 + 1)/2;
}

// return the vertical offset in pixels
// based on the current scroll position
TruncatedTriHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	return yScroll*tilePixels*3*(Q3 + 1)/4;
}
