// Equalateral triangle
// Side length = S
// Height = Q3*S/2
// Area = (Q3*S**2)/4
// Centre is Q3*S/6 from each edge
// Centre is Q3*S/3 from each point

function Triangle (loadedAction,progressAction) {
	this.loadedAction = loadedAction;
	this.progressAction = progressAction;
	this.name = "triangle"
	this.sides = 3;
	this.initialForm = "000";
	this.angle = 120;
	this.orientations = ["up","right","down","left"];
	this.imageFolder = "triangle";

	this.degrees =  {
		"up":    180,
		"right": 270,
		"down":  0,
		"left":  90
	};

	this.faces = {
		"up":    ["s","nww","nee"],
		"right": ["w","nne","sse"],
		"down":  ["n","see","sww"],
		"left":  ["e","ssw","nnw"]
	};

	this.points = {
		"up":    ["n","see","sww"],
		"right": ["e","ssw","nnw"],
		"down":  ["s","nww","nee"],
		"left":  ["w","nne","ssw"]
	};

	this.initialise();
}

Triangle.prototype = new ConRegon();

Triangle.prototype.defineForms = function () {
	this.form = {0: {}, 1: {}, 2: {}};
	this.form[1]["011"] = "";
	this.form[1]["111"] = "";

}

Triangle.prototype.defineStraightForms = function () {}

Triangle.prototype.loadMiscImages = function (directory) {}

Triangle.prototype.loadConnectorImages = function (directory) {
	this.image.connector = {1: {}};
	this.loadImage(directory,"mirror.png",  ["connector",1,"011"]);
	this.loadImage(directory,"threeway.png",["connector",1,"111"]);
}

Triangle.prototype.newTriangle = function (grid) {
	return new TriangleTile(this,grid);
}

function TriangleTile (triangle,grid) {
	this.ideal = triangle;
	this.grid = grid;
	this.initialise();
}

TriangleTile.prototype = new ConRegonTile();

TriangleTile.prototype.definePoints = function () {
	var size = this.size;

	this.origin.down.x  = 0 - size/2;
	this.origin.down.y  = 0 - size/(2*Q3);
	this.origin.up.x    = 0 + size/2;
	this.origin.up.y    = 0 + size/(2*Q3);
	this.origin.left.x  = 0 + size/(2*Q3);
	this.origin.left.y  = 0 - size/2;
	this.origin.right.x = 0 - size/(2*Q3);
	this.origin.right.y = 0 + size/2;

	this.drawPoint[0].x = 0;
	this.drawPoint[0].y = 0;
	this.drawPoint[1].x = 0 + size;
	this.drawPoint[1].y = 0;
	this.drawPoint[2].x = 0 + size/2;
	this.drawPoint[2].y = 0 + Q3*size/2;

	this.point[0].x = 0;
	this.point[0].y = 0;
	this.point[1].x = 0 + size;
	this.point[1].y = 0;
	this.point[2].x = 0 + size/2;
	this.point[2].y = 0 + Q3*size/2;
}


// create a blank tile
// default function creates a straight
TriangleTile.prototype.blank_tile = function (tile) {
	tile.image = this.images.source.frame.back;
	tile.connector();
}

// can't have more than one link
TriangleTile.prototype.possibleForms = function (form,linkCount) { return []; }
