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
        //this.image.setScale(pc.device.game.scale);
        this.image.draw(pc.device.ctx, 0, 0);
      }
    }
);

