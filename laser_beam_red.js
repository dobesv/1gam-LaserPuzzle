(function(window) {
laser_pulse_instance_1 = function() {
	this.initialize();
}
laser_pulse_instance_1._SpriteSheet = new SpriteSheet({images: ["laser_beam_red.png"], frames: [[2,2,99,10,0,49.35,4.95],[103,2,99,10,0,49.35,4.95],[2,14,99,10,0,49.35,4.95],[103,14,99,10,0,49.35,4.95],[2,26,99,10,0,49.35,4.95],[103,26,99,10,0,49.35,4.95],[2,38,99,10,0,49.35,4.95],[103,38,99,10,0,49.35,4.95],[2,50,99,10,0,49.35,4.95],[103,50,99,10,0,49.35,4.95],[2,62,99,10,0,49.35,4.95],[103,62,99,10,0,49.35,4.95]]});
var laser_pulse_instance_1_p = laser_pulse_instance_1.prototype = new BitmapAnimation();
laser_pulse_instance_1_p.BitmapAnimation_initialize = laser_pulse_instance_1_p.initialize;
laser_pulse_instance_1_p.initialize = function() {
	this.BitmapAnimation_initialize(laser_pulse_instance_1._SpriteSheet);
	this.paused = false;
}
window.laser_pulse_instance_1 = laser_pulse_instance_1;
}(window));

