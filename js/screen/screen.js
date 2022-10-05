
//var width = document.body.clientWidth; //document.width is obsolete
//var height = document.body.clientHeight; //document.height is obsolete
//console.log("document body width",document.body.clientWidth,"height",document.body.clientHeight);
//console.log("window inner width",window.innerWidth,"height",window.innerHeight);
//console.log("window outer width",window.outerWidth,"height",window.outerHeight);

//height = Math.max(window.innerHeight - 50,500);

// screen constructor
// screen is a wrapper for the html canvas
// canvasId is the id of the html canvas'
// width and height are in pixels
// background colour
function Screen (canvasId,colour) {
	// attributes
	this.canvas = document.getElementById(canvasId);
	this.context = this.canvas.getContext("2d");
	this.colour = colour;
	this.items = [];
	this.buttons = [];
	this.listeners = [];
	this.mouseInside = null;
	this.keyboardHandler = null;
	this.resizeHandler = null;

	// set dimensions, background, setup event bindings

	// determine width & height
	// canvas fills browser window entirely
	var window = document.defaultView;
	this.width = window.innerWidth;
	this.height = window.innerHeight - 4;
	
	this.canvas.width = this.width;
	this.canvas.height = this.height;

	// disable right-click menu
	this.canvas.oncontextmenu = function (e) { e.preventDefault(); };

	var screen = this;
	this.canvas.addEventListener("mousedown", function (mouseEvent) {screen.click(mouseEvent,true); mouseEvent.stopPropagation();}, false);
	this.canvas.addEventListener("mouseup", function (mouseEvent) {screen.click(mouseEvent,false); mouseEvent.stopPropagation();}, false);
	this.canvas.addEventListener("mousemove", function (mouseEvent) {screen.motion(mouseEvent); mouseEvent.stopPropagation();}, false);
	document.addEventListener("keydown", function (keyboardEvent) {screen.keyPress(keyboardEvent); keyboardEvent.stopPropagation();}, false);

	//this.canvas.addEventListener("resize", function () {canvas_resize();}, false);
	window.onresize = function () {screen.resize();};
}

Screen.prototype.keyPress = function (keyboardEvent) {
	// console.log("keypress",keyboardEvent);

	// intercept certain events~~~?

	if (this.keyboardHandler != null) {
		this.keyboardHandler.keyPress(keyboardEvent.key);
	}
}

Screen.prototype.passKeyEvents = function (handler) {
	this.keyboardHandler = handler;
}

// delete everything currently displayed on the canvas
Screen.prototype.clear = function () {
	this.context.clearRect(0, 0, this.width, this.height);
	this.listeners = [];
	this.items = [];
	this.buttons = [];
	this.keyboardHandler = null;
	this.resizeHandler = null;

	// fill with the background colour
	this.context.fillStyle = this.colour;
	this.context.fillRect(0,0,this.width,this.height);
}

// called whenever the browser window is resized
Screen.prototype.resize = function () {
	var window = document.defaultView;
	this.width = window.innerWidth;
	this.height = window.innerHeight - 5;

	// console.log("window resized to",window.innerWidth,window.innerHeight);

	this.canvas.width = this.width;
	this.canvas.height = this.height;

	// fill with the background colour
	this.context.fillStyle = this.colour;
	this.context.fillRect(0,0,this.width,this.height);

	if (this.resizeHandler != null) {
		this.resizeHandler.resize();
	} else {
		for (var item of this.items) {
			item.resize();
			item.draw();
		}

		for (var button of this.buttons) {
			button.resize();
		}
	}

}

Screen.prototype.passResizeEvents = function (handler) {
	this.resizeHandler = handler;
}

// called when the canvas is clicked
// check if a widget that listens for mouse events was clicked on
// if so, invoke the function associated
Screen.prototype.click = function (mouseEvent,buttonDown) {
	// determine the x,y pixel of the click
    var coordinate = this.mouseCoordinate(mouseEvent);
	var x = coordinate[0];
	var y = coordinate[1];

	var button = "";
	switch (mouseEvent.button) {
		case -1:
			// no button pressed
			// ignore mouse event entirely~~~
			return;
		case 0:
			button = "left"; break;
		case 1:
			button = "middle"; break;
		case 2:
			button = "right"; break;
		case 3:
			// browser back button~~~???
			game_log("screen",0,"mouse event for button 3");
			return;
		case 4:
			// browser forward button~~~???
			game_log("screen",0,"mouse event for button 4");
			return;
	}

	// each e.g. button
	for (var i = 0; i < this.listeners.length; i++) {
		var listener = this.listeners[i];
		if (listener.inside(x,y)) {
			// found a listener covering the clicked pixel
			if (listener.widget.click != undefined) {
				listener.widget.click(x,y,button,buttonDown);
			}
			// probably should break~~~
		}
	}
}

// called when the mouse moves on the canvas
// check if a widget that listens for mouse events was clicked on
// if so, invoke the function associated
Screen.prototype.motion = function (mouseEvent) {
	// determine the x,y pixel of the click
    var coordinate = this.mouseCoordinate(mouseEvent);
	var x = coordinate[0];
	var y = coordinate[1];

	if (this.mouseInside != null) {
		if (this.mouseInside.inside(x,y)) return;
		if (this.mouseInside.widget.mouseOut != undefined) {
			this.mouseInside.widget.mouseOut();
		}
		this.mouseInside = null;
	}

	// each item that is interested in motion
	for (var i = 0; i < this.listeners.length; i++) {
		var listener = this.listeners[i];
		if (!listener.inside(x,y)) continue;
		// found a listener covering pixel
		this.mouseInside = listener;
		if (this.mouseInside.widget.mouseIn != undefined) {
			this.mouseInside.widget.mouseIn();
		}
		return;
	}
}

// determine the x,y pixel of the given mouse event (e.g click)
Screen.prototype.mouseCoordinate = function (mouseEvent) {
    var x;
    var y;

	// ~~~
    if (mouseEvent.pageX != undefined && mouseEvent.pageY != undefined) {
		x = mouseEvent.pageX;
		y = mouseEvent.pageY;
    } else {
		x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

	x -= this.canvas.offsetLeft;
    y -= this.canvas.offsetTop;

    var coordinate = [x, y];
	return coordinate;
}

Screen.prototype.horizontal = function (x) {
	var horizontal;
	if (x > 1 || x < -1) {
		horizontal = x;
	} else {
		horizontal = x*this.width
	}
	//if (x < 0) horizontal = this.width - horizontal;

	return horizontal;
}

Screen.prototype.vertical = function (y) {
	var vertical;
	if (y > 1 || y < -1) {
		vertical = y;
	} else {
		vertical = y*this.height
	}
	//if (y < 0) vertical = this.height - vertical;

	return vertical;
}

// register a listener for mouse events within the specified area
// listeners are destroyed when screen.clear() is called
Screen.prototype.addListener = function(x1,y1,x2,y2,widget) {
	var listener = new Listener (x1,y1,x2,y2,widget);
	this.listeners.push(listener);
	return listener;
}

Screen.prototype.remove_listener = function(listener) {
	// remove from listener array, log warning if not present
	var index = this.listeners.indexOf(listener);
	if (index == -1) {
		console.log("removal of non-existent listener requested:",listener);
	}
	this.listeners.splice(index,1);

	// check if mouse currently inside the listener
	if (listener == this.mouseInside) {
		this.mouseInside = null;
	}
}

// draw rectangle on screen at x,y with width and height (all in pixels)
Screen.prototype.drawRectangle = function (x,y,width,height,colour) {
	// console.log("draw",colour,"rectangle @",x,y,width,"x",height);
	this.context.save();
	this.context.fillStyle = colour;
	this.context.fillRect(x,y,width,height);
	this.context.restore();
}

// draw rectangle on screen at x,y with width and height (all in pixels)
Screen.prototype.drawRectangleOutline = function (x,y,width,height,colour,thickness) {
	// console.log("draw",colour,"rectangle outline",thickness,"@",x,y,width,"x",height);
	this.context.save();
	this.context.beginPath();
	this.context.lineWidth = thickness;
	this.context.strokeStyle = colour;
	this.context.rect(x,y,width,height);
	this.context.stroke();
	this.context.restore();
}

// draw the text on the canvas
// return the metrics object for the associated text~~~
Screen.prototype.drawText = function (text,x,y,alignment,size,font,colour) {
	this.context.save();
	this.context.textAlign = alignment;
	this.context.font = size + 'pt ' + font;
	this.context.fillStyle = colour;
	this.context.fillText(text,x,y);
	this.context.restore();
}

// fill and border are colours (null means no colour)
// thickness is the thickness of the border
Screen.prototype.rectangle = function (x,y,width,height,fill,border,origin) {
	var rectangle = new RectangleItem(this,x,y,width,height,fill,border,origin);
	this.items.push(rectangle);
	return rectangle;
}

Screen.prototype.rectangleButton = function (x,y,width,height,fill,border,action,origin) {
	var button =  new RectangleButton(this,x,y,width,height,fill,border,action,origin);
	this.buttons.push(button);
	return button;
}

Screen.prototype.polygon = function (coords,fill,border,origin) {
	var polygon = new PolygonItem(this,coords,fill,border,origin);
	this.items.push(polygon);
	return polygon;
}

Screen.prototype.polygonButton = function (coords,fill,border,action,origin) {
	var button = new PolygonButton(this,coords,fill,border,action,origin);
	this.buttons.push(button);
	return button;
}

// add text to the screen
Screen.prototype.text = function (text, x, y, alignment, size) {
	var textItem = new TextItem (this,text,x,y,alignment,size);
	this.items.push(textItem);
	return textItem;
}

// add text to the screen and arrange for the function action to be
// invoked upon click. action will be passed the x,y pixel, and button of the click
Screen.prototype.textButton = function (text, x, y, alignment, size, action) {
	var button = new TextButton(this,text,x,y,alignment,size,action);
	this.buttons.push(button);
	return button;
}

Screen.prototype.selectionDropdown = function (selections,x,y,alignment,size,action) {
	return new SelectionDropdown(this,selections,x,y,alignment,size,action);
}

Screen.prototype.timer = function (x, y, size) {
	return new Timer (this,x,y,size);
}

Screen.prototype.progressBar = function (x,y,width,height,colour,thickness,margin) {
	return new ProgressBar(this,x,y,width,height,colour,thickness,margin);
}

function Listener (x1,y1,x2,y2,widget) {
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
	this.widget = widget;
}

Listener.prototype.coordinates = function (x1,y1,x2,y2) {
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
}

Listener.prototype.inside = function (x,y) {
	return this.x1 <= x && this.x2 >= x 
		&& this.y1 <= y && this.y2 >= y;
}
