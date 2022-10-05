
function Link (tile,id,colour) {
	this.tile = tile;
	this.id = id;             // identity of the link
	this.colour = colour;     // only paths of this colour (filters and prisms use this)
	this.arms = [];           // array of arms
	this.armCount = 0;        // number of arms
	this.paths = [];
	this.colours = {red: 0, green: 0, blue: 0};
}

Link.prototype.log_string = function () {

	var linkDescription = "";

	for (var key in this) {
		if (typeof this[key] == "function") continue;
		switch (key) {
			case "colours":
				linkDescription += "\t\tcolours:" + this.colours["red"] + this.colours["green"] + this.colours["blue"] + "\n"
				break;
			case "tile":
				linkDescription += "\t\ttile" + this.tile.x + "," + this.tile.y + "\n";
				break;
			default:
				linkDescription += "\t\t" + key + ":\t" + this[key] + "\n";
		}
	}

	return linkDescription;
}

// add an arm in the given direction
Link.prototype.addArm = function (direction) {
	this.arms.push(direction);
	this.armCount++;
	for (var path of this.paths) {
		this.tile.faceColours[direction][path.colour()]++;
	}
}

// remove the arm in the given direction
Link.prototype.removeArm = function (direction) {
	this.arms.splice(this.arms.indexOf(direction),1);
	this.armCount--;

	// update colours on the tile face
	for (var path of this.paths) {
		this.tile.faceColours[direction][path.colour()]--;
	}
}

Link.prototype.add_path = function (path) {

	this.paths.push(path);

	var colour = path.colour();
	this.colours[colour]++;
	for (var direction of this.arms) {
		this.tile.faceColours[direction][colour]++;
	}

	this.tile.add_path(path);
}

// remove the path from this link
Link.prototype.remove_path = function (path) {

	var index = this.paths.indexOf(path);
	if (index < 0) return;
	this.paths.splice(index,1);

	var colour = path.colour();
	this.colours[colour]--;
	for (var direction of this.arms) {
		this.tile.faceColours[direction][colour]--;
	}

	this.tile.remove_path(path);
}

Link.prototype.paths_in = function (direction) {
	if (this.arms.indexOf(direction) < 0) return [];

	var pathsIn = [];
	for (var path of this.paths) {
		if (path.from(this.tile,this,direction)) {
			pathsIn.push(path);
		}
	}

	return pathsIn;
}

Link.prototype.paths_out = function (direction) {
	if (this.arms.indexOf(direction) < 0) return [];

	var pathsOut = [];
	for (var path of this.paths) {
		if (path.to(this.tile,this,direction) || !path.from(this.tile,this,direction)) {
			pathsOut.push(path);
		}
	}

	return pathsOut;
}

// cut all paths to and from this link
// used when rotating a tile
Link.prototype.cutPaths = function (affectedTiles) {
	// copy the link's paths as they will be affected by this operation
	// console.log("cut all paths to/from",this.tile.x,this.tile.y,this.id,this.arms);
	var paths = this.paths.slice();
	for (var path of paths) {
		for (var direction of this.arms) {
			if (path.from(this.tile,this,direction) || this == path.source_link()) {
				path.cut(this.tile,this,direction,affectedTiles);
				if (!path.contains_link(this.tile,this)) break;
			}
		}
	}
}

// not used~~~
Link.prototype.unique_colours = function () {
	var colours = [];
	if (this.colours["red"]   > 0) colours.push("red");
	if (this.colours["green"] > 0) colours.push("green");
	if (this.colours["blue"]  > 0) colours.push("blue");
	return colours;
}
