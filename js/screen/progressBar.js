
function ProgressBar (screen,x,y,width,height,colour,thickness,margin) {
	// console.log("progress bar","+",x,"+",y,width,"x",height);
	this.screen = screen;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.fill = {
		colour: colour, 
		margin: margin
	}
	this.border = {
		colour: colour,
		thickness: thickness,
		margin: margin
	};
	this.progress = 0;

	this.outline = screen.rectangle(x,y,width,height,null,this.border);
	this.bar = screen.rectangle(x,y,width,height,this.fill);
}

ProgressBar.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.x = arguments[0];
		this.y = arguments[1];
		this.width = arguments[2];
		this.height = arguments[3];
		this.outline.coordinates(this.x,this.y,this.width,this.height);
		this.bar.coordinates(this.x,this.y,this.width,this.height);
		this.update(this.progress);
	} else {
		return this.outline.coordinates();
	}
}

ProgressBar.prototype.reset = function () {
	// console.log("reset progress bar...");
	this.bar.coordinates(this.x,this.y,0,0);
	// console.log("...reset done");
	this.progress = 0;
}

ProgressBar.prototype.update = function (percent) {
	percent = Math.min(100,Math.max(0,percent));
	// console.log("update progress bar to ",percent,"%, which is",width,"of original width",this.width);
	var width = this.width * percent / 100;
	this.bar.coordinates(this.x,this.y,width,this.height);
	// console.log("...updated",this.bar.width,"/",this.outline.width,this.bar);
	this.progress = percent;
}
