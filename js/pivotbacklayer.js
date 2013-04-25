PivotBackLayer = pc.Layer.extend('PivotBackLayer', {}, {
  grid:null,
  image:null,

  init:function(grid, name, zIndex) {
    this._super(name, zIndex);
    this.grid = grid;
    this.image = getImage('pivot_back');
  },

  draw:function() {
    this.image.setScale(this.grid.scale, this.grid.scale);
    this.grid.pivots.forEach(function(pivot) {
      var sp = pivot.getComponent('spatial');
      var center = sp.getCenterPos();
      var x = center.x - this.image.width/2;
      var y = center.y - this.image.height/2;
      this.image.draw(pc.device.ctx, 0, 0, x, y, this.image.width, this.image.height, sp.dir);
    }, this);
  }
});