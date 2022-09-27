
function Reflection () {
	var window = document.defaultView;
	var width = document.body.clientWidth; //document.width is obsolete
    var height = document.body.clientHeight; //document.height is obsolete	var width = Math.max(window.innerWidth - 50,800);

	height = Math.max(window.innerHeight - 50,500);

	//width = Math.min(width,3*height/2);
	//height = Math.min(height,2*width/3);

	// console.log("width",width,"height",height);

	this.screen = new Screen('canvas','#000000');

	this.shapes = {};
	this.shapesLoadedCount = 0;

	var reflection = this;
	var loadedAction = function () { reflection.shape_loaded(); }
	var progressAction = function (progress,next) { reflection.shape_progress(progress,next); }

	// arrange for the shpes to inform us of how many images they will load...
	// arrange for them to also inform us of when an image has loaded...
	this.shapes.triangle = new Triangle(loadedAction,progressAction);
	this.shapes.square = new Square(loadedAction,progressAction);
	this.shapes.hexagon = new Hexagon(loadedAction,progressAction);
	this.shapes.octagon = new Octagon(loadedAction,progressAction);
	this.shapes.dodecagon = new Dodecagon(loadedAction,progressAction);

	this.imageCount = 0;
	for (var shape in this.shapes) this.imageCount += this.shapes[shape].imageCount;

	this.tilings = [];
	this.tilings.push(new BoundedTriangular(this.shapes));     //0  size 2-10
	this.tilings.push(new Triangular(this.shapes));            //1  size 2-10
	this.tilings.push(new Squares(this.shapes));               //2  size 2-10
	this.tilings.push(new Hexagonal(this.shapes));             //3  size 2-10
	this.tilings.push(new ElongatedTriangular(this.shapes));   //4  size 1-6
	this.tilings.push(new SnubSquare(this.shapes));            //5  size 2-7
	this.tilings.push(new BoundedTriHexagonal(this.shapes));   //6  size 1-6
	this.tilings.push(new TriHexagonal(this.shapes));          //7  size 2-6
	this.tilings.push(new RhombiTriHexagonal(this.shapes));    //8  size 1-5
	this.tilings.push(new TruncatedSquare(this.shapes));       //9  size 2-9
	this.tilings.push(new TruncatedHexagonal(this.shapes));    //10 size 1-4
	this.tilings.push(new TruncatedTriHexagonal(this.shapes)); //11 size 1-4

	// this.levels = [];
	// tiling,size,xContinuous,yContinuous,mix ratio, growth type
	// this.levels.push([this.tilings[0] ,2, false,false,0.0,"random"]); //1 small bounded triangular, no mixing
	// this.levels.push([this.tilings[2] ,2, false,false,0.5,"random"]); //2 medium bounded squares
	// this.levels.push([this.tilings[1] ,2, true, false,0.0,"random"]); //3 small x-continuous triangular, no mixing
	// this.levels.push([this.tilings[4] ,2, false,true, 0.5,"random"]); //4 small y-continuous elongated-triangular
	// this.levels.push([this.tilings[5] ,3, true, true, 1.0,"random"]); //5 medium continuous snub-square
	// this.levels.push([this.tilings[6] ,1, false,false,0.5 ,"random"]); //6 small bounded tri-hexagonal
	// this.levels.push([this.tilings[3] ,3, true, true, 0.5,"random" ]); //7 medium continuous hexagonal
	// this.levels.push([this.tilings[4] ,3, true, true, 0.5,"random" ]); //8 large continuous elongated-triangular
	// this.levels.push([this.tilings[2] ,9, true, true, 0.5,"acute" ]); //9 large continuous squares
	// this.levels.push([this.tilings[10],2, true, true, 0.5,"random" ]); //10 small continuous truncated-hexagonal
	// this.levels.push([this.tilings[8] ,1, true, true, 0.5,"random" ]); //11 small continuous rhombi-tri-hexagonal
	// this.levels.push([this.tilings[5] ,7, true, true, 0.5,"random" ]); //12 large continuous snub-square
	// this.levels.push([this.tilings[9] ,6, true, true, 0.5,"random" ]); //13 small continuous truncated-square
	// this.levels.push([this.tilings[11],2, true, true, 0.5,"random" ]); //14 medium continuous truncated-tri-hexaxonal
	// this.levels.push([this.tilings[7] ,6, true, false,0.5,"random" ]); //15 large x-continuous tri-hexagonal
	// this.levels.push([this.tilings[8] ,2, true, true, 0.5,"random"]); //16 large continuous rhombi-tri-hexaxonal
	// this.levels.push([this.tilings[3] ,10, true, true, 1.0,"straight" ]); //17 large continuous hexagonal
	// this.levels.push([this.tilings[9] ,9, true, true, 0.5,"random" ]); //18 large continuous truncated-square
	// this.levels.push([this.tilings[10],3, true, true, 0,"random"]); //19 medium continuous truncated-hexaxonal, no mixing
	// this.levels.push([this.tilings[11],4, true, true, 0.5,"random" ]); //20 large continuous truncated-tri-hexaxonal

	this.loading();
}

// display a progress bar
Reflection.prototype.loading = function () {
	this.screen.clear();
	this.loadingBar = this.screen.progressBar(0.1,0.45,0.8,0.1,"#1e3c5a",3,1);
	this.loadingBar.reset();
	this.loadProgress = 0;
	this.nextProgress = 0;
	this.loadStart = Date.now();
	this.lastLoadAt = null;

	// refresh progress
	var reflection = this;
	this.loadingSchedule = setTimeout(function () {reflection.update_progress()},10);
}

// update the actual progress
Reflection.prototype.shape_progress = function (progress,nextProgress) {
	// console.log("shape progress",progress,nextProgress,"divided by",this.imageCount,"=>",this.loadProgress + progress/this.imageCount);
	this.loadProgress += progress/this.imageCount;
	this.nextProgress += nextProgress/this.imageCount;
	this.lastLoadAt = Date.now();
}

// refresh the progress bar
Reflection.prototype.update_progress = function () {
	if (this.loadProgress != 0 && this.lastLoadAt != null) {
		var loadTime = this.lastLoadAt - this.loadStart;
		var loadRate = this.loadProgress/loadTime;

		var duration = Date.now() - this.lastLoadAt;
		var proguess = this.loadProgress + duration*loadRate;

		// console.log("update loading bar to either",proguess,"or",this.nextProgress);
		this.loadingBar.update(Math.min(proguess,this.nextProgress)*100);
	}

	// refresh progress
	var reflection = this;
	this.loadingSchedule = setTimeout(function () {reflection.update_progress()},10);
}

Reflection.prototype.shape_loaded = function () {
	this.shapesLoadedCount++;
	if (this.shapesLoadedCount < 5) return;

	clearInterval(this.loadingSchedule);
	this.home();
}

Reflection.prototype.home = function () {
	var reflection = this;

	this.screen.clear();
	var width = this.screen.width;
	var height = this.screen.height;

	// full-screen bindings, f11, escape....

	var centre = width/2;

	// display stats...

	this.screen.text("REFLECTION",0.5,100,"center",50);

	var coords = [
		0,0,
		Q3*(50)/2,25,
		Q3*(50)/2,75,
		0,100,
		-Q3*(50)/2,75,
		-Q3*(50)/2,25
	];


	// this.screen.polygon(coords,{colour: "#ff0000"},null,{x: 0.5, y: 150});
	// this.screen.polygon([0,0,50,0,50,50,0,50],{colour: "#ff0000"});

	// this.screen.rectangle(0,275,1.0,75,{colour: "#ff00ff", margin: 5},null);

	this.screen.textButton("LEVELS",0.5,300,"center",40,function () { reflection.display_levels()});

	this.screen.textButton("PLAY",0.5,400,"center",40,function () { reflection.play()});

	// var selections = ["Triangular","Square","Elongated Triangular","Snub Square","Hexagonal","Tri-Hexagonal","Truncated Square"];
	// this.screen.selectionDropdown(selections,centre,500,"center",20,function () { reflection.selectTiling()})
}

Reflection.prototype.display_levels = function () {
	this.screen.clear();
	var width = this.screen.width;
	var height = this.screen.height;

	var x = 1/6;
	var y = 1/5;
	for (var n = 1; n <= LEVEL_COUNT; n++) {
		this.level_button(n,x,y);
		x += 1/6;
		if (x > 5/6) {
			x = 1/6;
			y += 1/5;
		}
	}
}

Reflection.prototype.level_button = function (levelNo,x,y) {
	var reflection = this;

	var gameOptions = LEVELS[levelNo];

	// set defaults:
	for (var option in LEVELS.default) {
		if (gameOptions[option] != undefined) continue;

		gameOptions[option] = LEVELS.default[option];
	}

	var action = function () { reflection.play(levelNo,gameOptions); };
	this.screen.textButton(levelNo,x,y,"center",40,action);
}

Reflection.prototype.play = function (levelNo,gameOptions) {
	this.screen.clear();

	// identify the tiling object
	var tiling = null;
	for (var t of this.tilings) {
		if (t.id != gameOptions.tiling) continue;

		tiling = t;
		break;
	}

	if (tiling == null) {
		throw "unknown tiling '"+gameOptions.tiling+"'"
	}

	// console.log("play",levelNo,gameOptions);

	new Game(this,this.screen,levelNo,tiling,gameOptions);
}

init();
