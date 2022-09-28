
// arguments
function Game (reflection,screen,level,tiling,options) {
	var game = this;
	this.reflection = reflection;
	this.screen = screen;
	this.level = level;
	this.tiling = tiling;
	this.process_options(options);

	this.moves = 0;
	this.nodes = 0;
	this.lit = 0;
	this.par = {};
	this.paused = false;

	// saved game...

	// determine the size of the border, side panel etc
	this.calculateDimensions();

	// control panel on the left-hand side
	// game grid on the right
	//this.panel = new SidePanel();
	this.drawPanel();
	this.drawGrid();

	this.scrollButton = {};
	if (this.options.xContinuous) {
		this.drawXScrollButtons();
	} else {
		this.scrollButton.left = null
		this.scrollButton.right = null
	}
	if (this.options.yContinuous) {
		this.drawYScrollButtons();
	} else {
		this.scrollButton.up = null
		this.scrollButton.down = null
	}

	// listen for any mouse events on the grid area
	this.listener = this.screen.addListener(this.gridInner.x1,this.gridInner.y1,this.gridInner.x2,this.gridInner.y2,this);

	// register to receive keyboard & resize events
	this.screen.passKeyEvents(this);
	this.screen.passResizeEvents(this);

	this.grid = new Grid(
		this,
		this.screen,
		this.tiling,
		this.tilingSize,
		this.gridInner,
		this.gridOuter,
		this.options.xContinuous,
		this.options.yContinuous
	);

	this.pausePanel = null;

	this.generated = false;
	this.tilesFinished = false;
	this.started = false;
	this.generate();
	this.shuffleGrid();
	this.grid.draw();
}

Game.prototype.process_options = function (options) {
	// options should all be set; throw an error if any missing:
	for (var required of ["size","size","mix","sources","xContinuous","yContinuous","growth","colours","filter"]) {
		if (options[required] == undefined) {
			throw "missing option '"+required+"'"
		}
	}

	// parse the size now - we need to know how many tiles will be displayed because it affects
	// the proportions of the grid
	this.tilingSize = this.tiling.size_number(options.size);

	// determine x & y continous - may be restricted by the tiling
	// required for placement of scroll buttons
	options.xContinuous = this.tiling.x_continuous(options.xContinuous);
	options.yContinuous = this.tiling.y_continuous(options.yContinuous);

	this.options = options;
}

Game.prototype.resize = function () {
	this.calculateDimensions();

	var width = this.panelWidth;
	var centre = width/2;

	this.panel.border.coordinates(0,0,width,1.0);
	this.panel.levelText.coordinates(centre,40);
	this.panel.progressText.coordinates(centre,90);
	this.panel.progressBar.coordinates(0,100,width,15);
	this.panel.timer.coordinates(centre,155);
	this.panel.moveCounterText.coordinates(centre,220);
	this.panel.scoreText.coordinates(centre,280);
	this.panel.pauseButton.coordinates(centre,350);
	this.panel.newGameButton.coordinates(centre,400);
	this.panel.menuButton.coordinates(centre,450);
	// redraw par...

	this.listener.coordinates(this.gridInner.x1,this.gridInner.y1,this.gridInner.x2,this.gridInner.y2);

	//scroll buttons
	if (this.options.xContinuous) this.resizeXScrollButtons();
	if (this.options.yContinuous) this.resizeYScrollButtons();

	var x = this.gridBorder.x1;
	var y = this.gridBorder.y1;
	var width = this.gridBorder.x2 - this.gridBorder.x1;
	var height = this.gridBorder.y2 - this.gridBorder.y1;
	this.gameBorder.coordinates(x,y,width,height);

	this.grid.resize(this.gridInner,this.gridOuter);

	if (this.paused) {
		// resize pause panel?
	}

}

Game.prototype.calculateDimensions = function () {
	// delete...
	// hard-coded stuff
	// distance from edge of canvas to panel and grid borders
	// this.margin = BORDER_MARGIN;
	// this.borderSize = BORDER_THICKNESS;
	// var minPanelWidth = MIN_PANEL_WIDTH;
	// if the grid is continuous, there is a scroll button (20 pixels)
	// otherwise there is 10 pixels of grey
	// var scrollButtonSize = SCROLL_BUTTON_SIZE;
	// var wallSize = WALL_SIZE;

	this.gridInner = {};
	this.gridOuter = {};
	this.gridBorder = {};

	var xOuterPadding = BORDER_MARGIN + BORDER_THICKNESS/2 + (this.options.xContinuous ? 0 : WALL_SIZE);
	var yOuterPadding = BORDER_MARGIN + BORDER_THICKNESS/2 + (this.options.yContinuous ? 0 : WALL_SIZE);
	//console.log("outer padding",xOuterPadding,yOuterPadding);

	var xInnerPadding = xOuterPadding + (this.options.xContinuous ? SCROLL_BUTTON_SIZE : 0);
	var yInnerPadding = yOuterPadding + (this.options.yContinuous ? SCROLL_BUTTON_SIZE : 0);
	//console.log("inner padding",xInnerPadding,yInnerPadding);

	// game grid is variable dimensions, depends on grid size, tiling
	// find out how much width the grid will use at maximum height
	var maxInnerHeight = this.screen.height - 2*yInnerPadding;
	var innerWidth = this.tiling.x_pixels(maxInnerHeight,this.tilingSize);
	var innerHeight;
	//console.log("inner height max",maxInnerHeight,"inner width",innerWidth)

	if ((innerWidth + 2*xInnerPadding) + (MIN_PANEL_WIDTH + 2*BORDER_MARGIN) > this.screen.width) {
		//console.log("too wide, reduce height");
		// use the entire width, will have to reduce the height
		innerWidth = this.screen.width - (MIN_PANEL_WIDTH + 2*BORDER_MARGIN) - 2*xInnerPadding;
		innerHeight = this.tiling.y_pixels(innerWidth,this.tilingSize);
		this.panelWidth = MIN_PANEL_WIDTH;
		yOuterPadding += (maxInnerHeight - innerHeight)/2;
	} else {
		innerHeight = maxInnerHeight;
		this.panelWidth = this.screen.width - (innerWidth + 2*xInnerPadding + 2*BORDER_MARGIN);
	}

	//console.log("panel width",this.panelWidth);

	this.gridInner.x1 = this.screen.width - xInnerPadding - innerWidth;
	this.gridInner.x2 = this.screen.width - xInnerPadding;
	this.gridInner.y1 = this.screen.height/2 - innerHeight/2;
	this.gridInner.y2 = this.screen.height/2 + innerHeight/2;
	//console.log("grid inner",this.gridInner);

	this.gridOuter.x1 = this.panelWidth + BORDER_MARGIN*2 + xOuterPadding;
	this.gridOuter.x2 = this.screen.width - xOuterPadding;
	this.gridOuter.y1 = yOuterPadding;
	this.gridOuter.y2 = this.screen.height - yOuterPadding;
	//console.log("grid outer",this.gridOuter);

	this.gridBorder.x1 = this.panelWidth + 3*BORDER_MARGIN;
	this.gridBorder.x2 = this.screen.width - BORDER_MARGIN;
	this.gridBorder.y1 = BORDER_MARGIN;
	this.gridBorder.y2 = this.screen.height - BORDER_MARGIN;
	//console.log("grid border",this.gridBorder);
	//console.log(this);
}

Game.prototype.drawPanel = function () {
	var game = this;
	var screen = game.screen;
	game.panel = {};

	var width = game.panelWidth;
	var border = {colour: "#ffffff", thickness: game.borderSize, margin: game.margin};

	game.panel.border = screen.rectangle(0,0,width,1.0,null,border);
	var centre = width/2;

	// display level number
	game.panel.levelText = screen.text('LEVEL ' + game.level,centre,40,'center',30);

	// display how many nodes are lit, with a progress bar
	game.panel.progressText = screen.text('0/0',centre,90,'center',40);
	game.panel.progressBar = screen.progressBar(0,100,width,15,'#ffffff',3,15);

	// display a timer
	game.panel.timer = screen.timer(centre,160,30);

	screen.text("PAR: ",centre,185,"right",10);
	game.panel.parTime = screen.text(format_seconds(this.par.seconds),centre,185,"left",10);
	//screen.text("RECORD: ",195,"right",10);
	//screen.text(format_centiseconds(this.record.time),centre,195,"right",10);

	// display move count
	game.panel.moveCounterText = screen.text("0 MOVES",centre,220,"center",15);
	screen.text("PAR: ",centre,240,"right",10);
	game.panel.parMoves = screen.text(this.par.moves,centre,240,"left",10);

	// score
	game.panel.scoreText = screen.text('0',centre,280,"center",15);
	screen.text("PAR: ",centre,300,"right",10);
	game.panel.parScore = screen.text(this.par.score,centre,300,"left",10);

	// records...

	// buttons
	game.panel.pauseButton   = screen.textButton('PAUSE (P)', centre,350,'center',20,function () {game.toggle_pause();});
	game.panel.newGameButton = screen.textButton('NEW GAME',  centre,400,'center',20,function () {game.regenerate();});
	game.panel.menuButton    = screen.textButton('MENU',      centre,450,'center',20,function () {game.quit();});
}

Game.prototype.drawGrid = function () {
	// draw the grid border
	var x = this.gridBorder.x1;
	var y = this.gridBorder.y1;
	var width = this.gridBorder.x2 - this.gridBorder.x1;
	var height = this.gridBorder.y2 - this.gridBorder.y1;
	var fill = {colour: "#4b4b4b"};
	var border = {colour: "#ffffff", thickness: BORDER_THICKNESS};
	this.gameBorder = this.screen.rectangle(x,y,width,height,fill,border);
}

Game.prototype.gridDrawn = function () {
	this.redrawScrollButtons();
}

Game.prototype.drawXScrollButtons = function () {
	//console.log("draw x scroll buttons");
	// draw scroll buttons left & right
	// between the grid inner and the grid outer
	var game = this;

	var fill = {colour: "#40b040", alpha: 0.25};
	var origin;

	if (this.options.yContinuous) {
		var coords;
		// trapezoid buttons
		origin = {x: 0,y: 0};
		coords = [this.gridOuter.x1,this.gridOuter.y1,
				  this.gridInner.x1,this.gridInner.y1,
				  this.gridInner.x1,this.gridInner.y2,
				  this.gridOuter.x1,this.gridOuter.y2];
		this.scrollButton.left = 
			this.screen.polygonButton(coords,fill,null,function () {game.grid.scroll("left")},origin);

		origin = {x: 1,y: 0};
		coords = [this.gridOuter.x2 - this.screen.width,this.gridOuter.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y2,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y2];
		this.scrollButton.right = 
			this.screen.polygonButton(coords,fill,null,function () {game.grid.scroll("right")},origin);
	} else {
		var x, y, width, height;
		// rectangle buttons
		origin = {x: 0,y: 0};
		x = this.gridOuter.x1;
		y = this.gridOuter.y1;
		width = this.gridInner.x1 - this.gridOuter.x1;
		height = this.gridOuter.y2 - this.gridOuter.y1;
		this.scrollButton.left = 
			this.screen.rectangleButton(x,y,width,height,fill,null,function () {game.grid.scroll("left")},origin);

		origin = {x: 1,y: 0};
		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y1;
		width = this.gridInner.x2 - this.gridOuter.x2;
		height = this.gridOuter.y2 - this.gridOuter.y1;
		this.scrollButton.right = 
			this.screen.rectangleButton(x,y,width,height,fill,null,function () {game.grid.scroll("right")},origin);
	}
}

Game.prototype.drawYScrollButtons = function () {
	// draw scroll buttons top & bottom
	// between the grid inner and the grid outer
	var game = this;

	var fill = {colour: "#40b040", alpha: 0.25};
	var origin;

	if (this.options.xContinuous) {
		var coords;
		// trapezoid buttons
		origin = {x: 1,y: 0};
		coords = [this.gridOuter.x1 - this.screen.width,this.gridOuter.y1,
				  this.gridInner.x1 - this.screen.width,this.gridInner.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y1,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y1];
		this.scrollButton.up = 
			this.screen.polygonButton(coords,fill,null,function () {game.grid.scroll("up")},origin);

		origin = {x: 1,y: 1};
		coords = [this.gridOuter.x1 - this.screen.width,this.gridOuter.y2 - this.screen.height,
				  this.gridInner.x1 - this.screen.width,this.gridInner.y2 - this.screen.height,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y2 - this.screen.height,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y2 - this.screen.height];
		this.scrollButton.down = 
			this.screen.polygonButton(coords,fill,null,function () {game.grid.scroll("down")},origin);
	} else {
		var x, y, width, height;
		// rectangle buttons
		origin = {x: 1,y: 0};
		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y1;
		width = this.gridOuter.x1 - this.gridOuter.x2;
		height = this.gridInner.y1 - this.gridOuter.y1;
		this.scrollButton.up = 
			this.screen.rectangleButton(x,y,width,height,fill,null,function () {game.grid.scroll("up")},origin);

		origin = {x: 1,y: 1};
		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y2 - this.screen.height;
		width = this.gridOuter.x1 - this.gridOuter.x2;
		height = this.gridInner.y2 - this.gridOuter.y2;
		this.scrollButton.down = 
			this.screen.rectangleButton(x,y,width,height,fill,null,function () {game.grid.scroll("down")},origin);
	}
}

Game.prototype.resizeXScrollButtons = function () {
	if (this.options.yContinuous) {
		var coords;
		// trapezoid buttons
		coords = [this.gridOuter.x1,this.gridOuter.y1,
				  this.gridInner.x1,this.gridInner.y1,
				  this.gridInner.x1,this.gridInner.y2,
				  this.gridOuter.x1,this.gridOuter.y2];
		this.scrollButton.left.coordinates(coords);

		coords = [this.gridOuter.x2 - this.screen.width,this.gridOuter.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y2,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y2];
		this.scrollButton.right.coordinates(coords);
	} else {
		var x, y, width, height;
		// rectangle buttons
		x = this.gridOuter.x1;
		y = this.gridOuter.y1;
		width = this.gridInner.x1 - this.gridOuter.x1;
		height = this.gridOuter.y2 - this.gridOuter.y1;
		this.scrollButton.left.coordinates(x,y,width,height);

		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y1;
		width = this.gridInner.x2 - this.gridOuter.x2;
		height = this.gridOuter.y2 - this.gridOuter.y1;
		this.scrollButton.right.coordinates(x,y,width,height);
	}
}

Game.prototype.resizeYScrollButtons = function () {
	if (this.options.xContinuous) {
		var coords;
		// trapezoid buttons
		coords = [this.gridOuter.x1 - this.screen.width,this.gridOuter.y1,
				  this.gridInner.x1 - this.screen.width,this.gridInner.y1,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y1,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y1];
		this.scrollButton.up.coordinates(coords);

		coords = [this.gridOuter.x1 - this.screen.width,this.gridOuter.y2 - this.screen.height,
				  this.gridInner.x1 - this.screen.width,this.gridInner.y2 - this.screen.height,
				  this.gridInner.x2 - this.screen.width,this.gridInner.y2 - this.screen.height,
				  this.gridOuter.x2 - this.screen.width,this.gridOuter.y2 - this.screen.height];
		this.scrollButton.down.coordinates(coords);
	} else {
		var x, y, width, height;
		// rectangle buttons
		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y1;
		width = this.gridOuter.x1 - this.gridOuter.x2;
		height = this.gridInner.y1 - this.gridOuter.y1;
		this.scrollButton.up.coordinates(x,y,width,height);

		x = this.gridOuter.x2 - this.screen.width;
		y = this.gridOuter.y2 - this.screen.height;
		width = this.gridOuter.x1 - this.gridOuter.x2;
		height = this.gridInner.y2 - this.gridOuter.y2;
		this.scrollButton.down.coordinates(x,y,width,height);
	}
}

Game.prototype.redrawScrollButtons = function () {
	if (this.options.xContinuous) {
		this.scrollButton.left.redraw();
		this.scrollButton.right.redraw();
	} 
	if (this.options.yContinuous) {
		this.scrollButton.up.redraw();
		this.scrollButton.down.redraw();
	}
}

Game.prototype.gridReady = function () {
	if (!this.started) this.start();
}

Game.prototype.tilesReady = function () {
	this.tilesFinished = true;
	this.shuffleGrid();
}

Game.prototype.shuffleGrid = function () {
	var requiredMoves = 0;
	// console.log("shuffle grid, generated = "+this.generated+" finished = "+this.tilesFinished)
	if (!this.generated || !this.tilesFinished) return;
	if (SHUFFLE) requiredMoves = this.grid.shuffle();
	this.updatePar(requiredMoves);
}

Game.prototype.start = function () {
	this.panel.timer.reset();
	this.panel.timer.start();
	this.startScoring();
	this.updateLitCount(this.grid.lit);
	this.started = true;
}

Game.prototype.regenerate = function () {
	this.generated = false;
	this.tilesFinished = false;
	this.started = false;
	this.paused = false;
	this.drawGrid();
	this.grid.clear();
	this.panel.timer.stop();
	this.panel.timer.reset();
	this.stopScoring();
	this.generate();
	this.shuffleGrid();
	this.grid.draw();
	this.moves = 0;
	this.updateMoves();
}

Game.prototype.keyPress = function (key) {
	switch (key) {
		case "Escape":
			this.quit; break;
		case "ArrowUp": case "w": case "W":
			this.scroll_grid("up"); break;
		case "ArrowRight": case "d": case "D":
			this.scroll_grid("right"); break;
		case "ArrowDown": case "s": case "S":
			this.scroll_grid("down"); break;
		case "ArrowLeft": case "a": case "A":
			this.scroll_grid("left"); break;
		case "p": case "P":
			this.toggle_pause(); break;
		case "f": case "F":
			this.find_action(); break;
	}
}

Game.prototype.click = function (xPixel,yPixel,mouseButton,buttonDown) {
	if (!buttonDown) return;
	if (!this.started) return;
	if (this.paused) return;
	var direction = mouseButton == "right" ? "anticlockwise" : "clockwise";
	if (this.grid.rotateAt(xPixel,yPixel,direction)) {
		this.moves++;
		this.updateMoves();
		this.updateLitCount(this.grid.lit);
	}
	// redraw the border, scroll buttons etc...
}

Game.prototype.quit = function () {
	this.panel.timer.stop();
	this.stopScoring();
	//this.grid.clear();
	this.reflection.home();
}

Game.prototype.restart = function () {}
Game.prototype.leftClick = function () {}
Game.prototype.rightClick = function () {}
Game.prototype.scroll = function () {}

Game.prototype.scroll_grid = function (direction) {
	if (this.paused) return;
	this.grid.scroll(direction);
}

Game.prototype.find_action = function () {
	if (this.paused) return;
	this.grid.find_unlit_node();
}

Game.prototype.toggle_pause = function () {
	if (!this.started) return;
	if (this.paused) {
		this.resume();
	} else {
		this.pause();
	}
}

Game.prototype.pause  = function () {
	// stop the clock
	this.panel.timer.stop();
	this.stopScoring();

	// click events to the grid are disabled by setting the paused status
	this.paused = true;

	// disable any scroll buttons
	if (this.options.xContinuous) {
		this.scrollButton.left.update_staus("disabled");
		this.scrollButton.right.update_staus("disabled");
	} 
	if (this.options.yContinuous) {
		this.scrollButton.up.update_staus("disabled");
		this.scrollButton.down.update_staus("disabled");
	}

	// cover the grid, and the scroll buttons, with a black rectangle
	this.pausePanel = {};

	var x = this.gridOuter.x1;
	var y = this.gridOuter.y1;
	var width = this.gridOuter.x2 - this.gridOuter.x1;
	var height = this.gridOuter.y2 - this.gridOuter.y1;
	this.pausePanel.frame = this.screen.rectangleItem(x,y,width,height,{colour: "#000000"},null);

	var centreX = this.gridOuter.x2 - width/2;
	var centreY = this.gridOuter.y2 - height/2;

	// display "paused" text
	this.pausePanel.text = this.screen.textItem("PAUSED",centreX,centreY - 100,"center",30);

	// and a resume button
	var game = this;
	this.pausePanel.button = this.screen.textButton("RESUME",centreX,centreY + 100,"center",30,{game.resume();});
}

Game.prototype.resume = function () {
	// remove the pause panel
	this.pausePanel.button.remove();
	this.pausePanel.text.remove();
	this.pausePanel.frame.remove();
	this.pausePanel = null;

	// reactivate the scroll buttons
	if (this.options.xContinuous) {
		this.scrollButton.left.update_staus("active");
		this.scrollButton.right.update_staus("active");
		this.scrollButton.left.redraw();
		this.scrollButton.right.redraw();
	} 
	if (this.options.yContinuous) {
		this.scrollButton.up.update_staus("active");
		this.scrollButton.down.update_staus("active");
		this.scrollButton.up.redraw();
		this.scrollButton.down.redraw();
	}

	// redraw the grid
	this.grid.updateScreen();

	// resume redirecting clicks to the grid
	this.paused = false;

	// start the clock
	this.panel.timer.start();
	this.startScoring();
}

Game.prototype.findUnlit = function () {}

Game.prototype.updateMoves = function () {
	this.panel.moveCounterText.update(this.moves + " MOVES",true);
}

Game.prototype.updateLitCount = function (litCount) {
	this.lit = litCount;

	this.panel.progressText.update(this.lit + "/" + this.nodes,true);
	this.panel.progressBar.update(100*this.lit/this.nodes);

	if (this.lit == this.nodes) this.over();
}

Game.prototype.over = function () {
	console.log("game over, score = ",this.score(true),"/",this.par.score);
	this.panel.timer.stop();
	this.stopScoring();
	this.panel.scoreText.update(this.score(true));
	this.complete = true;
}

Game.prototype.updatePar = function (requiredMoves) {
	this.par = {moves: 0, seconds: 0, score: 0};
	this.par.moves = requiredMoves;
	
	var tiles = this.tiling.tiles(this.tilingSize);
	var complexity = this.tiling.complexity;

	seconds = tiles*Math.pow((complexity + 1),2)/30;
	// seconds += requiredMoves/3;
	this.par.seconds = Math.round(seconds);

	this.par.score = this.par.seconds + this.par.moves;

	this.panel.parMoves.update(this.par.moves);
	this.panel.parTime.update(format_seconds(this.par.seconds));
	this.panel.parScore.update(this.par.score);
}

Game.prototype.startScoring = function () {

	var game = this;
	var updateScore = function () {
		if (game.complete) return;
		game.panel.scoreText.update(game.score(true));
	}

	// update each second
	this.scoreSchedule = setInterval(updateScore,1000);
}

Game.prototype.stopScoring = function () {
	clearInterval(this.scoreSchedule);
}

Game.prototype.score = function (log) {
	if (this.nodes == 0) return 0;

	var baseScore = 2*(this.par.seconds + this.par.moves);
	var score = baseScore*this.lit/this.nodes;
	//if (log) console.log("potential score is",score,"out of",baseScore);
	
	var seconds = this.panel.timer.duration()/1000;
	var timePenalty = seconds < this.par.seconds ? 0 : 2*this.par.seconds - this.par.seconds/Math.pow(2,Math.floor(seconds/this.par.seconds) - 1);
	timePenalty += modulo(seconds,this.par.seconds)/Math.pow(2,Math.floor(seconds/this.par.seconds));
	score -= timePenalty;
	//if (log) console.log("time penalty is",timePenalty,"=>",score);

	var movesPenalty = this.moves < this.par.moves ? 0 : 2*this.par.moves - this.par.moves/Math.pow(2,Math.floor(this.moves/this.par.moves) - 1);
	movesPenalty += modulo(this.moves,this.par.moves)/Math.pow(2,Math.floor(this.moves/this.par.moves));
	score -= movesPenalty;
	//if (log) console.log("moves penalty is",movesPenalty,"=>",score);

	return Math.round(score);
}
