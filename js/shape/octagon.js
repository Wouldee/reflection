
function Octagon (loadedAction,progressAction) {
	this.loadedAction = loadedAction;
	this.progressAction = progressAction;
	this.name = "octagon"
	this.sides = 8;
	this.initialForm = "00000000";
	this.angle = 45;
	this.imageFolder = "octagon";

	this.orientations = ["straight"];

	this.degrees =  {
		"straight": 0
	};

	this.faces = {
		"straight": ["n","ne","e","se","s","sw","w","nw"]
	};

	this.points = {
		"straight":  ["nee","see","sse","ssw","sww","nww","nnw","nne"],
	};

	this.initialise();
}

Octagon.prototype = new ConRegon();

Octagon.prototype.defineForms = function () {
	var octagon = this;
	octagon.form = {0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}};
	octagon.form[1]["00000110"] = "11114"; // versatile mirror
	octagon.form[1]["00000101"] = "111113"; // right mirror
	octagon.form[1]["00001001"] = "11114"; // versatile mirror
	octagon.form[1]["00011001"] = ""; // irregular threeway point
	octagon.form[1]["00100110"] = ""; // irregular threeway point
	octagon.form[1]["00010101"] = ""; // regular threeway point
	octagon.form[1]["11111111"] = ""; // eightway

	var ignore = {};
	ignore[6] = true; // versatile mirror
	ignore[5] = true; // right mirror
	ignore[9] = true; // versatile mirror
	ignore[17] = true; // straight
	ignore[25] = true; // irregular threeway point
	ignore[38] = true; // irregular threeway point
	ignore[21] = true; // regular threeway point
	ignore[255] = true; // eightway
	octagon.defineSingleForms(ignore);

	// multi-link tiles
	octagon.form[2]["00001221"] = "11114"; // versatile mirror
	octagon.form[2]["00002112"] = "11114"; // versatile mirror
	octagon.form[2]["00211221"] = ""; // irregular threeway point
	octagon.form[2]["00122112"] = ""; // irregular threeway point (reversed)

	// each remaining multi link tile is composed of partitions
	// for an octagonal tile there are three types of partition:
	//   acute: covers 2 faces, single link, walls at 90 degrees
	//   right: covers three faces (middle is unused), single link, walls at 135 degrees
	//   versatile: covers 4 faces, two links, walls at 180 degrees
	octagon.definePartitionedForms();
}

Octagon.prototype.defineStraightForms = function () {
	var octagon = this;
	octagon.straightForms["00010001"] = 1;
	octagon.straightForms["00120012"] = 2;
	octagon.straightForms["00210021"] = 2;
	octagon.straightForms["01020102"] = 2;
	permutations([1,2,3]).forEach(function (permutation) {
		var form = "0" + permutation.join("") + "0" + permutation.join("");
		octagon.straightForms[form] = 3;
		var form = permutation.join("") + "4" + permutation.join("") + "4";
		octagon.straightForms[form] = 4;
	});

	for (var form in octagon.straightForms) {
		var linkCount = octagon.straightForms[form];
		octagon.form[linkCount][form] = "";
	}
}

// define the connector forms that can be turned into a prism
Octagon.prototype.definePrismForms = function () {
	var octagon = this;
	octagon.prismForms["00010111"] = ["000W1BGR"];
	octagon.prismForms["00011101"] = ["000RGB1W"];
}

Octagon.prototype.loadMiscImages = function (directory) {
	directory += "/" + "connector"
	this.image.misc.connector = {};
	this.loadImage(directory,"double-versatile-mirror-arm.png",["misc","connector","fullArm"]);
	this.loadImage(directory,"double-versatile-mirror.png",    ["misc","connector","full"]);
	this.loadImage(directory,"eightway.png",                   ["misc","connector","reflector"]);

	// filter images
	this.loadImage(directory,"filter-red.png"  ,["special","filter","red"  ]);
	this.loadImage(directory,"filter-green.png",["special","filter","green"]);
	this.loadImage(directory,"filter-blue.png" ,["special","filter","blue" ]);

	// prism
	this.loadImage(directory,"prism.png" ,["special","prism","regular" ]);
}

Octagon.prototype.loadConnectorImages = function (directory) {
	this.image.connector = {1: {}, 2: {}, 3: {}, 4: {}};
	this.loadImage(directory,"versatile-mirror.png",   ["connector",1,"00000110"]);
	this.loadImage(directory,"right-mirror.png",       ["connector",1,"00000101"]);
	this.loadImage(directory,"irregular-threeway.png", ["connector",1,"00011001"]);
	this.loadImage(directory,"regular-threeway.png",   ["connector",1,"00010101"]);
	this.loadImage(directory,"eightway.png",           ["connector",1,"11111111"]);
	this.loadImage(directory,"double-right-mirror.png",["connector",2,"02020101"]);

	var versatileMirror = this.image.connector[1]["00000110"];
	this.image.connector[1]["00001001"] = versatileMirror;
	this.image.connector[2]["00001221"] = versatileMirror;
	this.image.connector[2]["00002112"] = versatileMirror;

	var irregularThreeway = this.image.connector[1]["00011001"];
	this.image.connector[1]["00100110"] = irregularThreeway;
	this.image.connector[2]["00122112"] = irregularThreeway;
	this.image.connector[2]["00211221"] = irregularThreeway;

	//this.image.connector[2]["44"]       = this.loadImage(directory,"double-versatile-mirror.png");
	//this.image.connector[3]["44"]       = this.loadImage(directory,"double-versatile-mirror.png");
	//this.image.connector[4]["44"]       = this.loadImage(directory,"double-versatile-mirror.png");
}

Octagon.prototype.baseImagesLoaded = function () {
	for (var form in this.straightForms) {
		var linkCount = this.straightForms[form];
		this.image.connector[linkCount][form] = null;
	}

	// prism
	var reversedPrism = this.reverse_image(this.image.special.prism.regular[this.imagePixels])
	this.useImage(reversedPrism,["special","prism","regular-reversed" ]);
}

Octagon.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = (Q2 + 1)*this.imagePixels;
	canvas.height = (Q2 + 1)*this.imagePixels;
	return canvas;
}

Octagon.prototype.newOctagon = function (grid) {
	return new OctagonTile(this,grid);
}

function OctagonTile (octagon,grid) {
	this.ideal = octagon;
	this.grid = grid;
	this.initialise();
	// console.log("new octagon",octagon);
}

OctagonTile.prototype = new ConRegonTile();

OctagonTile.prototype.definePoints = function () {
	var size = this.size;

	this.origin.straight.x = 0 - (Q2 + 1)*size/2;
	this.origin.straight.y = 0 - (Q2 + 1)*size/2;

	this.drawPoint[0].x = 0;
	this.drawPoint[0].y = 0;
	this.drawPoint[1].x = 0 + (Q2 + 1)*size/2;
	this.drawPoint[1].y = 0 - size/2;
	this.drawPoint[2].x = 0 + (Q2 + 1)*size;
	this.drawPoint[2].y = 0;
	this.drawPoint[3].x = 0 + (2*Q2 + 3)*size/2;
	this.drawPoint[3].y = 0 + (Q2 + 1)*size/2;
	this.drawPoint[4].x = 0 + (Q2 + 1)*size;
	this.drawPoint[4].y = 0 + (Q2 + 1)*size;
	this.drawPoint[5].x = 0 + (Q2 + 1)*size/2;
	this.drawPoint[5].y = 0 + (2*Q2 + 3)*size/2;
	this.drawPoint[6].x = 0;
	this.drawPoint[6].y = 0 + (Q2 + 1)*size;
	this.drawPoint[7].x = 0 - size/2;
	this.drawPoint[7].y = 0 + (Q2 + 1)*size/2;

	this.point.centre.x = 0 + (Q2 + 1)*size/2;
	this.point.centre.y = 0 + (Q2 + 1)*size/2;
	this.point[0].x = 0 + size/Q2;
	this.point[0].y = 0;
	this.point[1].x = 0 + (Q2 + 1)*size/Q2;
	this.point[1].y = 0;
	this.point[2].x = 0 + (Q2 + 1)*size;
	this.point[2].y = 0 + size/Q2;
	this.point[3].x = 0 + (Q2 + 1)*size;
	this.point[3].y = 0 + (Q2 + 1)*size/Q2;
	this.point[4].x = 0 + (Q2 + 1)*size/Q2;
	this.point[4].y = 0 + (Q2 + 1)*size;
	this.point[5].x = 0 + size/Q2;
	this.point[5].y = 0 + (Q2 + 1)*size;
	this.point[6].x = 0;
	this.point[6].y = 0 + (Q2 + 1)*size/Q2;
	this.point[7].x = 0;
	this.point[7].y = 0 + size/Q2;
}

OctagonTile.prototype.prism_type_forms = function (prismType) {
	if (prismType == "regular") return ["000W1BGR","000RGB1W"];
	return undefined;
}

OctagonTile.prototype.prism_type = function (form) {
	switch (form) {
		case "000W1BGR" : return ["regular",""];
		case "000RGB1W" : return ["regular","reversed"];
	}
}

// add any additional links
OctagonTile.prototype.addAdditionalLinks = function (tile) {
	var breakdown = this.ideal.form[tile.linkCount][tile.form];
	var rotation = tile.rotation;

	if (breakdown != "") {
		// if the form has a breakdown, add links according to each partition
		var formIndex = 0;
		for (let partition of breakdown) {
			switch (partition) {
				case "1":
				case "2":
					// nothing
					break;
				case "3":
					this.addFormLink(tile,rotation,formIndex + 1);
					break;
				case "4":
					if (!this.formLinkExists(tile,rotation,formIndex)) 
						this.addFormLink(tile,rotation,formIndex, formIndex + 3);
					if (!this.formLinkExists(tile,rotation,formIndex + 1)) 
						this.addFormLink(tile,rotation,formIndex + 1, formIndex + 2);
					break;
			}
			formIndex += parseInt(partition);
		}
	} else if (this.ideal.straightForms[tile.form] != undefined) {
		//console.log("straight",tile.form);
		// if the form is a straight form, add additional straight links
		for (var formIndex = 0; formIndex < 4; formIndex++) {
			if (!this.formLinkExists(tile,rotation,formIndex)) 
				this.addFormLink(tile,rotation,formIndex, formIndex + 4);
		}
	} else {
		// otherwise special case per form

		//game_log("octagon",1,"connector octagon @",tile.x,tile.y,"form",tile.form);
		switch (tile.form) {
			case "00011001": 
				// irregular threeway point
				this.addFormLink(tile,rotation,2,5,6);
				break;
			case "00100110":
				// irregular threeway point (reversed)
				this.addFormLink(tile,rotation,3,4,7);
				break;
			case "00010101":
				// regular threeway point
				this.addFormLink(tile,rotation,4);
				this.addFormLink(tile,rotation,6);
				break;
		}
	}
}

OctagonTile.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = (Q2 + 1)*this.size;
	canvas.height = (Q2 + 1)*this.size;
	return canvas;
}
