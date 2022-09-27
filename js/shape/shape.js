
function Shape () {
	this.name = ""
	this.sides = 0;
	this.initialForm = "";
	this.angle = 0;
	this.orientations = [];
	this.degrees =  {};
	this.faces = {};
	this.points = {};
	this.face = {};
	this.point = {};
	this.form = {};
	this.imagePixels = 256;
	this.image = {};
	this.imageFolder = "";
	this.imageCount = 0;
	this.imageLoadedCount = 0;
}

Shape.prototype.initialise = function () {
	var shape = this;
	shape.orientations.forEach(function(orientation) {
		shape.face[orientation] = {};
		shape.point[orientation] = {};
		var count = 0;
		var faces = shape.faces[orientation];

		faces.forEach(function(fromFace) {
			shape.face[orientation][fromFace] = {};
			shape.point[orientation][fromFace] = {};
			var rotation = 0;

			while (rotation<shape.sides) {
				var index = (count + rotation)%shape.sides;
				var toFace = shape.faces[orientation][index];
				var toPoint = shape.points[orientation][index];
				shape.face[orientation][fromFace][rotation] = toFace;

				rotation++;
				shape.point[orientation][fromFace][rotation] = toPoint;
			}
			count++;
		});
	});

	shape.defineForms();
	shape.loadImages();
}

Shape.prototype.defineForms = function () {
	throw "defineForms function not defined for "+this.name;
}

Shape.prototype.defineSingleForms = function (ignoreNumbers) {
	ignoreNumbers[1] = true;

	var max = Math.pow(2,this.sides);
	// start from 7 (111), assume anything less than 3 bits is already covered
	for (var i = 7; i < max; i++) {
		if (ignoreNumbers[i] != undefined) continue;

		var iShift = i;
		var alreadyFound = false;
		while (true) {
			iShift *= 2;
			if (iShift > max - 1) iShift -= max - 1;
			if (iShift == i) break;
			if (ignoreNumbers[iShift] != undefined) {
				alreadyFound = true;
				break;
			}
			ignoreNumbers[iShift] = true;
		}
		if (alreadyFound) continue;

		var remaining = i;
		var form = "";
		var power = max/2;
		while (power >= 1) {
			if (power <= remaining) {
				form += "1";
				remaining -= power;
			} else {
				form += "0";
			}

			power /= 2;
		}

		this.form[1][form] = "";
		//console.log("discovered new octagonal form:",form);
	}
}

// define all partitioned, i.e composite mirror forms for the shape
// based on number of sides
// used by hexagon, octagon, dodecagon
Shape.prototype.definePartitionedForms = function () {
	var shape = this;
	shape.partitions = {
		1: [[0]],
		2: [[1,1]],
		3: [[1,0,1]],
		4: [[1,0,0,1],
			[0,1,1,0],
			[1,2,2,1],
			[2,1,1,2]],
		5: [[1,0,0,0,1],
			[0,1,0,1,0],
			[1,2,0,2,1],
			[2,1,0,1,2]],
		6: [[1,0,0,0,0,1],
			[0,1,0,0,1,0],
			[0,0,1,1,0,0],
			[1,2,0,0,2,1],
			[2,1,0,0,1,2],
			[1,0,2,2,0,1],
			[2,0,1,1,0,2],
			[0,1,2,2,1,0],
			[0,2,1,1,2,0],
			[1,2,3,3,2,1],
			[1,3,2,2,3,1],
			[2,1,3,3,1,2],
			[2,3,1,1,3,2],
			[3,1,2,2,1,3],
			[3,2,1,1,2,3]]
	}

	// start with all possible combinations/permutations of the partitions with
	// size greater than 1, but less than half the number of sides
	var partitionPermutations = [];
	partitionCombinations = shape.partitionCombinations(shape.sides,shape.sides/2,0);
	for (var index in partitionCombinations) {
		var combination = partitionCombinations[index];

		if (combination.length <= 2) {
			// partition combination doesn't have any permutations
			var padded = shape.padPartitionPermutation(combination,1,shape.sides);
			partitionPermutations = partitionPermutations.concat(padded);
			continue;
		}

		// add all permutations of the combination
		permutations(combination.slice(1)).forEach(function (permutation) {
			permutation.unshift(combination[0]);
			var padded = shape.padPartitionPermutation(permutation,1,shape.sides);
			partitionPermutations = partitionPermutations.concat(padded);
		});
	}

	// now use the partition permutations to generate the forms
	partitionPermutations.forEach(function (permutation) {
		// determine the link count, form and breakdown
		// reverse the order at this point
		var linkCount = 0;
		var breakdown = "";
		var form = "";
		permutation.forEach(function (partition) {
			breakdown = partition.length + breakdown;
			form = partition.join("") + form;
			partition.forEach(function (linkId) {
				if (linkId > linkCount) linkCount = linkId;
			});
		});

		// check the form is not already defined
		var shift = form;
		var alreadyFound = false;
		for (var i = 0; i < 8; i++) {
			if (shape.form[linkCount][shift] != undefined) {
				alreadyFound = true;
				break;
			}
			shift = shift.substr(1) + shift.substr(0,1);
		}

		if (!alreadyFound) {
			// add the form
			shape.form[linkCount][form] = breakdown;
			//console.log(linkCount,form,breakdown);
		}
	});
}

// pad the given partition permutation with partitions of size 1, containing no links
// return an array of all the possible ways to do this
Shape.prototype.padPartitionPermutation = function (permutation,fromIndex,toLength) {
	// base case: the permutation is already the required length
	var length = 0;
	permutation.forEach(function (partition) { length += partition.length });
	if (length == toLength) return [permutation];

	// otherwise, add a size 1 partition at each index
	var permutations = [];
	for (var i = fromIndex; i <= permutation.length; i++) {
		// copy the permutation
		var paddedPermutation = permutation.slice();
		paddedPermutation.splice(i,0,[0]);
		// recursive call is all permutations from the current index
		permutations = permutations.concat(this.padPartitionPermutation(paddedPermutation,i + 1,toLength));
	}

	return permutations;
}

// return all unique permutations of partitions with size greater than 1
// apply the linkOffset to all links in partitions
Shape.prototype.partitionCombinations = function (length,maxSize,linkIdOffset) {
	// base case: remaining length is less than the required partition size
	if (length <= 1) return [];
	var shape = this;

	var combinations = [];
	// partition size must be <= remaining length
	if (maxSize > length) maxSize = length;

	// prioritise larger partitions
	for (var size = maxSize; size > 1; size--) {
		// each partition of this size
		shape.partitions[size].forEach(function (partition) {
			// apply the offset to each link in the partition
			var offsetPartition = [];
			// calculate the maxLinkId for the next offset
			var maxLinkId = 0;
			partition.forEach(function (linkId) {
				if (linkId > 0) {
					if (linkId > maxLinkId) maxLinkId = linkId;
					offsetPartition.push(linkId + linkIdOffset);
				} else {
					offsetPartition.push(linkId);
				}
			});
			partition = offsetPartition;
			// add the partition as a permutation on its own
			combinations.push([partition]);

			// recursive call for the remaining length
			shape.partitionCombinations(length - size,maxSize,linkIdOffset + maxLinkId).forEach(
			function (combination) {
				// add the partition to the start of the permutation
				combination.unshift(partition);
				combinations.push(combination);
			});
		});
	}

	return combinations;
}

Shape.prototype.loadImages = function () {

	var dir = "images" + "/" + this.imageFolder;
	var pathDir = dir + "/" + "path";
	var nodeDir = dir + "/" + "node";
	var sourceDir = dir + "/" + "source";
	var connectorDir = dir + "/" + "connector";

	this.image = {misc: {}, source: {}, node: {}, connector: {}, path: {}};
	this.image.misc = {tile: {}};
	this.image.path = {beam: {}};
	this.image.node = {lit: {}, inner: {}, outer: {}, frame: {}};
	this.image.source = {light: {}, frame: {}};

	this.loadMiscImages(dir);

	this.image.misc.tile.lit           = this.loadImage(dir,"lit.png");
	this.image.path.beam.red           = this.loadImage(pathDir,"beam-red.png");
	this.image.path.beam.green         = this.loadImage(pathDir,"beam-green.png");
	this.image.path.beam.blue          = this.loadImage(pathDir,"beam-blue.png");
	this.image.path.beam.yellow        = this.loadImage(pathDir,"beam-yellow.png");
	this.image.path.beam.magenta       = this.loadImage(pathDir,"beam-magenta.png");
	this.image.path.beam.cyan          = this.loadImage(pathDir,"beam-cyan.png");
	this.image.path.beam.white         = this.loadImage(pathDir,"beam-white.png");
	this.image.node.lit.red            = this.loadImage(nodeDir,"lit-red.png");
	this.image.node.lit.green          = this.loadImage(nodeDir,"lit-green.png");
	this.image.node.lit.blue           = this.loadImage(nodeDir,"lit-blue.png");
	this.image.node.lit.yellow         = this.loadImage(nodeDir,"lit-yellow.png");
	this.image.node.lit.magenta        = this.loadImage(nodeDir,"lit-magenta.png");
	this.image.node.lit.cyan           = this.loadImage(nodeDir,"lit-cyan.png");
	this.image.node.lit.white          = this.loadImage(nodeDir,"lit-white.png");
	this.image.node.inner.red          = this.loadImage(nodeDir,"inner-red.png");
	this.image.node.inner.green        = this.loadImage(nodeDir,"inner-green.png");
	this.image.node.inner.blue         = this.loadImage(nodeDir,"inner-blue.png");
	this.image.node.inner.yellow       = this.loadImage(nodeDir,"inner-yellow.png");
	this.image.node.inner.magenta      = this.loadImage(nodeDir,"inner-magenta.png");
	this.image.node.inner.cyan         = this.loadImage(nodeDir,"inner-cyan.png");
	this.image.node.inner.white        = this.loadImage(nodeDir,"inner-white.png");
	this.image.node.frame.red          = this.loadImage(nodeDir,"frame-red.png");
	this.image.node.frame.green        = this.loadImage(nodeDir,"frame-green.png");
	this.image.node.frame.blue         = this.loadImage(nodeDir,"frame-blue.png");
	this.image.node.frame.yellow       = this.loadImage(nodeDir,"frame-yellow.png");
	this.image.node.frame.magenta      = this.loadImage(nodeDir,"frame-magenta.png");
	this.image.node.frame.cyan         = this.loadImage(nodeDir,"frame-cyan.png");
	this.image.node.frame.white        = this.loadImage(nodeDir,"frame-white.png");
	this.image.source.light.red        = this.loadImage(sourceDir,"red.png");
	this.image.source.light.green      = this.loadImage(sourceDir,"green.png");
	this.image.source.light.blue       = this.loadImage(sourceDir,"blue.png");
	this.image.source.frame.back       = this.loadImage(sourceDir,"back.png");
	this.image.source.frame.front      = this.loadImage(sourceDir,"frame.png");

	this.loadConnectorImages(connectorDir);
}

Shape.prototype.loadMiscImages = function () {
	throw "loadExtraImages function not defined for "+this.name;
}

Shape.prototype.loadConnectorImages = function () {
	throw "loadConnectorImages function not defined for "+this.name;
}

Shape.prototype.loadImage = function (directory,tail) {
	var shape = this;
	shape.imageCount++;
	var loadedAction = function (image) { shape.imageLoaded(image); }

	var file = directory + "/" + tail;
	return load_image(file,loadedAction);
}

Shape.prototype.imageLoaded = function (image) {
	this.imageLoadedCount++;
	//console.log("loaded",this.name,"image",this.imageLoadedCount,"/",this.imageCount);
	if (this.imageLoadedCount < this.imageCount) return;

	console.log("all",this.name,"images loaded",this);
	this.allImagesLoaded();
}

Shape.prototype.allImagesLoaded = function () {
	this.loadedAction();
}

function TiledShape (shape,grid) {
	this.origin = {};
	this.drawPoint = {};
	this.point = {};
	this.primaryImagesLoaded = false;
}

TiledShape.prototype.initialise = function () {
	this.sides = this.shape.sides;
	this.name = this.shape.name;
	this.size = this.grid.tilePixels;

	for (var index in this.shape.orientations) {
		var orientation = this.shape.orientations[index];
		this.origin[orientation] = {x: 0, y: 0};
	}

	this.point.centre = {x: 0, y: 0};
	for (var i = 0; i < this.sides; i++) {
		this.drawPoint[i] = {x: 0, y: 0};
		this.point[i] = {x: 0, y: 0};
	}
	this.definePoints();

	var scaleRatio = this.size/this.shape.imagePixels;

	this.images = {};
	for (var i in this.shape.image) {
		this.images[i] = {};
		for (var j in this.shape.image[i]) {
			this.images[i][j] = {};
			for (var k in this.shape.image[i][j]) {
				if (this.shape.image[i][j][k] == null) {
					this.images[i][j][k] = null;
				} else {
					this.images[i][j][k] = this.loadImage(this.shape.image[i][j][k],scaleRatio);
				}
			}
		}
	}

	this.undrawnImages = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}};
}

TiledShape.prototype.resize = function () {
	this.size = this.grid.tilePixels;
	this.definePoints();

	var scaleRatio = this.size/this.shape.imagePixels;
	var image;
	for (var i in this.images) {
		for (var j in this.images[i]) {
			for (var k in this.images[i][j]) {
				image = this.images[i][j][k];
				if (image == null) continue;

				image.resize(scaleRatio);
			}
		}
	}
}

TiledShape.prototype.definePoints = function () {
	throw "definePoints function not defined for tiled "+this.name;
}

TiledShape.prototype.directions = function (orientation) {
	return this.shape.faces[orientation].slice();
}

TiledShape.prototype.randomDirections = function (orientation) {
	var directions = this.directions(orientation);
	var randomDirections = [];
	while (directions.length>0) {
		var index = Math.floor(directions.length*Math.random());
		var subset = directions.splice(index,1);
		randomDirections.push(subset[0]);
	}

	return randomDirections;
}


TiledShape.prototype.randomDirection = function (orientation) {
	var index = Math.floor(this.sides*Math.random());
	return this.shape.faces[orientation][index];
}

TiledShape.prototype.direction = function (orientation,from,by) {
	return this.shape.face[orientation][from][by];
}

TiledShape.prototype.nextDirection = function (orientation,direction) {
	return this.shape.face[orientation][direction][1];
}

TiledShape.prototype.degrees = function (orientation) {
	return this.shape.degrees[orientation];
}

TiledShape.prototype.newTile = function (tile) {
	var directions = this.shape.faces[tile.orientation];
	for (var index in directions) {
		var direction = directions[index];
		tile.faces[direction] = [];
		tile.faceColours[direction] = {red: 0, green: 0, blue: 0};
	}

	tile.candidateFaces = this.randomDirections(tile.orientation);
	tile.shape = this;
	tile.form = this.shape.initialForm;
	tile.rotation = 0;
}

TiledShape.prototype.shift = function (form,rotation) {
	return form.substr(form.length - rotation , rotation) + form.substr(0 , this.sides - rotation);
}

TiledShape.prototype.removeArmFromConnector = function (tile,direction,linkId) {
	// tile.form is the arrangement of the links, regardless of rotation
	// the shift is the form with the tile rotation applied
	// we update the shift by removing the direction
	// and then rotate it until we find a matching form
	var shift = this.shift(tile.form,tile.rotation);

	// determine the position of the old arm in the shift and update it
	var armIndex = this.shape.faces[tile.orientation].indexOf(direction);
	shift = shift.substr(0,armIndex) + "0" + shift.substr(armIndex+1);

	this.newTileShift(tile,shift);
}

// update the shift and rotation of the tile
// the shift is a string of digits and represents a tile"s current morphology 
// in terms of where it has links and where those links have arms
// each shift for a connector corresponds to a sprite
// the rotation of the tile is how far the tile is rotated, in degrees
TiledShape.prototype.addArmToConnector = function (tile,direction,linkId) {
	// tile.form is the arrangement of the links, regardless of rotation
	// the shift is the form with the tile rotation applied
	// we update the shift with the new direction
	// and then rotate it until we find a matching form
	var shift = this.shift(tile.form,tile.rotation);

	// add 1 to the linkId
	// linkIds can be 0, which represents "no link" in the form
	linkId++;

	// determine the position of the new arm in the shift and update it
	var armIndex = this.shape.faces[tile.orientation].indexOf(direction);
	shift = shift.substr(0,armIndex) + linkId + shift.substr(armIndex+1);

	// now determine what the new rotation and form are
	this.newTileShift(tile,shift);
}

TiledShape.prototype.newTileShift = function (tile,shift) {
	//console.log("new shift",shift,"for tile",tile);
	var rotation = 0;
	var validForm = true;

	if (this.shape.form[tile.linkCount] == undefined) {
		console.log(this.name,"form undefined for",tile.linkCount,"links");
	}

	while (this.shape.form[tile.linkCount][shift] == undefined) {

		// shift the first digit to the end
		shift = shift.substr(1) + shift.substr(0,1);
		rotation++;

		if (rotation == this.sides) {
			validForm = false;
			rotation = 0;
			break;
		}
	}

	if (validForm) {
		// update the form, rotation and image
		tile.form = shift;
		tile.rotation = rotation;
		//tile.image = this.images.connector[tile.linkCount][tile.form];
		//console.log("valid connector",tile.x,tile.y,tile.linkCount,tile.form,tile.image);
	} else {
		// otherwise, just update the form
		tile.form = this.shift(shift,modulo(this.sides - tile.rotation,this.sides));
		//console.log("invalid connector",tile.x,tile.y,tile.linkCount,tile.form,tile.image);
	}
}

TiledShape.prototype.validConnector = function (connector) {
	return (this.shape.form[connector.linkCount][connector.form] != undefined);
}

// tile may be a normal connector, or a filter, or a prism
TiledShape.prototype.finishConnector = function (tile) {
	var formImage = this.images.connector[tile.linkCount][tile.form];
	var breakdown = this.shape.form[tile.linkCount][tile.form];

	if (formImage !== undefined) {
		tile.image = formImage;
	} else {
		breakdownImage = this.images.connector[tile.linkCount][breakdown];
		if (breakdownImage !== undefined) {
			tile.image = breakdownImage;
		} else if (this.primaryImagesLoaded) {
			tile.image = this.createTileImage(tile);
		} else {
			this.queueUndrawnTile(tile);
			return;
		}
	}

	this.addAdditionalLinks(tile);
	this.grid.connectorFinished();
	//console.log("finish connector",tile.x,tile.y,tile.form,tile.linkCount,breakdown,formImage,tile.image);
}

TiledShape.prototype.queueUndrawnTile = function (tile) {
	if (tile.linkCount == 1) {
		if (this.undrawnImages[tile.linkCount][tile.form] == undefined)
			this.undrawnImages[tile.linkCount][tile.form] = [];
		this.undrawnImages[tile.linkCount][tile.form].push(tile);
	} else {
		var breakdown = this.shape.form[tile.linkCount][tile.form];
		if (this.undrawnImages[tile.linkCount][breakdown] == undefined)
			this.undrawnImages[tile.linkCount][breakdown] = [];
		this.undrawnImages[tile.linkCount][breakdown].push(tile);
	}
}

TiledShape.prototype.addAdditionalLinks = function (tile) {}

// check if a link exists at the give form index
// it will be translated to a direction based on the tile's rotation
TiledShape.prototype.formLinkExists = function (tile,rotation,formIndex) {
	var index = modulo(formIndex + rotation, this.sides);
	var direction = this.shape.faces[tile.orientation][index];
	//console.log("form link exists",tile.faces[direction],direction,index,formIndex,tile.rotation);
	return (tile.faces[direction].length > 0);
}

// add a link to the tile
// additional arguments are indexes in the form of the tile
// that will be translated to directions based on the tile's rotation
TiledShape.prototype.addFormLink = function (tile,rotation) {
	var linkId = tile.add_link();

	for (var i = 2; i < arguments.length; i++) {
		var formIndex = arguments[i];
		var index = modulo(formIndex + rotation, this.sides);
		var direction = this.shape.faces[tile.orientation][index];
		//console.log("add arm to link",linkId,direction,index,formIndex);
		tile.addToLink(linkId,direction);
	}
}

// called by the tiling when the first load of images has finished
// check if there are any undrawn images
TiledShape.prototype.imagesLoaded = function () {
	this.primaryImagesLoaded = true;
	var tiles = [];

	var linkCount = 1;
	for (var form in this.undrawnImages[linkCount]) {
		if (this.undrawnImages[linkCount][form].length == 0) continue;
		tiles = tiles.concat(this.undrawnImages[linkCount][form]);

		var image = this.reflectorBlockImage(form);
		var scaleRatio = 1;
		var tileImage = this.loadImage(image,scaleRatio);

		this.images.connector[linkCount][form] = tileImage;
		delete this.undrawnImages[linkCount][form];
	}

	for (linkCount = 2; linkCount <= this.sides/4; linkCount++) {
		for (var breakdown in this.undrawnImages[linkCount]) {
			if (this.undrawnImages[linkCount][breakdown].length == 0) continue;
			tiles = tiles.concat(this.undrawnImages[linkCount][breakdown]);

			var image = this.partitionedMirrorImage(breakdown);
			var scaleRatio = 1;
			var tileImage = this.loadImage(image,scaleRatio);

			this.images.connector[linkCount][breakdown] = tileImage;
			delete this.undrawnImages[linkCount][breakdown];
		}
	}

	if (tiles.length == 0) return true;

	for (var tile of tiles) {
		this.finishConnector(tile);
	}

	return false;
}

TiledShape.prototype.loadImage = function (image,scaleRatio) {
	var grid = this.grid;
	var loadAction = function () { grid.tileImageCreated(); }
	var loadingAction = undefined;
	var loadedAction = function () { grid.tileImageLoaded(); }
	return new ScaledImage(grid,image,scaleRatio,loadAction,loadingAction,loadedAction);
}

TiledShape.prototype.createTileImage = function (tile) {
	if (tile.linkCount == 1) {
		var image = this.reflectorBlockImage(tile.form);
		var scaleRatio = 1;
		var tileImage = this.loadImage(image,scaleRatio);

		this.images.connector[tile.linkCount][tile.form] = tileImage;
	} else {
		var breakdown = this.shape.form[tile.linkCount][tile.form];
		var image = this.partitionedMirrorImage(breakdown);
		var scaleRatio = 1;
		var tileImage = this.loadImage(image,scaleRatio);

		this.images.connector[tile.linkCount][breakdown] = tileImage;
	}

	return tileImage;
}

TiledShape.prototype.reflectorBlockImage = function (form) {
	throw "reflectorBlockImage function not defined for tiled "+this.name;
}

TiledShape.prototype.partitionedMirrorImage = function (breakdown) {
	throw "partitionedMirrorImage function not defined for tiled "+this.name;
}

// tell the grid where to draw and at what rotation
TiledShape.prototype.drawTileAt = function (xPixel,yPixel,orientation) {
	var xOrigin = xPixel + this.origin[orientation].x;
	var yOrigin = yPixel + this.origin[orientation].y;
	this.grid.drawAt(xOrigin,yOrigin);
	this.grid.rotateBy(this.degrees(orientation));
}

// clear the tile at the current position
// canvas context must be translated and rotated to the origin first
TiledShape.prototype.clearTile = function () {
	var coords = [];
	var i = 0;
	while (this.point[i] != undefined) {
		coords.push(this.point[i].x,this.point[i].y);
		i++;
	}

	this.grid.clearPolygon.apply(this.grid,coords);
	var outlineArgs = coords;
	outlineArgs.push("black");
	this.grid.outlinePolygon.apply(this.grid,outlineArgs);
}

// draw node at the curent location
TiledShape.prototype.drawNode = function (tile) {
	// draw the paths first
	this.drawBeams(tile);
	
	if (tile.lit) {
		this.images.misc.tile.lit.draw();
		this.images.node.lit[tile.colour].draw();
	} else {
		this.images.node.frame[tile.colour].draw();

		var litColour = composite_colour(tile.colours);
		if (litColour != "black") {
			this.images.node.inner[litColour].draw();
		}
	}
}

// draw source at the current location
TiledShape.prototype.drawSource = function (tile) {
	// draw the abck first
	this.images.source.frame.back.draw();

	this.drawBeams(tile);

	this.images.source.light[tile.colour].draw();
	this.images.source.frame.front.draw();
}

TiledShape.prototype.drawConnector = function (tile) {
	if (tile.colours.red || tile.colours.green || tile.colours.blue) {
		this.images.misc.tile.lit.draw();
	}

	this.drawBeams(tile);

	var image = tile.image;
	if (image != null) {
		this.grid.startDrawing();
		var location = this.drawPoint[tile.rotation];
		this.grid.drawAt(location.x,location.y);
		this.grid.rotateBy(this.shape.angle*tile.rotation);

		image.draw();
		this.grid.finishDrawing();
	}
}

// draw the arms of the tile
// canvas context must be translated and rotated to the origin first
TiledShape.prototype.drawBeams = function (tile) {
	this.grid.startDrawing();

	// each arm
	var rotation = 0;
	var direction = this.shape.faces[tile.orientation][0];
	var initialDirection = direction;
	while (true) {
		if (tile.faces[direction].length > 0) {
			var location = this.drawPoint[rotation];
			this.grid.drawAt(location.x,location.y);
			this.grid.rotateBy(this.shape.angle*rotation);
			// rotation stacks on the canvas, so reset our local rotation after rotating
			rotation = 0;

			//get colour
			var colour = composite_colour(tile.faceColours[direction]);
			if (colour != "black") {
				// draw the beams with a slightly raised y coordinate so that it meets the
				// beam on the pther tile (and so looks like a continuous line)
				this.images.path.beam[colour].draw(0,-0.5);
			}
		}

		// increase rotation
		rotation++;

		// next face to check is clockwise from this one
		direction = this.shape.face[tile.orientation][direction][1];
		if (direction == initialDirection) break;
	}

	this.grid.finishDrawing();
}


TiledShape.prototype.reflectorBlockImage = function (form) {
	// create a canvas
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	var blockCoords = [];
	context.fillStyle = BLOCK_COLOUR;

	for (var i = 0; i < this.shape.sides; i++) {
		var face = form.charAt(i);
		if (face == "1") {
			if (blockCoords.length > 0) {
				context.save();

				// draw the block
				context.beginPath();
				// start at the current point
				context.moveTo(this.point[i].x,this.point[i].y);

				// move to all the other points in order
				for (var j = 0; j < blockCoords.length; j++) {
					context.lineTo(blockCoords[j].x,blockCoords[j].y);
				}

				// restrict the fill to the outlined area
				context.clip();
				context.fillRect(0,0,canvas.width,canvas.height);

				context.restore();

				// clear the blockCoords
				blockCoords = [];
			}
		} else {
			if (blockCoords.length == 0) {
				blockCoords.push(this.point.centre);
			}
			blockCoords.push(this.point[i]);
		}
	}

	// draw the reflector
	context.drawImage(this.images.misc.connector.reflector.image, 0, 0);

	return convert_canvas_to_image(canvas);
}

TiledShape.prototype.partitionedMirrorImage = function (breakdown) {
	game_log("dodecagon",1,"creating image for",breakdown);
	// create a canvas
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	var blockCoords = [];
	context.fillStyle = BLOCK_COLOUR;

	var i = 0;
	var lastDrawnPartition = breakdown.charAt(breakdown.length - 1);
	for (var partition of breakdown) {
		game_log(this.shape.name,2,"partition",partition,"i",i);
		if (lastDrawnPartition != this.shape.sides/2 && (partition != 1 || blockCoords.length == 0)) {
			game_log(this.shape.name,3,"draw arm");
			// if the previous partition was half, we don't need to draw any image
			// we also don't need to draw an arm if we are in the middle of a block
			// draw the mirror arm image
			if (partition == this.shape.sides/2) {
				image = this.images.misc.connector.full.image;
			} else {
				image = this.images.misc.connector.fullArm.image;
			}

			// draw the image at the current rotation
			context.save();
			context.translate(this.drawPoint[i].x,this.drawPoint[i].y);
			context.rotate(this.shape.angle*i*RAD);
			context.drawImage(image, 0, 0);
			context.restore();

			lastDrawnPartition = partition;
		} else {
			lastDrawnPartition = 0;
		}

		if (partition == 1) {
			game_log(this.shape.name,3,"add to block");
			// block
			if (blockCoords.length == 0) {
				blockCoords.push(this.point.centre);
			}
			blockCoords.push(this.point[i]);
		}

		// if we are not mid-block, draw the block
		if ((partition != 1 || i == this.shape.sides - 1) && blockCoords.length > 0) {
			game_log(this.shape.name,2,"draw block");
			context.save();
			// draw the block
			context.beginPath();
			// start at the current point
			context.moveTo(this.point[i].x,this.point[i].y);

			// move to all the other points in order
			for (let point of blockCoords) {
				context.lineTo(point.x,point.y);
			}

			// restrict the fill to the outlined area
			context.clip();
			context.fillRect(0,0,canvas.width,canvas.height);
			context.restore();

			blockCoords = [];
		}

		i += parseInt(partition);
	}

	return convert_canvas_to_image(canvas);;
}
