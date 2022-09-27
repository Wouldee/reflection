
// create an html image element
// load with the source image file
// arrange for the loadAction to be invoked once the image has loaded
function load_image (imageSource, loadAction) {
	var image = document.createElement("img");
	image.src = imageSource;

	// arrange for the action to be performed when the image is loaded
	image.addEventListener ("load", function() { loadAction(image); });

	return image;
}

// Converts image to canvas; returns new canvas element
function convert_image_to_canvas(image) {
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	canvas.getContext("2d").drawImage(image, 0, 0);

	return canvas;
}

// Converts canvas to an image
function convert_canvas_to_image(canvas) {
	var image = new Image();
	image.crossOrigin = "anonymous";
	image.setAttribute('crossOrigin', 'anonymous');
	image.src = canvas.toDataURL("image/png");
	return image;
}

// create a scaled image, a wrapper for an html image
// parent will have created, loading and loaded functions invoked upon it
// drawImage (image, x, y)
// imageSource is the filename of the image
// scaleRatio is the ratio to scale the image by before drawing
// has the following attributes in addition to those passed in here
// image     : the html image object
// loaded    : boolean, has the image source loaded
function ScaledImage (parent,sourceImage,scaleRatio,loadAction,loadingAction,loadedAction) {
	game_log("image",1,"new image from",sourceImage,"scaled by",scaleRatio);
	this.parent = parent;
	this.loadAction = loadAction || function () {};
	this.loadingAction = loadingAction || function () {};
	this.loadedAction = loadedAction || function () {};
	this.original = sourceImage;
	this.loaded = false;
	this.scaleRatio = scaleRatio;
	this.loadImage();
	this.loadAction(this);
}

// load (or re-load) the image from the original source
ScaledImage.prototype.loadImage = function () {
	this.loaded = false;
	var scaledImage = this;
	var onLoad = function () { scaledImage.onLoad(); }
	this.image = load_image(this.original.src,onLoad);
	game_log("image",3,"load image for",this,"src",this.image.src);
}

ScaledImage.prototype.resize = function (scaleRatio) {
	game_log("image",2,"resize image",this,"by",scaleRatio);
	this.scaleRatio = scaleRatio;

	// relaod the image from the original if necessary
	// it's not necessary if it's currently in the process of being loaded
	if (this.image.width != this.width && this.image.height != this.height && this.loaded) {
		game_log("image",3,"image not already loaded");
		this.loadImage();
	}

	this.loadAction(this);
}

ScaledImage.prototype.onLoad = function () {
	game_log("image",2,"loaded image @",this.image.width,"x",this.image.height,"should be @",this.width,this.height);

	if (this.width == undefined || this.height == undefined) {
		this.width  = Math.round(this.image.width*this.scaleRatio);
		this.height = Math.round(this.image.height*this.scaleRatio);
		this.loadEstimate = Math.abs(Math.round(Math.log2(this.image.width) - Math.log2(this.width))) + 1;
		// console.log(this.loadEstimate,"loads required to scale from",this.image.width,"to",this.width);
	}

	this.loadingAction(this, 1/this.loadEstimate);

	if (this.image.width == this.width) {
		this.loaded = true;
		this.loadedAction(this);
	} else {
		this.scaleImage();
	}
}

// draw the html image
// the canvas context must already be translated and rotated to the correct location
ScaledImage.prototype.draw = function (x,y) {
	game_log("image",2,"draw image @",x,y);
	this.parent.drawImage(this.image,x,y);
}

// scale the image to the required size
// first function to be called when the image is initially loaded
ScaledImage.prototype.scaleImage = function () {
	game_log("image",2,"scale image",this.width,this.height,this);
	var tileImage = this;
	var image = this.image;

	//console.log("scale image",image.width,"x",image.height,"to",this.width,"x",this.height);

	// if we need to scale down by more than 50%, do it in steps
	// to make the image smoother
	if (this.width < image.width/2) {
		var width = image.width/2;
		var height = image.height/2;
	} else if (this.width > image.width && image.width != this.original.width) {
		game_log("image",2,"image too large -- reload");
		// we need to resize larger than the current image, but smaller than the original
		// (a new resize request must have turned up) re-load the image instead
		this.loadImage();
		return;
	} else {
		var width = this.width;
		var height = this.height;
	}
	game_log("image",3,"scale to",width,height);

	// create a canvas and draw the image on it, scaled to the required size
	var canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.getContext("2d").drawImage(image,0,0,image.width,image.height,0,0,width,height);

	// convert the canvas to an image
	// this does not happen instantaneously, we need to arrange a callback
	var onLoad = function() { tileImage.onLoad(); }
	var scaledImage = convert_canvas_to_image(canvas);
	this.image = scaledImage;
	scaledImage.addEventListener("load",onLoad);
}
