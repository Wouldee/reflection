
function SidePanel (game,screen,width,thickness) {
	this.game = game;
	this.screen = screen;
	this.width = width;

	this.frame = null;
	this.level = null;
	this.progress = null;
	this.progressBar = null;
	this.timer = null;
	this.parTime = null;
	this.moveCounter = null;
	this.parMoves = null;
	this.pause = null;
	this.newGame = null;
	this.menu = null;
}

SidePanel.prototype.draw = function () {
	var border = {colour: "#ffffff", thickness: game.borderSize, margin: game.margin};
	this.frame = screen.rectangle(0,0,width,1.0,null,border);

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
	game.panel.moveCounterText = screen.text('0 MOVES',centre,220,'center',15);
	screen.text("PAR: ",centre,240,"right",10);
	game.panel.parMoves = screen.text(this.par.moves,centre,240,"left",10);

	// records...

	// buttons
	game.panel.pauseButton   = screen.textButton('PAUSE (P)', centre,350,'center',20,function () {game.pauseAction();});
	game.panel.newGameButton = screen.textButton('NEW GAME',  centre,400,'center',20,function () {game.regenerate();});
	game.panel.menuButton    = screen.textButton('MENU',      centre,450,'center',20,function () {game.quit();});
}