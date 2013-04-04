Grid = pc.Base.extend('Grid', {}, {
  columns:0,
  rows:0,
  topRow:0,
  topRowY:0,
  bottomRow:0,
  bottomRowY:0,
  leftColumn:0,
  leftColumnX:0,
  rightColumn:0,
  rightColumnX:0,
  pivots:[],
  lasers:[],
  filters:[],
  sensors:[],
  targetWidth:0,
  targetHeight:0,
  fullWidth:0,
  fullHeight:0,
  screenBottomY:768,
  screenRightX:1024,
  scale:1,
  solved:false,

  lookupRowColumn:{}, // Indexed by strings "<row>,<column>" to laser or filter

  // Get the Y coordinate of the given row
  // The first row is numbered 1, in lua tradition
  rowY: function rowY(n)
  {
    if(n == this.topRow) return this.topRowY;
    if(n == this.bottomRow) return this.bottomRowY;
    return Math.round(this.topRowY + this.padTop + (n * filterGridSize) * this.scale);
  },
  // Get the X coordinate of the given column
  // Note that the left and right columns have the emitters and the
  // middle columns have the filters.
  // The first column is number 0, in lua tradition
  columnX: function columnX(n) {
    if(n == this.leftColumn) return this.leftColumnX;
    if(n == this.rightColumn) return this.rightColumnX;
    return Math.round(this.leftColumnX + this.padLeft + (n * filterGridSize) * this.scale);
  },

  setDimensions: function(rows,columns) {
    this.topRow = 0;
    this.bottomRow = rows-1;
    this.leftColumn = 0;
    this.rightColumn = columns-1;
    this.topRowY = 130;
    this.bottomRowY = 635;
    this.leftColumnX = 75;
    this.rightColumnX = 705;
    this.targetWidth = this.rightColumnX - this.leftColumnX;
    this.targetHeight = this.bottomRowY - this.topRowY;
    this.fullWidth = (columns-1) * filterGridSize;
    this.fullHeight = (rows-1) * filterGridSize;
    var scale = this.scale = Math.min(this.targetWidth / this.fullWidth, this.targetHeight / this.fullHeight);
    this.columnWidth = filterGridSize * scale;
    this.padTop = Math.floor(this.targetHeight - this.fullHeight*scale)/2;
    this.padLeft = Math.floor(this.targetWidth - this.fullWidth*scale)/2;

  },

  lookup: function (row,column) {
    return this.lookupRowColumn[row+","+column];
  },

  update: function(row,column,ent) {
    this.lookupRowColumn[row+","+column] = ent;
    return ent;
  },

  clear: function() {
    var removeIt = function(x) {x.remove();};
    this.pivots.forEach(removeIt);
    this.pivots = [];
    this.lasers.forEach(removeIt);
    this.lasers = [];
    this.filters.forEach(removeIt);
    this.filters = [];
    this.sensors.forEach(removeIt);
    this.sensors = [];
    this.lookupRowColumn = {};
    this.setDimensions(1,1);
  }
});