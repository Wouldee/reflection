


function Path (grid,source,link) {
	this.grid = grid;
	this.segments = {};
	this.linkCount = 0;

	this.sourceSegment = new Segment(source,link);
	var segmentId = this.segment_id(source,link);

	this.id = segmentId;
	this.segments[segmentId] = this.sourceSegment;

	link.add_path(this);
	this.linkCount++;

	this.sourceSegment.add_from("centre",null);

	this.grid.new_path(this);
}

Path.prototype.source_tile = function () {
	return this.sourceSegment.tile;
}

Path.prototype.source_link = function () {
	return this.sourceSegment.link;
}

// return the colour of this path
// colour is determined by the source
Path.prototype.colour = function () {
	return this.source_tile().colour;
}

// add a new link to the path
Path.prototype.add_segment = function (tile,link) {
	var segment = new Segment(tile,link);
	var segmentId = this.segment_id(tile,link);
	this.segments[segmentId] = segment;

	link.add_path(this);
	this.linkCount++;

	return segment;
}

// return true if the link is part of this path
// otherwise false
Path.prototype.contains_link = function (tile,link) {
	var segmentId = this.segment_id(tile,link);
	return (this.segments[segmentId] != undefined);
}

Path.prototype.to = function (tile,link,direction) {
	var segmentId = this.segment_id(tile,link);
	var segment = this.segments[segmentId];
	if (segment == undefined) {
		console.log("Path.to(): segment",segmentId,"does not exist in path from",this.segment_id(this.source_tile(),this.source_link()),this);
	}

	return (segment.to[direction] != undefined);
}

Path.prototype.from = function (tile,link,direction) {
	var segmentId = this.segment_id(tile,link);
	var segment = this.segments[segmentId];
	if (segment == undefined) {
		console.log("Path.from(): segment",segmentId,"does not exist in path from",this.segment_id(this.source_tile(),this.source_link()),this);
	}
	return (segment.from[direction] != undefined);
}

// not used~~~
Path.prototype.next_link = function (tile,link,direction) {
	var segmentId = this.segment_id(tile,link);
	var segment = this.segments[segmentId];

	var nextSegment = segment.to[direction];
	if (nextSegment == undefined) return null;

	return nextSegment.link;
}

// not used~~~
Path.prototype.previous_link = function (tile,link,direction) {
	var segmentId = this.segment_id(tile,link);
	var segment = this.segments[segmentId];

	var previousSegment = segment.from[direction];
	if (previousSegment == undefined) return null;

	return previousSegment.link;
}

// Return true if the path goes from the one tile to the other
// Depends on direction: has to be from -> to; to -> from doesn't count
Path.prototype.connects_from = function (fromTile,fromLink,toTile,toLink,visited) {
	if (fromTile.x == toTile.x && fromTile.y == toTile.y && fromLink.id == toLink.id) {
		// same tile
		return true;
	}

	// keep track of which tiles have been visited to prevent loops
	visited = visited || {};
	var segmentId = this.segment_id(toTile,toLink);
	if (visited[segmentId]) return false;
	visited[segmentId] = true;

	// load segment
	var toSegment = this.segments[segmentId];
	if (toSegment == this.sourceSegment) return false; // beginning of the path

	// each segment that connects to the 'to segment'
	for (var direction in toSegment.from) {
		var fromSegment = toSegment.from[direction]
		// console.log("direction = "+direction);
		// console.log("to segment = "+toSegment);
		// console.log("from segment = "+fromSegment);

		// recusively check if the fromTile/Link connects to 
		// the segment that leads to the toTile/Link
		// return true if so, otherwise keep searching
		if (this.connects_from(fromTile,fromLink,fromSegment.tile,fromSegment.link,visited)) {
			return true;
		}
	}

	// no connection found
	return false;
}

// not used
// change the path so that it passes through the new link instead of the old link
// there is something wrong with this
// but I have no idea what~~~
Path.prototype.switch_links = function (tile,oldLink,newLink) {
	var segmentId = this.segment_id(tile,oldLink);

	// update the segment with the new link
	var segment = this.segments[segmentId];
	segment.link = newLink;

	// the segment id has changed, update the reference
	var newSegmentId = this.segment_id(tile,newLink);
	console.log("path",this.segment_id(this.source_tile(),this.source_link()),"switching link",segmentId,"for",newSegmentId);

	this.segments[newSegmentId] = segment;
	delete this.segments[segmentId];

	// update the links
	oldLink.remove_path(this);
	console.log("and the path from the link?",(oldLink.paths.indexOf(this) < 0));
	newLink.add_path(this);

	console.log("have removed link",segmentId,"from path?",(this.segments[segmentId] == undefined));
	console.log("and the path from the link?",(oldLink.paths.indexOf(this) < 0));
	console.log("have added link",newSegmentId,"to path?",(this.segments[newSegmentId] != undefined));
	console.log("and the path to the link?",(newLink.paths.indexOf(this) >= 0));
	console.log("segment switched:",segment);
}

// propagate path from the given link to any neighbours, recursively
// all connected links will be added to this path also
// push any affected tiles onto the affected array so the caller can redraw them
Path.prototype.propagate = function (fromTile,fromLink,fromOutDirection,affected) {
	affected = affected || [];
	game_log("path",1,"path ",this.segment_id(this.sourceSegment.tile,this.sourceSegment.link),": propogating path from",fromTile.x,fromTile.y,"to the",fromOutDirection);

	var fromSegmentId = this.segment_id(fromTile,fromLink);
	var fromSegment = this.segments[fromSegmentId];

	// check if path already goes in this direction
	if (fromSegment.to[fromOutDirection] != undefined) return;
	game_log("path",2,"segment",fromSegmentId,"does not yet go to the",fromOutDirection);

	// load the neighbouring tile
	var neighbour = this.grid.neighbour(fromTile.x,fromTile.y,fromOutDirection);
	if (neighbour == null) return;

	var tile = this.grid.tile(neighbour.x,neighbour.y);
	var inDirection = neighbour.direction;

	// find the link
	var link;
	var found = false;
	for (var index in tile.faces[inDirection]) {
		var linkId = tile.faces[inDirection][index];
		link = tile.links[linkId];

		// check the colour matches
		if (link.colour != undefined && link.colour != this.colour()) continue;
		// otherwise assume there is only one matching link
		found = true;
		break;
	}

	// check: a matching link exists
	if (!found) return;
	game_log("path",2,"add path to link",tile.x,tile.y,linkId);

	var segmentId = this.segment_id(tile,link);

	// check if segment already exists
	if (this.contains_link(tile,link)) {
		game_log("path",2,"segment already exists");
		var segment = this.segments[segmentId];
	} else {
		game_log("path",2,"creating a new segment");
		// add the link to the path and vice-versa
		var segment = this.add_segment(tile,link);
	}

	// record the connection between the two segments
	fromSegment.add_to(fromOutDirection,segment);
	segment.add_from(inDirection,fromSegment);

	// flag the tile
	if (affected[tile.x] == undefined) affected[tile.x] = [];
	affected[tile.x][tile.y] = true;

	// propagate
	for (var index in link.arms) {
		var outDirection = link.arms[index];
		game_log("path",2,"continue the path from",tile.x,tile.y,"to the",outDirection,"?");

		// don't go back the way we came (unless the path caomes from another direction)
		if (outDirection == inDirection && segment.fromCount < 2) continue;

		// check if path already goes in this direction
		if (segment.to[outDirection] != undefined) continue;

		this.propagate(tile,link,outDirection,affected);
	}
}

// cut the path going in or out of the tile in the given direction
// results in path coming in being removed from this tile and any tiles it links to;
// and path going out being removed from the neighbour and any tiles it links to
Path.prototype.cut = function (tile,link,direction,affected) {
	affected = affected || [];
	game_log("path",1,"path ",this.segment_id(this.sourceSegment.tile,this.sourceSegment.link),": cut path to the",direction,"of",tile.x,tile.y);

	var segmentId = this.segment_id(tile,link);
	var segment = this.segments[segmentId];

	if (segment.from[direction] != undefined) {
		game_log("path",2,"cut: remove path coming into",tile.x,tile.y);
		// path flows into this segment from the given direction
		var fromSegment = segment.from[direction];
		var toDirection = opposite_direction(direction);

		// remove the path from this tile and any linked segments recursively
		this.remove(segmentId,direction,affected)

		// remove the reference to this tile from the neighbouring segment
		fromSegment.delete_to(toDirection);
	}

	if (segment.to[direction] != undefined) {
		game_log("path",2,"cut: remove path goint out of",tile.x,tile.y);
		// path frows from this segment in the given direction
		var toSegment = segment.to[direction];
		var toSegmentId = this.segment_id(toSegment.tile,toSegment.link);
		var fromDirection = opposite_direction(direction);

		// remove the path from the neighbouring segment recursively
		this.remove(toSegmentId,fromDirection,affected);

		// remove the reference to the neighbouring segment
		segment.delete_to(direction);
	}
}

// remove the path from the segment in the given direction
// typically results in the segment being deleted (and the associated link being removed)
// exception is if the path also enters the segment/link from another direction
// recursive
Path.prototype.remove = function (segmentId,direction,affected) {
	game_log("path",1,"removing path to",segmentId,"from",direction);
	var segment = this.segments[segmentId];
	if (segment == undefined) {
		console.log("Path.remove(): undefined segment",segmentId,direction,affected)
		return;
	}

	segment.delete_from(direction);
	// if the path still flows into the tile from at least two other directions
	//   then we don't need to do anything more
	if (segment.fromCount > 1) return;
	game_log("path",2,"less than 2 paths now coming in");

	// recursively remove from segments this segment links to
	for (var outDirection in segment.to) {
		// don't remove the path flowing back in the same direction
		if (outDirection == direction) continue;
		// don't remove the path if it is coming in another direction
		// except for removing the path flowing in that other direction
		if (segment.fromCount == 1 && segment.from[outDirection] == undefined) continue;
		game_log("path",2,"removing path to the",outDirection);

		// load the segment the path flows to and reverse the direction
		var toSegment = segment.to[outDirection];
		var toSegmentId = this.segment_id(toSegment.tile,toSegment.link);
		var inDirection = opposite_direction(outDirection);

		// delete the reference to the next segment
		segment.delete_to(outDirection);

		// remove the path from the next segment
		this.remove(toSegmentId,inDirection,affected);
	}

	if (segment.fromCount == 0) {
		game_log("path",2,"removing segment",segmentId,"from path entirely")
		// the link is being removed from the path completely
		// flag the tile
		if (affected[segment.tile.x] == undefined) affected[segment.tile.x] = [];
		affected[segment.tile.x][segment.tile.y] = true;

		//remove the path from the link
		segment.link.remove_path(this);

		// delete the segment
		delete this.segments[segmentId];
		this.linkCount--;
	}
}

Path.prototype.segment_id = function (tile,link) {
	return tile.x + "|" + tile.y + "|" + link.id;
}

function Segment (tile,link) {
	this.tile = tile;
	this.link = link;
	this.from = {};
	this.to = {};
	this.fromCount = 0;
	this.toCount = 0;
}

Segment.prototype.add_from = function (direction,segment) {
	if (this.from[direction] != undefined) game_log("path",0,"add: segment",this.tile.x,this.tile.y,"already comes from",direction,segment.tile.x,segment.tile.y);
	this.from[direction] = segment;
	this.fromCount++;
}

Segment.prototype.delete_from = function (direction) {
	if (this.from[direction] == undefined) game_log("path",0,"delete: segment",this.tile.x,this.tile.y,"doesn't come from",direction);
	delete this.from[direction];
	this.fromCount--;
}

Segment.prototype.add_to = function (direction,segment) {
	if (this.to[direction] != undefined) game_log("path",0,"add: segment",this.tile.x,this.tile.y,"already goes to",direction,segment.tile.x,segment.tile.y);
	this.to[direction] = segment;
	this.toCount++;
}

Segment.prototype.delete_to = function (direction) {
	if (this.to[direction] == undefined) game_log("path",0,"delete: segment",this.tile.x,this.tile.y,"doesn't go to",direction);
	delete this.to[direction];
	this.toCount--;
}

