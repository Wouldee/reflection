
// Create a new grid
// game = the game object (game.js)
// screen = screen object (screen.js)
// tiling = abstract tiling object (tiling.js)
// size = size description (small medium large etc globals.tcl & tiling.tcl)
// innerDimensions = x1,y1,x2,y2 of the inner clickable area of the grid
// outerDimensions = x1,y1,x2,y2 of the outer viewable area of the grid
// xContinuous & yContinuous = booleans, used by the tiling
function Grid (game,screen,tiling,size,innerDimensions,outerDimensions,xContinuous,yContinuous) {
	this.game = game;
	this.screen = screen;
	this.tiling = tiling;
	this.size = size;
	this.x = innerDimensions.x1;
	this.y = innerDimensions.y1;
	this.xPixels = innerDimensions.x2 - innerDimensions.x1;
	this.yPixels = innerDimensions.y2 - innerDimensions.y1;
	this.outerDimensions = outerDimensions;
	this.xContinuous = xContinuous;
	this.yContinuous = yContinuous;

	// tiling-specific variables
	this.columnLocations = [];
	this.rowLocations = [];

	// offsets for drawing on the gridCanvas
	this.xOffset = this.x - outerDimensions.x1;
	this.yOffset = this.y - outerDimensions.y1;

	// scroll properties
	this.yScrollPeriod = 1;
	this.xScrollOffset = 0;

	this.reset_properties();
	tiling.calculate_dimensions(this);
	this.shapes = tiling.shapes();
	this.reset_tiles();

	// clear the outer area
	this.clear_screen();
}

// called when game is restarted or new game started while previous game still exists
Grid.prototype.clear = function () {
	delete this.canvas;
	this.reset_properties();
	this.reset_tiles();

	// clear the outer area
	this.clear_screen();
}

Grid.prototype.reset_properties = function () {
	this.tiles = [];
	this.sources = [];
	this.connectors = [];
	this.nodes = [];
	this.paths = [];
	this.lit = 0;
	this.xScroll = 0;
	this.yScroll = 0;
	this.xScrollPixel = 0;
	this.yScrollPixel = 0;
	this.drawn = false;
	this.ready = false;
	this.tileImageCount = 0;
	this.scaledImageLoadedCount = 0;
	this.tileImageLoadProgress = 0;
	this.loadCounter = 0;
	this.unfinishedConnectors = 0;
}

// initialise the tiles array
// create the grid canvas
Grid.prototype.reset_tiles = function () {
	// initialise each row
	for (var x = 0; x <= this.xMax; x++) this.tiles[x] = [];

	// function to initialise each tile per row
	var grid  = this;
	var reset_tile = function (x,y) {
		grid.tiles[x][y] = null;
	}
	this.eachTile(reset_tile);

	// create a canvas to draw everything on
	// whenever anything changes - e.g a tile is rotated
	// the affected tiles get drawn to this canvas
	// once everything is drawn on this canvas, then we draw this canvas on the screen
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.xPixels;
	this.canvas.height = this.yPixels;
	this.context = this.canvas.getContext("2d");
	this.image = null;
	this.imageLoaded = false;
}

// resize during a game does not work~~
Grid.prototype.resize = function (innerDimensions,outerDimensions) {
	this.x = innerDimensions.x1;
	this.y = innerDimensions.y1;
	this.xPixels = innerDimensions.x2 - innerDimensions.x1;
	this.yPixels = innerDimensions.y2 - innerDimensions.y1;
	this.outerDimensions = outerDimensions;

	// offsets for drawing on the gridCanvas
	this.xOffset = this.x - outerDimensions.x1;
	this.yOffset = this.y - outerDimensions.y1;

	// reset all the tile images
	// resizng the tiling will cause all the images to be re-loaded
	this.tileImageCount = 0;
	this.scaledImageLoadedCount = 0;
	this.tileImageLoadProgress = 0;

	// update/reset tiling
	this.tiling.calculate_dimensions();
	for (name in this.shapes) {
		shapes[name].resize();
	}

	// update scroll
	this.update_scroll();

	// redraw the canvas image at the new size
	this.draw_screen();

	// resize the canvas image of the grid contents
	var canvas = document.createElement("canvas");
	canvas.width = this.xPixels;
	canvas.height = this.yPixels;
	canvas.getContext("2d").drawImage(this.canvas,0,0,this.canvas.width,this.canvas.height,0,0,canvas.width,canvas.height);
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.image = null;
	this.imageLoaded = false;
}

// update the screen with the current image of the grid
Grid.prototype.update_screen = function () {
	// console.log("update grid screen");

	// convert the grid canvas to an image and draw it
	this.image = convert_canvas_to_image(this.canvas);

	this.loadCounter++;

	var loadCounter = this.loadCounter;
	// the image has no content yet, we have to arrange for it to be drawn when it is loaded
	var grid = this;
	var onLoad = function () {
		grid.imageLoaded = true;
		grid.drawScreen(loadCounter);
	}
	this.image.addEventListener("load",onLoad);
}

Grid.prototype.draw_screen = function (loadCounter) {
	//console.log("drawing grid image; scroll:",this.xScroll,this.yScroll,"scroll pixel:",this.xScrollPixel,this.yScrollPixel);

	if (!this.imageLoaded) return;
	if (loadCounter != undefined && loadCounter != this.loadCounter) return;

	// console.log("draw grid screen");

	// clear the outer area
	this.tiling.clipScreen();

	// the grid image will often not occupy the entire area
	// this happens when the grid is continuous
	// the grid image is drawn multiple times, i.e a 'tiling' of grid images

	// draw the grid images row by row, starting at the bottom
	// find the y of the images at the bottom of the screen
	var row = 0;
	y = this.y + this.yScrollPixel;
	while (y < this.outerDimensions.y2) {
		y += this.scrollHeight;

		// if the scroll has a vertical period, we need to keep track of how many rows
		row++;
	}

	// keep drawing rows until we hit the top
	while (y > this.outerDimensions.y1) {
		y -= this.scrollHeight;
		row--;

		var height = this.yPixels;
		//console.log("draw grid image row at",y,"with height",height);

		var xOffset = this.xScrollOffset*modulo(row,this.yScrollPeriod);

		// draw each row image from right to left
		// find the x of the rightmost image
		x = this.x + this.xScrollPixel + xOffset;
		while (x < this.outerDimensions.x2) x += this.scrollWidth;

		// draw images until we hit the left edge
		while (x > this.outerDimensions.x1) {
			x -= this.scrollWidth;
			var width = this.xPixels;

			//console.log("drawing grid image at",x,y,"with",width,height);

			// draw the grid image
			//if (x == this.x + this.xScrollPixel && y == this.y + this.yScrollPixel) {
				this.screen.context.drawImage(this.image,x,y,width,height);
			//}
		}
	}

	// reverse the clip
	this.tiling.unclipScreen();

	// inform the game that the grid has been drawn
	this.game.gridDrawn();
}

/* 
// calculate the xPixels, yPixels, tilePixels column and row locations
Grid.prototype.calculate_dimensions = function () {
	throw "calculateDimensions function not defined for "+this.tiling.name+" grid";
}

Grid.prototype.resize_shapes = function () {
	throw "resizeShapes function not defined for "+this.tiling.name+" grid";
}

// return the shape of the tile at the given location
Grid.prototype.shape = function (x,y) {
	throw "shape function not defined for "+this.tiling.name+" grid";
}
 */

// return the orientation of the tile at the given location
Grid.prototype.orientation = function (x,y) {
	throw "orientation function not defined for "+this.tiling.name+" grid";
}

Grid.prototype.new_tile = function (tile) {
	tile.orientation = this.orientation(tile.x,tile.y);
	var shape = this.shape(tile.x,tile.y);
	shape.newTile(tile);
}

// generic random tile function for most tilings
// tiling needs a specific function where it does not use all values
// of x,y
Grid.prototype.randomTile = function () {
	var x = Math.floor(Math.random()*(this.xMax + 1));
	var y = Math.floor(Math.random()*(this.yMax + 1));
	return [x,y];
}

// return x,y of the tile of the specified shape that is closest to the centre
Grid.prototype.centre_tile = function () {
	return this.tileAt(this.xPixels/2,this.yPixels/2);
}

Grid.prototype.randomRotation = function (x,y) {
	return Math.floor(Math.random()*this.shape(x,y).sides);
}

// return a neighbour object containing x,y,direction of the face of the
// tile touching the given tile face
Grid.prototype.neighbour = function (x,y,direction) {
	throw "neighbour function not defined for "+this.tiling.name+" grid";
}

// similar to randomTile, tiling needs a 
// specific function where it does not use all values of x,y
Grid.prototype.eachTile = function (tileFunction) {
	for (var x = 0; x <= this.xMax; x++) {
		for (var y = 0; y <= this.yMax; y ++) {
			tileFunction(x,y);
		}
	}
}

// return the x y pixel at the centre of the tile
Grid.prototype.tileLocation = function (x,y,rotation) {
	var xPixel = this.columnLocations[x];
	var yPixel = this.rowLocations[y];
	return [xPixel,yPixel];
}

// return the x,y of the tile that the pixel position is inside of
Grid.prototype.tileAt = function (xPixel,yPixel) {
	throw "tileAt function not defined for "+this.tiling.name+" grid";
}

Grid.prototype.updateScroll = function () {
	throw "updateScroll function not defined for "+this.tiling.name+" grid";
}

Grid.prototype.clear_screen = function () {
	this.clipScreen();
	this.unclipScreen();
}

Grid.prototype.clip_screen = function () {
	var outer = this.outerDimensions;
	var screen = this.screen;

	// clear the outer area
	var x = outer.x1;
	var y = outer.y1;
	var width = outer.x2 - outer.x1;
	var height = outer.y2 - outer.y1;

	// clip the area
	screen.context.save();
	screen.context.beginPath();
	screen.context.moveTo(x,y);
	screen.context.lineTo(x + width,y);
	screen.context.lineTo(x + width,y + height);
	screen.context.lineTo(x,y + height);
	screen.context.lineTo(x,y);
	screen.context.clip();

	screen.context.clearRect(x, y, width, height);

	// fill with the background colour
	screen.context.fillStyle = screen.colour;
	screen.context.fillRect(x,y,width,height);
}

Grid.prototype.unclip_screen = function () {
	this.screen.context.restore();
}

Grid.prototype.imagesLoaded = function () {
	var imagesLoaded = true;
	for (var shape of this.shapes) {
		if (!shape.imagesLoaded()) imagesLoaded = false;
	}
	return imagesLoaded;
}
