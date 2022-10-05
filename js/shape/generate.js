// separate this out to a "generator" object or something~~~
// Game object is too big~~~

Game.prototype.generate = function () {
	this.complete = false;

	// how many tiles will the completed grid contain
	var tileCount = this.tiling.tiles(this.grid.size);

	// parse options for growth, sources, colours, and mixing
	var growth = this.options.growth; //parsing? ~~~
	var sourceCount = this.parse_sources(tileCount);
	var sourceColours = this.parse_colours(sourceCount);
	var [mixPathsMax,mixNodesMax] = this.parse_mix(sourceCount, sourceColours);

	// array of x,y of each tile created
	var tiles = [];

	// if prism option is true, add three sources and a prism~~~
	if (this.options.prism != null) {
		tiles.push(...this.create_prism(this.options.prism));
		sourceColours.red--;
		sourceColours.green--;
		sourceColours.blue--;
		sourceCount -= 3;
	}

	// generate sources, this will deplete the colours hash
	tiles.push(...this.add_sources(sourceCount, sourceColours));

	// build a network from each source
	// tiles = this.grid.sources.slice();
	var empty = tileCount - tiles.length;
	var count = 0;
	// console.log("finished grid will contain ",tileCount," tiles")
	while (tiles.length > 0) {
		count++;
		// if there are any empty tiles left
		if (empty > 0) {
			// choose candidate tile at random
			var index = Math.floor(tiles.length * Math.random());
			var tilePosition = tiles[index];
			var x = tilePosition[0];
			var y = tilePosition[1];

			// attempt to add an arm to the tile
			var newTiles = this.grow_network_from(x,y,growth);
			if (newTiles.length > 0) {
				// a new arm was successfully added
				// add the new tile(s) to the list
				// maybe only add the last new tile~~~
				// need to remove duplicates~~~
				tiles = tiles.concat(newTiles);
				empty--;
				continue;
			}

			// if we weren't able to add an arm, finish the tile
			// remove tile from list
			tiles.splice(index,1);
		} else {
			// pop the next tile
			var tilePosition = tiles.pop();
			var x = tilePosition[0];
			var y = tilePosition[1];
		}

		// determine what kind of tile this is
		var type = this.type_tile(x,y);
	}

	//empty seems to always be 1 more than it should be at this point but I can't see why because I'm tired~~~
	// console.log(empty,"empty tiles remain");
	if (empty > 0) this.grid.fillInTheBlanks();

	// game_log ("game",2,"nodes & lit: "+this.grid.nodes.length+" & "+this.grid.lit);

	// console.log("grid connected:",this.grid.tiles);

	// add mixing to paths
	var mixCount = this.add_path_mixes(mixPathsMax);

	// add filters (prisms count as filters)
	var filterMax = this.options.filter ? mixCount : 0;
	this.add_filtering(filterMax);

	// update node colours
	for (var node of this.grid.nodes) {
		var x = node[0];
		var y = node[1];
		var tile = this.grid.tile(x,y);
		tile.set_node_colour();
		tile.update_lit();
	}

	// add mixing to nodes
	// mixNodesMax
	this.add_node_mixes(mixNodesMax);

	// finalise
	for (var connector of this.grid.connectors) {
		var tile = this.grid.tile(connector[0],connector[1]);
		game_log("generate",2,"Finished tile",tile)
		tile.finish();
	}

	// result is a completed puzzle
	// caller should shuffle the puzzle
	// and draw the tiles

	this.nodes = this.grid.nodes.length;
	this.generated = true;
}

// return the number of sources to generate, based on the sources option, and the number of tiles
// throws an error if sources is invalid - see globals.tcl
Game.prototype.parse_sources = function (tileCount) {
	var sources = this.options.sources;
	var sourceCount = null;

	// determine how many sources to create
	if (sources == "Q") {
		// square root of the total number of tiles
		sourceCount = Math.round(Math.sqrt(tileCount));
	} else if (!isNaN(sources)) {
		if (Number.isInteger(sources)) {
			// Exact number of sources specified
			sourceCount = sources;
		} else if (sources > 0.0 && sources < 1.0)  {
			// A ratio of the total number of tiles
			sourceCount = Math.round(tileCount*sources);
		}
	}

	if (sourceCount == null) {
		throw "Invalid number of sources '"+sources+"' - must be 'Q', an exact number, or a ratio between 0 and 1"
	}

	// Ensure final number is at least one, and less than the total number of tiles:
	sourceCount = Math.max(1,Math.min(tileCount - 1,sourceCount));

	return sourceCount;
}

// return an array of the colours to use for each source
Game.prototype.parse_colours = function (sourceCount) {
	var proportions = this.options.colours;
	var colours = {"red" : 0, "green" : 0, "blue" : 0};
	// console.log("options.colours: red "+proportions.red+" green "+proportions.green+" blue "+proportions.blue);

	var totalProportion = 0.0;
	var totalCount = 0;
	var randomColours = primary_colours();
	for (var colour in proportions) {
		// check colour is valid
		if (primary_colours().indexOf(colour) == -1) {
			throw "Invalid source colour '"+colour+"'";
		}

		// do random colours later
		if (proportions[colour] == null) continue;

		// check proportion is valid
		var proportion = proportions[colour];
		if (isNaN(proportion) || proportion < 0 || proportion > 1) {
			throw "Invalid value for colour '"+colour+"' : '"+proportion+"'";
		}

		// update the total proportion (restrict to 1 - should throw an error~~~)
		totalProportion += proportion;
		if (totalProportion > 1) totalProportion = 1;

		// the amount to add for this colour is up to the total, minus the total so far
		var colourCount = Math.round(sourceCount*totalProportion) - totalCount;
		colours[colour] = colourCount;
		totalCount += colourCount;

		// remove colour from random colours:
		var index = randomColours.indexOf(colour);
		randomColours.splice(index,1);
	}

	// now add remaining colours randomly
	while (totalCount < sourceCount) {
		// randomly choose one of the remaining colours and increase it
		var colour = randomColours[random_index(randomColours)];
		colours[colour]++;
		totalCount++;
	}

	// console.log("colours for sources: red "+colours.red+" green "+colours.green+" blue "+colours.blue);

	return colours;
}

// Return an array of the number of mixes to aim for: [pathMix, nodeMix]
Game.prototype.parse_mix = function (sourceCount, colours) {
	// mix is just a boolean, no parsing required
	// if false, then mix count is zero
	// console.log("mix option = "+this.options.mix);
	var mix = this.options.mix;
	if (mix == "none") return [0,0];

	// validate mix option - should be none, path, node or both~~~

	// mix counts depends on how many colours there are,
	// how many sources there are,
	// and how many faces per tile there are (on average)

	// colours - first determine how evenly the colours are distributed
	// if there is only one colour, then mix count is zero
	var maxCount = Math.max(colours.red,colours.green,colours.blue);
	// console.log("sources = "+sourceCount+" colour max "+maxCount);
	if (maxCount == sourceCount) return [0,0];

	// otherwise, we can mix
	// if one colour has a majority, that does restrict the amount of mixing
	// number of paths per source depends on average number of faces per tile
	var sources = Math.min(sourceCount - maxCount,sourceCount/2);
	var faces = this.tiling.faces;

	// console.log("mix count is "+Math.round(faces*sources*2/3));

	// multiply by a factor
	// one-thirds for path mixes, double for node mixes
	var pathMixes = this.options.mix == "node" ? 0 : Math.round(faces*sources*1/3);
	var nodeMixes = this.options.mix == "path" ? 0 : Math.round(faces*sources*2/3);

	return [pathMixes,nodeMixes];
}

// create sources up to the required number
Game.prototype.add_sources = function (sourceCount,colours) {
	var sources = [];
	// continue adding a source at a random, empty location
	// until we reach the desired number
	var grid = this.grid;
	var colourIndex = 0
	var colour = "red"
	while (grid.sources.length < sourceCount) {
		var randomXY = grid.tiling.randomTile();
		var x = randomXY[0];
		var y = randomXY[1];
		if (grid.tileExists(x,y)) continue;

		while(colours[colour] == 0) {
			colourIndex++;
			colour = primary_colours()[colourIndex];
		}
		colours[colour]--;

		grid.create_source(x,y,colour);
		sources.push([x,y]);
		game_log("generate",2,"created "+colour+" source: "+grid.tile(x,y).description());
	}

	return sources;
}

Game.prototype.type_tile = function (x,y) {
	var tile = this.grid.tile(x,y);

	if (tile.isSource) {
		delete tile.candidateFaces;
		return "source";
	} else {
		// determine whether this should be a node or a connector
		if (tile.linkCount == 1) {
			for (var linkId in tile.links) break;
			var link = tile.links[linkId];
			if (link.armCount == 1) {
				this.grid.node(x,y);
				game_log("generate",2,"Node @",x+","+y);
				return "node";
			}
		}

		// tile is a connector
		// don't finalise it yet
		this.grid.connector(x,y);
		return "connector";
	}
}
