
// tiling of dodecacons, hexagons (flat), squares (left, right, and straight), and triangles (left and right)
// "Extended Hexagonal" is my name for it - taking the dodecagons as the centre of the hexagons, and the triangles as the points
// https://en.wikipedia.org/wiki/File:2-uniform_n1.svg (rotated 90 degrees here)
// smallest size contains 12 squares, 6 hexagons, 4 triangles, and 2 dodecagons
// width = tilePixels * (2*size*(Q3 + 3) + 1/2) = height * (2*size*(Q3 + 3) + 1/2) / ((Q3 + 1)*(2*size + 1/2))
// height = tilePixels * (Q3 + 1)*(2*size + 1/2) = width * (Q3 + 1)*(2*size + 1/2) / (2*size*(Q3 + 3) + 1/2)
// tilePixels = width / (2*size*(Q3 + 3) + 1/2) = height / ((Q3 + 1)*(2*size + 1/2))

function ExtendedHexagonal (shapes) {
	this.name = "Extended Hexagonal Tiling";
	this.id = "extended-hexagonal";
	this.no = 13;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 5.0;
	this.complexity = 51/10;
	this.triangle = shapes.triangle;
	this.square = shapes.square;
	this.hexagon = shapes.hexagon;
	this.dodecagon = shapes.dodecagon;
}

ExtendedHexagonal.prototype = new Tiling();

// total display width in pixels
// repeat width is two dodecagons and two squares
// an extra 0.5 tilePixels is required to fully display the hexagons on the far right
// width = height * (2*size*(Q3 + 3) + 1/2) / ((Q3 + 1)*(2*size + 1/2))
ExtendedHexagonal.prototype.x_pixels = function (yPixels, size) {
	return yPixels * (2*size*(Q3 + 3) + 1/2) / ((Q3 + 1)*(2*size + 1/2));
}

// total display height in pixels
// repeat height is a dodecagon and a hexagon
// an extra (Q3 + 1)/2 is required to display the hexagons at the bottom
// height = width * (Q3 + 1)*(2*size + 1/2) / (2*size*(Q3 + 3) + 1/2)
ExtendedHexagonal.prototype.y_pixels = function (xPixels, size) {
	return xPixels * (Q3 + 1)*(2*size + 1/2) / (2*size*(Q3 + 3) + 1/2)
}

ExtendedHexagonal.prototype.tiles = function (size) {
	return (24 * size**2);
}

// return the size that will give the number of tiles closest to the given number
ExtendedHexagonal.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/24));
}

// create sized shapes for a new grid
ExtendedHexagonal.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.square = this.square.newSquare(grid);
	shapes.hexagon = this.hexagon.newHexagon(grid);
	shapes.dodecagon = this.dodecagon.newDodecagon(grid);
	return shapes;
}

ExtendedHexagonal.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 8*grid.size - 1;
	grid.yMax = 4*grid.size - 1;

	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
		// tilePixels = 2*grid.yPixels/((4*grid.size + 1)*(Q3 + 1));
		tilePixels = grid.yPixels / ((Q3 + 1)*(2*grid.size + 1/2));
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
		// tilePixels = 2*grid.xPixels/(4*grid.size*(Q3 + 3) + 1);
		tilePixels = grid.xPixels / (2*grid.size*(Q3 + 3) + 1/2);
	}
	grid.tilePixels = tilePixels;

	// scroll interval
	grid.scrollWidth = grid.xPixels - tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels*(Q3 + 1)/2;

	// even numbered columns contain left & right squares & triangles
	// - column centre matches squares
	// - column 0 mod 4 contains right triangles, centred to the left
	// - column 2 mod 4 contains left triangles, centred to the right
	// odd numbered columns contain dodecagons, hexagons and straight squares
	// - all centres match
	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column++) {
		var columnX = Math.floor(column/4);
		columnX *= Q3 + 3; // the pattern repeats every dodecagon width + straight square width

		switch (modulo(column,4)) {
			case 0: columnX +=   (Q3 + 1)/4; break; // + centre of a left/right square
			case 1: columnX +=   (Q3 + 2)/2; break; // + centre of a dodecagon
			case 2: columnX += (3*Q3 + 7)/4; break; // + width of left/right square + width of straight square + centre of left/right square
			case 3: columnX += (2*Q3 + 5)/2; break; // + width of a dodecagon + centre of a straight square
		}

		columnX *= tilePixels;
		grid.columnLocations.push(columnX);
	}

	// even numbered rows contain left & right squares, and hexagons
	// - row centre matches hexagons
	// - squares can be above or below
	// odd numbered rows contain dodecagons, hexagons, straight squares, left & right triangles
	// - all centres match
	grid.rowLocations = [];
	for (var row = 0; row <= grid.yMax; row++) {
		var rowX = Math.floor(row/2);
		rowX *= Q3 + 1; // row pattern repeats every dodecagon height + flat hexagon height, divided by two

		if (modulo(row,2) == 0) {
			// + first point on a dodecagon
			rowX += 1/2;
		} else {
			// + centre of a dodecagon
			rowX += (Q3 + 2)/2;
		}

		rowX *= tilePixels;
		grid.rowLocations.push(rowX);
	}
}

ExtendedHexagonal.prototype.shape = function (shapes, x, y) {
	switch (modulo(x,8)) {
		case 0:
			// left & right squares + right triangles
			return modulo(y,4) == 3 ? shapes.triangle : shapes.square;
		case 1:
			// dodecagons & hexagons
			return modulo(y,4) == 1 ? shapes.dodecagon : shapes.hexagon;
		case 2:
			// left & right squares + left triangles
			return modulo(y,4) == 3 ? shapes.triangle : shapes.square;
		case 3:
			// straight squares & hexagons
			return modulo(y,2) == 0 ? shapes.hexagon : shapes.square;
		case 4:
			// left & right squares + right triangles
			return modulo(y,4) == 1 ? shapes.triangle : shapes.square;
		case 5:
			// dodecagons & hexagons
			return modulo(y,4) == 3 ? shapes.dodecagon : shapes.hexagon;
		case 6:
			// left & right squares + left triangles
			return modulo(y,4) == 1 ? shapes.triangle : shapes.square;
		case 7:
			// straight squares & hexagons
			return modulo(y,2) == 0 ? shapes.hexagon : shapes.square;
	}
}

// all hexagons are flat
ExtendedHexagonal.prototype.orientation = function (x, y) {
	switch (modulo(x,8)) {
		case 0:
			// left & right squares + right triangles
			return modulo(y,4) == 0 ? "left" : "right";
		case 1:
			// dodecagons & hexagons
			return modulo(y,4) == 1 ? "straight" : "flat";
		case 2:
			// left & right squares + left triangles
			return modulo(y,4) == 0 ? "right" : "left";
		case 3:
			// straight squares & hexagons
			return modulo(y,2) == 0 ? "flat" : "straight";
		case 4:
			// left & right squares + right triangles
			return modulo(y,4) == 2 ? "left" : "right";
		case 5:
			// dodecagons & hexagons
			return modulo(y,4) == 3 ? "straight" : "flat";
		case 6:
			// left & right squares + left triangles
			return modulo(y,4) == 2 ? "right" : "left";
		case 7:
			// straight squares & hexagons
			return modulo(y,2) == 0 ? "flat" : "straight";
	}
}

ExtendedHexagonal.prototype.neighbour = function (x, y, direction, gridSize) {
	// console.log("neighbour of",x,y,direction);
	/*
	Coordinate map:
	      0   1   2   3   4   5   6   7  
	    +---+---+---+---+---+---+---+---+
	  0 | Sl|   | Sr| H | Sr|   | Sl| H |
	    +---+---+---+---+---+---+---+---+
	  1 |   | D |   | Ss| Tr| H | Tl| Ss|
	    +---+---+---+---+---+---+---+---+
	  2 | Sr|   | Sl| H | Sl|   | Sr| H |
	    +---+---+---+---+---+---+---+---+
	  3 | Tr| H | Tl| Ss|   | D |   | Ss|
	    +---+---+---+---+---+---+---+---+
	D = Dodecagon
	H = Hexagon
	S = Square (s = straight, l = left, r = right)
	T = Triangle (l = left, r = right)
	*/

	

	var dirCoord = direction + "-" + modulo(x,8) + modulo(y,4);

	// note: switch uses drop-throughs
	switch (dirCoord) {
		case "n-11":   case "n-13":   case "n-51":   case "n-53":        y--;        // D  <-> H
		case "n-30":   case "n-31":   case "n-32":   case "n-33":
		case "n-70":   case "n-71":   case "n-72":   case "n-73":        y--; break; // Ss <-> H
		case "nne-02": case "nne-11": case "nne-40": case "nne-53": x++;             // D  <-> Sr
		case "nne-03": case "nne-20": case "nne-41": case "nne-62":      y--; break; // Tr  -> Sr or Sr -> Tl
		case "nee-11": case "nee-30": case "nee-53": case "nee-72": x++;             // D  <-> H 
		case "nee-00": case "nee-13": case "nee-42": case "nee-51":      y--;        // Sl <-> H
		case "nee-22": case "nee-32": case "nee-60": case "nee-70": x++;      break; // Sl <-> H
		case "e-11":   case "e-33":   case "e-53":   case "e-71":   x++;             // D  <-> Ss
		case "e-23":   case "e-31":   case "e-61":   case "e-73":   x++;      break; // Tl  -> Ss or Ss -> Tr
		case "see-11": case "see-32": case "see-53": case "see-70": x++;             // D  <-> H
		case "see-02": case "see-13": case "see-40": case "see-51":      y++;        // Sr <-> H
		case "see-20": case "see-30": case "see-62": case "see-72": x++;      break; // Sr <-> H
		case "sse-00": case "sse-11": case "sse-42": case "sse-53": x++;             // D  <-> Sl
		case "sse-03": case "sse-22": case "sse-41": case "sse-60":      y++; break; // Tr  -> Sl or Sl -> Tl
		case "s-11":   case "s-13":   case "s-51":   case "s-53":        y++;        // D  <-> H
		case "s-30":   case "s-31":   case "s-32":   case "s-33":
		case "s-70":   case "s-71":   case "s-72":   case "s-73":        y++; break; // Ss <-> H
		case "ssw-11": case "ssw-20": case "ssw-53": case "ssw-62": x--;             // D  <-> Sr
		case "ssw-02": case "ssw-23": case "ssw-40": case "ssw-61":      y++; break; // Tl  -> Sr or Sr -> Tr
		case "sww-11": case "sww-30": case "sww-53": case "sww-72": x--;             // D  <-> H
		case "sww-13": case "sww-22": case "sww-51": case "sww-60":      y++;        // Sl <-> H
		case "sww-00": case "sww-32": case "sww-42": case "sww-70": x--;      break; // Sl <-> H
		case "w-11":   case "w-31":   case "w-53":   case "w-73":   x--;             // D  <-> Ss
		case "w-03":   case "w-33":   case "w-41":   case "w-71":   x--;      break; // Tr  -> Ss or Ss -> Tl x-
		case "nww-11": case "nww-32": case "nww-53": case "nww-70": x--;             // D  <-> H
		case "nww-13": case "nww-20": case "nww-51": case "nww-62":      y--;        // Sr <-> H
		case "nww-02": case "nww-30": case "nww-40": case "nww-72": x--;      break; // Sr <-> H
		case "nnw-11": case "nnw-22": case "nnw-53": case "nnw-60": x--;             // D  <-> Sl
		case "nnw-00": case "nnw-23": case "nnw-42": case "nnw-61":      y--; break; // Tl  -> Sl or Sl -> Tr y-

		default:
			console.error("No matching case for "+dirCoord);
	}

	// console.log("neighbour is",x,y);
	return [x,y];
}

ExtendedHexagonal.prototype.random_tile = function (maxX, maxY) {
	// console.log("random tile up to "+maxX+","+maxY);

	// pick a random row (every row has the same number of cells)
	var y = Math.floor(Math.random()*(maxY + 1));

	// every row, only 3 of every 4 cells are used
	// random number up to 3/4 of maximum x
	var rand = Math.floor(Math.random()*(3*(maxX + 1)/4));

	// patterns repeat every 8 cells
	// map x to the x at the beginning of the pattern
	var x = 8*(Math.floor(rand/6));

	// add the remainder
	var remainder = modulo(rand,6);
	x += remainder;

	// add another 1 or two depending which row and what the remainder is
	if (modulo(y,2) == 0) {
		// second (1) and sixth (5) columns are missing
		if (remainder >= 1) x++;
		if (remainder >= 4) x++;
	} else if (modulo(y,4) == 1) {
		// first (0) and third (2) columns are missing
		if (remainder >= 0) x++;
		if (remainder >= 1) x++;
	} else {
		// fifth (4) and seventh (6) columns are missing
		if (remainder >= 4) x++;
		if (remainder >= 5) x++;
	}

	// console.log("random tile is "+x+","+y);
	return [x,y];
}

ExtendedHexagonal.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var y = 0; y <= maxY; y ++) {
		for (var x = 0; x <= maxX; x ++) {
			// skip this cell depending which row and column
			if (modulo(y,2) == 0) {
				// second (1) and sixth (5) columns are missing
				if (modulo(x,4) == 1) continue;
			} else if (modulo(y,4) == 1) {
				// first (0) and third (2) columns are missing
				if (modulo(x,8) == 0 || modulo(x,8) == 2) continue;
			} else {
				// fifth (4) and seventh (6) columns are missing
				if (modulo(x,8) == 4 || modulo(x,8) == 6) continue;
			}

			tileFunction(x,y);
		}
	}
}

ExtendedHexagonal.prototype.tile_location = function (grid, x, y) {
	var xPixel = grid.columnLocations[x];
	var yPixel = grid.rowLocations[y];

	var shape = this.shape(grid.shapes,x,y);
	var orientation = this.orientation(x,y);
	if (shape == grid.shapes.square && orientation != "straight") {
		// adjust yPixel up or down
		// XOR:
		// left/right squares:
		// 0,0 & 2,0 up
		// 0,2 & 2,2 down
		// 4,0 & 6,0 down
		// 4,2 & 6,2 up
		if ((modulo(x,8) < 4) != (modulo(y,4) == 0)) {
			yPixel += grid.tilePixels*(Q3 + 1)/4;
		} else {
			yPixel -= grid.tilePixels*(Q3 + 1)/4;
		}
	} else if (shape == grid.shapes.triangle) {
		// adjust xPixel left or right
		if (orientation == "left") {
			xPixel += grid.tilePixels*(Q3 + 3)/12;
		} else {
			xPixel -= grid.tilePixels*(Q3 + 3)/12;
		}
	}

	// adjust for y = 0 - the hexagons, and half of the squares are actually at the bottom of the grid
	// they are partially at the top of the grid too, but we need to return the position at which they are fully visible
	if (y == 0 && (shape == grid.shapes.hexagon || modulo(x,8) < 4)) yPixel += grid.scrollHeight;

	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
ExtendedHexagonal.prototype.tile_at = function (grid, xPixel, yPixel) {
	console.log("find tile @ "+xPixel+","+yPixel);
	var tileSize = grid.tilePixels;
	
	// determine which "column"/"row" we are in
	var columnWidth = tileSize*(Q3 + 3)/2;
	var rowHeight = tileSize*(Q3 + 1);
	// console.log("column height is "+columnWidth);
	// console.log("row width is "+rowHeight);

	var column = Math.floor(xPixel/columnWidth);
	var row = Math.floor(yPixel/rowHeight);
	//var row = Math.floor((yPixel - tileSize/4)/rowHeight) + 1;
	console.log("column "+column+", row "+row);

	var columnPixel = column*columnWidth;
	var rowPixel = row*rowHeight;
	console.log("column @ "+columnPixel+", row @ "+rowPixel);

	xPixel -= columnPixel;
	yPixel -= rowPixel;
	console.log("within cell @ "+xPixel+","+yPixel);

	// if the x or y scroll is odd, then we need to adjust row/column
	if (modulo(grid.xScroll,2) == 1) {
		xPixel -= columnWidth/2;
		console.log("scroll-adjusted x "+xPixel);
		if (xPixel < 0) {
			xPixel += columnWidth;
			column = modulo(column - 1,4*grid.size);
			console.log("scroll-adjusted x "+xPixel);
			console.log("scroll-adjusted column "+column);
		}
	}

	if (modulo(grid.yScroll,2) == 1) {
		yPixel -= rowHeight/2;
		if (yPixel < 0) {
			yPixel += rowHeight;
			row = modulo(row - 1,2*grid.size);
		}
	}

	// identify cell type
	// 4 types of cell: 0,1,2,3
	var xScroll = Math.floor(grid.xScroll/2);
	var yScroll = Math.floor(grid.yScroll/2);
	var cellType;
	if (modulo(column - xScroll,4) < 2) {
		cellType = 2*modulo(column - xScroll,2) + modulo(row - yScroll,2);
	} else {
		cellType = 2*modulo(column - xScroll,2) + modulo(row + 1 - yScroll,2);
	}
	

	var x;
	var y;
	switch (cellType) {
		case 0:
			console.log("near top left of a dodecagon");
			// dodecagon occupies majority; top-left corner features a hexagon to the left and a left-square to the top
			// there is also a sliver of a hexagon at the bottom left

			// assume dodecagon:
			x = 2*column + 1;
			y = 2*row + 1;

			// border between dodecagon and square runs from [(Q3 + 1)/2, 0] to [1/2, 1/2]
			// border between dodecagon and hexagon runs from [0, (Q3 + 1)/2] to [1/2, 1/2]
			// border between hexagon and square runs from [(Q3 - 1)/(2*Q3), 0] to [1/2, 1/2]
			// border between dodecagon and lower left hexagon from [0, (Q3 + 3)/2)] to [(Q3 - 1)/(2*Q3), Q3 + 1]
			if (xPixel + Q3*yPixel < tileSize*(Q3 + 1)/2 && Q3*xPixel > yPixel + tileSize*(Q3 - 1)/2) {
				// top left, square
				console.log("left square above dodecagon");
				x--;
				y--;
			} else if (Q3*xPixel + yPixel < tileSize*(Q3 + 1)/2) {
				// top left, hexagon
				console.log("hexagon north west of dodecagon");
				x -= 2;
				y--;
			} else if (Q3*xPixel < yPixel - tileSize*(Q3 + 3)/2) {
				// bottom right hexagon
				console.log("hexagon south west of dodecagon");
				x -= 2;
				y++;
			} else {
				console.log("dodecagon");
			}

			break;
		case 1:
			console.log("near right-square at bottom left of a dodecagon");
			// bottom-left of dodecagon occupies the top right
			// most of a hexagon, on the right, north face to the south face of the dodecagon
			// all of a right square to the left, nne face to the ssw face of the dodecagon, sse face to the nww face of the hexagon
			// all of a right triangle against the left edge, nne face to the square
			// most of a left square below the triangle, to the triangle's sse face and the hexagon's sww face
			// some of another hexagon at the top left, touching the dodecagon and the right square
			// tiny sliver of another hexagon bottom left

			// assume right square:
			x = 2*column;
			y = 2*row;

			// border between right square and hexagon on the right runs southwest from [(Q3 + 1)/2, 1] to [Q3/2, (Q3 + 2)/2]
			// - this line reaches the top edge of the area at [(Q3 + 5)/(2*Q3), 0]
			// border between right square and dodecagon runs southeast from [1/2, 1/2] to [(Q3 + 1)/2, 1]
			// border between right square and triangle runs southeast from [0, (Q3 + 1)/2] to [Q3/2, (Q3 + 2)/2]
			// border between right square and top-left hexagon runs northeast from [0, (Q3 + 1)/2] to [1/2, 1/2]

			if ((xPixel - tileSize/2)/Q3 > (yPixel - tileSize/2)) {
				// beyond the ne border of the right square - either the dodecagon, the hexagon on the right or the top-left hexagon
				// border between hexagon on the right and dodecagon runs horizontally from [(Q3 + 1)/2, 1] to [(Q3 + 3)/2, 1]
				// border between top-left hexagon and dodecagon runs southeast from [(Q3 - 1)/(2*Q3), 0] to [1/2, 1/2]
				if (yPixel > tileSize) {
					// hexagon on the right
					console.log("hexagon to the right of the square");
					x++;
					y++;
				} else if (Q3*(xPixel - tileSize*(Q3 - 1)/(2*Q3)) > yPixel) {
					// dodecagon
					console.log("dodecagon above the square");
					x++;
					y--;
				} else {
					console.log("hexagon to the left of the square");
					// top-left hexagon
					x--;
				}
			} else if (xPixel/Q3 < (yPixel - tileSize*(Q3 + 1)/2)) {
				// beyond the sw edge of the right square - either the triangle, the left square, the hexagon on the right or the bottom left hexagon
				// border between triangle and left square runs northwest from [(Q3 + 3)/2, 0] to [Q3/2, (Q3 + 2)/2]
				// border between hexagon on the right and left square runs southeast from [Q3/2, (Q3 + 2)/2] to [(Q3 + 1)/2, Q3 + 1]
				// border between bottom left hexagon and left square runs southeast from [(Q3 + 3)/2, 0] to [(Q3 - 1)/(2*Q3), Q3 + 1]
				if ((xPixel - tileSize*Q3/2) > (yPixel - tileSize*(Q3 + 2)/2)/Q3) {
					console.log("hexagon to the right of the square");
					// hexagon on the right
					x++;
					y++;
				} else if ((xPixel/Q3 + yPixel) < tileSize*(Q3 + 3)/2) {
					console.log("triangle below the square");
					// triangle
					y++;
				} else if (xPixel > (yPixel - tileSize*(Q3 + 3)/2)/Q3) {
					console.log("left-square further down");
					// left square
					y += 2;
				} else {
					console.log("hexagon further down and to the left");
					// bottom left hexagon
					y += 2;
					x--;
				}
			} else if ((xPixel + yPixel/Q3) > tileSize*(Q3 + 5)/(2*Q3)) {
				// hexagon on the right
				console.log("hexagon to the right of the square");
				x++;
				y++;
			} else if ((Q3*xPixel + yPixel) < tileSize*(Q3 + 1)/2) {
				// top left hexagon
				console.log("hexagon to the left of the square");
				x--;
			}

			break;
		case 2:
			console.log("near the right of a dodecagon");
			// top right of a dodecagon on the left, touching bottom left of a hexagon to the top right
			// all of a straight-square below the hexagon, on the right
			// top of another hexagon below the square
			// bottom of a right square at top left, between the dodecagon and the hexagon

			// assume dodecagon:
			x = 2*column - 1;
			y = 2*row + 1;

			// border between dodecagon and straight square is a vertical line from [(Q3 + 1)/2, (Q3 + 1)/2] to [(Q3 + 3)/2, (Q3 + 1)/2]
			// border between dodecagon and upper hexagon runs southwest from [Q3/2, 1/2] to [(Q3 + 1)/2, (Q3 + 1)/2]
			// border between dodecagon and right square runs southwest from [0, 0] to [Q3/2, 1/2]
			// border between dodecagon and lower hexagon runs southeast from [(Q3 + 3)/2, (Q3 + 1)/2] to [2/Q3, Q3 + 1]
			// - this line reaches the left edge (x = 0) at Q3 + 3
			if (xPixel > tileSize*(Q3 + 1)/2) {
				console.log("near square to the right of the dodecagon");
				// right of the dodecagon - either the straight square or one of the hexagons
				// assume square:
				x += 2;
				// border between upper hexagon and square is a horizontal line from [(Q3 + 1)/2, (Q3 + 1)/2] to [(Q3 + 1)/2, (Q3 + 3)/2]
				// border between square and lower hexagon is a horizontal line from [(Q3 + 1)/2, (Q3 + 3)/2] to [(Q3 + 3)/2, (Q3 + 3)/2]
				if (yPixel < tileSize*(Q3 + 1)/2) {
					console.log("hexagon above the square");
					// upper hexagon
					y--;
				} else if (yPixel > tileSize*(Q3 + 3)/2) {
					console.log("hexagon below the square");
					// lower hexagon
					y++;
				}
			} else if ((xPixel - tileSize*Q3/2) > (yPixel - tileSize/2)/Q3) {
				// beyond the nee edge of the dodecagon - either the upper hexagon or the right square
				y--;
				if ((xPixel + yPixel/Q3) > tileSize*2/Q3) {
					console.log("hexagon above and to the right of the dodecagon");
					// hexagon
					x += 2;
				} else {
					console.log("right-square above the dodecagon");
					// square
					x++;
				}
			} else if (xPixel/Q3 > yPixel) {
				// beyond the nne edge of the dodecagon - must be the right square
				console.log("right-square above the dodecagon");
				y--;
				x++;
			} else if ((Q3*xPixel + yPixel) > tileSize*(Q3 + 3)) {
				// beyond the see edge of the dodecagon - the lower hexagon
				console.log("hexagon down and to the right of the dodecagon");
				x += 2;
				y++;
			}

			break;
		case 3:
			console.log("near left-square at bottom right of a dodecagon");
			// bit of a dodecagon in top left corner
			// all of a left square against the sse face of the dodecagon
			// all of a left triangle below the square, and the top of a right square below that
			// the right of a hexagon on the left of the two squares
			// another hexagon in the top right, against the see face of the dodecagon, and the nee face of the left square
			// a straight square below the hexagon, on the west face of the triangle
			// finally another hexagon in bottom right, touching the straight square and the right square

			// assume the left square:
			x = 2*column;
			y = 2*row;

			// border between square and dodecagon runs northwest from [0, 1] to [Q3/2, 1/2]
			// border between square and top right hexagon runs southwest from [Q3/2, 1/2] to [(Q3 + 1)/2, (Q3 + 1/2)]
			// border between square and left hexagon runs southwest from [0, 1] to [1/2, (Q3 + 2)/2]
			// border between square and triangle runs northwest from [1/2, (Q3 + 2)/2] to [(Q3 + 1)/2, (Q3 + 1/2)]
			// - this line intersects the left edge (x = 0) at y = (Q3 + 2)/Q3
			if ((xPixel/Q3 + yPixel) < tileSize) {
				// beyond the square's nnw edge - either dodecagon or top right hexagon
				// border between the two runs southeast from [2/Q3, 0] to [Q3/2, 1/2]
				if ((xPixel + yPixel/Q3) < tileSize*2/Q3) {
					console.log("dodecagon above the square");
					// dodecagon
					x--;
					y--;
				} else {
					console.log("hexagon right of the square");
					// hexagon
					x++;
				}
			} else if ((xPixel - tileSize*Q3/2) > (yPixel - tileSize/2)/Q3) {
				// beyond the nee edge of the square - either top right hexagon or straight square
				// assume hexagon:
				console.log("near hexagon above the square");
				x++;
				// border between the two is a horizontal line from [(Q3 + 1)/2, (Q3 + 1)/2] to [(Q3 + 3)/2, (Q3 + 1)/2]
				if (yPixel > tileSize*(Q3 + 1)/2) {
					console.log("straight square below the hexagon");
					y++;
				}
			} else if (xPixel < (yPixel - tileSize)/Q3) {
				// beyond the square's sww edge - either the hexagon on the left or the right square at the bottom
				// boundary is a line running southeast from [1/2, (Q3 + 2)/2] to [0, Q3 + 1]
				if ((Q3*xPixel + yPixel) < tileSize*(Q3 + 1)) {
					console.log("hexagon left of the square");
					// hexagon
					x--;
					y++;
				} else {
					console.log("right-square further down");
					// square
					y += 2;
				}
			} else if ((xPixel/Q3 + yPixel) > tileSize*(Q3 + 2)/Q3) {
				// beyond the ssw edge of the square - could be the triangle, the straight square, the right square or the bottom hexagon
				// border between the triangle and the straight square is a vertical line from [(Q3 + 1)/2, (Q3 + 1)/2] to [(Q3 + 1)/2, (Q3 + 3)/2]
				// border between the straight square and the hexagon is a horizontal line from [(Q3 + 1)/2, (Q3 + 3)/2] to [(Q3 + 3)/2, (Q3 + 3)/2]
				// border between the triangle and the left square runs southwest from [1/2, (Q3 + 2)/2] to [(Q3 + 1)/2, (Q3 + 3)/2]
				// border between left square and hexagon runs southeast from [(Q3 + 3)/2, (Q3 + 1)/2] to [2/Q3, Q3 + 1]
				if (xPixel > tileSize*(Q3 + 1)/2 && yPixel < tileSize*(Q3 + 3)/2) {
					// straight square
					console.log("straight square right of the square");
					x++;
					y++;
				} else if (xPixel < tileSize*(Q3 + 1)/2 && (xPixel - tileSize/2)/Q3 > (yPixel - tileSize*(Q3 + 2)/2)) {
					console.log("triangle below the square");
					// triangle
					y++;
				} else if (yPixel > tileSize*(Q3 + 3)/2 && (Q3*xPixel + yPixel) > tileSize*(Q3 + 3)) {
					console.log("hexagon, further down and to the right");
					// hexagon
					x++;
					y += 2;
				} else {
					console.log("right-square further down");
					// right square
					y += 2;
				}
			}

			break;
	}

	x -= 2*xScroll
	y -= 2*yScroll
	console.log("tile @"+x+","+y);

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
ExtendedHexagonal.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	console.log("x scroll is "+xScroll);
	return xScroll*tilePixels*(Q3 + 3)/4;
	// return xScroll*tilePixels*Q3*(Q3 + 1)/2
}

// return the vertical offset in pixels
// based on the current scroll position
ExtendedHexagonal.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	console.log("y scroll is "+yScroll);
	return yScroll*tilePixels*(Q3 + 1)/2;
	// return yScroll*tilePixels*3*(Q3 + 1)/4
}
