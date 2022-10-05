
// idea for new algorithm, seems overly complicated but probably more efficient if implemented correctly:
//  make a hash of all paths, indexed by the source segment id
//  choose paths at random until the mixCount has been reached or we run out of paths
//  each random path
//  choose segment/tile/links at random until we mix successfully or run out of segments
//  attempt to mix from the link at each random segment
//  if mix successful
//  increase the colour count for both tiles, remove paths if over 3

Game.prototype.add_path_mixes = function (mixMax) {
	game_log("generate",1,"add "+mixMax+" path mixes");
	//console.log(this.grid);
	var mixCount = 0;

	// keep track of which paths have had which colours mixed to them
	var clusters = {};

	var connectors = this.grid.connectors.slice();

	// while mixCount less than mixMax
	while (mixCount < mixMax && connectors.length > 0) {
		// choose a tile at random
		// only mix from connectors, not sources or nodes
		var index = Math.floor(connectors.length*Math.random());
		var connector = connectors.splice(index,1)[0];
		var x = connector[0];
		var y = connector[1];
		var tile = this.grid.tile(x,y);
		game_log("generate",3,"Attempt to mix from connector @"+x+","+y);

		// each remaining candidate face
		while (tile.candidateFaces.length > 0) {
			var direction = tile.candidateFaces.shift();
			var mixed = false;
			// var direction = directions[index];

			// already a link in this direction
			if (tile.faces[direction].length > 0) continue;

			// check there is a neighbour
			var neighbour = this.grid.tiling.neighbour(tile.x,tile.y,direction);
			if (neighbour == null) continue;

			// check is the neighbour a node - node mixing is done separately
			if (this.is_node(neighbour.x,neighbour.y)) continue;

			// each link
			for (var linkId in tile.links) {
				var link = tile.links[linkId];

				// if adding the direction to the link does not result in a valid tile continue
				tile.add_to_link(linkId,direction);
				if (tile.valid()) {
					game_log("generate",3,"Adding "+direction+" arm to link "+linkId+" is a valid tile");
					// attempt to mix with the neighbour
					var cluster = this.path_cluster(clusters,link);
					if (this.mix_paths_to(neighbour,cluster,clusters)) {
						for (var pathIndex in link.paths_out(direction)) {
							var path = link.paths[pathIndex];
							path.propagate(tile,link,direction);
							var pathId = path.source_tile().x + "|" + path.source_tile().y + "|" + path.source_link();
							clusters[pathId] = cluster;
						}

						game_log("generate",2,"Mixed to "+composite_colour(cluster.colours)+" with tile @"+neighbour.x+","+neighbour.y);
						mixed = true;
						break;
					}
				}

				// mix was unsuccessful, remove the arm
				tile.remove_from_link(linkId,direction);
			}

			if (mixed) {
				mixCount++;
				// keep trying to add mixes in other directions
				// unless we have hit the max
				if (mixCount >= mixMax) break;
			}
		}
	}

	game_log("generate",1,"added "+mixCount+" path mixes out of "+mixMax);

	return mixCount;
}

Game.prototype.is_node = function (x,y) {
	var tile = this.grid.tile(x,y);
	return tile.isNode;
}

Game.prototype.add_node_mixes = function (mixMax) {
	game_log("generate",1,"add "+mixMax+" node mixes");
	var mixCount = 0;

	var nodes = this.grid.nodes.slice();

	// while mixCount less than mixMax
	while (mixCount < mixMax && nodes.length > 0) {
		// choose a node at random

		var [x,y] = nodes.splice(random_index(nodes),1)[0];
		game_log("generate",3,"Attempt to mix from node @"+x+","+y);
		var node = this.grid.tile(x,y);

		// white node is already as mixed as possible
		if (node.colour == "white") continue;

		// each direction in random order
		// there will already be an arm in every direction
		// (at the end of the growth phase, arms are added to every node)
		var directions = node.shape.randomDirections(node.orientation);
		for (var direction of directions) {
			// check there is a neighbour
			var neighbour = this.grid.tiling.neighbour(node.x,node.y,direction);
			if (neighbour == null) continue;

			// check neighbour has no path in this direction
			var tile = this.grid.tile(neighbour.x,neighbour.y);
			if (tile.faces[neighbour.direction].length > 0) continue;

			// if the neighbour is a source or a connector, we can mix
			// we will be connecting to a new or existing link on the neighbouring tile
			var mixLinkId = null;
			if (tile.isSource) {
				// check the colour of the source does not clash
				if (node.colours[tile.colour] == 0) {
					// OK add the new link to the neighbour
					mixLinkId = tile.add_link();
					tile.add_to_link(mixLinkId,neighbour.direction);
				}
			} else if (tile.isConnector) {
				// check composite colour of each link
				for (var linkId in tile.links) {
					var link = tile.links[linkId];

					if (link.colours.red   > 0 && node.colours.red   > 0) continue;
					if (link.colours.green > 0 && node.colours.green > 0) continue;
					if (link.colours.blue  > 0 && node.colours.blue  > 0) continue;

					// check if adding the link to the link results in a valid tile
					tile.add_to_link(linkId,neighbour.direction);
					if (!tile.valid()) {
						tile.remove_from_link(linkId,neighbour.direction);
						continue;
					}

					// OK make the connection to this link
					mixLinkId = linkId;
					break;
				}
			}

			if (mixLinkId == null) continue; // no link to mix to

			// propagate any paths from the neighbour link into the node
			var link = tile.links[mixLinkId];
			for (var path of link.paths) {
				path.propagate(tile,link,neighbour.direction, null);
			}

			// update node colour
			node.set_node_colour();
			node.update_lit();

			// connection has been added
			game_log("generate",2,"Mixed to "+composite_colour(node.colours)+" with tile @"+neighbour.x+","+neighbour.y);
			mixCount++;
			if (mixCount >= mixMax) break;
			if (node.colour == "white") break;
		}
	}

	game_log("generate",1,"added "+mixCount+" node mixes out of "+mixMax);

	return mixCount;
}










Game.prototype.mix_paths_to = function (to,cluster,clusters) {
	var tile = this.grid.tile(to.x,to.y);
	var direction = to.direction;
	var link;

	if (tile == null) {
		console.log("mix to invalid tile @",to.x,to.y);
		console.log("tiles:",this.grid.tiles);
	}

	if (tile.isSource) {
		game_log("generate",3,"Attempt to mix to source  @"+tile.x+","+tile.y)
		// console.log("attempt to mix with source @",to.x,to.y);
		// check the colour of the source is not already found in the cluster~~~
		if (cluster.colours[tile.colour] > 0) return false;

		// add a new link
		var linkId = tile.add_link();
		tile.add_to_link(linkId,direction);
		var link = tile.links[linkId];

		var sourceCluster = this.path_cluster(clusters,link);

		// add the new link's paths to the incoming cluster
		// absorb this cluster into the incoming cluster
		cluster.paths = cluster.paths.concat(sourceCluster.paths);
		cluster.intersects = cluster.paths.concat(sourceCluster.intersects);
		for (var colour in cluster.colours) cluster.colours[colour] += sourceCluster.colours[colour];

		// propagate the paths on this link out the incoming direction
		// caller will propagate the incoming paths back this way
		for (var path of link.paths_out(direction)) {
			path.propagate(tile,link,direction);

			// update each path on this link to point to the incoming cluster
			var pathId = path.source_tile().x + "|" + path.source_tile().y + "|" + path.source_link();
			clusters[pathId] = cluster;
		}

		return true;
	} else if (tile.isNode) {
		game_log("generate",3,"Attempt to mix to node  @"+tile.x+","+tile.y)
		// check the colours currently coming into the node are ok
		for (var path of cluster.paths) {
			// check this node not already lit with the path's colour
			if (tile.colours[path.colour()] > 0) return false;
		}

		// ok then we will mix
		for (var linkId in tile.links) {
			var link = tile.links[linkId];
			if (link.paths.length == 0) continue;

			// get the cluster for this link on the node
			var nodeCluster = this.path_cluster(clusters,link);

			// record an intersection between the incoming path cluster and this one
			cluster.intersects = cluster.intersects.concat(nodeCluster.paths);
			nodeCluster.intersects = nodeCluster.intersects.concat(cluster.paths);

			// update the colours on both clusters
			for (var colour in cluster.colours) {
				cluster.colours[colour] += nodeCluster.colours[colour];
				nodeCluster.colours[colour] += cluster.colours[colour];
			}
		}

		return true;
	} else if (tile.isConnector) {
		game_log("generate",3,"Attempt to mix to connector  @"+tile.x+","+tile.y)
		//connector
		// each link (should be random order~~~)
		for (var linkId in tile.links) {
			var link = tile.links[linkId];

			var connectorCluster = this.path_cluster(clusters,link);

			// check colours of this link/cluster and the incoming cluster are mutually exclusive
			var colourClash = false;
			for (var colour in cluster.colours) {
				if (connectorCluster.colours[colour] > 0 && cluster.colours[colour] > 0) {
					colourClash = true;
					break;
				}
			}
			if (colourClash) continue;

			// check adding the direction to the neighbour link is ok
			tile.add_to_link(linkId,direction);
			if (!tile.valid()) {
				tile.remove_from_link(linkId,direction);
				continue;
			}

			// all good then mix

			// add this link's paths to the incoming cluster
			// absorb this cluster into the incoming cluster
			cluster.paths = cluster.paths.concat(connectorCluster.paths);
			cluster.intersects = cluster.paths.concat(connectorCluster.intersects);
			for (var colour in cluster.colours) cluster.colours[colour] += connectorCluster.colours[colour];

			// propagate the paths on this link out the incoming direction
			// caller will propagate the incoming paths back this way
			for (var pathIndex in link.paths_out(direction)) {
				var path = link.paths[pathIndex];
				path.propagate(tile,link,direction);

				// update each path on this link to point to the incoming cluster
				var pathId = path.source_tile().x + "|" + path.source_tile().y + "|" + path.source_link();
				clusters[pathId] = cluster;
			}

			return true;
		}

		return false;
	}
}

// check if there is a cluster in clusters for the paths on this link already
// otherwise make a new one
Game.prototype.path_cluster = function (clusters,link) {
	var pathId = link.paths[0].source_tile().x + "|" + link.paths[0].source_tile().y + "|" + link.paths[0].source_link();
	if (clusters[pathId] != undefined) {
		cluster = clusters[pathId];
	} else {
		// copy the link's colours & paths:
		var colours = {red : link.colours.red, green : link.colours.green, blue : link.colours.blue}
		var paths = link.paths.slice();
		cluster = { paths: paths, intersects: [], colours: colours };
	}
	return cluster;
}

// not used~~~
Game.prototype.combined_colours = function (paths,mixedColours) {
	var colours = {red: 0, green: 0, blue: 0};

	for (var pathIndex in paths) {
		var path = paths[pathIndex];
		// check the mixedColours hash
		if (mixedColours[pathId] == undefined) {
			colours[path.colour()]++;
		} else {
			// this path has been previously mixed
		var pathId = path.source_tile().x + "|" + path.source_tile().y + "|" + path.source_link();
			for (var colour in mixedColours[pathId]) {
				if (mixedColours[pathId][colour]) colours[colour]++;
			}
		}
	}
}
