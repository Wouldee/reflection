
// Merge Grid & TilingGrid into a single class...
// Remove the reference to the game - grid should do the shuffle...
// Game should pass in a callback for when the grid is drawn...
// Also a callback for when a node is lit...
// Maybe game passes in a callback "object", that has certain functions...

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
	this.size = size;
	this.x = innerDimensions.x1;
	this.y = innerDimensions.y1;
	this.xPixels = innerDimensions.x2 - innerDimensions.x1;
	this.yPixels = innerDimensions.y2 - innerDimensions.y1;
	this.outerDimensions = outerDimensions;
	this.xContinuous = xContinuous;
	this.yContinuous = yContinuous;

	// offsets for drawing on the gridCanvas
	this.xOffset = this.x - outerDimensions.x1;
	this.yOffset = this.y - outerDimensions.y1;

	// scroll properties
	this.yScrollPeriod = 1;
	this.xScrollOffset = 0;

	// this.loadingBar = this.screen.progressBar(this.x,0.5,this.xPixels,0.025,'#00ff00',5,3);
	// this.loadingBar.update(1);
	// this.loadingBar.reset();

	this.resetProperties();
	this.tiling = tiling.newGrid(this);
	this.resetTiles();

	// clear the outer area
	this.tiling.clearScreen();

	//this.screen.addListener(innerDimensions.x1,innerDimensions.y1,innerDimensions.x2,innerDimensions.y2,this);

	// console.log("generated grid: pixels",this.xPixels,this.yPixels,this.tilePixels,"offset",this.x,this.y,"continuous",this.xContinuous,this.yContinuous,"max",this.xMax,this.yMax);
	// console.log(this);
}

// called when game is restarted or new game started while previous game still exists
Grid.prototype.clear = function () {
	delete this.canvas;
	this.resetProperties();
	this.resetTiles();

	// clear the outer area
	this.tiling.clearScreen();

	// this.loadingBar.coordinates(this.x,0.5,this.xPixels,0.05)
	// this.loadingBar.reset();
}

Grid.prototype.resetProperties = function () {
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
	//this.scrollWidth = this.xPixels;
	//this.scrollHeight = this.yPixels;
	this.drawn = false;
	this.ready = false;
	this.tileImageCount = 0;
	this.scaledImageLoadedCount = 0;
	this.tileImageLoadProgress = 0;
	this.loadCounter = 0;
	this.unfinishedConnectors = 0;
}

Grid.prototype.resetTiles = function () {
	var grid  = this;

	// initialise each row
	for (var x = 0; x <= this.xMax; x++) this.tiles[x] = [];

	// function to initialise each tile per row
	var resetTile = function (x,y) {
		grid.tiles[x][y] = null;
	}
	this.tiling.eachTile(resetTile);

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
	// this.loadingBar.reset();
	// this.progressLoadingBar();

	// update/reset tiling
	this.tiling.resize();
	//this.tiling.calculateDimensions();

	// update scroll
	this.tiling.updateScroll();

	// redraw the canvas image at the new size
	this.drawScreen();

	// resize the canvas image of the grid contents
	var canvas = document.createElement("canvas");
	canvas.width = this.xPixels;
	canvas.height = this.yPixels;
	canvas.getContext("2d").drawImage(this.canvas,0,0,this.canvas.width,this.canvas.height,0,0,canvas.width,canvas.height);
	this.canvas = canvas;
	this.context = canvas.getContext("2d");
	this.image = null;
	this.imageLoaded = false;

	// update the screen
	//this.updateScreen();
}

// update the screen with the current image of the grid
Grid.prototype.updateScreen = function () {
	var grid = this;

	// console.log("update grid screen");

	// convert the grid canvas to an image and draw it
	this.image = convert_canvas_to_image(this.canvas);

	this.loadCounter++;

	var loadCounter = this.loadCounter;
	// the image has no content yet, we have to arrange for it to be drawn when it is loaded
	var onLoad = function () {
		grid.imageLoaded = true;
		grid.drawScreen(loadCounter);
	}
	this.image.addEventListener("load",onLoad);
}

Grid.prototype.drawScreen = function (loadCounter) {
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

Grid.prototype.rotateAt = function (xPixel,yPixel,direction) {

	//game_log("grid",1,"grid",mouseButton,"clicked @",xPixel - this.x,yPixel - this.y);

	var location = this.tiling.tileAt(xPixel - this.x,yPixel - this.y);
	var x = location[0];
	var y = location[1];
	var tile = this.tiles[x][y];
	console.log("tile clicked is ",tile);
	// console.log("tile has "+tile.linkCount+" links");
	// console.log("paths in & out",tile.paths_in(),tile.paths_out());
	if (!ROTATE) return;

	var affectedTiles = {};
	var rotation = 1
	if (direction == "anticlockwise") rotation = -1;

	var rotatedBy = this.rotateTile(x,y,rotation,affectedTiles);

	// console.log("Rotated tile ",tile);

	for (var tileX in affectedTiles) {
		for (var tileY in affectedTiles[tileX]) {
			this.drawTile(parseInt(tileX),parseInt(tileY));
		}
	}

	this.updateScreen();

	return (rotatedBy != 0);
}

Grid.prototype.startDrawing = function () {
	this.context.save();
}

Grid.prototype.finishDrawing = function () {
	this.context.restore();
}

Grid.prototype.drawAt = function (xPixel,yPixel) {
	this.context.translate(xPixel,yPixel);
}

Grid.prototype.rotateBy = function (degrees) {
	this.context.rotate(degrees*RAD);
}

Grid.prototype.reverse = function (degrees) {
	this.context.scale(-1,1);
}

Grid.prototype.tileImageCreated = function () {
	// this.progressLoadingBar();
	this.tileImageCount++;
}

Grid.prototype.tileImageLoading = function (ratio) {
	this.tileImageLoadProgress += ratio;
	// this.loadingBar.update(100*this.tileImageLoadProgress/this.tileImageCount);
}

Grid.prototype.tileImageLoaded = function () {
	this.scaledImageLoadedCount++;

	if (this.scaledImageLoadedCount == this.tileImageCount) {
		if (!this.tiling.imagesLoaded()) return;
		// console.log("all images loaded");
		this.draw();
	}
}

Grid.prototype.progressLoadingBar = function () {
	if (this.scaledImageLoadedCount == this.tileImageCount) return;
	if (this.progressLoadingSchedule != undefined) 	clearInterval(this.progressLoadingSchedule);

	// console.log("loading bar updated @",Date.now()/1000);
	// update the progress bar
	// this.loadingBar.update(this.loadingBar.progress + 0.5);

	// schedule another update of the loading bar in another 100 milliseconds
	var grid = this;
	// var update_load = function() { grid.progressLoadingBar(); }
	// this.progressLoadingSchedule = setInterval(update_load,100);
}

Grid.prototype.drawImage = function (image,x,y) {
	x = x || 0;
	y = y || 0;
	//console.log("draw image on canvas",image);
	this.context.drawImage(image,x,y,image.width,image.height);
}

Grid.prototype.clearRectangle = function (x1,y1,x2,y2) {
	var width = x2 - x1;
	var height = y2 - y1;
	this.context.clearRect(x1, y1, width, height);

	// fill with the background colour
	this.context.fillStyle = this.screen.colour;
	this.context.fillRect(x1,y1,width,height);

	// update affected dimensions
	// these define the area that will be redrawn on the screen
	//this.affectedDimensions.x1 = Math.min(x1,this.affectedDimensions.x1)
	//this.affectedDimensions.y1 = Math.min(y1,this.affectedDimensions.y1)
	//this.affectedDimensions.x2 = Math.min(x2,this.affectedDimensions.x2)
	//this.affectedDimensions.y2 = Math.min(y2,this.affectedDimensions.y2)
}

Grid.prototype.clearPolygon = function () {
	this.startDrawing();
	this.context.beginPath();

	var xPixel = arguments[0];
	var yPixel = arguments[1];
	this.context.moveTo(xPixel,yPixel);

	var xMin = xPixel, yMin = yPixel, xMax = xPixel, yMax = yPixel;

	for (var i = 2; i < arguments.length; i += 2) {
		xPixel = arguments[i];
		yPixel = arguments[i+1];
		this.context.lineTo(xPixel,yPixel);

		if (xPixel < xMin) xMin = xPixel;
		if (yPixel < yMin) yMin = yPixel;
		if (xPixel > xMax) xMax = xPixel;
		if (yPixel > yMax) yMax = yPixel;
	}

	this.context.clip();
	this.clearRectangle(xMin,yMin,xMax,yMax);
	this.finishDrawing();
}

Grid.prototype.fillPolygon = function () {
	this.startDrawing();
	this.context.beginPath();

	var lastIndex = arguments.length - 1;
	if (modulo(arguments.length,2) == 0) {
		this.context.fillStyle = "white";
	} else {
		this.context.fillStyle = arguments[lastIndex];
		lastIndex--;
	}

	var xPixel = arguments[0];
	var yPixel = arguments[1];
	this.context.moveTo(xPixel,yPixel);

	var xMin = xPixel, yMin = yPixel, xMax = xPixel, yMax = yPixel;

	for (var i = 2; i <= lastIndex; i += 2) {
		xPixel = arguments[i];
		yPixel = arguments[i+1];
		this.context.lineTo(xPixel,yPixel);

		if (xPixel < xMin) xMin = xPixel;
		if (yPixel < yMin) yMin = yPixel;
		if (xPixel > xMax) xMax = xPixel;
		if (yPixel > yMax) yMax = yPixel;
	}

	this.context.clip();
	this.context.fillRect(xMin,yMin,xMax-xMin,yMax-yMin);
	this.finishDrawing();
}

Grid.prototype.outlinePolygon = function () {
	this.startDrawing();
	this.context.beginPath();
	this.context.lineWidth = "1";

	var lastIndex = arguments.length - 1;
	if (modulo(arguments.length,2) == 0) {
		this.context.strokeStyle = "white";
	} else {
		this.context.strokeStyle = arguments[lastIndex];
		lastIndex--;
	}

	var xPixel = arguments[0];
	var yPixel = arguments[1];
	this.context.moveTo(xPixel,yPixel);

	for (var i = 2; i <= lastIndex; i += 2) {
		xPixel = arguments[i];
		yPixel = arguments[i+1];
		this.context.lineTo(xPixel,yPixel);
	}
	this.context.lineTo(arguments[0],arguments[1]);

	this.context.stroke();
	this.finishDrawing();
}

// create a tile at grid location x,y
Grid.prototype.createTile = function (x,y) {
	var tile = new Tile(this,x,y);
	this.tiles[x][y] = tile;
	this.tiling.newTile(tile);
	return tile;
}

Grid.prototype.removeTile = function (x,y) {
	this.tiles[x][y] = null;
}

// create a source at grid location x,y
Grid.prototype.create_source = function (x,y,colour) {
	var tile = this.createTile(x,y);
	tile.source(colour);
	this.sources.push([x,y]);
	return tile;
}

// return the tile at grid location x,y
Grid.prototype.tile = function (x,y) {
	return this.tiles[x][y];
}

// return true if a tile has been created at grid location x,y
Grid.prototype.tileExists = function (x,y) {
	return (this.tiles[x][y] != null);
}

Grid.prototype.connector = function (x,y) {
	var tile = this.tiles[x][y];
	tile.connector();
	this.connectors.push([x,y]);
	this.unfinishedConnectors++;
	// console.log("added connector",this.unfinishedConnectors);
}

Grid.prototype.connectorFinished = function () {
	this.unfinishedConnectors--;
	// console.log("finished connector",this.unfinishedConnectors);
	if (this.unfinishedConnectors == 0) this.game.tilesReady();
}

Grid.prototype.node = function (x,y) {
	var tile = this.tiles[x][y];
	tile.node();
	this.nodes.push([x,y]);
	this.lit++;
}

Grid.prototype.fillInTheBlanks = function () {
	var grid = this;

	var tileFunction = function (x,y) {
		if (!grid.tileExists(x,y)) grid.blankTile(x,y);
	}

	this.tiling.eachTile(tileFunction);
}

Grid.prototype.blankTile = function (x,y) {
	console.log("blank tile @",x,y);
	var tile = this.createTile(x,y);
	tile.shape.blankTile(tile);
}

Grid.prototype.lightNode = function () {
	this.lit++;
}

Grid.prototype.unlightNode = function () {
	this.lit--;
}

Grid.prototype.newPath = function (path) {
	this.paths.push(path);
}

Grid.prototype.shuffle = function () {
	var affectedTiles = {};
	var grid = this;

	var requiredMoves = 0;

	var tileFunction = function (x,y) {
		// don't rotate sources for now...
		//if (grid.tile(x,y).isSource) return;
		var rotateBy = grid.tiling.randomRotation(x,y);
		game_log("grid",2,"rotate",x,y,"by",rotateBy);
		requiredMoves += grid.rotateTile(x,y,rotateBy,affectedTiles);
	}

	this.tiling.eachTile(tileFunction);

	// console.log("required moves",requiredMoves);
	return requiredMoves;
}

Grid.prototype.draw = function () {
	// console.log("draw!");
	if (this.scaledImageLoadedCount < this.tileImageCount) return;
	//if (!this.ready) return;

	for (var x = 0; x <= this.xMax; x++) {
		for (var y = 0; y <= this.yMax; y++) {
			this.drawTile(x,y,false);
		}
	}

	//this.drawn = true;
	this.updateScreen();
	this.game.gridReady();
}

Grid.prototype.drawTile = function (x,y,clear) {
	if (clear == undefined) clear = true;
	var tile = this.tiles[x][y];
	if (tile == null) return;
	var location = this.tiling.tileLocation(x,y);
	var xPixel = location[0];
	var yPixel = location[1];

	//console.log("draw tile",x,y,"@",xPixel,yPixel);

	this.startDrawing();
	//tile.draw(xPixel,yPixel,clear);
	tile.draw(xPixel,yPixel,true);
	this.finishDrawing();
	// restrict drawing to within the outer dimensions of the grid
	// no longer necessary....
	//this.startDrawing();
	//this.context.beginPath();
	//this.context.moveTo(this.outerDimensions.x1,this.outerDimensions.y1);
	//this.context.lineTo(this.outerDimensions.x2,this.outerDimensions.y1);
	//this.context.lineTo(this.outerDimensions.x2,this.outerDimensions.y2);
	//this.context.lineTo(this.outerDimensions.x1,this.outerDimensions.y2);
	//this.context.clip();

	//for (var xIndex in xLocations) {
	//	var xPixel = xLocations[xIndex];
	//	for (var yIndex in yLocations) {
	//		var yPixel = yLocations[yIndex];
			//console.log("drawTile",x,y,"at",xPixel,yPixel);
	//		this.startDrawing();
	//		tile.draw(xPixel,yPixel,clear);
	//		this.finishDrawing();
	//	}
	//}

	//this.finishDrawing();
}

Grid.prototype.rotateTile = function (x,y,rotateBy,affectedTiles) {
	var tile = this.tiles[x][y];    // tile object
	rotateBy = rotateBy || 1;       // how many faces to rotate by, default is 1 clockwise

	//debug....
	// console.log("rotate tile @",x,y,"by",rotateBy);
	game_log("grid",1,"rotating tile @ ",x,y);
	// console.log(tile.log_string());

	// determine what the new links will be
	// return now if the tile did not actually rotate (either because the rotation turned out to be zero,
	// or because the tile is rotationally symetrical)
	var newLinks = {};
	var actualRotation = tile.rotated_links(rotateBy,newLinks);
	if (actualRotation == 0) return 0;

	if (affectedTiles[x] == undefined) affectedTiles[x] = {}; // initialise affected tiles
	affectedTiles[x][y] = true;                               // flag this tile as affected (needs to be redrawn)

	// immediately prior to rotating the tile, cut any paths on the affected links, in or out
	for (var linkId in newLinks) {
		var link = tile.links[linkId];
		link.cutPaths(affectedTiles);
	}

	// do the actual rotation
	tile.rotate(rotateBy,newLinks);

	// finally, propagate any paths into & out of each face
	for (var direction in tile.faces) {
		if (tile.faces[direction].length == 0) continue;
		// at least one link on this face

		var neighbour = this.tiling.neighbour(x,y,direction);
		if (neighbour == null) continue;
		var neighbourTile = this.tiles[neighbour.x][neighbour.y];
		if (neighbourTile.faces[neighbour.direction].length == 0) continue;
		// at least one link on the neighbouring tile

		// check each path coming in from the neighbour
		var pathsIn = neighbourTile.paths_out(neighbour.direction);
		for (var neighbourLinkId in pathsIn) {
			var neighbourLink = neighbourTile.links[neighbourLinkId];

			for (var path of pathsIn[neighbourLinkId]) {
				// check if the path can come in
				// find a link on this tile that the path can come in on
				for (var linkId of tile.faces[direction]) {
					var link = tile.links[linkId];

					if (link.colour != undefined && link.colour != path.colour()) continue;
					// the link colours match -- propagate the path
					path.propagate(neighbourTile,neighbourLink,neighbour.direction,affectedTiles);
					break;
				}
			}
		}

		// check for any paths out of this tile
		// only necessary if this tile is a source
		if (!tile.isSource) continue;

		var pathsOut = tile.paths_out(direction);
		for (var linkId in pathsOut) {
			var link = tile.links[linkId];
			for (var pathIndex in pathsOut[linkId]) {
				var path = pathsOut[linkId][pathIndex];
				// propagate will check whether the path is already coming out, or where it can go etc.
				path.propagate(tile,link,direction,affectedTiles);
			}
		}
	}

	return actualRotation;
}

Grid.prototype.scroll = function (direction) {
	// up means moving tiles off the bottom of the screen, onto the top
	// so the origin moves down
	// and right means moving the origin to the left, to see what's further to the right
	// etc.
	// so the xScroll/yScroll represent how many columns/rows the origin has moved
	switch (direction) {
		case "up":
			if (!this.yContinuous) return;
			this.yScroll++;
			break;
		case "right":
			if (!this.xContinuous) return;
			this.xScroll--;
			break;
		case "down":
			if (!this.yContinuous) return;
			this.yScroll--;
			break;
		case "left":
			if (!this.xContinuous) return;
			this.xScroll++;
			break;
	}

	this.tiling.updateScroll();
	this.drawScreen();
}

Grid.prototype.find_unlit_node = function () {
	var node;
	for (var location of this.nodes) {
		var x = location[0];
		var y = location[1];
		node = this.tiles[x][y];
		if (!node.lit) break;
	}

	if (node == undefined) return; // no unlit node

	// make the node "wink" - light it, wait a beat (200ms) then unlight it
	// light the node up on screen
	node.lit = true;
	this.drawTile(x,y,true);
	this.updateScreen();

	// restore correct lit value now
	node.lit = false;

	// arrange for redraw of the node
	var grid = this;
	var redraw_node = function () {
		node.update_lit();
		grid.drawTile(x,y,true);
		grid.updateScreen();
	}

	setTimeout(redraw_node,200);
}
