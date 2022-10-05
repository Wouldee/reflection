
Game.prototype.grow_network_from = function (x,y,growth) {
	// load the tile
	var tile = this.grid.tile(x,y);
	var candidateFaces = tile.candidate_faces(growth);
	var newTiles = [];
	var skipped = [];

	game_log("generate",1,"Adding new arm from "+tile.description());
	game_log("generate",3,"Candidate faces = "+candidateFaces);

	// check each candidate face in turn
	while (candidateFaces.length > 0) {
		var direction = candidateFaces.shift();

		// attempt to add an arm in this direction
		switch (this.add_arm_from(x,y,direction,newTiles)) {
			case null:
				// arm could not be added this time, but it may be possible later
				skipped.push(direction);
				// console.log("can't add arm  this time");
				break;
			case true:
				// arm was added successfully
				// console.log("added arm");
				break;
			case false:
				// console.log("can't add arm ever");
				// arm was not added and cannot be added in this direction
				break;
		}

		// console.log("returned tiles added:",newTiles);

		// if the attempt to add an arm was successful, there will be at least one new tile
		if (newTiles.length == 0) continue;
		// once an arm is succefully added, stop

		// now that the links have been added, add the path	
		var linkIds = tile.faces[direction];
		var linkId = linkIds[0];
		var link = tile.links[linkId];
		var paths = link.paths_out(direction);
		var path = paths[0];
		path.propagate(tile,link,direction);
		//this.propogate_paths(x,y,direction);
		break;
	}

	// put the skipped directions back on the end
	candidateFaces.push(...skipped);
	
	return newTiles;
}

// add an arm from the tile @ x,y in the given direction and (optionally) to the specified link
Game.prototype.add_arm_from = function (x,y,direction,tilesAdded,linkId) {
	var xFrom = x;
	var yFrom = y;
	var directionFrom = direction;
	var linkIdFrom = linkId;
	var newTile = null;
	var possibleLinks = [];

	var logLevel = 3;
	if (linkIdFrom != undefined) logLevel = 2;

	// load the tile
	var tileFrom = this.grid.tile(xFrom,yFrom);
	game_log("generate",logLevel,"adding new arm to "+tileFrom.description()+", link "+linkId+" from "+direction);

	// is there a neighbour location
	var neighbour = this.grid.tiling.neighbour(xFrom,yFrom,directionFrom);
	game_log("generate",3,"neighbour",neighbour);
	if (neighbour == null) return false;
	var xTo = neighbour.x;
	var yTo = neighbour.y;
	var directionTo = neighbour.direction;

	var tileTo = null;
	if (this.grid.tileExists(xTo,yTo)) {
		// check the tileTo can be added to
		tileTo = this.grid.tile(xTo,yTo);
		switch (this.check_add_link_to(tileTo,directionTo,possibleLinks)) {
			case false: return false;
			case null: return null;
		}
	}

	// add link/add to link on the tile from
	if (linkIdFrom == undefined) {
		// determine the link to add an arm to
		if (tileFrom.isSource) {
			// origin tile is a source
			// add a new link
			linkIdFrom = tileFrom.add_link();
			tileFrom.add_to_link(linkIdFrom,directionFrom);
			game_log("generate",logLevel,"added new link",linkIdFrom,"to source @",xFrom+","+yFrom);
		} else {
			// connector tile
			// find an existing link and add a new arm
			// should be random order, but doesn't really matter:
			// in the case where there is more than one link to choose from, it's extremely unlikely to work anyway
			for (var id in tileFrom.links) {
				var link = tileFrom.links[id];
				// check if ok to add new direction to link
				tileFrom.add_to_link(id,directionFrom);
				if (tileFrom.valid()) {
					linkIdFrom = id;
					break;
				}
				tileFrom.remove_from_link(id,directionFrom);
			}

			if (linkIdFrom == undefined) return false;
			game_log("generate",logLevel,"added new "+directionFrom+" arm to",tileFrom.form,"link "+linkIdFrom+" on connector @",xFrom+","+yFrom);
		}
	} else {
		tileFrom.add_to_link(linkIdFrom,directionFrom);
	}

	// add the link to the neighbour
	if (tileTo == null) {
		// no tile exists yet
		// create new tile at the neighbour
		// add it to the new tiles
		var tileTo = this.grid.createTile(xTo,yTo);
		newTile = [xTo,yTo];
		game_log("generate",1,"added new tile @ "+xTo+","+yTo);
	} else {
		// tile already exists
		var tileTo = this.grid.tile(xTo,yTo);
	}

	// the tile we're going to, we add a new link containing just the direction
	var linkIdTo = tileTo.add_link();
	tileTo.add_to_link(linkIdTo,directionTo);

	game_log("generate",1,"Connected "+tileFrom.description()+" to "+tileTo.description());

	// if the tile we're going to was a new tile then we are done
	if (newTile != null) {
		// remove the directionTo from candidate faces
		// not needed - candidateFaces not added until we attempt to add a path from the tile~~~
		// var index = tileTo.candidateFaces.indexOf(directionTo);
		// tileTo.candidateFaces.splice(index,1);
		//console.log("removing",directionTo,"from candidateFaces for",xTo,yTo);

		tilesAdded.push(newTile);
		return true;
	}

	game_log("generate",2,"trying to push connection through "+tileTo.description()+" rotation "+tileTo.rotation);

	for (var link of possibleLinks) {
		game_log("generate",2,"attempting to create link "+link+" for link "+linkIdTo+" on "+tileTo.description());
		var linkAddedOK = true;
		var armsAdded = [];
		for (var directionOut of link) {
			if (directionOut == directionTo) continue;
			if (this.add_arm_from(xTo,yTo,directionOut,tilesAdded,linkIdTo)) {
				armsAdded.push(directionOut);
			} else {
				linkAddedOK = false;
				break;
			}
		}

		if (linkAddedOK) {
			game_log("generate",2,"success\n"+tileTo.log_string());
			// remove the link directions from candidate faces
			for (var arm of link) {
				var index = tileTo.candidateFaces.indexOf(arm);
				tileTo.candidateFaces.splice(index,1);
			}
			return true;
		}

		// could not add this link, remove any arms that were successful
		// recursively remove the links from the tiles the arms connect to~~~
		// the termnini tiles will no longer be null~~~ reset them~~~
		game_log("generate",2,"unable to add link");
		for (var arm of armsAdded) this.remove_arm_from(xTo,yTo,arm,tilesAdded,linkIdTo);
	}

	game_log("generate",2,"failure\n"+tileTo.log_string());
	// addition was unsuccessful, remove the links/arms we added
	tileTo.remove_link(linkIdTo);
	game_log("generate",2,"removed link "+linkIdTo+" entirely from "+tileTo.description());

	if (tileFrom.isSource) {
		tileFrom.remove_link(linkIdFrom);
	} else {
		tileFrom.remove_from_link(linkIdFrom,directionFrom);
	}
	tilesAdded.splice(0,tilesAdded.length);
	return null;
}

Game.prototype.check_add_link_to = function(tile,direction,possibleLinks) {
	// why is this checking isNode ??? ~~~
	if (tile.isSource || tile.isNode) {
		// cannot add links through sources
		game_log("generate",2,tile.description()+" is a source");
		return false;
	} else if (!tile.valid()) {
		// tile is not yet valid, i.e it has a single link going nowhere
		// it will either become a valid connector if addRandomArm is successfully called on it
		// or it will be converted to a node
		game_log("generate",2,tile.description()+" is not a valid connector");
		return null;
	} else if (tile.faces[direction].length > 0 && false) {
		// pretty sure this check is unnecessary ~~~
		game_log("generate",1,tile.description()+" already has a path to the "+direction);
		return false;
	}

	// tile to is not a node or a source, and already contains a valid link
	// finally, check if there are any valid links we can add to it
	for (var link of tile.possible_links()) {
		if (link.indexOf(direction) == -1) continue;
		possibleLinks.push(link);
	}

	if (possibleLinks.length == 0) {
		game_log("generate",2,tile.description()+" has no possible link that can be added from the "+direction);
		return false;
	}
	// console.log(tile.form,"has possible links",possibleLinks);
	return true;
}

Game.prototype.remove_arm_from = function (x,y,direction,tilesAdded,linkId) {
	var xFrom = x;
	var yFrom = y;
	var directionFrom = direction;
	var linkIdFrom = linkId;

	// load the tile
	var tileFrom = this.grid.tile(xFrom,yFrom);
	var linkFrom = tileFrom.links[linkIdFrom];
	game_log("generate",2,"removing "+direction+" arm from link "+linkId+" on "+tileFrom.description());
	if (linkFrom.arms.indexOf(directionFrom) < 0) return; // link may not have arm in this direction

	// load the neighbour
	var neighbour = this.grid.tiling.neighbour(xFrom,yFrom,directionFrom);
	game_log("generate",3,"neighbour",neighbour);
	var tileTo = this.grid.tile(neighbour.x,neighbour.y);
	var directionTo = neighbour.direction;
	var linkIdTo = tileTo.faces[directionTo][0];
	var linkTo = tileTo.links[linkIdTo];

	// recursively remove other arms from the linkTo
	for (var arm of linkTo.arms) {
		if (arm == directionTo) continue;
		this.remove_arm_from(tileTo.x,tileTo.y,arm,tilesAdded,linkIdTo);
	}

	// remove the link from the tile completely
	tileTo.remove_link(linkIdTo);
	game_log("generate",3,"removed link "+linkIdTo+" from "+tileTo.description());

	// if the tile has no more links, reset it
	if (tileTo.linkCount == 0) {
		this.grid.removeTile(tileTo.x,tileTo.y);
		game_log("generate",1,"removed tile @"+tileTo.x+","+tileTo.y);
		// also remove the tile from the tilesAdded array
		for (var index in tilesAdded) {
			if (tilesAdded[index][0] != tileTo.x) continue;
			if (tilesAdded[index][1] != tileTo.y) continue;

			tilesAdded.splice(index,1);
			break;
		}
	}

	// finally remove the directionFrom from the linkFrom
	tileFrom.remove_from_link(linkIdFrom,directionFrom);
	game_log("generate",3,"removed "+directionFrom+" arm from link "+linkIdTo+" on "+tileTo.description());
}
