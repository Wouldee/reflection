
// tiling of dodecacons, straight squares, and triangles (up, down, left and right)
// "Extended Squares" is my name for it, it doesn't have a proper name
// https://en.wikipedia.org/wiki/3-4-3-12_tiling
// smallest size contains 16 triangles, 4 squares, and 4 dodecagons

function ExtendedSquare (shapes) {
	this.name = "Extended Square Tiling";
	this.id = "extended-square";
	this.no = 12;
	this.xContinuous = true;
	this.yContinuous = true;
	this.filters = null;
	this.prisms = null;
	this.faces = 14/3;
	this.complexity = 6.0;
	this.triangle = shapes.triangle;
	this.square = shapes.square;
	this.dodecagon = shapes.dodecagon;
}

ExtendedSquare.prototype = new Tiling();

// x and y are equal
ExtendedSquare.prototype.x_pixels = function (yPixels, size) {
	return yPixels;
}

// x and y are equal
ExtendedSquare.prototype.y_pixels = function (xPixels, size) {
	return xPixels;
}

ExtendedSquare.prototype.tiles = function (size) {
	return (24 * size**2);
}

// return the size that will give the number of tiles closest to the given number
ExtendedSquare.prototype.closest_size = function (tiles) {
	return Math.round(Math.sqrt(tiles/24));
}

ExtendedSquare.prototype.shapes = function (grid) {
	var shapes = {};
	shapes.triangle = this.triangle.newTriangle(grid);
	shapes.square = this.square.newSquare(grid);
	shapes.dodecagon = this.dodecagon.newDodecagon(grid);
	return shapes;
}

ExtendedSquare.prototype.calculate_dimensions = function (grid) {
	grid.xMax = 8*grid.size - 1;
	grid.yMax = 8*grid.size - 1;


	// determine the size of each tile edge
	// and whether we use the width or the height of the available space
	var tilePixels;
	if (this.x_pixels(grid.yPixels,grid.size) < grid.xPixels) {
		// tile size is restricted by the screen height
		grid.xPixels = this.x_pixels(grid.yPixels,grid.size);
	} else {
		grid.yPixels = this.y_pixels(grid.xPixels,grid.size);
	}

	// width/height is two dodecagons per size, plus an extra 1/2
	// tilePixels (length of any shape's side) is the reverse of this equation
	tilePixels = grid.xPixels/(2*grid.size*(Q3 + 2) + 1/2);
	grid.tilePixels = tilePixels;

	// scroll interval - width/height minus the extra 1/2
	grid.scrollWidth = grid.xPixels - tilePixels/2;
	grid.scrollHeight = grid.yPixels - tilePixels/2;

	// column pattern repeats every four columns:
	// column 0 contains only right triangles
	// column 1 contains only dodecagons
	// column 2 contains only left triangles
	// column 3 contains squares, and up & down triangles
	// - all centres match
	var columnX = 0;
	grid.columnLocations = [];
	for (var column = 0; column <= grid.xMax; column += 4) {
		// the pattern repeats every dodecagon width

		// first column, centre of right triangles - pushed in by 1/2 of a square
		// triangle centre is at Q3/6
		grid.columnLocations.push(columnX + tilePixels*(Q3 + 3)/6);

		// second column, centre of dodecaons - left edge flush with the column
		// dodecagon centre is (Q3 + 2)/2
		grid.columnLocations.push(columnX + tilePixels*(Q3 + 2)/2);

		// third column, left triangles - dodecagon width minus first column location
		// comes out as (3*Q3 + 5)/(2*Q3)~~~looks complicated - is it correct?
		grid.columnLocations.push(columnX + tilePixels*(3*Q3 + 5)/(2*Q3));

		// final column with the squares and up/down triangles is exactly where the next column starts
		// increment columnX by the width of a dodecagon
		columnX += tilePixels*(Q3 + 2);
		grid.columnLocations.push(columnX);
	}

	// rows exactly the same as columns, just copy the columns array
	grid.rowLocations = grid.columnLocations.slice();
}

ExtendedSquare.prototype.shape = function (shapes, x, y) {
	if (modulo(x,4) == 1) {
		return shapes.dodecagon;
	} else if (modulo(x,4) == 3 && modulo(y,4) == 3) {
		return shapes.square;
	} else {
		return shapes.triangle;
	}
}

// all squares are straight
ExtendedSquare.prototype.orientation = function (x, y) {
	if (modulo(x,4) == 0) {
		// right triangle
		return "right";
	} else if (modulo(x,4) == 2) {
		// left triangle
		return "left";
	} else if (modulo(y,4) == 0) {
		// down triangle
		return "down";
	} else if (modulo(y,4) == 2) {
		return "up";
	} else {
		// dodecagon or square
		return "straight"
	}
}

ExtendedSquare.prototype.neighbour = function (x, y, direction, gridSize) {
	// console.log("neighbour of",x,y,direction);
	/*
	Coordinate map:
	      0   1   2   3   4   5   6   7  
	    +---+---+---+---+---+---+---+---+
	  0 |   |   |   | v |   |   |   | v |
	    +---+---+---+---+---+---+---+---+
	  1 |   | D |   |   |   | D |   |   |
	    +---+---+---+---+---+---+---+---+
	  2 |   |   |   | ^ |   |   |   | ^ |
	    +---+---+---+---+---+---+---+---+
	  3 | > |   | < | S | > |   | < | S |
	    +---+---+---+---+---+---+---+---+
	  4 |   |   |   | v |   |   |   | v |
	    +---+---+---+---+---+---+---+---+
	  5 |   | D |   |   |   | D |   |   |
	    +---+---+---+---+---+---+---+---+
	  6 |   |   |   | ^ |   |   |   | ^ |
	    +---+---+---+---+---+---+---+---+
	  7 | > |   | < | S | > |   | < | S |
	    +---+---+---+---+---+---+---+---+
	D = Dodecagon
	S = Square
	^,v,>,< = Triangle 
	*/

	// ddistance is greater between two dodecagons (cardinal directions)
	var dodecagon = (modulo(x,4) == 1);

	switch (direction) {
		case "n":           y--;    if (dodecagon) y -= 3; break; // S <-> Tu/Td, or D <-> D
		case "nne": x++;    y -= 2;                        break; // D <-> Tl
		case "nee": x += 2; y--;                           break; // D <-> Td
		case "e":   x++;            if (dodecagon) x += 3; break; // S <-> Tl/Tr, D <-> D
		case "see": x += 2; y++;                           break; // D <-> Tu
		case "sse": x++;    y += 2;                        break; // D <-> Tl
		case "s":           y++;    if (dodecagon) y += 3; break; // S <-> Tu/Td, D <-> D
		case "ssw": x--;    y += 2;                        break; // D <-> Tr
		case "sww": x -= 2; y++;                           break; // D <-> Tu
		case "w":   x--;            if (dodecagon) x -= 3; break; // S <-> Tl/Tr, D <-> D
		case "nww": x -= 2; y--;                           break; // D <-> Td
		case "nnw": x--;    y -= 2;                        break; // D <-> Tr
	}

	// console.log("neighbour is",x,y);
	return [x,y];
}

ExtendedSquare.prototype.random_tile = function (maxX, maxY) {
	// random x and y - size multiplied by two
	var x = Math.floor(Math.random()*(maxX + 1)/4);
	var y = Math.floor(Math.random()*(maxY + 1)/4);

	// pick a random shape & orientation
	// they all appear in equal numbers
	// 0 = dodecagon, 1 = square, 2 = up triangle, 3 = down triangle, 4 = right triangle, 5 = left triangle
	switch (Math.floor(Math.random()*6)) {
		case 0:
			// dodecagons appear in row & column mod 4 = 1
			x = 4*x + 1;
			y = 4*y + 1;
			break;
		case 1:
			// squares appear in row & column mod 4 = 3
			x = 4*x + 3;
			y = 4*y + 3;
			break;
		case 2:
			// up triangles appear in row mod 4 = 2, column mod 4 = 3
			x = 4*x + 3;
			y = 4*y + 2;
			break;
		case 3:
			// down triangles appear in row mod 4 = 0, column mod 4 = 3
			x = 4*x + 3;
			y = 4*y;
			break;
		case 4:
			// right triangles appear in row mod 4 = 3, column mod 4 = 0
			x = 4*x;
			y = 4*y + 3;
			break;
		case 5:
			// left triangles appear in row mod 4 = 3, column mod 4 = 2
			x = 4*x + 2;
			y = 4*y + 3;
			break;
	}

	// console.log("random tile = "+x+","+y);
	return [x,y];
}

ExtendedSquare.prototype.each_tile = function (maxX, maxY, tileFunction) {
	for (var row = 0; row <= maxY; row += 4) {
		// row 0 contains only down triangles, at x mod 4 = 3
		var y = row;
		for (var x = 3; x <= maxX; x += 4) {
			tileFunction(x,y);
		}

		// row 1 contains only dodecagons, at x & y mod 4 = 1
		y++;
		for (var x = 1; x <= maxX; x += 4) {
			tileFunction(x,y);
		}

		// row 3 contains only up triangles, at x & y mod 4 = 1
		y++;
		for (var x = 3; x <= maxX; x += 4) {
			tileFunction(x,y);
		}

		// row 4 contains squares, and left, right triangles
		// x = 1 mod 4 is empty
		y++;
		for (var x = 0; x <= maxX; x++) {
			if (modulo(x,4) == 1) continue;
			tileFunction(x,y);
		}
	}
}

// return the x,y of the tile that the pixel position is inside of
ExtendedSquare.prototype.tile_at = function (grid, xPixel,yPixel) {
	// console.log("Find tile @"+xPixel+","+yPixel);
	var tileSize = grid.tilePixels;

	// determine which "column"/"row" we are in
	// cell size (width/hieght) is half a dodecagon
	// each cell contains a quarter of a dodecagon
	var cellSize = tileSize*(Q3 + 2)/2;
	// console.log("cell size = "+cellSize);

	var column = Math.floor(xPixel/cellSize);
	var row = Math.floor(yPixel/cellSize);
	// console.log(xPixel,yPixel,"is in column",column,"row",row);

	var columnPixel = column*cellSize;
	var rowPixel = row*cellSize;

	xPixel -= columnPixel;
	yPixel -= rowPixel;
	// console.log("relative coord "+xPixel+","+yPixel);


	// cell at 0,0 (mod 2) has a quarter of a square in the top left
	// half a down triangle below it, half a right triangle to the right
	// the rest is all dodecagon
	// translate x and y for other x,y to be same as 0,0
	if (modulo(column - grid.xScroll/2,2) == 1) xPixel = cellSize - xPixel;
	if (modulo(row - grid.yScroll/2,2) == 1)    yPixel = cellSize - yPixel;
	// console.log("translated to "+xPixel+","+yPixel);

	var x = column*2;
	var y = row*2;
	// console.log("initial x,y "+x+","+y);
	if (xPixel < tileSize/2 && yPixel < tileSize/2) {
		// square
		x += modulo(column,2) == 0 ? -1 : 1;
		y += modulo(row,2) == 0 ? -1 : 1;
		// console.log("square: "+x+","+y);
	} else if (xPixel < tileSize/2 && (Q3*xPixel + yPixel) < tileSize*(Q3 + 1)/2) {
		// down triangle (or up triangle)
		x += modulo(column,2) == 0 ? -1 : 1;
		// console.log("up/down triangle: "+x+","+y);
	} else if (yPixel < tileSize/2 && (xPixel + Q3*yPixel) < tileSize*(Q3 + 1)/2) {
		// right triangle (or left triangle)
		y += modulo(row,2) == 0 ? -1 : 1;
		// console.log("left/right triangle: "+x+","+y);
	} else {
		// dodecagon
		x += modulo(column,2) == 0 ? 1 : -1;
		y += modulo(row,2) == 0 ? 1 : -1;
		// console.log("dodecagon: "+x+","+y);
	}

	// console.log("scroll = "+grid.xScroll+","+grid.yScroll);
	// round scroll down to the nearest even number before applying
	// not sure why this is needed, think it's because of the translation above~~~
	// var scrollX = 2*Math.floor(grid.xScroll/2);
	// var scrollY = 2*Math.floor(grid.yScroll/2);

	x -= grid.xScroll/2;
	y -= grid.yScroll/2;
	// console.log("final tile @"+x+","+y);

	return [x,y];
}

// return the horizontal offset in pixels
// based on the current scroll position
ExtendedSquare.prototype.x_scroll_pixel = function (xScroll,tilePixels) {
	console.log("x scroll = "+xScroll);
	return xScroll*tilePixels*(Q3 + 2)/4;
}

// return the vertical offset in pixels
// based on the current scroll position
ExtendedSquare.prototype.y_scroll_pixel = function (yScroll,tilePixels) {
	console.log("y scroll = "+yScroll);
	return yScroll*tilePixels*(Q3 + 2)/4;
}

// 2 tiles per scroll
ExtendedSquare.prototype.x_scroll_increment = function () { return 2; }
ExtendedSquare.prototype.y_scroll_increment = function () { return 2; }
