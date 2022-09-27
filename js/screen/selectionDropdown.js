
function SelectionDropdown (screen,selections,x,y,alignment,size,action) {
	var selection = this;
	selection.screen = screen;
	selection.action = action;

	var downArrow = "\u25BC";
	var x1 = x, x2 = x, y1 = y, y2 = y;

	for (var selectionText of selections) {
		var textItem = screen.text(selectionText+downArrow,x,y,alignment,size);
		var dimensions = textItem.dimensions();
		x1 = Math.min(dimensions[0],x1);
		y1 = Math.min(dimensions[1],y1);
		x2 = Math.max(dimensions[2],x2);
		y2 = Math.max(dimensions[3],y2);
		textItem.remove();
	}

	selection.listener = screen.addListener(x1,y1,x2,y2,selection);
	selection.arrowText = screen.text(downArrow,x2,y,"right",size);
	// console.log(selection);

	screen.rectangle(x1,y1,x2 - x1,y2 - y1,null,{colour: "#ffffff"});
}

SelectionDropdown.prototype.mouseIn = function () {
	this.screen.canvas.style.cursor="pointer"
	game_log("screen",1,'Into button');
}

SelectionDropdown.prototype.mouseOut = function () {
	this.screen.canvas.style.cursor="auto"
	game_log("screen",1,'Outof button');
}

SelectionDropdown.prototype.click = function (x,y,button,down) {
	if (button == "left") {
		if (down) {
			//console.log("dropdown click");
		} else {
			// console.log("dropdown release");
		}
	}
}


