
function Timer (screen, x, y, size) {
	this.screen = screen;
	this.x = x;
	this.y = y;
	this.size = size;
	this.minuteText = screen.text("00:",x,y,"right",size);
	this.secondText = screen.text("00.",x,y,"left",size);
	this.centisecondText = screen.text("00",this.secondText.coordinates()[2],y,"left",size/2);
	this.running = 0;
	this.schedule = null;

	this.reset();
}

Timer.prototype.coordinates = function () {
	if (arguments.length > 0) {
		this.x = arguments[0];
		this.y = arguments[1];
		this.minuteText.coordinates(this.x,this.y);
		this.secondText.coordinates(this.x,this.y);
		this.centisecondText.coordinates(this.secondText.coordinates()[2],this.y);
	} else {
		var coords = this.minuteText.coordinates();
		coords[2] = this.centisecondText.coordinates()[2];
		return coords;
	}
}

Timer.prototype.reset = function () {
	var now = Date.now();
	this.startTime = now;
	this.stopTime = now;
	this.centiSeconds = 0;
	this.seconds = 0;
	this.minutes = 0;
	this.minuteText.update("00:");
	this.secondText.update("00.");
	this.centisecondText.update("00");
}

Timer.prototype.start = function () {
	if (this.running) return;

	var now = Date.now();
	// adjust the start time to compensate for the amount of time we were stopped for
	this.startTime = this.startTime + now - this.stopTime;

	var self = this;

	var update_timer = function() {
		self.update();
	}

	// schedule the timer to update every 30 milliseconds
	this.schedule = setInterval(update_timer,30);
	this.running = 1;
}

Timer.prototype.stop = function () {
	if (!this.running) return;

	clearInterval(this.schedule);
	var now = Date.now();
	this.stopTime = now;
	this.running = 0;
}


Timer.prototype.update = function () {
	var now = Date.now();
	var duration = now - this.startTime;

	// update displayed hundredths of a second
	var centiSeconds = (Math.round(duration/10))%100;
	this.centiSeconds = centiSeconds;
	this.centisecondText.update(pad_number(centiSeconds,2));

	// update seconds & minutes if necessary
	var seconds = (Math.floor(duration/1000))%60;
	if (seconds !== this.seconds) {
		var minutes = Math.floor(duration/60000);

		if (duration >= 6000000) {
			// maximum time reached
			// force stop
			this.stop();
			this.centiSeconds = 99;
			this.centisecondText.update(this.centiSeconds);
			seconds = 59;
			minutes = 99;
		}
		this.seconds = seconds;
		this.minutes = minutes;

		this.secondText.update(pad_number(seconds,2) + ".");
		this.minuteText.update(pad_number(minutes,2) + ":");
	}
}

Timer.prototype.duration = function (duration) {
	var now = Date.now();

	if (duration != undefined) {
		// update the timer with the given duration, which is in milliseconds
		this.startTime = now - duration;
	} else {
		duration = now - this.startTime;
	}

	return duration;
}
