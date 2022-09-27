
// set any global vars, create reflection object (the game, init?)
function init () {
	HOST = "localhost"
	SHUFFLE = true;
	ROTATE = true;
	Q2 = Math.sqrt(2);
	Q3 = Math.sqrt(3);
	RAD = Math.PI/180;
	MIN_PIXELS = 10;
	BORDER_MARGIN = 5;
	BORDER_THICKNESS = 5;
	MIN_PANEL_WIDTH = 200;
	SCROLL_BUTTON_SIZE = 40;
	WALL_SIZE = 10;

	LOG = {
		"screen": 0,
		"game": 0,
		"generate": 2,
		"filter": 0,
		"grid": 0,
		"image": 0,
		"path": 0,
		"tile": 0,
		"triangular": 0,
		"squares": 0,
		"long-tri": 0,
		"triangle": 0,
		"square": 0,
		"hexagon": 0,
		"octagon": 0,
		"dodecagon": 0
	};

	COLOUR = {
		0: "black",
		1: "red",
		2: "green",
		3: "yellow",
		4: "blue",
		5: "magenta",
		6: "cyan",
		7: "white"
	};

	BLOCK_COLOUR = "#4b4b4b";

	// tilings
	// all tilings are displayed in a box unless specified
	// box may be continuous either horizontally or vertically, or both (or neither)

	// tiling:                 desciption                                continuous?
	// bounded-triangular      triangles in a triangle                   neither
	// triangular              triangles                                 x, both
	// squares                 squares                                   neither, x, y, both
	// hexagonal               hexagons                                  both
	// elongated-triangular    alternating columns of squares/triangles  y, both
	// snub-square             squares and triangles                     both
	// bounded-trihexagonal    hexagons and triangles in a hexagon       neither
	// trihexagonal            hexagons and triangles                    x, both
	// rhombitrihexagonal      hexagons, squares and triangles           both
	// truncated-square        squares and octagons                      both
	// truncated-hexagonal     dodecagons and triangles                  both
	// truncated-trihexagonal  dodecagons, hexagons and squares          both

	// sizes:
	// tiny = 20 cells or less
	// small = 21 - 50 cells
	// medium = 51 - 120 cells
	// large = 121 - 250 cells
	// huge = 250+
	// suffix with +/- for finer control
	// parsed in tiling.js

	// sources:
	// an exact number (integer)
	// or a proportion of the total tiles (between 1 and 0)
	// "Q", square root of the total number of tiles (this is the default)
	// Should specify an exact number for tiny tilings, because e.g 3 is probably too many sources for 9 tiles total
	// parsed in generate.js

	// colours:
	// a hash, indexed by primary colour, value is frequency ratio
	// by default, proportion of each colour is random (null or undefined)
	// if all values have a number, the numbers must add up to 1
	// if only some colours have numbers, must add up to 1 or less
	// e.g 
	// {"red" : 1} = all red
	// {"blue" : 0.5} = half blue, red & green in random proportions
	// {"red" : 0.4, "green" : 0.4} = mostly red & green, some blue
	// {"green" : 0} = red & blue only, in random proportions
	// {"green" : 1/3, "blue" : 2/3} = mostly blue, some green, no red
	// parsed in generate.js

	// growth:
	// a string describing how the network of paths should be generated:
	// random - the default, paths are grown in random directions
	// straight - attempt to grow each path in a straight line
	// acute - always attempt to always turn an acute corner
	// parsed in tile.js

	// mix:
	// either "none", "path", "node", or "both" (default)
	// a boolean, should the paths be mixed into hybrid colours (yellow, teal, magenta, white)
	// path means mix entire paths only, i.e between connecters and sources or other connectors
	// node means mix to nodes only, i.e between connectors and nodes
	// has no effect if there is only one colour
	// parsed in generate.js

	// filter:
	// a boolean, should the mixed paths be filtered. Has no effect if mix is false

	// prism:
	// an array of the shape & type of a prism to add
	// e.g ["hexagon","regular"]
	// resulting grid will always have at least one prism

	LEVELS = {};
	LEVEL_COUNT = 20;

	// tiling & size have no default, must be specified
	LEVELS.default = {
		xContinuous : true,
		yContinuous : true,
		sources     : "Q",
		colours     : {"red" : null, "green" : null, "blue" : null},
		growth      : "random",
		mix         : "both",
		filter      : true,
		prism       : null
	};

	LEVELS[1] = {tiling : "bounded-triangular", size : "tiny", xContinuous : false, yContinuous : false, sources : 1, colours : {red : 1}};
	LEVELS[2] = {tiling : "squares", size : "tiny", xContinuous : false, yContinuous : false, mix : false, sources : 2, colours : {green : 0.5, blue: 0.5}, filter : false};
	LEVELS[3] = {tiling : "triangular", size : "small", yContinuous : false, colours : {red : 1/3, green : 1/3, blue : 1/3}};
	LEVELS[4] = {tiling : "elongated-triangular", size : "small", xContinuous : false};
	LEVELS[5] = {tiling : "snub-square", size : "small+", mix : 1.0};

	// LEVELS[6] = {tiling : "bounded-trihexagonal", size : "small", prism : "regular", colours : {red : 1/3, green : 1/3, blue : 1/3}};
	LEVELS[6] = {tiling : "bounded-trihexagonal", size : "small", sources : 3, colours : {red : 1/3, green : 1/3, blue : 1/3}};
	LEVELS[7] = {tiling : "hexagonal", size : "medium-", sources : 1, growth : "acute"};
	LEVELS[8] = {tiling : "elongated-triangular", size : "large"};
	LEVELS[9] = {tiling : "squares", size : "large", growth : "straight"};
	LEVELS[10] = {tiling : "truncated-hexagonal", size : "small"};

	LEVELS[11] = {tiling : "rhombitrihexagonal", size : "small"};
	LEVELS[12] = {tiling : "snub-square", size : "large"};
	LEVELS[13] = {tiling : "truncated-square", size : "small"};
	LEVELS[14] = {tiling : "truncated-trihexagonal", size : "medium"};
	LEVELS[15] = {tiling : "trihexagonal", size : "huge", yContinuous : false};

	LEVELS[16] = {tiling : "rhombitrihexagonal", size : "large"};
	LEVELS[17] = {tiling : "hexagonal", size : "huge", growth : "straight"};
	LEVELS[18] = {tiling : "truncated-square", size : "large", growth : "straight"};
	LEVELS[19] = {tiling : "truncated-hexagonal", size : "medium", growth : "straight"};
	LEVELS[20] = {tiling : "truncated-trihexagonal", size : "huge", growth : "prism"};

	var instance = new Reflection();
	//game_log("game",0,"initialised",instance);
}

function game_log (module,level) {
	if (level > LOG[module]) return;
	var messageArgs = [];
	// console.log(arguments);
	for (var i = 2; i < arguments.length; i++) {
		messageArgs.push(arguments[i]);
	}

	console.log.apply(console,messageArgs);
}

// modulo for javascript that won't return a negative number
function modulo (a,b) {
	var modulo = a%b;
	if (modulo < 0) modulo += b;
	return modulo;
}

function composite_colour (primaryColours) {
	var colourCode = 0
	if (primaryColours.red > 0)   (colourCode += 1);
	if (primaryColours.green > 0) (colourCode += 2);
	if (primaryColours.blue > 0)  (colourCode += 4);
	return COLOUR[colourCode];
}

function primary_colours () {
	return ["red","green","blue"];
}

function random_colour () {
	switch (Math.floor(3*Math.random())) {
		case 0: return "red";
		case 1: return "green";
		case 2: return "blue";
	}
}

// return a random index into the given array of items
function random_index (items) {
	return Math.floor(items.length*Math.random());
}

// return an array of with the same elements as the items array, in a random order
// doesn't affect sorted
function random_sort (items) {
	sorted = items.slice();
	var randomised = [];

	// randomly choose items and add them to the return value
	// until there are none left:
	while (sorted.length > 0) {
		var index = random_index(sorted);
		randomised.push(sorted[index]);
		sorted.splice(index,1);
	}

	return randomised;
}

function opposite_direction (direction) {
	switch (direction) {
		case "n":   return "s";
		case "nne": return "ssw";
		case "ne":  return "sw";
		case "nee": return "sww";
		case "e":   return "w";
		case "see": return "nww";
		case "se":  return "nw";
		case "sse": return "nnw";
		case "s":   return "n";
		case "ssw": return "nne";
		case "sw":  return "ne";
		case "sww": return "nee";
		case "w":   return "e";
		case "nww": return "see";
		case "nw":  return "se";
		case "nnw": return "sse";
	}
}

function right_angle_directions (direction) {
	switch (direction) {
		case "n":   return ["w","e"];
		case "nne": return ["nww","see"];
		case "ne":  return ["nw","se"];
		case "nee": return ["nnw","sse"];
		case "e":   return ["n","e"];
		case "see": return ["nne","ssw"];
		case "se":  return ["ne","sw"];
		case "sse": return ["nee","ssw"];
		case "s":   return ["e","w"];
		case "ssw": return ["see","nww"];
		case "sw":  return ["se","nw"];
		case "sww": return ["sse","nnw"];
		case "w":   return ["s","n"];
		case "nww": return ["ssw","nne"];
		case "nw":  return ["sw","ne"];
		case "nnw": return ["sww","nee"];
	}
}

function partitioned_forms (initialForm,length,linkIds) {
	// console.log("partitions for",initialForm,length,linkIds);
	if (length - initialForm.length < 2) {
		while (initialForm.length < length) initialForm += "0";
		return [initialForm];
	}

	var forms = [];

	for (var partitionLength = Math.min(length,initialForm.length); partitionLength >=2; partitionLength--) {
		combinations(linkIds,Math.floor(partitionLength/2)).forEach( function (combination) {

			var unusedLinkIds = linkIds;
			combination.forEach(function (linkId) { unusedLinkIds.splice(unusedLinkIds.indexOf(linkId));});

			permutations(combination).forEach(function (permutation) {
				var partition = permutation.reduce(reduce_to_string,"");
				if (modulo(partitionLength,2) == 1) partition += "0";
				partition += permutation.reduceRight(reduce_to_string,"");

				//console.log(partition);
				var form = initialForm + partition;
				partitions = partitions.concat(partitionedForms(form,length,unusedLinkIds));
			});
		});
	}

	return forms;
}

function reduce_to_string (reduction,value) {
	return reduction + value;
}

// return all permutations of the set
function permutations ( superset ) {
	// determine set size
	var length = superset.length;
	// sets of size one only have one permutation
	if (length == 1) return [superset];

	var permutations = [];
	// iterate over the set
	// find all permutations of each subset formed by removing one element
	// then append the removed element to all those permutations
	for (var index in superset) {
		// copy the set array, this will become a subset
		var subset = superset.slice();
		// remove the element at the current index from the subset
		var element = subset.splice(index,1)[0];
		// find all permutations of the subset
		this.permutations(subset).forEach(function (permutation) {
			// append the removed element, add the resulting permutation to the return array
			permutation.push(element);
			permutations.push(permutation);
		});
	} 
	return permutations;
}

function combinations (superset, length) {
	if (length == 0) return [[]];

	var index = 1;
	length--;
	var combinations = [];
	superset.forEach(function (element) {
		this.combinations(superset.slice(index),length).forEach(function (combination) {
			combination.unshift(element);
			combinations.push(combination);
		});
		index++;
	});

	return combinations;
}

function sumCombinations (sum,maxSlice) {
	if (sum == 0) return [[]];

	if (maxSlice > sum || maxSlice == undefined) maxSlice = sum;
	var combinations = [];

	for (var slice = maxSlice; slice > 0; slice--) {
		var remaining = sum - slice;
		sumCombinations(remaining,slice).forEach(function (combination) {
			combination.push(slice);
			combinations.push(combination);
		});
	}

	return combinations
}

function format_centiseconds (centiseconds) {
	var remaining = Math.round(centiseconds);

	centiseconds = modulo(remaining,100);
	remaining = (remaining - time.centiseconds)/100;
	var seconds = modulo(remaining,60);
	var minutes = (remaining - seconds)/60;

	return pad_number(minutes,2) + ":" + pad_number(seconds,2) + ":" + pad_number(centiseconds,2);
}

function format_seconds (seconds) {
	var remaining = Math.round(seconds);

	var seconds = modulo(remaining,60);
	var minutes = (remaining - seconds)/60;

	return pad_number(minutes,2) + ":" + pad_number(seconds,2);
}

function pad_number(number, length) {
    var padded = number+"";
    while (padded.length < length) padded = "0" + padded;
    return padded;
}

