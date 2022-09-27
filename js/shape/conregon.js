
// CONvex REGular polyGON
// abstract ancestor
// contains information about a polygon, independant of geometry
// decendants: triangle, square, hexagon, octagon, dodecagon
// instance is ConregonTile, which a tiling instance uses to draw tiles on the grid
function ConRegon () {
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
	this.straightForms = {};
	this.prismForms = {};
	this.imagePixels = 256;
	this.image = {};
	this.imageFolder = "";
	this.imageCount = 0;
	this.imageLoadedCount = 0;
	this.imageFinishedCount = 0;
}

ConRegon.prototype.initialise = function () {
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
	shape.defineStraightForms();
	shape.definePrismForms();
	shape.loadImages();
}

ConRegon.prototype.defineForms = function () {
	throw "defineForms function not defined for "+this.name;
}

// By default there are none
ConRegon.prototype.definePrismForms = function () {}

// define all distinct forms with a single link
// only defines forms with at least 3 arms
ConRegon.prototype.defineSingleForms = function (ignoreNumbers) {
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
ConRegon.prototype.definePartitionedForms = function () {
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
			// shift = shift.substr(1) + shift.substr(0,1);
			shift = shift.slice(1) + shift.slice(0,1);
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
ConRegon.prototype.padPartitionPermutation = function (permutation,fromIndex,toLength) {
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
ConRegon.prototype.partitionCombinations = function (length,maxSize,linkIdOffset) {
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
/* 
ConRegon.prototype.definePossibleForms = function () {
	this.possibleForms = {};

	// each possible link count, bar the maximum
	for (var linkCount = 1; linkCount < this.sides/2; linkCount++) {
		// ignore 1 link with > 3 arms...

		// each form
		for (var form in this.form[linkCount]) {
			this.possibleForms[form] = [];
			var pattern = new RegExp(form.replace(/0/g,"."));
			for (var possibleForm in this.form[linkCount + 1]) {
				// each shift of the form
				for (var rotation = 0; rotation < this.sides; rotation++) {
					var shift = possibleForm.substr(possibleForm.length - rotation , rotation) + possibleForm.substr(0 , this.sides - rotation);
					// regexp looking for a match
					if (!shift.match(pattern)) continue;

					// console.log(form,"->",shift);
					this.possibleForms[form].push(shift);
					break;
				}
			}
		}
	}
}
 */
ConRegon.prototype.loadImages = function () {
	// calculate and record the base image sizes
	this.imageSizes = [];
	var imageSize = this.imagePixels;
	while (imageSize > 10) {
		this.imageSizes.push(parseInt(imageSize));
		imageSize /= 2;
	}

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
	this.image.special = {filter: {}, prism: {}};

	this.loadMiscImages(dir);

	this.loadImage(dir,"lit.png",              ["misc","tile","lit"]);
	this.loadImage(pathDir,"beam-red.png",     ["path","beam","red"]);
	this.loadImage(pathDir,"beam-green.png",   ["path","beam","green"]);
	this.loadImage(pathDir,"beam-blue.png",    ["path","beam","blue"]);
	this.loadImage(pathDir,"beam-yellow.png",  ["path","beam","yellow"]);
	this.loadImage(pathDir,"beam-magenta.png", ["path","beam","magenta"]);
	this.loadImage(pathDir,"beam-cyan.png",    ["path","beam","cyan"]);
	this.loadImage(pathDir,"beam-white.png",   ["path","beam","white"]);
	this.loadImage(nodeDir,"lit-red.png",      ["node","lit","red"]);
	this.loadImage(nodeDir,"lit-green.png",    ["node","lit","green"]);
	this.loadImage(nodeDir,"lit-blue.png",     ["node","lit","blue"]);
	this.loadImage(nodeDir,"lit-yellow.png",   ["node","lit","yellow"]);
	this.loadImage(nodeDir,"lit-magenta.png",  ["node","lit","magenta"]);
	this.loadImage(nodeDir,"lit-cyan.png",     ["node","lit","cyan"]);
	this.loadImage(nodeDir,"lit-white.png",    ["node","lit","white"]);
	this.loadImage(nodeDir,"inner-red.png",    ["node","inner","red"]);
	this.loadImage(nodeDir,"inner-green.png",  ["node","inner","green"]);
	this.loadImage(nodeDir,"inner-blue.png",   ["node","inner","blue"]);
	this.loadImage(nodeDir,"inner-yellow.png", ["node","inner","yellow"]);
	this.loadImage(nodeDir,"inner-magenta.png",["node","inner","magenta"]);
	this.loadImage(nodeDir,"inner-cyan.png",   ["node","inner","cyan"]);
	this.loadImage(nodeDir,"inner-white.png",  ["node","inner","white"]);
	this.loadImage(nodeDir,"frame-red.png",    ["node","frame","red"]);
	this.loadImage(nodeDir,"frame-green.png",  ["node","frame","green"]);
	this.loadImage(nodeDir,"frame-blue.png",   ["node","frame","blue"]);
	this.loadImage(nodeDir,"frame-yellow.png", ["node","frame","yellow"]);
	this.loadImage(nodeDir,"frame-magenta.png",["node","frame","magenta"]);
	this.loadImage(nodeDir,"frame-cyan.png",   ["node","frame","cyan"]);
	this.loadImage(nodeDir,"frame-white.png",  ["node","frame","white"]);
	this.loadImage(sourceDir,"red.png",        ["source","light","red"]);
	this.loadImage(sourceDir,"green.png",      ["source","light","green"]);
	this.loadImage(sourceDir,"blue.png",       ["source","light","blue"]);
	this.loadImage(sourceDir,"back.png",       ["source","frame","back"]);
	this.loadImage(sourceDir,"frame.png",      ["source","frame","front"]);

	this.loadConnectorImages(connectorDir);
}

ConRegon.prototype.loadMiscImages = function () {
	throw "loadExtraImages function not defined for "+this.name;
}

ConRegon.prototype.loadConnectorImages = function () {
	throw "loadConnectorImages function not defined for "+this.name;
}

ConRegon.prototype.imageRenders = function (imagePath) {
	var imageRenders = this.image;
	for (var key of imagePath) {
		if (imageRenders[key] == undefined) imageRenders[key] = {};
		imageRenders = imageRenders[key];
	}

	return imageRenders;
}

// load the image file (tail), located in directory
// imagePath in the image hash where the image and resizes are to be stored
ConRegon.prototype.loadImage = function (directory,tail,imagePath) {
	this.imageCount++;
	var imageRenders = this.imageRenders(imagePath);

	var conregon = this;
	var loadedAction = function (image) { conregon.imageLoaded(image,true,imageRenders); }
	var file = directory + "/" + tail;
	// console.log("load image "+file);
	load_image(file,loadedAction);
}

// similar to load image, but uses an image from memory, not disk
// imagePath in the image hash where the image and resizes are to be stored
ConRegon.prototype.useImage = function (image,imagePath) {
	this.imageCount++;
	var imageRenders = this.imageRenders(imagePath);

	if (image.complete) {
		// console.log("image",imagePath,"is complete");
		this.imageLoaded(image,false,imageRenders);
	} else {
		// console.log("image",imagePath,"is not complete");
		var conregon = this;
		var loadedAction = function () { conregon.imageLoaded(image,false,imageRenders); }
		image.addEventListener ("load",loadedAction);
	}
}

// initial image has loaded
// now add incrementally smaller resizes of the image
ConRegon.prototype.imageLoaded = function (image,isBase,imageRenders) {
	// check if this is the last base image to load
	this.imageLoadedCount++;
	if (isBase && this.imageLoadedCount == this.imageCount) this.baseImagesLoaded();
	// if (!isBase) console.log("derived image loaded");
	var size = this.imagePixels;
	imageRenders[size] = image;

	var progress = 1 / this.imageSizes.length;
	this.progressAction(progress,2*progress);

	var resize = parseInt(size/2);
	var conregon = this;
	var loadedAction = function (scaledImage) { conregon.imageResizeLoaded(imageRenders,resize,scaledImage); }
	new ScaledImage(this,image,0.5,undefined,undefined,loadedAction);
}

ConRegon.prototype.baseImagesLoaded = function () {}

// return the given image, reflected about the vertical axis
ConRegon.prototype.reverse_image = function (baseImage) {
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	// reverse the drawing context
	context.scale(-1,1);

	// draw the base image with the origin being the top right corner
	context.drawImage(baseImage, 0 - canvas.width, 0);

	return convert_canvas_to_image(canvas);
}

// a resize of an image has loaded
// either stop, or add another resize
ConRegon.prototype.imageResizeLoaded = function (imageRenders,size,scaledImage) {
	var image = scaledImage.image;
	imageRenders[size] = image;

	var progress = 1 / this.imageSizes.length;

	var resize = parseInt(size/2);
	if (size/2 < MIN_PIXELS) {
		this.progressAction(progress,0);
		this.imageLoadFinished();
		return;
	}
	this.progressAction(progress,progress);

	var conregon = this;
	var loadedAction = function (scaledImage) { conregon.imageResizeLoaded(imageRenders,resize,scaledImage); }
	new ScaledImage(this,image,0.5,undefined,undefined,loadedAction);
}

// an image and any resizes of it have finished loading
// check if it is the last image
ConRegon.prototype.imageLoadFinished = function () {
	this.imageFinishedCount++;
	if (this.imageFinishedCount < this.imageCount) return;

	// console.log("all",this.name,"images loaded",this);
	this.allImagesLoaded();
}

ConRegon.prototype.allImagesLoaded = function () {
	this.loadedAction();
}

function ConRegonTile (shape,grid) {
	this.origin = {};
	this.drawPoint = {};
	this.point = {};
	this.primaryImagesLoaded = false;
}

ConRegonTile.prototype.initialise = function () {
	this.sides = this.ideal.sides;
	this.name = this.ideal.name;
	this.size = this.grid.tilePixels;

	for (var index in this.ideal.orientations) {
		var orientation = this.ideal.orientations[index];
		this.origin[orientation] = {x: 0, y: 0};
	}

	this.point.centre = {x: 0, y: 0};
	for (var i = 0; i < this.sides; i++) {
		this.drawPoint[i] = {x: 0, y: 0};
		this.point[i] = {x: 0, y: 0};
	}
	this.definePoints();

	var imageSize = 0;
	var imageSizes = this.ideal.imageSizes.slice();
	while (imageSize < this.size && imageSizes.length > 0) imageSize = imageSizes.pop();
	// console.log("image size is",imageSize);

	var scaleRatio = this.size/imageSize;
	this.images = {};
	for (var type in this.ideal.image) {
		this.images[type] = {};
		for (var subtype in this.ideal.image[type]) {
			this.images[type][subtype] = {};
			for (var img in this.ideal.image[type][subtype]) {
				if (this.ideal.image[type][subtype][img] == null) {
					this.images[type][subtype][img] = null;
				} else {
					var image = this.ideal.image[type][subtype][img][imageSize]
					// console.log("load image for",type,subtype,img,this.ideal.image[type][subtype][img][imageSize]);
					// console.log("load image for",type,subtype,img,image.width,"x",image.height);
					this.images[type][subtype][img] = this.loadImage(image,scaleRatio);
				}
			}
		}
	}

	this.undrawnImages = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}};
}

ConRegonTile.prototype.resize = function () {
	this.size = this.grid.tilePixels;
	this.definePoints();

	var scaleRatio = this.size/this.ideal.imagePixels;
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

ConRegonTile.prototype.definePoints = function () {
	throw "definePoints function not defined for tiled "+this.name;
}

ConRegonTile.prototype.directions = function (orientation) {
	return this.ideal.faces[orientation].slice();
}

ConRegonTile.prototype.randomDirections = function (orientation) {
	var directions = this.directions(orientation);
	var randomDirections = [];
	while (directions.length>0) {
		var index = Math.floor(directions.length*Math.random());
		var subset = directions.splice(index,1);
		randomDirections.push(subset[0]);
	}

	return randomDirections;
}


ConRegonTile.prototype.randomDirection = function (orientation) {
	var index = Math.floor(this.sides*Math.random());
	return this.ideal.faces[orientation][index];
}

ConRegonTile.prototype.direction = function (orientation,from,by) {
	return this.ideal.face[orientation][from][by];
}

ConRegonTile.prototype.nextDirection = function (orientation,direction) {
	return this.ideal.face[orientation][direction][1];
}

ConRegonTile.prototype.prevDirection = function (orientation,direction) {
	return this.ideal.face[orientation][direction][this.sides - 1];
}

ConRegonTile.prototype.degrees = function (orientation) {
	return this.ideal.degrees[orientation];
}

ConRegonTile.prototype.newTile = function (tile) {
	var directions = this.ideal.faces[tile.orientation];
	for (var index in directions) {
		var direction = directions[index];
		tile.faces[direction] = [];
		tile.faceColours[direction] = {red: 0, green: 0, blue: 0};
	}

	// no longer added here - added when generate.js attempts to add a path...
	// tile.candidateFaces = this.randomDirections(tile.orientation);
	tile.shape = this;
	tile.form = this.ideal.initialForm;
	tile.rotation = 0;
}

// create a blank tile
// default function creates a straight
ConRegonTile.prototype.blankTile = function (tile) {
	console.log("blank tile @",tile.x,tile.y);
}

// return the form after applying the rotation
// e.g if the form is 000101, and the rotation is 2, then the shift is 010001 (01+0001)
ConRegonTile.prototype.shift = function (form,rotation) {
	if (rotation == 0) return form;

	// return form.substr(form.length - rotation , rotation) + form.substr(0 , this.sides - rotation);
	return form.slice(0 - rotation) + form.slice(0,0 - rotation);
}

ConRegonTile.prototype.removeArmFromConnector = function (tile,direction,linkId) {
	// tile.form is the arrangement of the links, regardless of rotation
	// the shift is the form with the tile rotation applied
	// we update the shift by removing the direction
	// and then rotate it until we find a matching form
	var shift = this.shift(tile.form,tile.rotation);

	// determine the position of the old arm in the shift and update it
	var armIndex = this.ideal.faces[tile.orientation].indexOf(direction);

	// shift = shift.substr(0,armIndex) + "0" + shift.substr(armIndex+1);
	shift = shift.slice(0,armIndex) + "0" + shift.slice(armIndex + 1);

	this.newTileShift(tile,shift);
}

// update the shift and rotation of the tile
// the shift is a string of digits and represents a tile"s current morphology 
// in terms of where it has links and where those links have arms
// each shift for a connector corresponds to a sprite
// the rotation of the tile is how far the tile is rotated, in degrees
ConRegonTile.prototype.addArmToConnector = function (tile,direction,linkId) {
	// tile.form is the arrangement of the links, regardless of rotation
	// the shift is the form with the tile rotation applied
	// we update the shift with the new direction
	// and then rotate it until we find a matching form
	var shift = this.shift(tile.form,tile.rotation);

	// add 1 to the linkId
	// linkIds can be 0, which represents "no link" in the form
	linkId++;

	// determine the position of the new arm in the shift and update it
	var armIndex = this.ideal.faces[tile.orientation].indexOf(direction);
	// shift = shift.substr(0,armIndex) + linkId + shift.substr(armIndex+1);
	shift = shift.slice(0,armIndex) + linkId + shift.slice(armIndex + 1);

	// now determine what the new rotation and form are
	this.newTileShift(tile,shift);
}

ConRegonTile.prototype.newTileShift = function (tile,shift) {
	//console.log("new shift",shift,"for tile",tile);
	var rotation = 0;
	var validForm = true;

	if (this.ideal.form[tile.linkCount] == undefined) {
		console.log(this.name,"form undefined for",tile.linkCount,"links");
	}

	while (this.ideal.form[tile.linkCount][shift] == undefined) {

		// shift the first digit to the end
		// shift = shift.substr(1) + shift.substr(0,1);
		shift = shift.slice(1) + shift.slice(0,1);
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
	console.log("updated "+tile.description()+" form to "+tile.form);
}

// return the element of the form at the given direction for the tile
ConRegonTile.prototype.form_element = function (form,direction,tile) {
	// first apply the tile's rotation to the form
	var shift = this.shift(form,tile.rotation);

	// now determine what index the direction appears in the orientation's array of directions
	index = this.directions(tile.orientation).indexOf(direction);

	// now return the character that appears at that index
	// return shift.substr(index,1);
	return shift.slice(index,index + 1);
}

ConRegonTile.prototype.validConnector = function (connector) {
	// game_log(this.ideal.name,4,"connector valid ?",connector.linkCount,"links",connector.form,this.ideal.form[connector.linkCount][connector.form]);
	return (this.ideal.form[connector.linkCount][connector.form] != undefined);
}

// Return the prism forms that the connector can be converted into
// undefined if there are none
ConRegonTile.prototype.prism_forms = function (connector) {
	return this.ideal.prismForms[connector.form];
}

// return all possible regular prism forms for the given type
// undefined by default
ConRegonTile.prototype.prism_type_forms = function (prismType) {
	return undefined;
}

ConRegonTile.prototype.prism_type = function (form) {
	throw "prism_type(form) function not defined for tiled "+this.name;
}

// return an array of new links that can be added to a tile with the given form
// given tile must contain at least one link
ConRegonTile.prototype.possible_links = function (tile) {
	if (tile.linkCount == 1) {
		// special case when there is only one link
		// if the link has more than 3 arms, no other links can be added
		for (var linkId in tile.links) {
			if (tile.links[linkId].arms.length > 3) return [];
		}
	}

	var possibleForms = this.possibleForms(tile.form, tile.linkCount);

	// convert each form to a shift
	var newLinks = [];
	for (var form of possibleForms) {
		var link = [];
		var shift = this.shift(form,tile.rotation);
		var index = 0;
		for (var direction of this.directions(tile.orientation)) {
			if (shift.charAt(index) == "2") link.push(direction);
			index++;
		}
		newLinks.push(link);
	}

	// console.log("new links from tile with form & rotation",tile.form,tile.rotation,newLinks);
	return newLinks;
}

ConRegonTile.prototype.possibleForms = function (form,linkCount) {
	var possibleForms = [];

	var pattern = new RegExp(form.replace(/0/g,"[0"+(linkCount+1)+"]"));
	for (var possibleForm in this.ideal.form[linkCount + 1]) {
		// each shift of the form
		for (var rotation = 0; rotation < this.sides; rotation++) {
			// var shift = possibleForm.substr(possibleForm.length - rotation , rotation) + possibleForm.substr(0 , this.sides - rotation);
			var shift = this.shift(possibleForm,rotation);

			// regexp looking for a match
			if (!shift.match(pattern)) continue;

			// console.log(form,"->",shift);
			possibleForms.push(shift);
			break;
		}
	}

	// console.log("possible forms for",form,possibleForms);
	return possibleForms;
}


ConRegonTile.prototype.create_prism_links = function (tile) {
	// create the new links:
	var redLinkId = tile.add_link("red")
	var greenLinkId = tile.add_link("green")
	var blueLinkId = tile.add_link("blue")

	for (var direction in tile.faces) {
		// get the prism element for this direction
		var element = this.form_element(tile.form,direction,tile);

		// add or create paths depending on what the element is
		// on the coloured elements, add to the link of the corresponding colour
		// and also add a single-armed link of each of the other colours
		switch (element) {
			case "0" : break; // no links
			case "1" :
				// a single armed link to the centre
				var linkId = tile.add_link();
				tile.add_to_link(linkId,direction);
				break;
			case "R" :
				tile.add_to_link(redLinkId,direction);
				tile.add_to_link(tile.add_link("green"),direction);
				tile.add_to_link(tile.add_link("blue"),direction);
				break;
			case "G" :
				tile.add_to_link(greenLinkId,direction);
				tile.add_to_link(tile.add_link("red"),direction);
				tile.add_to_link(tile.add_link("blue"),direction);
				break;
			case "B" :
				tile.add_to_link(blueLinkId,direction);
				tile.add_to_link(tile.add_link("red"),direction);
				tile.add_to_link(tile.add_link("green"),direction);
				break;
			case "Y" :
				tile.add_to_link(redLinkId,direction);
				tile.add_to_link(greenLinkId,direction);
				tile.add_to_link(tile.add_link("blue"),direction);
				break;
			case "T" :
				tile.add_to_link(greenLinkId,direction);
				tile.add_to_link(blueLinkId,direction);
				tile.add_to_link(tile.add_link("red"),direction);
				break;
			case "W" :
				tile.add_to_link(redLinkId,direction);
				tile.add_to_link(greenLinkId,direction);
				tile.add_to_link(blueLinkId,direction);
				break;
		}
	}
}

// tile is be a normal connector
// set the image
// add any additional links
ConRegonTile.prototype.finishConnector = function (tile) {
	game_log(this.ideal.name,"2","finish connector @",tile.x,tile.y,tile.linkCount,"links",tile.form);
	var formImage = this.images.connector[tile.linkCount][tile.form];

	if (formImage !== undefined) {
		tile.image = formImage;
	} else {
		var breakdown = this.ideal.form[tile.linkCount][tile.form];
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
}

// tile is a filter
// set the image
ConRegonTile.prototype.finishFilter = function (tile) {
	game_log(this.ideal.name,"2","finish filter @",tile.x,tile.y,tile.linkCount,"links",tile.form);

	tile.image = this.images.special.filter[tile.colour];

	// Find he first empty link and set the rotation
	// To any other directions, add any additional links
	// console.log("add arms to filter @"+tile.x+","+tile.y);
	var index = -1;
	tile.rotation = null;
	for (var direction of this.ideal.faces[tile.orientation]) {
		index++;
		if (index >= this.sides/2) break;

		// console.log("\tcheck direction "+direction+" index = "+index);
		// console.log("\tlink count = "+tile.faces[direction].length);

		// only add links if there are none already
		if (tile.faces[direction].length > 0) continue;

		if (tile.rotation == null) {
			// leave this face, and its opposite, blank
			// rotation then is whatever index we are up to
			tile.rotation = index;
			// console.log("rotation is "+tile.rotation);
			continue;
		}

		// add links
		// determine the opposite face
		var opposite = opposite_direction(direction);

		// console.log("\tadd arms to "+direction+" & "+opposite);

		for (var colour of primary_colours()) {
			// create a new link, add an arm in the one direction
			var linkId = tile.add_link(colour);
			tile.add_to_link(linkId,direction);

			if (colour == tile.colour) {
				// colour matches the filter - link passes through
				// add the opposite direction to the same link:
				tile.add_to_link(linkId,opposite);
			} else {
				// link colour does not match, shall not pass
				// create another link on the opposite side
				linkId = tile.add_link(colour);
				tile.add_to_link(linkId,opposite);
			}
		}
	}

	// even though not technically a connector, filters begin life as connectors
	// the grid will not draw if it thinks there is a connector outstanding
	this.grid.connectorFinished();
}

// tile is a prism
// set the image
// all links have been added already - see create_prism_links
// set rotation
ConRegonTile.prototype.finishPrism = function (tile) {
	game_log(this.ideal.name,"2","finish filter @",tile.x,tile.y,tile.linkCount,"links",tile.form);

	// determine image by prism type
	var [prismType, prismOrientation] = this.prism_type(tile.form);
	if (prismOrientation == "reversed") {
		tile.image = this.images.special.prism[prismType+"-reversed"];
	} else {
		tile.image = this.images.special.prism[prismType];
	}

	// Find the direction that all the colours come in on 
	// The rotation is the direction's index minus one
	// Or minus two for an extended prism
	var rotation;
	if (prismType == "extended") {
		if (prismOrientation == "reversed") {
			rotation = 2;
		} else {
			rotation = this.sides - 2;
		}
	} else if (prismOrientation == "reversed") {
		rotation = 1;
	} else {
		rotation = this.sides - 1;
	}

	for (var direction of this.directions(tile.orientation)) {
		// must be 3 links
		if (tile.faces[direction].length == 3) {
			// each link must have at least 2 arms
			var oneArmedLink = false;
			for (var linkId of tile.faces[direction]) {
				var link = tile.links[linkId];
				if (link.armCount >= 2) continue;

				oneArmedLink = true;
				break;
			}

			if (!oneArmedLink) break; // we have found the white face
		}

		rotation++;
		if (rotation >= this.sides) rotation = 0;
	}

	tile.rotation = rotation;

	// even though not technically a connector, prisms begin life as connectors
	// the grid will not draw if it thinks there is a connector outstanding
	this.grid.connectorFinished();
}

ConRegonTile.prototype.queueUndrawnTile = function (tile) {
	if (tile.linkCount == 1) {
		if (this.undrawnImages[tile.linkCount][tile.form] == undefined)
			this.undrawnImages[tile.linkCount][tile.form] = [];
		this.undrawnImages[tile.linkCount][tile.form].push(tile);
	} else {
		var breakdown = this.ideal.form[tile.linkCount][tile.form];
		if (this.undrawnImages[tile.linkCount][breakdown] == undefined)
			this.undrawnImages[tile.linkCount][breakdown] = [];
		this.undrawnImages[tile.linkCount][breakdown].push(tile);
	}
}

ConRegonTile.prototype.addAdditionalLinks = function (tile) {}

// check if a link exists at the give form index
// it will be translated to a direction based on the tile's rotation
ConRegonTile.prototype.formLinkExists = function (tile,rotation,formIndex) {
	var index = modulo(formIndex + rotation, this.sides);
	var direction = this.ideal.faces[tile.orientation][index];
	//console.log("form link exists",tile.faces[direction],direction,index,formIndex,tile.rotation);
	return (tile.faces[direction].length > 0);
}

// add a link to the tile
// additional arguments are indexes in the form of the tile
// that will be translated to directions based on the tile's rotation
ConRegonTile.prototype.addFormLink = function (tile,rotation) {
	var linkId = tile.add_link();

	for (var i = 2; i < arguments.length; i++) {
		var formIndex = arguments[i];
		var index = modulo(formIndex + rotation, this.sides);
		var direction = this.ideal.faces[tile.orientation][index];
		//console.log("add arm to link",linkId,direction,index,formIndex);
		tile.add_to_link(linkId,direction);
	}
}

ConRegonTile.prototype.canFilter = function (connector) {
	console.log("can add filter to connector?",connector);
	// tile must be a straight
	if (this.ideal.straightForms[connector.form] == undefined) return false;
	console.log("straight");

	// must be at least one spare path...
	if (connector.PathCount >= this.sides/2) return false;
	console.log("spare path");

	return true;
}

// called by the tiling when the first load of images has finished
// check if there are any undrawn images
ConRegonTile.prototype.imagesLoaded = function () {
	game_log(this.ideal.name,"1",this.ideal.name,"images loaded - undrawn:",this.undrawnImages);
	this.primaryImagesLoaded = true;
	var tiles = [];

	var linkCount = 1;
	for (var form in this.undrawnImages[linkCount]) {
		if (this.undrawnImages[linkCount][form].length == 0) continue;
		tiles = tiles.concat(this.undrawnImages[linkCount][form]);

		game_log(this.ideal.name,3,"create reflector block image for form",form);

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

			game_log(this.ideal.name,3,"create partitioned mirror image for breakdown",breakdown);

			var image = this.partitionedMirrorImage(breakdown);
			var scaleRatio = 1;
			var tileImage = this.loadImage(image,scaleRatio);

			this.images.connector[linkCount][breakdown] = tileImage;
			delete this.undrawnImages[linkCount][breakdown];
		}
	}

	game_log(this.ideal.name,2,tiles.length,"tiles still to be finished")
	if (tiles.length == 0) return true;

	for (var tile of tiles) {
		this.finishConnector(tile);
	}

	return false;
}

ConRegonTile.prototype.loadImage = function (image,scaleRatio) {
	var grid = this.grid;
	var loadAction = function () { grid.tileImageCreated(); }
	var loadingAction = undefined;
	var loadedAction = function  () { grid.tileImageLoaded(); }
	return new ScaledImage(grid,image,scaleRatio,loadAction,loadingAction,loadedAction);
}

ConRegonTile.prototype.createTileImage = function (tile) {
	if (tile.linkCount == 1) {
		var image = this.reflectorBlockImage(tile.form);
		var scaleRatio = 1;
		var tileImage = this.loadImage(image,scaleRatio);

		this.images.connector[tile.linkCount][tile.form] = tileImage;
	} else {
		var breakdown = this.ideal.form[tile.linkCount][tile.form];

		//...
		if (breakdown == undefined) {
			console.log(tile);
			throw "Invalid breakdown for tile";
		}


		var image = this.partitionedMirrorImage(breakdown);
		var scaleRatio = 1;
		var tileImage = this.loadImage(image,scaleRatio);

		this.images.connector[tile.linkCount][breakdown] = tileImage;
	}

	return tileImage;
}

ConRegonTile.prototype.imageCanvas = function () {
	throw "imageCanvas function not defined for tiled "+this.name;
}

ConRegonTile.prototype.reflectorBlockImage = function (form) {
	// create a canvas
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	var blockCoords = [];
	context.fillStyle = BLOCK_COLOUR;

	for (var i = 0; i < this.ideal.sides; i++) {
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

// tell the grid where to draw and at what rotation
ConRegonTile.prototype.drawTileAt = function (xPixel,yPixel,orientation) {
	var xOrigin = xPixel + this.origin[orientation].x;
	var yOrigin = yPixel + this.origin[orientation].y;
	this.grid.drawAt(xOrigin,yOrigin);
	this.grid.rotateBy(this.degrees(orientation));
}

// clear the tile at the current position
// canvas context must be translated and rotated to the origin first
ConRegonTile.prototype.clearTile = function () {
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
ConRegonTile.prototype.drawNode = function (tile) {
	// draw the paths first
	this.drawBeams(tile);

	if (tile.colour == "black") {
		game_log("tile",0,"**Node @"+tile.x+","+tile.y+" has no clour")
		return;
	}

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
ConRegonTile.prototype.drawSource = function (tile) {
	// draw the abck first
	this.images.source.frame.back.draw();

	this.drawBeams(tile);

	this.images.source.light[tile.colour].draw();
	this.images.source.frame.front.draw();
}

ConRegonTile.prototype.drawConnector = function (tile) {
	if (tile.colours.red || tile.colours.green || tile.colours.blue) {
		this.images.misc.tile.lit.draw();
	}

	this.drawBeams(tile);

	var image = tile.image;
	if (image != null) {
		this.grid.startDrawing();
		var location = this.drawPoint[tile.rotation];
		this.grid.drawAt(location.x,location.y);
		this.grid.rotateBy(this.ideal.angle*tile.rotation);

		image.draw();
		this.grid.finishDrawing();
	}
}

ConRegonTile.prototype.drawFilter = function (tile) {
	if (tile.colours.red || tile.colours.green || tile.colours.blue) {
		this.images.misc.tile.lit.draw();
	}

	this.drawBeams(tile);

	var image = tile.image;
	this.grid.startDrawing();
	var location = this.drawPoint[tile.rotation];
	this.grid.drawAt(location.x,location.y);
	this.grid.rotateBy(this.ideal.angle*tile.rotation);

	image.draw();
	this.grid.finishDrawing();
}

ConRegonTile.prototype.drawPrism = function (tile) {
	if (tile.colours.red || tile.colours.green || tile.colours.blue) {
		this.images.misc.tile.lit.draw();
	}

	this.drawBeams(tile);

	var image = tile.image;
	this.grid.startDrawing();
	var location = this.drawPoint[tile.rotation];
	this.grid.drawAt(location.x,location.y);
	this.grid.rotateBy(this.ideal.angle*tile.rotation);

	image.draw();
	this.grid.finishDrawing();
}

// draw the arms of the tile
// canvas context must be translated and rotated to the origin first
ConRegonTile.prototype.drawBeams = function (tile) {
	this.grid.startDrawing();

	// each arm
	var rotation = 0;
	var direction = this.ideal.faces[tile.orientation][0];
	var initialDirection = direction;
	while (true) {
		if (tile.faces[direction].length > 0) {
			var location = this.drawPoint[rotation];
			this.grid.drawAt(location.x,location.y);
			this.grid.rotateBy(this.ideal.angle*rotation);
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
		direction = this.ideal.face[tile.orientation][direction][1];
		if (direction == initialDirection) break;
	}

	this.grid.finishDrawing();
}


ConRegonTile.prototype.partitionedMirrorImage = function (breakdown) {
	game_log(this.ideal.name,1,"creating image for",breakdown);
	// create a canvas
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	var blockCoords = [];
	context.fillStyle = BLOCK_COLOUR;

	var i = 0;
	var lastDrawnPartition = breakdown.charAt(breakdown.length - 1);
	for (var partition of breakdown) {
		game_log(this.ideal.name,2,"partition",partition,"i",i);
		if (lastDrawnPartition != this.ideal.sides/2 && (partition != 1 || blockCoords.length == 0)) {
			game_log(this.ideal.name,3,"draw arm");
			// if the previous partition was half, we don't need to draw any image
			// we also don't need to draw an arm if we are in the middle of a block
			// draw the mirror arm image
			if (partition == this.ideal.sides/2) {
				image = this.images.misc.connector.full.image;
			} else {
				image = this.images.misc.connector.fullArm.image;
			}

			// draw the image at the current rotation
			context.save();
			context.translate(this.drawPoint[i].x,this.drawPoint[i].y);
			context.rotate(this.ideal.angle*i*RAD);
			context.drawImage(image, 0, 0);
			context.restore();

			lastDrawnPartition = partition;
		} else {
			lastDrawnPartition = 0;
		}

		if (partition == 1) {
			game_log(this.ideal.name,3,"add to block");
			// block
			if (blockCoords.length == 0) {
				blockCoords.push(this.point.centre);
			}
			blockCoords.push(this.point[i]);
		}

		// if we are not mid-block, draw the block
		if ((partition != 1 || i == this.ideal.sides - 1) && blockCoords.length > 0) {
			game_log(this.ideal.name,2,"draw block");
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
