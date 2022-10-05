
function TextButton (screen,text,x,y,alignment,size,action) {
	this.screen = screen;
	this.action = action;
	this.textItem = screen.text(text,x,y,alignment,size);

	var coords = this.textItem.coordinates();
	x1 = coords[0];
	y1 = coords[1];
	x2 = coords[2];
	y2 = coords[3];

	this.listener = screen.addListener(x1,y1,x2,y2,this);
}

TextButton.prototype.remove = function () {
	// delete the listener
	this.screen.remove_listener(this.listener);

	// remove the text
	this.textItem.remove();
}

TextButton.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.textItem.coordinates.apply(this.textItem,arguments);
		this.resize();
	} else {
		return this.textItem.coordinates();
	}
}

TextButton.prototype.resize = function () {
	var coords = this.textItem.coordinates();
	x1 = coords[0];
	y1 = coords[1];
	x2 = coords[2];
	y2 = coords[3];
	this.listener.coordinates(x1,y1,x2,y2);
}

TextButton.prototype.mouseIn = function () {
	this.screen.canvas.style.cursor="pointer"
	game_log("screen",1,'Into button');
}

TextButton.prototype.mouseOut = function () {
	this.screen.canvas.style.cursor="auto"
	game_log("screen",1,'Outof button');
}

TextButton.prototype.click = function (x,y,button,down) {
	if (button == "left") {
		if (down) {
			// change text colour~~~
		} else {
			this.action();
		}
	}
}
