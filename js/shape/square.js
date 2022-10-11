// empty squares aren't handled properly~~~
// spotted on level 13, truncated square
// no links - should either be painted grey, or have links all through


function Square (loadedAction,progressAction) {
	this.loadedAction = loadedAction;
	this.progressAction = progressAction;
	this.name = "square"
	this.sides = 4;
	this.initialForm = "0000";
	this.angle = 90;
	this.imageFolder = "square";

	this.orientations = ["straight","right","left"];

	this.degrees =  {
		"straight":    0,
		"right":      30,
		"left":      330,
	};

	this.faces = {
		"straight": ["n","e","s","w"],
		"right":    ["nne","see","ssw","nww"],
		"left":     ["nnw","nee","sse","sww"]
	};

	this.points = {
		"straight": ["ne","se","sw","nw"],
		"right":    ["nee","sse","sww","nnw"],
		"left":     ["nne","see","ssw","nww"]
	};

	this.initialise();
}

Square.prototype = new ConRegon();

Square.prototype.defineForms = function () {
	this.form = {0: {}, 1: {}, 2: {}};
	this.form[1]["0011"] = "";
	this.form[1]["0101"] = "";
	this.form[1]["0111"] = "";
	this.form[1]["1111"] = "";
	this.form[2]["1122"] = "22";
	this.form[2]["1212"] = "";
}

Square.prototype.defineStraightForms = function () {
	this.straightForms["0101"] = 1;
	this.straightForms["1212"] = 2;
}

Square.prototype.loadMiscImages = function (directory) {
	directory += "/" + "connector"
	// filter images
	this.loadImage(directory,"filter-red.png"  ,["special","filter","red"  ]);
	this.loadImage(directory,"filter-green.png",["special","filter","green"]);
	this.loadImage(directory,"filter-blue.png" ,["special","filter","blue" ]);
}

Square.prototype.loadConnectorImages = function (directory) {
	this.image.connector = {1: {}, 2: {}};
	this.loadImage(directory,"mirror.png"       ,["connector",1,"0011"]);
	this.loadImage(directory,"threeway.png"     ,["connector",1,"0111"]);
	this.loadImage(directory,"fourway.png"      ,["connector",1,"1111"]);
	this.loadImage(directory,"double-mirror.png",["connector",2,"1122"]);

	// straightForms
	this.image.connector[1]["0101"] = null;
	this.image.connector[2]["1212"] = null;
}

Square.prototype.newSquare = function (grid) {
	return new SquareTile(this,grid);
}

function SquareTile (square,grid) {
	this.ideal = square;
	this.grid = grid;
	this.initialise();
}

SquareTile.prototype = new ConRegonTile();

SquareTile.prototype.definePoints = function () {
	var size = this.size;

	this.origin.straight.x  = 0 - size/2;
	this.origin.straight.y  = 0 - size/2;
	this.origin.right.x     = 0 - (Q3 - 1)*size/4;
	this.origin.right.y     = 0 - (Q3 + 1)*size/4;
	this.origin.left.x      = 0 - (Q3 + 1)*size/4;
	this.origin.left.y      = 0 - (Q3 - 1)*size/4;

	this.drawPoint[0].x = 0;
	this.drawPoint[0].y = 0;
	this.drawPoint[1].x = 0 + size;
	this.drawPoint[1].y = 0;
	this.drawPoint[2].x = 0 + size;
	this.drawPoint[2].y = 0 + size;
	this.drawPoint[3].x = 0;
	this.drawPoint[3].y = 0 + size;

	this.point[0].x = 0;
	this.point[0].y = 0;
	this.point[1].x = 0 + size;
	this.point[1].y = 0;
	this.point[2].x = 0 + size;
	this.point[2].y = 0 + size;
	this.point[3].x = 0;
	this.point[3].y = 0 + size;
}

SquareTile.prototype.possibleForms = function (form,linkCount) {
	switch (form) {
		case "0101" : return ["2121"];
		case "0011" : return ["2211"];
		default : return [];
	}
}

SquareTile.prototype.finishConnector = function (tile) {
	tile.image = this.images.connector[tile.linkCount][tile.form];

	switch (tile.form) {
		case "0101" :
		case "1212" :
			// add a link straight through in every direction
			for (var direction in tile.faces) {
				// check no links already on this face
				if (tile.faces[direction].length > 0) continue;

				var linkId = tile.add_link();
				tile.add_to_link(linkId,direction);
				tile.add_to_link(linkId,this.direction(tile.orientation,direction,2));
			}
			break;
	}
	this.grid.connectorFinished();
}
