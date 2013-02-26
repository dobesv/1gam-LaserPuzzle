

levels = [
[ " RrgrbRGB ",
  "RmmrmrmrrG",
  " mmrrrrbbR",
  "BbbbmrrrrR",
  " mbbbrmmm ",
  "Ggggmbmbb ",
  "BmgggbbbbB",
  " B  G B B "]
// [ " B    G ",
    //  " brrmrg ",
    //  " brrrrm ",
    //  " bbbmrr ",
    //  " mbbbrm ",
    //  " gggmbb ",
    //  "Bmgggbb ",
    //  " B    B " ]
];

var filterOffset=80;
var filterGridSize = filterOffset*2;
var pivotGridSize = filterGridSize*2;
var cardinals = {up:0,right:90,down:180,left:270};

LaserLayer = pc.Layer.extend('LaserLayer',
    {},
    {
        grid: {
            columns: 0,
            rows: 0,
            lasers:[],
            filters:[],
            sensors:[]
        },

        draw:function() {
            var lineCount = 0;
            var layer = this;
            var grid = this.grid;
            grid.sensors.forEach(function resetFlag(sensor) {
                sensor.lit = false;
            });
            grid.filters.forEach(function resetFlag(filter) {
                filter.lit = false;
            });
            var fireLaserLeft;
            var fireLaserRight;
            var fireLaserUp;
            var fireLaserDown;
            var fireLaser = function(startRow, startColumn, dir, color) {
                var row = startRow;
                var column = startColumn;
                var startX = grid.columnX(column);
                var startY = grid.rowY(row);
                var y=startY;
                var x=startX;
                var ctx = pc.device.ctx;
                var litSensor = null;
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = "4"; //+(20 * grid.scale);
                ctx.moveTo(startX, startY);
                for(;;) {
                    switch(dir) {
                        case 'down': row++; break;
                        case 'up': row--; break;
                        case 'left': column--; break;
                        case 'right': column++; break;
                    }
                    y = grid.rowY(row);
                    x = grid.columnX(column);

                    if(row == grid.bottomRow || column == grid.rightColumn ||
                        row == grid.topRow || column == grid.leftColumn) {
                        var sensor = grid.lookup(row, column);
                        if(typeof(sensor) === 'undefined') {
                            // Off the bottom, extend laser to the edge of the visible area
                            switch(dir) {
                                case 'down': y = grid.screenBottomY; break;
                                case 'up': y = 0; break;
                                case 'left': x = 0; break;
                                case 'right': x = grid.screenRightX; break;
                            }
                        } else if("sensorColor" in sensor && sensor.sensorColor == color) {
                            sensor.lit = true;
                        }
                        ctx.lineTo(x,y);
                        break;
                    }

                    ctx.lineTo(x,y);

                    var filter = grid.lookup(row, column);
                    if(filter.filterColor != 'clear' && filter.filterColor != color) {
                        if(filter.filterColor == 'mirror') {
                            dir = filter.reflection[dir];
                        } else {
                            break;
                        }
                    }
                }
                lineCount++;
                ctx.stroke();
            };
            var drawLaser = function(laser) {
                var laserColor = laser.laserColor;
                if(laser.column == grid.leftColumn) {
                    fireLaser(laser.row, laser.column, 'right', laser.laserColor);
                } else if(laser.row == grid.topRow) {
                    fireLaser(laser.row, laser.column, 'down', laser.laserColor);
                }
            };
            this.grid.lasers.forEach(drawLaser);

            this.grid.sensors.forEach(function(sensor) {
                var sprite = sensor.getComponent('sprite');
                var img = sensor.lit ? 'laser_'+sensor.sensorColor : 'laser_off';
                if(sprite.sprite.spriteSheet.image.name != img) {
                    sprite.sprite.spriteSheet.image = pc.device.loader.get(img).resource;
                }
            });
            //console.log("drawing", lineCount, "lines from", grid.lasers.length, "lasers");

        },

        process:function() {

        }
    });

GameScene = pc.Scene.extend('GameScene',
    {

    },
    {
        backgroundLayer:null,
        gridLayer:null,
        frameLayer:null,

        backgroundResource:null,
        grid: {
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

            lookupRowColumn:[], // Indexed by strings "<row>,<column>" to laser or filter

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
                this.topRowY = 150;
                this.bottomRowY = 625
                this.leftColumnX = 75;
                this.rightColumnX = 705;
                this.targetWidth = this.rightColumnX - this.leftColumnX;
                this.targetHeight = this.bottomRowY - this.topRowY;
                this.fullWidth = (columns-1) * filterGridSize;
                this.fullHeight = (rows-1) * filterGridSize;
                var scale = this.scale = Math.min(this.targetWidth / this.fullWidth, this.targetHeight / this.fullHeight);
                this.columnWidth = filterGridSize * scale
                this.padTop = Math.floor(this.targetHeight - this.fullHeight*scale)/2;
                this.padLeft = Math.floor(this.targetWidth - this.fullWidth*scale)/2;

                console.log("Grid is "+rows+" rows "+columns+" columns; rect ("+this.leftColumnX+","+this.topRowY+") to ("+this.rightColumnX+","+this.bottomRowY+") and scale is "+this.scale+" padding is "+this.padLeft+","+this.padTop);
            },

            lookup: function (row,column) {
                return this.lookupRowColumn[row+","+column];
            },

            update: function(row,column,ent) {
                this.lookupRowColumn[row+","+column] = ent;
                return ent;
            }
        },


        fgbg: function(name)
        {
            var layer = this.addLayer(new pc.EntityLayer(name+" layer", 1, 1));
            layer.addSystem(new pc.systems.Render());
            var ent = pc.Entity.create(layer);
            var sheet = new pc.SpriteSheet({ image:pc.device.loader.get(name).resource });
            ent.addComponent(pc.components.Sprite.create({ spriteSheet: sheet }));
            ent.addComponent(pc.components.Spatial.create({ x:0, y:0 }));
            return layer;
        },

        setupGrid: function(level) {
            var rows = level.length;
            var columns = level[0].length;
            var grid = this.grid;
            grid.setDimensions(rows,columns);

            if(rows <= 2) {
                alert("Need more than 2 rows for a real level.  Something must be wrong.");
                return false;
            }
            level.forEach(function(rowSpec, n) {
                if(rowSpec.length != columns) {
                    alert("Row "+(n+1)+" ("+rowSpec+") isn't the same width as the first row.");
                    return false;
                }
            });


            var layer = this.gridLayer = this.addLayer(new pc.EntityLayer("puzzle pieces"));
            layer.addSystem(new pc.systems.Render());
            console.log("screen", layer.screenX(0), layer.screenY(0));
            var scene = this;

            var setupLaser = function(row,column,laserColor,angle) {
                if(! laserColor)
                {
                    scene.warn("Invalid laser color at row "+row+" column "+column);
                    return;
                }
                var laserImage = pc.device.loader.get('laser_'+laserColor).resource;
                var laserSheet = new pc.SpriteSheet({
                    image:laserImage,
                    useRotation:true,
                    scaleX:grid.scale,
                    scaleY:grid.scale
                });
                var laser = pc.Entity.create(layer);
                laser.addComponent(pc.components.Sprite.create({ spriteSheet: laserSheet }));
                laser.addComponent(pc.components.Spatial.create({
                    x: grid.columnX(column)-(laserImage.width*0.5),
                    y: grid.rowY(row)-(laserImage.height*0.5),
                    w: laserImage.width,
                    h: laserImage.height,
                    dir:(angle+270)%360
                }));
                //console.log("Laser at", grid.columnX(column), grid.rowY(row), grid.columnX(column)-(laserImage.width*0.5*grid.scale), grid.rowY(row)-(laserImage.height*0.5*grid.scale));
                laser.laserColor = laserColor;
                laser.row = row;
                laser.column = column;
                grid.update(row, column, laser);
                grid.lasers.push(laser);
            };

            var setupSensor = function(row,column,laserColor,angle) {
                if(! laserColor)
                {
                    scene.warn("Invalid laser color at row "+row+" column "+column);
                    return;
                }
                var laserImage = pc.device.loader.get('laser_off').resource;
                var laserSheet = new pc.SpriteSheet({
                    image:laserImage,
                    useRotation:true,
                    scaleX:grid.scale,
                    scaleY:grid.scale
                });
                var sensor = pc.Entity.create(layer);
                sensor.addComponent(pc.components.Sprite.create({ spriteSheet: laserSheet }));
                sensor.addComponent(pc.components.Spatial.create({
                    x: grid.columnX(column)-(laserImage.width*0.5),
                    y: grid.rowY(row)-(laserImage.height*0.5),
                    dir:(angle+270)%360
                }));
                //console.log("Sensor at", grid.columnX(column), grid.rowY(row), grid.scale, grid.columnX(column)-(laserImage.width*0.5*grid.scale), grid.rowY(row)-(laserImage.height*0.5*grid.scale));
                sensor.sensorColor = laserColor;
                sensor.row = row;
                sensor.column = column;
                grid.update(row, column, sensor);
                grid.sensors.push(sensor);
            };

            var colorLetterToWord = {r:"red", g:"green", b:"blue", m:"mirror"};
            var setupTopLasers = function(rowSpec) {
                scene.info('Top lasers: '+rowSpec);
                var row = grid.topRow;
                for(var column=1; column < columns-1; column++) {
                    var colChar = rowSpec[column];
                    if(colChar != ' ') {
                        setupLaser(row, column, colorLetterToWord[colChar], 180);
                    }
                }
            };
            var setupBottomSensors = function(rowSpec) {
                scene.info('Bottom sensors: '+rowSpec);
                var row = grid.bottomRow;
                for(var column=1; column < columns-1; column++) {
                    var colChar = rowSpec[column];
                    if(colChar != ' ') {
                        setupSensor(row, column, colorLetterToWord[colChar], 0);
                    }
                }
            };
            var setupLeftLaser = function(colChar, row) {
                if(colChar == ' ')
                    return;
                setupLaser(row, 0, colorLetterToWord[colChar], 90);
            };
            var setupRightSensor = function(colChar, row) {
                if(colChar == ' ')
                    return;
                setupSensor(row, columns-1, colorLetterToWord[colChar], 270);
            };

            var setupFilter = function(row, column, color, pivot) {
                var filterImage = pc.device.loader.get('filter_'+color).resource;
                var top = (row%2) == 1;
                var left = (column%2) == 1;
                var filterSheet = new pc.SpriteSheet({
                    image:filterImage,
                    useRotation:true,
                    scaleX:grid.scale,
                    scaleY:grid.scale
                });
                var filter = pc.Entity.create(layer);
                filter.addComponent(pc.components.Sprite.create({ spriteSheet: filterSheet }));
                filter.addComponent(pc.components.Spatial.create({
                    x: grid.columnX(column)-(filterImage.width/2),
                    y: grid.rowY(row)-(filterImage.height/2),
                    dir: top?(left?90:180):(left?0:270)
                }));
                //console.log("filter at", grid.columnX(column), grid.rowY(row), grid.scale, grid.columnX(column)-(filterImage.width/2*grid.scale), grid.rowY(row)-(filterImage.height/2*grid.scale));
                filter.filterColor = color;
                filter.row = row;
                filter.column = column;
                filter.pivot = pivot;
                if(color == 'mirror') {
                    filter.reflection = {
                        down:(top == left)?'left':'right',
                        up:(top == left)?'right':'left',
                        left:(top == left)?'down':'up',
                        right:(top == left)?'up':'down'
                    };
                }
                grid.update(row, column, filter);
                grid.filters.push(filter);
            }
            var setupPivot = function(row, column, tl, tr, br, bl) {
                if(!(tl && tr && br && bl))
                    return; // Bad color somewhere
                var pivotImage = pc.device.loader.get('pivot').resource;
                var pivotSheet = new pc.SpriteSheet({
                    image:pivotImage,
                    useRotation:true,
                    scaleX:grid.scale,
                    scaleY:grid.scale
                });
                var pivot = pc.Entity.create(layer);
                pivot.addComponent(pc.components.Sprite.create({ spriteSheet: pivotSheet }));
                pivot.addComponent(pc.components.Spatial.create({
                    x: grid.columnX(column) + grid.columnWidth/2 - pivotImage.width/2,
                    y: grid.rowY(row) + grid.columnWidth/2 - pivotImage.height/2,
                    w: pivotImage.width,
                    h: pivotImage.height
                }));
                setupFilter(row,   column,   tl);
                setupFilter(row,   column+1, tr);
                setupFilter(row+1, column+1, br);
                setupFilter(row+1, column,   bl);
                pivot.row = row;
                pivot.column = column;
                pivot.handleClick = function() {
                    //console.log("Rotate pivot", row, column, tl, tr, br, bl);
                    // Remove old filters and add new ones, rotated.
                    grid.filters = grid.filters.filter(function(f) {
                        if((f.column == column || f.column == column+1)
                            && (f.row == row || f.row == row+1)) {
                            f.remove();
                            return false;
                        }
                        return true;
                    });
                    grid.pivots = grid.pivots.filter(function(p) { return !(p.row == row && p.column == column); });
                    pivot.remove();
                    setupPivot(row, column, bl, tl, tr, br);
                }
                grid.pivots.push(pivot);
            };
            var bottomRow = grid.bottomRow;
            level.forEach(function(rowSpec, row) {
                rowSpec = rowSpec.toLowerCase();
                if(row == 0) {
                    setupTopLasers(rowSpec);
                } else if(row == bottomRow) {
                    setupBottomSensors(rowSpec);
                } else {
                    setupLeftLaser(rowSpec[0], row);
                    setupRightSensor(rowSpec[rowSpec.length-1], row);
                    if(row < (rows-1) && (row % 2) == 1) {
                        var nextRowSpec = level[row+1];
                        for(var column=1; column < columns-1; column += 2) {
                            var tl = colorLetterToWord[rowSpec[column]];
                            var tr = colorLetterToWord[rowSpec[column+1]];
                            var br = colorLetterToWord[nextRowSpec[column+1]];
                            var bl = colorLetterToWord[nextRowSpec[column]];
                            //console.log("pivot", row, column, tl, tr, br, bl);
                            setupPivot(row, column, tl, tr, br, bl);
                        }
                    }
                }
            });


        },

        onAction:function(actionName) {
            //console.log('Action', actionName, pc.device.input.mousePos.x, pc.device.input.mousePos.y);
            var self = this;
            function whatIsUnderTheMouse() {
                var x = pc.device.input.mousePos.x;
                var y = pc.device.input.mousePos.y;
                var foundPivot = null;
                var grid = self.grid;
                self.grid.pivots.forEach(function(pivot) {
                    var leftX = grid.columnX(pivot.column);
                    var rightX = grid.columnX(pivot.column+1);
                    var topY = grid.rowY(pivot.row);
                    var bottomY = grid.rowY(pivot.row+1);
                    if(x >= leftX && x <= rightX && y >= topY && y <= bottomY) {
                        foundPivot = pivot;
                    }
                });
                return foundPivot;
            }
            if(actionName == 'press') {
                this.pressed = whatIsUnderTheMouse();
            } else if(actionName == 'release') {
                if(!this.pressed)
                    return;
                var onWhat = whatIsUnderTheMouse();
                if(onWhat === this.pressed) {
                    onWhat.handleClick();
                }
            }
        },

        init:function ()
        {
            this._super();

            this.backgroundLayer = this.fgbg('bg');
            this.backgroundLayer.setZIndex(1)
            this.setupGrid(levels[0]);
            this.gridLayer.setZIndex(5);

            this.laserLayer = new LaserLayer('Laser layer', 3);
            this.addLayer(this.laserLayer);
            this.laserLayer.grid = this.grid;
            this.laserLayer.setZIndex(2);

            this.frameLayer = this.fgbg('frame');
            this.frameLayer.setZIndex(10)

            pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
            pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
            pc.device.input.bindAction(this, 'press', 'TOUCH');
            pc.device.input.bindAction(this, 'release', 'TOUCH_END');
        }


    });
TheGame = pc.Game.extend('TheGame',
    {},
    {
        gameScene:null,

        onReady:function ()
        {
            this._super(); // call the base class' onReady

            // disable caching when developing
            if (pc.device.devMode)
                pc.device.loader.setDisableCache();

            // load up resources
            pc.device.loader.add(new pc.Image('bg', 'images/bg.jpg'));
            pc.device.loader.add(new pc.Image('frame', 'images/frame.png'));
            pc.device.loader.add(new pc.Image('beam_blue_end', 'images/Beam_blue_end.png'));
            pc.device.loader.add(new pc.Image('beam_blue_mid', 'images/Beam_blue_mid.png'));
            pc.device.loader.add(new pc.Image('beam_green_end', 'images/Beam_green_end.png'));
            pc.device.loader.add(new pc.Image('beam_green_mid', 'images/Beam_green_mid.png'));
            pc.device.loader.add(new pc.Image('beam_red_end', 'images/Beam_red_end.png'));
            pc.device.loader.add(new pc.Image('beam_red_mid', 'images/Beam_red_mid.png'));
            pc.device.loader.add(new pc.Image('filter_blue', 'images/filter_blue.png'));
            pc.device.loader.add(new pc.Image('filter_green', 'images/filter_green.png'));
            pc.device.loader.add(new pc.Image('filter_red', 'images/filter_red.png'));
            pc.device.loader.add(new pc.Image('filter_mirror', 'images/filter_mirror.png'));
            pc.device.loader.add(new pc.Image('filter_clear', 'images/filter_clear.png'));
            pc.device.loader.add(new pc.Image('laser_off', 'images/laser_off.png'));
            pc.device.loader.add(new pc.Image('laser_red', 'images/laser_red.png'));
            pc.device.loader.add(new pc.Image('laser_green', 'images/laser_green.png'));
            pc.device.loader.add(new pc.Image('laser_blue', 'images/laser_blue.png'));
            pc.device.loader.add(new pc.Image('pivot', 'images/Pivot.png'));

            // fire up the loader (with a callback once done)
            pc.device.loader.start(this.onLoading.bind(this), this.onLoaded.bind(this));
        },

        onLoading:function (percentageComplete)
        {
            // display progress, such as a loading bar
            var ctx = pc.device.ctx;
            ctx.clearRect(0, 0, pc.device.canvasWidth, pc.device.canvasHeight);
            ctx.font = "normal 50px Verdana";
            ctx.fillStyle = "#8f8";
            ctx.fillText('Lazer Puzzle', 40, (pc.device.canvasHeight / 2) - 50);
            ctx.font = "normal 18px Verdana";
            ctx.fillStyle = "#777";

            ctx.fillText('Loading: ' + percentageComplete + '%', 40, pc.device.canvasHeight / 2);
        },

        onLoaded:function ()
        {
            // we're ready; make the magic happen
            this.gameScene = new GameScene();
            this.addScene(this.gameScene);

        }
    });


