
function Dodecagon (loadedAction,progressAction) {
	this.loadedAction = loadedAction;
	this.progressAction = progressAction;
	this.name = "dodecagon"
	this.sides = 12;
	this.initialForm = "000000000000";
	this.angle = 30;
	this.imageFolder = "dodecagon";

	this.orientations = ["straight"];

	this.degrees =  {
		"straight": 0
	};

	this.faces = {
		"straight": ["n","nne","nee","e","see","sse","s","ssw","sww","w","nww","nnw"]
	};

	this.points = {
		"straight":  ["ne","nee","see","se","sse","ssw","sw","sww","nww","nw","nnw","nne"],
	};

	this.initialise();
}

Dodecagon.prototype = new ConRegon();

Dodecagon.prototype.defineForms = function () {
	var dodecagon = this;
	dodecagon.form = {0: {}, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}};
	dodecagon.form[1]["000000001100"] = "1111116" ; // full mirror
	dodecagon.form[1]["000000001010"] = "11111115"; // split mirror
	dodecagon.form[1]["000000010010"] = "1111116" ; // full mirror
	dodecagon.form[1]["000000010001"] = "11111115"; // split mirror
	dodecagon.form[1]["000000100001"] = "1111116" ; // full mirror
	dodecagon.form[1]["000100001100"] = ""        ; // full threeway point
	dodecagon.form[1]["000010010010"] = ""        ; // full threeway point
	dodecagon.form[1]["000001100001"] = ""        ; // full threeway point
	dodecagon.form[1]["000010001010"] = ""        ; // split threeway point
	dodecagon.form[1]["000001010001"] = ""        ; // split threeway point
	dodecagon.form[1]["111111111111"] = ""        ; // twelveway (!)

	var ignore = {};
	ignore[12] = true  ; // full mirror
	ignore[10] = true  ; // split mirror
	ignore[18] = true  ; // full mirror
	ignore[17] = true  ; // split mirror
	ignore[33] = true  ; // full mirror
	ignore[65] = true  ; // straight
	ignore[268] = true ; // full threeway point
	ignore[148] = true ; // full threeway point
	ignore[97] = true  ; // full threeway point
	ignore[138] = true ; // split threeway point
	ignore[81] = true  ; // split threeway point
	ignore[4095] = true; // eightway
	dodecagon.defineSingleForms(ignore);

	// multi-link tiles
	dodecagon.form[2]["000000021120"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000201102"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000210012"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000012210"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000102201"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000120021"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000321123"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000231132"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000213312"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000312213"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000132231"] = "1111116" ; // full mirror
	dodecagon.form[3]["000000123321"] = "1111116" ; // full mirror
	dodecagon.form[2]["000000021012"] = "11111115"; // split mirror
	dodecagon.form[2]["000000012021"] = "11111115"; // split mirror
	dodecagon.form[2]["000120021120"] = ""        ; // full threeway point
	dodecagon.form[2]["000102201102"] = ""        ; // full threeway point
	dodecagon.form[2]["000210012210"] = ""        ; // full threeway point
	dodecagon.form[2]["000012210012"] = ""        ; // full threeway point
	dodecagon.form[2]["000021120021"] = ""        ; // full threeway point
	dodecagon.form[2]["000201102201"] = ""        ; // full threeway point
	dodecagon.form[3]["000123321123"] = ""        ; // full threeway point
	dodecagon.form[3]["000132231132"] = ""        ; // full threeway point
	dodecagon.form[3]["000213312213"] = ""        ; // full threeway point
	dodecagon.form[3]["000312213312"] = ""        ; // full threeway point
	dodecagon.form[3]["000321123321"] = ""        ; // full threeway point
	dodecagon.form[3]["000231132231"] = ""        ; // full threeway point
	dodecagon.form[2]["000012021012"] = ""        ; // split threeway point
	dodecagon.form[2]["000021012021"] = ""        ; // split threeway point

	// each remaining multi link tile is composed of partitions
	// for an octagonal tile there are three types of partition:
	//   acute: covers 2 faces, single link, walls at 90 degrees
	//   right: covers three faces (middle is unused), single link, walls at 135 degrees
	//   versatile: covers 4 faces, two links, walls at 180 degrees
	dodecagon.definePartitionedForms();
}

Dodecagon.prototype.defineStraightForms = function () {
	var dodecagon = this;
	dodecagon.straightForms["000001000001"] = 1;
	dodecagon.straightForms["000012000012"] = 2;
	dodecagon.straightForms["000021000021"] = 2;
	dodecagon.straightForms["000102000102"] = 2;
	dodecagon.straightForms["000201000201"] = 2;
	dodecagon.straightForms["001002001002"] = 2;
	dodecagon.straightForms["000123000123"] = 3;
	dodecagon.straightForms["000132000132"] = 3;
	dodecagon.straightForms["000213000213"] = 3;
	dodecagon.straightForms["000231000231"] = 3;
	dodecagon.straightForms["000312000312"] = 3;
	dodecagon.straightForms["000321000321"] = 3;
	dodecagon.straightForms["001023001023"] = 3;
	dodecagon.straightForms["001032001032"] = 3;
	dodecagon.straightForms["002013002013"] = 3;
	dodecagon.straightForms["002031002031"] = 3;
	dodecagon.straightForms["003012003012"] = 3;
	dodecagon.straightForms["003021003021"] = 3;
	dodecagon.straightForms["001203001203"] = 3;
	dodecagon.straightForms["001302001302"] = 3;
	dodecagon.straightForms["002103002103"] = 3;
	dodecagon.straightForms["002301002301"] = 3;
	dodecagon.straightForms["003102003102"] = 3;
	dodecagon.straightForms["003201003201"] = 3;
	dodecagon.straightForms["010203010203"] = 3;
	dodecagon.straightForms["010302010302"] = 3;
	dodecagon.straightForms["020103020103"] = 3;
	dodecagon.straightForms["020301020301"] = 3;
	dodecagon.straightForms["030102030102"] = 3;
	dodecagon.straightForms["030201030201"] = 3;
	//this is getting wordy...

	permutations([1,2,3,4]).forEach(function (permutation) {
		var form = "00" + permutation.join("");
		dodecagon.straightForms[form+form] = 4;
		var form = "0" + permutation[0] + "0" + permutation.slice(1);
		dodecagon.straightForms[form+form] = 4;
		var form = "0" + permutation.slice(0,2).join("") + "0" + permutation.slice(2).join("");
		dodecagon.straightForms[form+form] = 4;
	});

	permutations([1,2,3,4,5]).forEach(function (permutation) {
		var form = "0" + permutation.join("");
		dodecagon.straightForms[form+form] = 5;
		var form = permutation.join("") + "6";
		dodecagon.straightForms[form+form] = 6;
	});

	for (var form in dodecagon.straightForms) {
		var linkCount = dodecagon.straightForms[form];
		dodecagon.form[linkCount][form] = "";
	}
}

// define the connector forms that can be turned into a prism
Dodecagon.prototype.definePrismForms = function () {
	var dodecagon = this;
	dodecagon.prismForms["000001000111"] = ["00000W111BGR"];
	dodecagon.prismForms["000001110001"] = ["00000RGB111W"];
	dodecagon.prismForms["000001011111"] = ["00000W1BTGYR"];
	dodecagon.prismForms["000001111101"] = ["00000RYGTB1W"];
}

Dodecagon.prototype.loadMiscImages = function (directory) {
	directory += "/" + "connector"
	this.image.misc.connector = {};
	this.loadImage(directory,"double-full-mirror-arm.png",["misc","connector","fullArm"]);
	this.loadImage(directory,"double-full-mirror.png",    ["misc","connector","full"]);
	this.loadImage(directory,"twelveway.png",             ["misc","connector","reflector"]);

	// filter images
	this.loadImage(directory,"filter-red.png"  ,["special","filter","red"  ]);
	this.loadImage(directory,"filter-green.png",["special","filter","green"]);
	this.loadImage(directory,"filter-blue.png" ,["special","filter","blue" ]);

	// prisms
	this.loadImage(directory,"prism.png"          ,["special","prism","regular" ]);
	this.loadImage(directory,"prism-extended.png" ,["special","prism","extended" ]);
}

Dodecagon.prototype.loadConnectorImages = function (directory) {
	this.image.connector = {1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}};

	this.loadImage(directory,"split-mirror.png",["connector",1,"000000001100"]);
	var fullMirror = this.image.connector[1]["000000001100"];
	this.image.connector[1]["000000010010"] = fullMirror;
	this.image.connector[1]["000000100001"] = fullMirror;
	this.image.connector[2]["000000021120"] = fullMirror;
	this.image.connector[2]["000000201102"] = fullMirror;
	this.image.connector[2]["000000210012"] = fullMirror;
	this.image.connector[2]["000000012210"] = fullMirror;
	this.image.connector[2]["000000102201"] = fullMirror;
	this.image.connector[2]["000000120021"] = fullMirror;
	this.image.connector[3]["000000321123"] = fullMirror;
	this.image.connector[3]["000000231132"] = fullMirror;
	this.image.connector[3]["000000213312"] = fullMirror;
	this.image.connector[3]["000000312213"] = fullMirror;
	this.image.connector[3]["000000132231"] = fullMirror;
	this.image.connector[3]["000000123321"] = fullMirror;

	this.loadImage(directory,"full-mirror.png",["connector",1,"000000001010"]);
	var splitMirror = this.image.connector[1]["000000001010"];
	this.image.connector[1]["000000010001"] = splitMirror;
	this.image.connector[2]["000000021012"] = splitMirror;
	this.image.connector[2]["000000012021"] = splitMirror;

	this.loadImage(directory,"full-threeway-point.png",["connector",1,"000100001100"]);
	var fullThreeway = this.image.connector[1]["000100001100"];
	this.image.connector[1]["000010010010"] = fullThreeway;
	this.image.connector[1]["000001100001"] = fullThreeway;
	this.image.connector[2]["000120021120"] = fullThreeway;
	this.image.connector[2]["000102201102"] = fullThreeway;
	this.image.connector[2]["000210012210"] = fullThreeway;
	this.image.connector[2]["000012210012"] = fullThreeway;
	this.image.connector[2]["000021120021"] = fullThreeway;
	this.image.connector[2]["000201102201"] = fullThreeway;
	this.image.connector[3]["000123321123"] = fullThreeway;
	this.image.connector[3]["000132231132"] = fullThreeway;
	this.image.connector[3]["000213312213"] = fullThreeway;
	this.image.connector[3]["000312213312"] = fullThreeway;
	this.image.connector[3]["000321123321"] = fullThreeway;
	this.image.connector[3]["000231132231"] = fullThreeway;

	this.loadImage(directory,"split-threeway-point.png",["connector",1,"000010001010"]);
	var splitThreeway = this.image.connector[1]["000010001010"];
	this.image.connector[1]["000001010001"] = splitThreeway;
	this.image.connector[2]["000012021012"] = splitThreeway;
	this.image.connector[2]["000021012021"] = splitThreeway;

	this.loadImage(directory,"twelveway.png",["connector",1,"111111111111"]);

	this.loadImage(directory,"double-split-mirror.png",["connector",2,"010001020002"]);
	var doubleSplitMirror = this.image.connector[2]["010001020002"];
	this.image.connector[3]["012021030003"] = doubleSplitMirror;
	this.image.connector[3]["013031020002"] = doubleSplitMirror;
	this.image.connector[3]["021012030003"] = doubleSplitMirror;
	this.image.connector[3]["023032010001"] = doubleSplitMirror;
	this.image.connector[3]["031013020002"] = doubleSplitMirror;
	this.image.connector[3]["032023010001"] = doubleSplitMirror;
	this.image.connector[4]["012021034043"] = doubleSplitMirror;
	this.image.connector[4]["012021043034"] = doubleSplitMirror;
	this.image.connector[4]["013031024042"] = doubleSplitMirror;
	this.image.connector[4]["013031042024"] = doubleSplitMirror;
	this.image.connector[4]["014041023032"] = doubleSplitMirror;
	this.image.connector[4]["014041032023"] = doubleSplitMirror;
	this.image.connector[4]["021012034043"] = doubleSplitMirror;
	this.image.connector[4]["021012043034"] = doubleSplitMirror;
	this.image.connector[4]["021012043034"] = doubleSplitMirror;
	this.image.connector[4]["031013024042"] = doubleSplitMirror;
	this.image.connector[4]["031013042024"] = doubleSplitMirror;
	this.image.connector[4]["041014023032"] = doubleSplitMirror;
	this.image.connector[4]["041014032023"] = doubleSplitMirror;

	for (var form in this.straightForms) {
		var linkCount = this.straightForms[form];
		this.image.connector[linkCount][form] = null;
	}
}

Dodecagon.prototype.baseImagesLoaded = function () {
	// prisms
	var reversedRegular = this.reverse_image(this.image.special.prism.regular[this.imagePixels])
	this.useImage(reversedRegular,["special","prism","regular-reversed" ]);

	var reversedExended = this.reverse_image(this.image.special.prism.extended[this.imagePixels])
	this.useImage(reversedExended,["special","prism","extended-reversed" ]);
}

Dodecagon.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = (Q3 + 2)*this.imagePixels;
	canvas.height = (Q3 + 2)*this.imagePixels;
	return canvas;
}

Dodecagon.prototype.newDodecagon = function (grid) {
	return new DodecagonTile(this,grid);
}

function DodecagonTile (dodecagon,grid) {
	this.ideal = dodecagon;
	this.grid = grid;
	this.initialise();
	game_log("dodecagon",1,"new dodecagon",dodecagon);
}

DodecagonTile.prototype = new ConRegonTile();

DodecagonTile.prototype.definePoints = function () {
	var size = this.size;

	this.origin.straight.x = 0 - (Q3 + 2)*size/2;
	this.origin.straight.y = 0 - (Q3 + 2)*size/2;

	this.drawPoint[0].x =  0;
	this.drawPoint[0].y =  0;
	this.drawPoint[1].x =  0 + (  Q3 + 3)*size/4;
	this.drawPoint[1].y =  0 - (  Q3 + 1)*size/4;
	this.drawPoint[2].x =  0 + (3*Q3 + 5)*size/4;
	this.drawPoint[2].y =  0 - (  Q3 + 1)*size/4;
	this.drawPoint[3].x =  0 + (  Q3 + 2)*size;
	this.drawPoint[3].y =  0;
	this.drawPoint[4].x =  0 + (5*Q3 + 9)*size/4;
	this.drawPoint[4].y =  0 + (  Q3 + 3)*size/4;
	this.drawPoint[5].x =  0 + (5*Q3 + 9)*size/4;
	this.drawPoint[5].y =  0 + (3*Q3 + 5)*size/4;
	this.drawPoint[6].x =  0 + (  Q3 + 2)*size;
	this.drawPoint[6].y =  0 + (  Q3 + 2)*size;
	this.drawPoint[7].x =  0 + (3*Q3 + 5)*size/4;
	this.drawPoint[7].y =  0 + (5*Q3 + 9)*size/4;
	this.drawPoint[8].x =  0 + (  Q3 + 3)*size/4;
	this.drawPoint[8].y =  0 + (5*Q3 + 9)*size/4;
	this.drawPoint[9].x =  0;
	this.drawPoint[9].y =  0 + (  Q3 + 2)*size;
	this.drawPoint[10].x = 0 - (  Q3 + 1)*size/4;
	this.drawPoint[10].y = 0 + (3*Q3 + 5)*size/4;
	this.drawPoint[11].x = 0 - (  Q3 + 1)*size/4;
	this.drawPoint[11].y = 0 + (  Q3 + 3)*size/4;

	this.point.centre.x = 0 + (Q3 + 2)*size/2;
	this.point.centre.y = 0 + (Q3 + 2)*size/2;
	this.point[0].x =     0 + (Q3 + 1)*size/2;
	this.point[0].y =     0;
	this.point[1].x =     0 + (Q3 + 3)*size/2;
	this.point[1].y =     0;
	this.point[2].x =     0 + (2*Q3 + 3)*size/2;
	this.point[2].y =     0 + size/2;
	this.point[3].x =     0 + (Q3 + 2)*size;
	this.point[3].y =     0 + (Q3 + 1)*size/2;
	this.point[4].x =     0 + (Q3 + 2)*size;
	this.point[4].y =     0 + (Q3 + 3)*size/2;
	this.point[5].x =     0 + (2*Q3 + 3)*size/2;
	this.point[5].y =     0 + (2*Q3 + 3)*size/2;
	this.point[6].x =     0 + (Q3 + 3)*size/2;
	this.point[6].y =     0 + (Q3 + 2)*size;
	this.point[7].x =     0 + (Q3 + 1)*size/2;
	this.point[7].y =     0 + (Q3 + 2)*size;
	this.point[8].x =     0 + size/2;
	this.point[8].y =     0 + (2*Q3 + 3)*size/2;
	this.point[9].x =     0;
	this.point[9].y =     0 + (Q3 + 3)*size/2;
	this.point[10].x =    0;
	this.point[10].y =    0 + (Q3 + 1)*size/2;
	this.point[11].x =    0 + size/2;
	this.point[11].y =    0 + size/2;
}

DodecagonTile.prototype.prism_type_forms = function (prismType) {
	if (prismType == "regular") {
		return ["00000W111BGR","00000RGB111W"];
	} else if (prismType == "extended") {
		return ["00000W1BTGYR","00000RYGTB1W"];
	}

	return undefined;
}

DodecagonTile.prototype.prism_type = function (form) {
	switch (form) {
		case "00000W111BGR" : return ["regular",""];
		case "00000RGB111W" : return ["regular","reversed"];
		case "00000W1BTGYR" : return ["extended",""];
		case "00000RYGTB1W"	: return ["extended","reversed"];
	}
}

// add any additional links
DodecagonTile.prototype.addAdditionalLinks = function (tile) {
	// console.log("add links to dodecagon tile @",tile.x,tile.y);

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
				case "5":
					if (!this.formLinkExists(tile,rotation,formIndex))
						this.addFormLink(tile,rotation,formIndex, formIndex + 4);
					if (!this.formLinkExists(tile,rotation,formIndex + 1))
						this.addFormLink(tile,rotation,formIndex + 1, formIndex + 3);
					this.addFormLink(tile,rotation,formIndex + 2);
					break;
				case "6":
					if (!this.formLinkExists(tile,rotation,formIndex))
						this.addFormLink(tile,rotation,formIndex, formIndex + 5);
					if (!this.formLinkExists(tile,rotation,formIndex + 1))
						this.addFormLink(tile,rotation,formIndex + 1, formIndex + 4);
					if (!this.formLinkExists(tile,rotation,formIndex + 2))
						this.addFormLink(tile,rotation,formIndex + 2, formIndex + 3);
					break;
			}
			formIndex += parseInt(partition);
		}
	} else if (this.ideal.straightForms[tile.form] != undefined) {
		game_log("dodecagon",2,"straight",tile.form);
		// if the form is a straight form, add additional straight links
		for (var formIndex = 0; formIndex < 6; formIndex++) {
			if (!this.formLinkExists(tile,rotation,formIndex)) 
				this.addFormLink(tile,rotation,formIndex, formIndex + 6);
		}
	} else {
		// otherwise special case per form

		game_log("octagon",2,"connector octagon @",tile.x,tile.y,"form",tile.form);
		switch (tile.form) {
			case "000100001100": 
				// full threeway point
				this.addFormLink(tile,rotation,4,7,10);
				this.addFormLink(tile,rotation,5,6,11);
				break;
			case "000010010010":
				// full threeway point
				this.addFormLink(tile,rotation,3,8,9);
				this.addFormLink(tile,rotation,5,6,11);
				break;
			case "000001100001":
				// full threeway point
				this.addFormLink(tile,rotation,3,8,9);
				this.addFormLink(tile,rotation,4,7,10);
				break;
			case "000010001010":
				// split threeway point
				this.addFormLink(tile,rotation,5,7,11);
				this.addFormLink(tile,rotation,6);
				this.addFormLink(tile,rotation,9);
				break;
			case "000001010001":
				// split threeway point
				this.addFormLink(tile,rotation,4,8,10);
				this.addFormLink(tile,rotation,6);
				this.addFormLink(tile,rotation,9);
				break;
			case "000120021120":
			case "000210012210":
				// full threeway point
				this.addFormLink(tile,rotation,5,7,11);
				break;
			case "000102201102":
			case "000201102201":
				// full threeway point
				this.addFormLink(tile,rotation,4,7,10);
				break;
			case "000012210012":
			case "000021120021":
				// full threeway point
				this.addFormLink(tile,rotation,3,8,9);
				break;
			case "000012021012":
			case "000021012021":
				// split threeway point
				this.addFormLink(tile,rotation,6);
				this.addFormLink(tile,rotation,9);
				break;
		}
	}
}

DodecagonTile.prototype.imageCanvas = function () {
	var canvas = document.createElement("canvas");
	canvas.width = (Q3 + 2)*this.size;
	canvas.height = (Q3 + 2)*this.size;
	return canvas;
}
