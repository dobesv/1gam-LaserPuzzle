ImageLayer = pc.Layer.extend('ImageLayer',
    {},
    {
      image: null,

      init:function(resourceName, name, zIndex) {
        this._super(name, zIndex);
        this.image = pc.device.loader.get(resourceName).resource;
        //console.log("ImageLayer.init", resourceName, name, zIndex, this.image);
      },

      draw:function() {
        this.image.draw(pc.device.ctx, 0, 0);
      }
    }
);

/**
 * Check if the mouse is currently over the given image.  Assumes the
 * image is not scaled and that the image has had screen x and y coordinates
 * added to it.
 *
 * @param image
 * @returns {boolean}
 */
var onImage = function(image) {
  var x = pc.device.input.mousePos.x - image.x;
  var y = pc.device.input.mousePos.y - image.y;
  return (x >= 0 && x < image.width &&
      y >= 0 && y < image.height);


};
