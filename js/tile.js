
function Tile (grid,x,y) {
	this.grid = grid;
	this.x = x;              // int, identity and location 
	this.y = y;              // int, identity and location
	this.linkCount = 0;      // int, number of links
	this.links = {};         // hash of link objects, indexed by linkId
	this.faces = {};         // hash, indexed by face; each value is array of linkIds
	this.isConnector = true; // boolean, is this a connector
	this.isSource = false;   // boolean, is this a source
	this.isNode = false;     // boolean, is this a node
	this.isPrism = false;
	this.isFilter = false;
	this.pathCount = 0;

	this.colours = {red: 0, green: 0, blue: 0};
	this.faceColours = {};
}

// add a link
Tile.prototype.add_link = function (colour) {
	//assign a link id
	var linkId = 0;
	while (this.links[linkId] != undefined) linkId++;

	// create the link
	var link = new Link (this,linkId,colour);

	// add the link to the array of links and increase the counters
	this.links[linkId] = link;
	this.linkCount++;

	// if we added a link to a source, add a path
	if (this.isSource) new Path(this.grid,this,link);

	return linkId;
}

// remove the link
// does not update paths, calling code should do this first if necessary
Tile.prototype.remove_link = function (linkId) {
	// load the link
	var link = this.links[linkId];

	// decrement the link counters
	this.linkCount--;

	// remove the link id from each face
	for (var direction of link.arms) {
		var faceLinks = this.faces[direction];
		faceLinks.splice(faceLinks.indexOf(linkId),1);
		if (this.isConnector) {
			// update form and rotation
			this.shape.removeArmFromConnector(this,direction,linkId);
		}
	}

	delete this.links[linkId];
}

// add a new arm to the link in the given direction
Tile.prototype.add_to_link = function (linkId,direction) {
	// console.log("add",direction,"to link",linkId,"on tile",this.x,this.y);
	// console.log("tile = ",this);
	linkId = parseInt(linkId);                   // ensure the linkId is an int
	var link = this.links[linkId];               // load the link
	link.addArm(direction);                      // add the arm to the link
	var faceLinks = this.faces[direction];       // array of link ids for the face

	// ~~~
	if (faceLinks == undefined) {
		console.log("faceLinks undefined while adding "+direction+" to tile",this);
	}

	faceLinks.push(linkId);            // add the linkId

	if (this.isConnector) {
		// update form and rotation
		this.shape.addArmToConnector(this,direction,linkId);
	}
}

// remove the arm in the given direction from the link
Tile.prototype.remove_from_link = function (linkId,direction) {
	var link = this.links[linkId];               // load the link
	link.removeArm(direction);                   // remove the arm from the link
	var faceLinks = this.faces[direction];       // array of link ids for the face
	faceLinks.splice(faceLinks.indexOf(link),1); // remove the linkId

	if (this.isConnector) {
		// update form and rotation
		this.shape.removeArmFromConnector(this,direction,linkId);
	}
}

Tile.prototype.add_path = function (path) {
	this.pathCount++;
	this.colours[path.colour()]++;

	if (this.isNode) this.update_lit();
}

Tile.prototype.remove_path = function (path) {
	this.pathCount--;
	this.colours[path.colour()]--;

	if (this.isNode) this.update_lit();
}

// used by generate.js
// return the next candidate face to add a link to
Tile.prototype.candidate_faces = function (growth) {
	if (this.candidateFaces != undefined) return this.candidateFaces;

	this.candidateFaces = [];
	var remainingDirections = this.shape.randomDirections(this.orientation);

	// remove any used faces
	for (var direction in this.faces) {
		if (this.faces[direction].length == 0) continue;
		remainingDirections.splice(remainingDirections.indexOf(direction),1);
	}

	// check if this is an unfinished connector
	if (this.isConnector && this.linkCount == 1) {
		// only one link
		var linkId = 0;
		while (this.links[linkId] == undefined) linkId++;
		var link = this.links[linkId];

		if (link.armCount == 1) {
			var direction = link.arms[0];
			// consider the growth style
			switch (growth) {
				case "random" :
					// this case is handled below
					break;
				case "straight" :
					// add the opposite direction, remove it from the random directions
					var opposite = opposite_direction(direction);

					// opposite face may not be present
					var index = remainingDirections.indexOf(opposite);
					if (index == -1) break;

					remainingDirections.splice(index,1);
					this.candidateFaces.push(opposite);

					break;
				case "prism" :
					// add directions likely to generate prisms
					// add the opposite direction first, then moving either
					//   clockwise or widdershins, add directions until we get to the used direction
					var opposite = opposite_direction(direction);

					// opposite face may not be present
					var index = remainingDirections.indexOf(opposite);
					if (index == -1) break;

					var clockwise = Math.random() > 0.5;
					var next = opposite;
					while (next != direction) {
						remainingDirections.splice(remainingDirections.indexOf(next),1);
						this.candidateFaces.push(next);

						if (clockwise) {
							next = this.shape.nextDirection(this.orientation,next);
						} else {
							next = this.shape.prevDirection(this.orientation,next);
						}
					}

					break;
				case "right" :
					// add directions at 90 degrees to the used direction
					var [widdershins,clockwise] = right_angle_directions(direction);

					var directions = Math.random() > 0.5 ? [clockwise,widdershins] : [widdershins,clockwise];

					// also add opposite direction
					directions.push(opposite_direction(direction));

					for (var candidate of directions) {
						// direction may not be present
						var index = remainingDirections.indexOf(candidate);
						if (index == -1) continue;

						remainingDirections.splice(index,1);
						this.candidateFaces.push(candidate);
					}

					break;
				case "acute" :
					// add the two directions adjacent in a random order
					// remove them from the random directions
					var adjacentNext = this.shape.nextDirection(this.orientation,direction);
					var adjacentPrev = this.shape.prevDirection(this.orientation,direction);
					if (Math.random() < 0.5) {
						this.candidateFaces.push(adjacentNext,adjacentPrev);
					} else {
						this.candidateFaces.push(adjacentPrev,adjacentNext);
					}
					remainingDirections.splice(remainingDirections.indexOf(adjacentNext),1);
					remainingDirections.splice(remainingDirections.indexOf(adjacentPrev),1);

					break;
			}

			// add remaining directions in random order
		}

		// console.log("unfinished connector with initial arm "+direction+" candidates = "+this.candidateFaces);
	}

	// growth style is irrelevant for sources, or connectors that already have a complete link~~~
	// add directions in a random order
	this.candidateFaces.push(...remainingDirections);
	return this.candidateFaces;
}

// return true if this tile is an unfinished connector
// - a connector tile that has only one link, with one arm
Tile.prototype.unfinished_connector = function () {
	if (!this.isConnector) return false;
	if (this.linkCount != 1) return false;

	
}

Tile.prototype.description = function () {
	var description = "";

	if (this.isSource) {
		description += this.colour + " source"
	} else if (this.isNode) {
		description += this.colour + " node"
	} else if (this.isConnector) {
		description += this.form + " connector"
	} else if (this.isFilter) {
		description += this.colour + " filter"
	} else if (this.isPrism) {
		description += this.form + " prism"
	} else {
		description += "**unknown tile"
	}

	description += " @ " + this.x + "," + this.y;

	return description;
}

Tile.prototype.log_string = function () {

	var tileDescription = ""

	for (var key in this) {
		if (typeof this[key] == "function") continue;
		switch (key) {
			case "colours":
				tileDescription += "\tcolours: R" + this.colours["red"] + "G" + this.colours["green"] + "B",this.colours["blue"] + "\n"
				break;
			case "links":
				tileDescription += "\tlinks:" + "\n";
				for (var linkId in this.links) {
					tileDescription += "\t" + linkId + "\n";
					tileDescription += this.links[linkId].toString();
				}
				break;
			case "faces":
				tileDescription += "\tfaces:" + "\n";
				for (var face in this.faces) {
					tileDescription += "\t\t" + face + ": " + this.faces[face] + "\n";
					tileDescription += "\t\tcolours: R" + this.faceColours[face]["red"] + "G" + this.faceColours[face]["green"] + "B" + this.faceColours[face]["blue"] + "\n";
				}
				break;
			case "faceColours":
			case "grid":	break;
			default:
				tileDescription += "\t" + key + ":\t" + this[key] + "\n";
		}
	}

	return tileDescription;
}

// 
Tile.prototype.paths_out = function (direction) {
	var pathsOut = {};                                   // initialise return value
	for (var linkId of this.faces[direction]) {          // every link in this direction
		var link = this.links[linkId];
		var paths = link.paths_out(direction);
		if (paths.length > 0) pathsOut[linkId] = paths;  // add the paths from the link
	}
	return pathsOut;
}

// 
Tile.prototype.paths_in = function (direction) {
	var pathsIn = {};                                    // initialise return value
	for (var i in this.faces[direction]) {               // every link in this direction
		var linkId = this.faces[direction][i];           // the value is the linkId..
		var link = this.links[linkId];                   // ..which gives us the index of the link
		var paths = link.paths_in(direction);
		if (paths.length > 0) pathsIn[linkId] = paths;   // add the paths from the link
	}
	return pathsIn;
}

// not used~~~
// propagate any paths from this tile in the given direction
// update the hash of affected tiles
Tile.prototype.propogate_paths = function (direction,affected) {
	game_log("tile",1,"propagate paths from",this.x,this.y,"to the",direction);
	for (var index in this.faces[direction]) {
		var linkId = this.faces[direction][index];
		var link = this.links[linkId];
		var pathsOut = link.paths_out(direction);
		for (var jndex in pathsOut) {
			var path = pathsOut[jndex];
			game_log("tile",2,"path",path,"from link",linkId);
			path.propagate(this,link,direction,affected);
		}
	}
}

Tile.prototype.source = function (colour) {
	this.isConnector = false;
	this.isSource = true;
	this.colour = colour;
}

// convert the tile into a node
Tile.prototype.node = function () {
	this.isConnector = false;
	this.isNode = true;
	this.lit = true;
	this.set_node_colour();

	// add a link in every direction
	for (var direction in this.faces) {
		// check no links already on this face
		if (this.faces[direction].length > 0) continue;

		var linkId = this.add_link();
		this.add_to_link(linkId,direction);
	}
}

// convert the tile into a filter
Tile.prototype.filter = function (colour) {
	this.isConnector = false;
	this.isFilter = true;
	this.colour = colour;
}

// convert the tile into a prism
// add the necessary links
Tile.prototype.prism = function (form) {
	this.isConnector = false;
	this.isPrism = true;
	this.form = form;
	this.shape.create_prism_links(this);
}

Tile.prototype.set_node_colour = function () {
	this.colour = composite_colour(this.colours);
}

Tile.prototype.valid = function () {
	if (!this.isConnector) return true;

	return this.shape.validConnector(this);
}

Tile.prototype.possible_links = function () {
	return this.shape.possible_links(this);
}

// convert the tile into a connector
Tile.prototype.connector = function () {
	// nothing~~~
	// perhaps set tile.image etc. here?
}

// specific to the shape, may add extra links
Tile.prototype.finish = function () {
	if (this.isSource || this.isNode) return;

	if (this.isFilter) {
		this.shape.finishFilter(this);
	} else if (this.isPrism) {
		this.shape.finishPrism(this);
	} else {
		this.shape.finishConnector(this);
	}

}

Tile.prototype.update_lit = function () {
	var litColour = composite_colour(this.colours);
	if (litColour == this.colour) {
		if (!this.lit) this.grid.light_node();
		this.lit = true;
	} else {
		if (this.lit) this.grid.unlight_node();
		this.lit = false;
	}
}

// not used~~~
Tile.prototype.unique_colours = function () {
	var colours = [];
	if (this.colours.red>0)   colours.push("red");
	if (this.colours.green>0) colours.push("green");
	if (this.colours.blue>0)  colours.push("blue");
	return colours;
}

// determine position of links after rotating
// rotation is how many faces to rotate by
// newLinks is populated by this proc, essentially an extra return value
// newLinks is a hash, indexed by linkId, value is an array of the new arms
// newLinks will only contain the linkIds of links that will be different after rotation
// return value is the size of newArms, i.e how many links will be different after rotation
Tile.prototype.rotated_links = function (rotation,newLinks) {
	game_log("tile",1,this.description()+": find "+this.linkCount+" link positions after rotating by",rotation);
	rotation = modulo(rotation,this.shape.sides);
	var changedLinks = 0;

	if (rotation == 0) return 0;          // no rotation
	if (this.isNode) return 0;            // nodes can't be rotated

	// initalise the newLinks hash
	for (var linkId in this.links) newLinks[linkId] = [];

	// where one link will have the same arms after rotation as another link has before rotation,
	// the second link remains unchanged.
	// the first link takes the arms of the second after rotation
	// this involves reallocating the link ids of the logical links
	// index spare links according to link colour 
	// most links don't have a colour, just filters and prisms
	var spareLinkIds = {"none" : [], "red" : [], "green" : [], "blue" : []};

	// each link, detmermine position after rotation
	for (var linkId in this.links) {
		// shouldn't need to parse~~~
		linkId = parseInt(linkId);
		var link = this.links[linkId];
		var colour = link.colour || "none";

		// each arm, determine position after rotation
		var newArms = [];
		for (var direction of link.arms) {
			var nextDirection = this.shape.direction(this.orientation,direction,rotation);
			newArms.push(nextDirection);
		}
		game_log("tile",2,link.arms,"->",newArms);

		// now we know what arms the link will have after rotation, check if there is already a link that has those same arms
		var existingLinkId = null;
		var direction = newArms[0];                                 // pick any direction from the new arms

		// check each link currently in this direction
		for (var otherLinkId of this.faces[direction]) {
			var otherLink = this.links[otherLinkId];

			if (otherLink.colour != link.colour)     continue;      // colour does not match, i.e is this a filtered link
			if (otherLink.armCount != link.armCount) continue;      // number of arms does not match

			// check all other arms of the link
			var sameLink = true;
			for (var otherDirection of otherLink.arms) {
				if (newArms.indexOf(otherDirection) >= 0) continue;
				sameLink = false;
				break;
			}

			if (!sameLink) continue;                                // not the same link
			game_log("tile",2,"link ",linkId," will be the same as link ",otherLinkId," is now ",otherLink.arms);
			existingLinkId = otherLinkId;
			changedLinks--;
			break;
		}

		// check if this link exists in the new arms hash
		if (newLinks[linkId] == undefined) {
			// a link we previously checked will have the same arms after rotation as this one currently has
			// so we need to assign a different link id
			newLinkId = spareLinkIds[colour].pop();
			game_log("tile",2,"using linkId "+newLinkId+" instead of "+linkId);
			linkId = newLinkId;
		}

		// tidy up: if we are keeping an existing link and are going to use its link id, we need to assign its arms to our current link id
		if (existingLinkId != null) {
			// first check if the existing link has had any new arms assigned
			if (newLinks[existingLinkId].length > 0) {
				game_log("tile",2,"assigning arms "+newLinks[existingLinkId]+" to link "+linkId);
				// assign the new arms to this link
				newLinks[linkId] = newLinks[existingLinkId];
			} else if (newLinks[linkId] != undefined) {
				// the existing link has not yet been processed
				// add this linkId to the spare links array
				game_log("tile",2,"adding link "+linkId+" to the spare link Ids");
				spareLinkIds[colour].push(linkId);
			}

			// remove the existing link from the new arms hash
			game_log("tile",2,"removing new arms for link "+existingLinkId);
			delete newLinks[existingLinkId];
			// also check the spare link ids for the existing link, remove it
			var index = spareLinkIds[colour].indexOf(existingLinkId);
			if (index >= 0) spareLinkIds[colour].splice(index,1);
		} else {
			game_log("tile",2,"link "+linkId+" will have arms "+newArms);
			newLinks[linkId] = newArms;
		}

		changedLinks++;
	}

	return changedLinks;
}

// rotate each arm on the links of the tile by the given rotation
// return the absolute rotation
// change this to remove any paths before adding any new ones, performance be damned
Tile.prototype.rotate = function (rotation,newLinks) {
	game_log("tile",1,"rotate "+this.description()+" links",rotation,newLinks);

	// nodes can't be rotated
	if (this.isNode) return 0;

	// normalise the rotation to a number between 0 and faces - 1
	rotation = modulo(rotation,this.shape.sides);
	if (rotation == 0) return 0;

	// now update the links with the new arms
	var anythingChanged = false;
	for (var linkId in newLinks) {
		linkId = parseInt(linkId);
		anythingChanged = true;
		var link = this.links[linkId];
		var newArms = newLinks[linkId];

		// remove the existing arms
		var existingArms = link.arms.slice();
		for (var armIndex in existingArms) {
			var direction = existingArms[armIndex];

			// remove the link from the face
			var index = this.faces[direction].indexOf(linkId);
			this.faces[direction].splice(index,1);

			link.removeArm(direction);
		}

		// add the link to the new faces
		for (var armIndex in newArms) {
			var direction = newArms[armIndex];

			this.faces[direction].push(linkId);

			link.addArm(direction);
		}
	}

	// check if anything actually changed
	if (!anythingChanged) return 0;

	// update the rotation of the tile
	this.rotation = modulo(this.rotation + rotation,this.shape.sides);

	// determine the effective rotation
	var actualRotation = Math.min(rotation,(this.shape.sides - rotation));

	return actualRotation;
}

Tile.prototype.draw = function (xPixel,yPixel,clear) {
	game_log("tile",1,"draw",this.orientation,this.x,this.y,"tile @",xPixel,yPixel);

	// move the canvas origin and apply rotation
	// both depend on the orientation
	this.shape.draw_tile_at(xPixel,yPixel,this.orientation);

	// clear the tile
	if (clear) this.shape.clearTile();

	if (this.isNode) {
		this.shape.drawNode(this);
	} else if (this.isSource) {
		this.shape.drawSource(this);
	} else if (this.isFilter) {
		this.shape.drawFilter(this);
	} else if (this.isPrism) {
		this.shape.drawPrism(this);
	} else {
		// connector
		this.shape.drawConnector(this);
	}
}
