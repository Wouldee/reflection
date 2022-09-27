
// create a prism of the specified shape & type
// create three sources to feed light into the prism
// return...
Game.prototype.create_prism = function (prismType) {
	game_log("generate",1,"Create prism")
	var createdTiles;

	// find a tile of the required shape to add the prism to
	// as close to the middle as possible
	var centre = this.tiling.centre_tile();
	var x = centre[0];
	var y = centre[1];

	var prismForms = tile.shape.prism_type_forms(prismType);

	// tiling may contain several different shapes
	// need to find one that can be a prism
	// can find all distinct shapes in a tiling around any point
	// pick a direction, any direction - check the neighbour
	// check the next neighbour on the adjacent face, repeat
	var direction = tile.shape.directions()[0];
	while (prismForms == undefined) {
		// check neighbouring tile
		var neighbour = this.tiling.neighbour(x,y,direction);
		x = neighbour.x;
		y = neighbour.y;

		if (x == centre[0] && y == centre[1]) {
			// did a full 360 - none of these tiles support prisms
			throw "Prism is not possible on this tiling"
		}

		prismForms = tile.shape.prism_type_forms(prismType);
		direction = tile.shape.nextDirection(direction);
	}

	// create the prism
	// rotation...
	var tile = this.grid.createTile(x,y);
	var form = prismForms[0];
	tile.prism(form);
	createdTiles.push(tile);

	// create a tile at each neighbour where there's a link
	// find the white face, and load the neighbouring tile
	// the sources will produce paths from this direction
	var sourceTile;
	for (var direction in tile.faces) {
		if (tile.faces[direction].length == 0) continue;

		// create a neighbouring tile in this direction
		var neighbour = this.tiling.neighbour(x,y,direction);
		var newTile = this.grid.createTile(neighbour.x,neighbour.y);
		var linkId = newTile.add_link();
		newTile.add_to_link(linkId,direction);

		if (tile.faces[direction].length == 3)  {
			// this is the white direction, where all three colours combine
			sourceTile = this.grid.tile(neighbour.x,neighbour.y);
		}
	}

	// now create the sources that feed into the prism
	// path to red and green source cannot create a cul de sac; must leave room for blue
	// any intermediate tiles will be added to created tiles
	redSource   = this.create_prism_source("red",  sourceTile,true, createdTiles);
	greenSource = this.create_prism_source("green",sourceTile,true, createdTiles);
	blueSource  = this.create_prism_source("blue", sourceTile,false,createdTiles);

	// now the required network is complete, propagate the paths from each source:

	return createdTiles;
}

Game.prototype.create_prism_source = function (colour,tile,leaveFreePath,newTiles) {
	// how many unused faces are there?
	var unusedFaces = [];
	for (var direction in tile.faces) {
		if (tile.faces[direction].length != 0) continue; // face is used
		if (this.tiling.neighbour(tile.x,tile.y,direction) == null) continue; // edge of the grid
		unusedFaces.push(direction);
	}

	// zero unused faces shouldn't be possible
	if (unusedFaces.length == 0) throw "No unused faces on tile " + x + "," + y;

	// find the existing link and add a new arm
	var direction = unusedFaces.pop();
	for (var linkId in tile.links) {
		var link = tile.links[id];

		// check if ok to add new direction to link
		tile.add_to_link(linkId,directionFrom);
		if (tile.valid()) {
					linkIdFrom = id;
					break;
				}
				tileFrom.remove_from_link(id,directionFrom);
			}

			if (linkIdFrom == undefined) return false;
}

// randomly choose connectors and attempt to filter them
Game.prototype.add_filtering = function (filterMax) {
	game_log("generate",1,"add "+filterMax+" filters");
	//console.log(this.grid);
	var filterCount = 0;

	// first add prisms, then filters
	// only connectors can be filtered:
	var prismConnectors = this.grid.connectors.slice();
	var filterConnectors = [];

	// keep track of which paths have been filtered
	var filteredPaths = [];

	// add prisms
	while (filterCount < filterMax && prismConnectors.length > 0) {
		// choose a tile at random
		var index = Math.floor(prismConnectors.length*Math.random());
		var connector = prismConnectors.splice(index,1)[0];
		var x = connector[0];
		var y = connector[1];

		// attempt to create a prism
		if (this.add_prism(x,y,filteredPaths)) {
			filterCount++;
		} else {
			// unable to add a prism, add tile to set of potential filters
			filterConnectors.push(connector);
		}
	}

	// add filters
	while (filterCount < filterMax && filterConnectors.length > 0) {
		// choose a tile at random
		var index = Math.floor(filterConnectors.length*Math.random());
		var connector = filterConnectors.splice(index,1)[0];
		var x = connector[0];
		var y = connector[1];

		// attempt to create a filter
		if (this.addFilter(x,y,filteredPaths)) {
			filterCount++;
		}
	}

	return filterCount;
}

// attempt to turn the tile at x,y into a prism
// return true if successful, false otherwise
Game.prototype.add_prism = function (x, y, filteredPaths) {
	var tile = this.grid.tile(x,y);

	// does the connector have a form that can be converted into a prism
	prismForms = tile.shape.prism_forms(tile);
	if (prismForms == undefined) return false;

	game_log("filter",2,"Attempt to add prism to tile @"+tile.x+","+tile.y)

	// check that the tile has exactly one path for each primary colour
	// also check that each prism form allows each colour to enter from its current direction
	// cull any prismForms that don't match the current configuration

	// finally, check filteredPaths against the paths leaving this tile
	// - can't cut a path that goes into some other prism downstream of this tile

	var colourCount = {"red" : 0, "green" : 0, "blue" : 0};
	for (var linkId in tile.links) {
		var link = tile.links[linkId];

		// console.log(link.log_string());

		for (var colour in link.colours) {
			if (link.colours[colour] > 0) colourCount[colour]++;
		}

		for (var direction of link.arms) {
			// check that the paths coming in are OK for the prism
			for (var path of link.paths_in(direction)) {
				// will this path still be able to enter if we make a prism?
				// check each form
				var validatedForms = [];
				for (var form of prismForms) {
					var validForm = true;
					// find the corresponding element of the form:
					var element = tile.shape.form_element(form,direction,tile);
					// console.log("Element at "+direction+" is "+element);

					// R = red, G = green, B = blue, Y = yellow, T = teal, W = white
					// (M = magenta, but doesn't occour in prisms because it's not a real colour)
					// compare against the colour of the path
					switch (path.colour()) {
						case "red":
							// must be R, Y, or W
							if (element == "R") break;
							if (element == "Y") break;
							if (element == "W") break;

							// cannot use this form
							validForm = false;
							game_log("filter",3,"Cannot use prism form "+form+": red cannot enter from the "+direction);
							break;
						case "green":
							// must be G, Y, T, or W
							if (element == "G") break;
							if (element == "Y") break;
							if (element == "T") break;
							if (element == "W") break;

							// cannot use this form
							validForm = false;
							game_log("filter",3,"Cannot use prism form "+form+": green cannot enter from the "+direction);
							break;
						case "blue":
							// must be R, Y, or W
							if (element == "B") break;
							if (element == "T") break;
							if (element == "W") break;

							// cannot use this form
							validForm = false;
							game_log("filter",3,"Cannot use prism form "+form+": blue cannot enter from the "+direction);
							break;
					}

					// keep this form if it's OK
					if (validForm) validatedForms.push(form);
				}

				prismForms = validatedForms;
				if (prismForms.length == 0) {
					// no valid forms
					game_log("filter",2,"Cannot create prism - no valid prism forms");
					return false;
				}
			}

			// Check that that any paths going out that wer're going to cut do not
			// lead to another prism
			for (var path of link.paths_out(direction)) {
				// filteredPaths is keyed by path, value is an array of links that
				// pass through previously added prisms
				// check if this path passes through a prism:
				if (filteredPaths[path.id] == undefined) continue;

				// check if any of the prism tiles are downstream of this tile
				for (var filtered of filteredPaths[path.id]) {
					filteredTile = filtered[0]
					filteredLink = filtered[1]

					if (path.connects_from(tile,link,filteredTile,filteredLink)) {
						game_log ("filter",1,"cannot add prism to tile @"+tile.x+","+tile.y+": path "+path.id+" already passes through a prism, on tile @"+filteredTile.x+","+filteredTile.y);
						return false;
					}
					game_log ("filter",2,"tile @"+tile.x+","+tile.y+" and prism @"+filteredTile.x+","+filteredTile.y+" are both on path "+path.id);
				}

			}
		}
	}

	if (colourCount.red != 1 || colourCount.green != 1 || colourCount.blue != 1) {
		game_log("filter",2,"Cannot create prism - missing/extra colours");
		return false;
	}

	// All OK - now make the tile a prism
	game_log ("filter",2,"tile will be turned into a prism");

	// just use the first available prism form
	// almost certainly there's only one anyway
	var form = prismForms[0];

	// cut all the paths coming in, but record where they came from
	// delete all the links
	// create new, coloured links corresponding to the elements of the form:
	// red from R, W, and optionally Y (for an expanded prism)
	// green from G, W, and optionally Y & T
	// blue to B, W, and optionally T
	// then add back the paths that were cut

	// cut all the incoming paths
	// delete the links
	var cutPaths = {};
	for (var linkId in tile.links) {
		var link = tile.links[linkId];
		for (var direction of link.arms) {
			for (var path of link.paths_in(direction)) {
				// cut the incoming path
				game_log ("filter",3,"Cut path "+path.id+" coming in from the "+direction);
				path.cut(tile,link,direction,null);
				cutPaths[direction] = true;
			}
		}

		// paths are cut, now delete the link:
		tile.remove_link(linkId);
	}

	// create the prism
	// this will add the new links
	tile.prism(form);

	// now add back the cut paths
	for (var direction in cutPaths) {
		var neighbour = this.grid.tiling.neighbour(tile.x, tile.y, direction);
		if (neighbour == null) continue; // shouldn't happen? I think? ...
		var neighbourTile = this.grid.tile(neighbour.x,neighbour.y);

		// Each path out of the neighbour in the direction of this tile
		for (var neighbourLinkId of neighbourTile.faces[neighbour.direction]) {
			var neighbourLink = neighbourTile.links[neighbourLinkId];
			for (var path of neighbourLink.paths_out(neighbour.direction)) {
				game_log("filter",3,"propagate path "+path.id+" from tile @"+neighbourTile.x+","+neighbourTile.y+", direction "+neighbour.direction);
				path.propagate(neighbourTile, neighbourLink, neighbour.direction, null);

				// find the link that the path comes in on
				// that is, the link that matches the colour of the path
				for (var linkId of tile.faces[direction]) {
					var link = tile.links[linkId];
					if (link.colour != path.colour()) continue;

					// record the path as a filtered path (if not already recorded);
					if (filteredPaths[path.id] == undefined) filteredPaths[path.id] = [];

					// record the tile & link
					filteredPaths[path.id].push([tile,link]);
 				}
			}
		}
	}

	game_log ("filter",1,"created prism @"+tile.x+","+tile.y);
	return true;
}

// attempt to turn the tile at x,y into a filter
// return true if successful, false otherwise
Game.prototype.addFilter = function (x, y, filteredPaths) {
	var tile = this.grid.tile(x,y);

	// tile must be a straight
	if (tile.shape.ideal.straightForms[tile.form] == undefined) return false;

	game_log("filter",2,"Attempt to add filter to tile @"+tile.x+","+tile.y)

	// check the colour of each of the links
	// must be: at least one colour that appears in each link (filter colour)
	// at least one other colour
	var colourCount = {"red" : 0, "green" : 0, "blue" : 0};
	var usedLinkCount = 0;
	for (var linkId in tile.links) {
		var link = tile.links[linkId];
		if (link.paths.length == 0) continue; // unused link - no paths

		usedLinkCount++;
		for (var colour in link.colours) {
			if (link.colours[colour] > 0) colourCount[colour]++;
		}
	}

	// must be at least one spare path
	game_log("filter",3,usedLinkCount+" out of "+tile.linkCount+" links are used")
	if (usedLinkCount >= tile.shape.sides/2) return false;

	// at least one colour in all paths
	// choose a colour to filter by
	var distinctColourCount = 0;
	var filterColour = null;
	for (var colour of random_sort(primary_colours())) {
		// if the colour is in every (used) link of the tile,
		// and if we haven't yet chosen a filter colour,
		// then use this colour as the filter colour:
		if (colourCount[colour] == usedLinkCount && filterColour == null) {
			filterColour = colour;
		}

		// increment the distinct colour count if this colour
		// appears on at least one of the links
		if (colourCount[colour] > 0) distinctColourCount++;
	}

	game_log("filter",3,distinctColourCount+" colours present, "+filterColour+" is the filter colour")
	if (filterColour == null) return false; // no filter colour available
	if (distinctColourCount <= 1) return false; // must be multiple colours

	// Need to check each of the paths that will be filtered
	// If the path passes through a filter downstream of this tile,
	// (a filter the same colour as the path that we will cut off)
	// then we cannot add a filter to this tile
	// Because if we did, then nothing would pass through that filter
	// And you end up with "black" nodes
	for (var linkId in tile.links) {
		var link = tile.links[linkId];
		for (var direction of link.arms) {
			for (var path of link.paths_out(direction)) {
				// filteredPaths is keyed by path, value is an array of links that
				// pass through a previously added filter. Paths that match the filterColour
				// will still pass through, we're not interested in them
				if (path.colour() == filterColour) continue;

				if (filteredPaths[path.id] == undefined) continue;
				// path has been filtered already
				// check if any of the the filtered tiles are downstream of this tile
				for (var filtered of filteredPaths[path.id]) {
					filteredTile = filtered[0]
					filteredLink = filtered[1]

					if (path.connects_from(tile,link,filteredTile,filteredLink)) {
						// could choose another filter colour? ...
						game_log ("filter",1,"cannot add filter to tile @"+tile.x+","+tile.y+": path "+path.id+" is already filtered on tile @"+filteredTile.x+","+filteredTile.y);
						return false;
					}
					game_log ("filter",2,"tile @"+tile.x+","+tile.y+" and tile @"+filteredTile.x+","+filteredTile.y+" are both on path "+path.id);
				}
			}
		}
	}

	// All OK - now make the tile a filter
	game_log ("filter",2,"tile will be turned into a filter");
	tile.filter(filterColour);

	// Choose an unused link to remove
	// All other links:
	// - Change their colour to the filter colour
	// - Add four additional short links, two per unfiltered colour
	//   these only go as far as the centre of the tile
	// - update the paths accordingly
	var removedLink = false
	for (var linkId of random_sort(Object.keys(tile.links))) {
		var link = tile.links[linkId];

		// Links are in random order - delete the first unused link
		if (link.paths.length == 0 && !removedLink) {
			game_log ("filter",2,"Remove unused link "+linkId);
			tile.remove_link(linkId);
			removedLink = true;
			continue
		}

		// Update link colour:
		link.colour = filterColour;

		// each arm of the link
		for (var direction of link.arms) {
			// Each colour except the filter colour:
			// Add a new link, with one arm
			for (var colour of primary_colours()) {
				if (colour == filterColour) continue;

				game_log ("filter",2,"Add "+colour+" link to the "+direction);
				var newLinkId = tile.add_link(colour);
				tile.add_to_link(newLinkId,direction);
			}

			// find all paths coming in:
			// if the path is the same colour as the filter, record it in filteredPaths
			// otherwise, cut the path
			for (var path of link.paths_in(direction)) {
				if (path.colour() == filterColour) {
					// record the path as a filtered path (if not already recorded);
					if (filteredPaths[path.id] == undefined) filteredPaths[path.id] = [];

					// record the id of the link that matches the path's colour
					filteredPaths[path.id].push([tile,link]);
				} else {
					game_log ("filter",3,"Cut path "+path.id+" coming in from the "+direction);
					path.cut(tile,link,direction,null);
				}
			}

			// Add back any paths from the neighbour
			// Each path will use one of the new links, depending on colour
			var neighbour = this.grid.tiling.neighbour(tile.x, tile.y, direction);
			if (neighbour == null) continue; // shouldn't happen? I think? ...
			var neighbourTile = this.grid.tile(neighbour.x,neighbour.y);

			// Each path out of the neighbour in the direction of this tile
			for (var neighbourLinkId of neighbourTile.faces[neighbour.direction]) {
				var neighbourLink = neighbourTile.links[neighbourLinkId];
				for (var path of neighbourLink.paths_out(neighbour.direction)) {
					game_log("filter",3,"propagate path "+path.id+" from tile @"+neighbourTile.x+","+neighbourTile.y+", direction "+neighbour.direction);
					path.propagate(neighbourTile, neighbourLink, neighbour.direction, null);
				}
			}
		}
	}

	game_log ("filter",1,"created "+filterColour+"filter @"+tile.x+","+tile.y);
	return true;
}
