
function Hexagon (loadedAction,progressAction) {
	this.loadedAction = loadedAction;
	this.progressAction = progressAction;
	this.name = "hexagon"
	this.sides = 6;
	this.initialForm = "000000";
	this.angle = 60;
	this.imageFolder = "hexagon";
	this.straightForms = {};

	this.orientations = ["flat","standing"];

	this.degrees =  {
		"flat":      0,
		"standing": 90,
	};

	this.faces = {
		"flat":     ["n","nee","see","s","sww","nww"],
		"standing": ["e","sse","ssw","w","nnw","nne"]
	};

	this.points = {
		"flat":      ["nne","e","sse","ssw","w","nnw"],
		"standing":  ["see","s","sww","nww","n","nee"],
	};

	this.initialise();
}

Hexagon.prototype = new ConRegon();

Hexagon.prototype.defineForms = function () {
	var hexagon = this;

	hexagon.form = {0: {}, 1: {}, 2: {}, 3: {}, 4: {}};
	hexagon.form[1]["000011"] = ""; // adjacent mirror
	hexagon.form[1]["001010"] = ""; // obtuse mirror
	hexagon.form[1]["000111"] = ""; // adjacent threeway*
	hexagon.form[1]["001011"] = ""; // irregular threeway
	hexagon.form[1]["011010"] = ""; // irregular threeway (reversed)*
	hexagon.form[1]["010101"] = ""; // regular threeway*
	hexagon.form[1]["001111"] = ""; // adjacent fourway*
	hexagon.form[1]["010111"] = ""; // 'peace' fourway*
	hexagon.form[1]["011011"] = ""; // regular fourway*
	hexagon.form[1]["011111"] = ""; // fiveway*
	hexagon.form[1]["111111"] = ""; // sixway
	hexagon.form[2]["011022"] = ""; // double adjacent
	hexagon.form[2]["012021"] = ""; // double obtuse
	hexagon.form[2]["001122"] = ""; // adjacent double adjacent*
	hexagon.form[2]["002211"] = ""; // adjacent double adjacent*
	hexagon.form[2]["112020"] = ""; // obtuse adjacent double*
	hexagon.form[2]["221010"] = ""; // obtuse adjacent double*
	hexagon.form[2]["102021"] = ""; // obtuse adjacent double*
	hexagon.form[2]["201012"] = ""; // obtuse adjacent double*
	hexagon.form[3]["112233"] = ""; // triple*
	hexagon.form[3]["113322"] = ""; // triple*
}

Hexagon.prototype.defineStraightForms = function () {
	var hexagon = this;
	hexagon.straightForms["001001"] = 1;
	hexagon.straightForms["012012"] = 2;
	hexagon.straightForms["021021"] = 2;
	hexagon.straightForms["123123"] = 3;
	hexagon.straightForms["132132"] = 3;

	for (var form in hexagon.straightForms) {
		var linkCount = hexagon.straightForms[form];
		hexagon.form[linkCount][form] = "";
	}
}

// define the connector forms that can be turned into a prism
Hexagon.prototype.definePrismForms = function () {
	var hexagon = this;
	hexagon.prismForms["001111"] = ["00WBGR","00RGBW"]; // adjacent fourway

	// These two are possible in theory but difficult to implement
	// You have to have blue in one partition, and yellow in the other (so quite rare also)
	// Creating the prism means adding red and green to a link that was previously blue
	// That means you're mixing colours, not just filtering, so you have to check that the mix isn't adding any redundancy~~~
	// hexagon.prismForms["001122"] = {"regular" : ["00WBGR","00RGBW"]}; // adjacent double adjacent
	// hexagon.prismForms["002211"] = {"regular" : ["00WBGR","00RGBW"]}; // adjacent double adjacent
}

Hexagon.prototype.loadMiscImages = function (directory) {
	directory += "/" + "connector"
	this.image.misc.connector = {};
	this.loadImage(directory,"double-mirror-arm.png",   ["misc","connector","arm"]);
	this.loadImage(directory,"double-obtuse-mirror.png",["misc","connector","obtuse"]);
	this.loadImage(directory,"sixway.png",              ["misc","connector","reflector"]);
	this.loadImage(directory,"threeway.png",            ["misc","connector","threeway"]);

	// filter images
	this.loadImage(directory,"filter-red.png"  ,["special","filter","red"  ]);
	this.loadImage(directory,"filter-green.png",["special","filter","green"]);
	this.loadImage(directory,"filter-blue.png" ,["special","filter","blue" ]);

	// prism
	this.loadImage(directory,"prism.png" ,["special","prism","regular" ]);
}

Hexagon.prototype.loadConnectorImages = function (directory) {
	var hexagon = this;
	this.image.connector = {1: {}, 2: {}, 3: {}};

	this.loadImage(directory,"adjacent-mirror.png"       ,["connector",1,"000011"]); // adjacent mirror
	this.loadImage(directory,"obtuse-mirror.png"         ,["connector",1,"001010"]); // obtuse mirror
	this.loadImage(directory,"threeway.png"              ,["connector",1,"001011"]); // irregular threeway
	this.loadImage(directory,"sixway.png"                ,["connector",1,"111111"]); // sixway
	this.loadImage(directory,"double-adjacent-mirror.png",["connector",2,"011022"]); // double adjacent
	this.loadImage(directory,"double-obtuse-mirror.png"  ,["connector",2,"012021"]); // double obtuse
}

Hexagon.prototype.baseImagesLoaded = function (image) {
	for (var form in this.straightForms) {
		var linkCount = this.straightForms[form];
		this.image.connector[linkCount][form] = null;
	}

	var reflectedThreeway = this.reverse_image(this.image.misc.connector.threeway[this.imagePixels]);
	this.useImage(reflectedThreeway,["connector",1,"011010"]);

	var doubleAdjacent = this.doubleAdjacentImage();
	this.useImage(doubleAdjacent,["connector",2,"001122"]);
	this.useImage(doubleAdjacent,["connector",2,"002211"]);

	var obtuseAdjacent = this.obtuseAdjacentImage(false);
	this.useImage(obtuseAdjacent,["connector",2,"112020"]);
	this.useImage(obtuseAdjacent,["connector",2,"221010"]);

	var reversedObtuseAdjacent = this.obtuseAdjacentImage(true);
	this.useImage(reversedObtuseAdjacent,["connector",2,"102021"]);
	this.useImage(reversedObtuseAdjacent,["connector",2,"201012"]);

	var tripleMirror = this.tripleMirrorImage();
	this.useImage(tripleMirror,["connector",3,"112233"]);
	this.useImage(tripleMirror,["connector",3,"113322"]);

	// prism
	var reversedPrism = this.reverse_image(this.image.special.prism.regular[this.imagePixels])
	this.useImage(reversedPrism,["special","prism","regular-reversed" ]);
}

// unused, delete~~~
Hexagon.prototype.irregularThreewayImage = function () {
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	// reverse the drawing context
	context.scale(-1,1);

	// draw a threeway with the origin being the top right corner
	//context.drawImage(this.image.misc.connector.threeway, 0, canvas.height);
	context.drawImage(this.image.misc.connector.threeway[this.imagePixels], 0 - canvas.width, 0);

	return convert_canvas_to_image(canvas);
}

Hexagon.prototype.doubleAdjacentImage = function () {
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	// draw the three arms
	// move and rotate the context between each draw
	var armImage = this.image.misc.connector.arm[this.imagePixels];
	context.save();
	context.drawImage(armImage, 0, 0);
	context.translate(9*this.imagePixels/4,Q3*this.imagePixels/4);
	context.rotate(120*RAD);
	context.drawImage(armImage, 0, 0);
	context.translate(9*this.imagePixels/4,Q3*this.imagePixels/4);
	context.rotate(120*RAD);
	context.drawImage(armImage, 0, 0);
	context.restore();

	// draw the block
	context.fillStyle = BLOCK_COLOUR;
	context.beginPath();
	// start at the centre
	context.moveTo(this.imagePixels,Q3*this.imagePixels/2);
	// move to the top left, top right, far right
	context.lineTo(this.imagePixels/2,0);
	context.lineTo(3*this.imagePixels/2,0);
	context.lineTo(2*this.imagePixels,Q3*this.imagePixels/2);

	// restrict the fill to the outlined area
	context.clip();
	context.fillRect(0,0,canvas.width,canvas.height);

	return convert_canvas_to_image(canvas);
}

Hexagon.prototype.obtuseAdjacentImage = function (reversed) {
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");
	context.fillStyle = BLOCK_COLOUR;

	// draw the obtuse mirror
	context.drawImage(this.image.misc.connector.obtuse[this.imagePixels], 0, 0);

	// draw the arm to form the acute mirror
	// different angle depending on whether this is the reversed one or not
	if (reversed) {
		context.translate(0 - this.imagePixels/4,3*Q3*this.imagePixels/4);
		context.rotate(300*RAD);
	} else {
		context.translate(3*this.imagePixels/4,5*Q3*this.imagePixels/4);
		context.rotate(240*RAD);
	}

	context.drawImage(this.image.misc.connector.arm[this.imagePixels], 0, 0);

	// draw the block
	context.beginPath();
	// start at the centre
	context.moveTo(this.imagePixels,Q3*this.imagePixels/2);

	// outline the gap between the two mirrors
	if (reversed) {
		context.lineTo(2*this.imagePixels,Q3*this.imagePixels/2);
		context.lineTo(3*this.imagePixels/2,Q3*this.imagePixels);
	} else {
		context.lineTo(3*this.imagePixels/2,0);
		context.lineTo(2*this.imagePixels,Q3*this.imagePixels/2);
	}

	// restrict the fill to the outlined area
	context.clip();
	context.fillRect(0,0,canvas.width,canvas.height);

	return convert_canvas_to_image(canvas);
}

Hexagon.prototype.tripleMirrorImage = function () {
	var canvas = this.imageCanvas();
	var context = canvas.getContext("2d");

	// draw the three arms
	// move and rotate the context between each draw
	var armImage = this.image.misc.connector.arm[this.imagePixels];
	context.drawImage(armImage, 0, 0);
	context.translate(9*this.imagePixels/4,Q3*this.imagePixels/4);
	context.rotate(120*RAD);
	context.drawImage(armImage, 0, 0);
	context.translate(9*this.imagePixels/4,Q3*this.imagePixels/4);
	context.rotate(120*RAD);
	context.drawImage(armImage, 0, 0);

	return convert_canvas_to_image(canvas);
}

// create a canvas to draw a tile image on, same size as the hexagon base images
Hexagon.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = 2*this.imagePixels;
	canvas.height = 2*this.imagePixels;
	return canvas;
}

Hexagon.prototype.newHexagon = function (grid) {
	return new HexagonTile(this,grid);
}

function HexagonTile (hexagon,grid) {
	this.ideal = hexagon;
	this.grid = grid;
	this.initialise();
	// console.log("new hexagon",hexagon);
}

HexagonTile.prototype = new ConRegonTile();

HexagonTile.prototype.definePoints = function () {
	var size = this.size;

	this.origin = {"flat": {}, "standing": {}};
	this.origin.flat.x     = 0 - size;
	this.origin.flat.y     = 0 - Q3*size/2;
	this.origin.standing.x = 0 + Q3*size/2;
	this.origin.standing.y = 0 - size;

	this.drawPoint[0].x = 0;
	this.drawPoint[0].y = 0;
	this.drawPoint[1].x = 0 + 5*size/4;
	this.drawPoint[1].y = 0 - Q3*size/4;
	this.drawPoint[2].x = 0 + 9*size/4;
	this.drawPoint[2].y = 0 + Q3*size/4;
	this.drawPoint[3].x = 0 + 2*size;
	this.drawPoint[3].y = 0 + Q3*size;
	this.drawPoint[4].x = 0 + 3*size/4;
	this.drawPoint[4].y = 0 + 5*Q3*size/4;
	this.drawPoint[5].x = 0 - size/4;
	this.drawPoint[5].y = 0 + 3*Q3*size/4;

	this.point.centre.x = size;
	this.point.centre.y = Q3*size/2;
	this.point[0].x = size/2;
	this.point[0].y = 0;
	this.point[1].x = 3*size/2;
	this.point[1].y = 0;
	this.point[2].x = 2*size;
	this.point[2].y = Q3*size/2;
	this.point[3].x = 3*size/2;
	this.point[3].y = Q3*size;
	this.point[4].x = size/2;
	this.point[4].y = Q3*size;
	this.point[5].x = 0;
	this.point[5].y = Q3*size/2;
}

HexagonTile.prototype.possibleForms = function (form,linkCount) {
	switch (form) {
		case "001001" : return ["021021","201201"];                            // straight
		case "012012" : return ["312312"];                                     // straight
		case "021021" : return ["321321"];                                     // straight
		case "001010" : return ["021012","221010","201012"];                   // obtuse -> double obtuse, obtuse-adjacent x 2
		case "000011" : return ["002211","022011","220011","020211","202011"]; // adjacent -> double adjacent x 3, obtuse-adjacent x 2
		case "001122" : return ["331122"];                                     // double adjacent -> triple
		case "002211" : return ["332211"];                                     // double adjacent -> triple
		default : return [];
	}
}

HexagonTile.prototype.prism_type_forms = function (prismType) {
	if (prismType == "regular") return ["00WBGR","00RGBW"];
	return undefined;
}

HexagonTile.prototype.prism_type = function (form) {
	switch (form) {
		case "00WBGR" : return ["regular",""];
		case "00RGBW" : return ["regular","reversed"];
	}
}

HexagonTile.prototype.addAdditionalLinks = function (tile) {
	game_log("hexagon",1,"connector hexagon @",tile.x,tile.y,"form",tile.form);

	switch (tile.form) {
		case "001001" :
		case "012012" :
		case "021021" :
			// straight - incomplete
			// add a link straight through in every direction
			for (var direction in tile.faces) {
				// check no links already on this face
				if (tile.faces[direction].length > 0) continue;

				var linkId = tile.add_link();
				tile.add_to_link(linkId,direction);
				tile.add_to_link(linkId,this.direction(tile.orientation,direction,3));
			}
			break;
		case "001010" :
			// obtuse mirror
			// add a link with a single arm inbetween the arms of the existing link
			this.addFormLink(tile,tile.rotation,3);
			// console.log("finalised obtuse mirror",tile);
			break;
		case "012021" :
			// double obtuse mirror
			// same as above, but twice~~~
			this.addFormLink(tile,tile.rotation,0);
			this.addFormLink(tile,tile.rotation,3);
			break;
		case "112020" :
		case "221010" :
		case "102021" :
		case "201012" :
			// adjacent obtuse double
			// add a single link arm to the obtuse side, as above~~~
			this.addFormLink(tile,tile.rotation,3);
			break;
		case "001011" :
		case "011010" :
			// threeway needs a single link arm too~~~
			this.addFormLink(tile,tile.rotation,3);
			break;
	}
	this.grid.connectorFinished();
}

HexagonTile.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = 2*this.size;
	canvas.height = 2*this.size;
	return canvas;
}
