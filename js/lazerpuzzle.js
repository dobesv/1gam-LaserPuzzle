
levels = [
[ " g br   ",
  " gmbmrrr",
  " grmbbbb",
  " grbmbr ",
  " mgggggg",
  "        "],

[ " br  g  ",
  " brrmgr ",
  " brrrmgG",
  " bmrrrm ",
  " mbbbmr ",
  " gggmbr ",
  "bbbmgbr ",
  "   B BR " ],
[ "    gr  ",
  "bbb m m ",
  " mm  r R",
  " brmbrg ",
  "rrmg  m ",
  "ggggm m ",
  " mgggm R",
  "  G G B "],
[ "    r   ",
  "bbb m m ",
  " bm  b B",
  "bbb  b B",
  "bbmr rm ",
  "rrrrmbm ",
  "r rmrbb ",
  "  RRR B "],
[ "    br    ",
  "bbbbm mm B",
  "gggmbr br ",
  "rrr  rmmr ",
  " rm  rrrrR",
  "gg gm  bbB",
  "rrmgg rbm ",
  "   ggrr   "]
];

var scrambleLevel = function scrambleLevel(level) {
    for(var row=1; row<level.length-1; row+=2) {
        var rowSpec1 = level[row];
        var rowSpec2 = level[row+1];
        var newRowSpec1 = ""+rowSpec1[0];
        var newRowSpec2 = ""+rowSpec2[0];

        for(var column=1; column<rowSpec1.length-1; column+=2) {
            var pivotSpec = rowSpec1[column]+
                            rowSpec1[column+1]+
                            rowSpec2[column+1]+
                            rowSpec2[column];
            var turns = Math.floor(Math.random()*4);
            newRowSpec1 += pivotSpec[turns] + pivotSpec[(turns+1)%4];
            newRowSpec2 += pivotSpec[(turns+3)%4] + pivotSpec[(turns+2)%4];
        }
        newRowSpec1 += rowSpec1[rowSpec1.length-1];
        newRowSpec2 += rowSpec2[rowSpec2.length-1];
        level[row] = newRowSpec1;
        level[row+1] = newRowSpec2;
    }
};

var filterOffset=80;
var filterGridSize = filterOffset*2;

var playSound = function(id, volume) {
    var sound = pc.device.loader.get(id).resource;
    sound.setVolume(volume || 1);
    sound.play(false);
};

var getImage = function(id) {
    return pc.device.loader.get(id).resource;
}
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
var onImage = function(image) {
    var x = pc.device.input.mousePos.x - image.x;
    var y = pc.device.input.mousePos.y - image.y;
    return (x >= 0 && x < image.width &&
        y >= 0 && y < image.height);


};

MenuLayer = pc.Layer.extend('MenuLayer',
    {},
    {
        startButton: null,
        nextLevelButton: null,
        youWinImage: null,
        levelCompleteImage: null,
        levelImages: [],

        init:function(game, name, zIndex) {
            this._super(name, zIndex);
            function button(id, x, y) {
                var up = getImage(id)
                return { up: up,
                         down:getImage(id+"_hit"),
                         hover:getImage(id+"_rollover"),
                         width: up.width,
                         height: up.height,
                         x:x,
                         y:y };

            }
            this.startButton = button("but_start", 780, 250);
            this.startButton.handleClick = function() {
                game.startGame();
            };
            this.nextLevelButton = button("but_nextlevel", 780, 250);
            this.nextLevelButton.handleClick = function() {
                game.nextLevel();
            };

            this.youWinImage = pc.device.loader.get("you_win").resource;
            this.youWinImage.x = 780;
            this.youWinImage.y = 185;

            this.levelCompleteImage = getImage("level_complete");
            this.levelCompleteImage.x = 775;
            this.levelCompleteImage.y = 175;
            for(var n=0; n < 6; n++) {
                var levelImage = getImage("level_"+(n+1));
                levelImage.x = 800;
                levelImage.y = 180;
                this.levelImages.push(levelImage);
            }

            this.game = game;
            pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
            pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
            pc.device.input.bindAction(this, 'press', 'TOUCH');
            pc.device.input.bindAction(this, 'release', 'TOUCH_END');
        },
        drawButton:function(but) {
            var toDraw = but.up;
            if(this.pressed == but) {
                toDraw = but.down;
            } else if(onImage(but)) {
                toDraw = but.hover;
            }
            toDraw.draw(pc.device.ctx,but.x,but.y);
        },
        drawIcon:function(ico) {
            ico.draw(pc.device.ctx,ico.x,ico.y);
        },
        draw:function() {
            if(this.game.complete) {
                // You win!
                this.drawIcon(this.youWinImage);
            } else if(this.game.levelStarted) {
                // No menu to draw, really - maybe a restart button?  A status indicator?
                this.drawIcon(this.levelImages[this.game.level]);
            } else {
                if(this.game.level > 0) {
                    // Draw "next level" button
                    this.drawIcon(this.levelCompleteImage);
                    this.drawButton(this.nextLevelButton);
                } else {
                    // Draw "start game" button
                    this.drawButton(this.startButton);
                }
            }
        },
        onAction:function(actionName) {
            var self = this;
            var game = this.game;
            var whatIsUnderTheMouse = function() {
                if(game.levelStarted) {

                } else {
                    if(game.level >= levels.length) {
                        // Show "you won!"
                    } else if(game.level > 0) {
                        if(onImage(self.nextLevelButton)) {
                            return self.nextLevelButton;
                        }
                    } else {
                        // Did we press on the start button?
                        if(onImage(self.startButton)) {
                            return self.startButton;
                        }

                    }
                }
                return null;
            };
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
        }
    }
);

var doorOverlap = 75;
var doorMidPointY = 386;
var doorLeftX = 48;
DoorLayer = pc.Layer.extend('DoorLayer',
    {},
    {
        game:null,
        topDoorImage:null,
        bottomDoorImage:null,
        gap:0,
        init:function(game,name,zIndex) {
            this._super(name,zIndex);
            this.game = game;
            this.topDoorImage = pc.device.loader.get("door_top").resource;
            this.bottomDoorImage = pc.device.loader.get("door_bottom").resource;
        },
        draw:function() {
            var ctx = pc.device.ctx;
            this.topDoorImage.draw(ctx, doorLeftX, doorMidPointY-this.gap-this.topDoorImage.height);
            this.bottomDoorImage.draw(ctx, doorLeftX, doorMidPointY+this.gap-(doorOverlap/2));
            // Clear anything drawn outside the
            ctx.clearRect(0, 768, pc.device.canvasWidth, pc.device.canvasHeight);
        },
        process:function() {
            var wantToOpen = this.game.levelStarted;
            var maxGap = pc.device.canvasHeight/2;
            var elapsed = pc.device.elapsed;

            // Let's slide at
            if(wantToOpen) {
                this.gap = Math.min(maxGap, this.gap + elapsed*0.5);
            } else {
                this.gap = Math.max(0, this.gap - elapsed*0.5);
            }
        }
    });
LaserLayer = pc.Layer.extend('LaserLayer',
    {},
    {
        grid: null,
        beamImage:null,
        color:null,

        init:function(color,grid,name,zIndex) {
            this._super(name,zIndex);
            this.color = color;
            this.beamImage = getImage("beam_"+color+"_mid");
            this.beamImage.alpha = 0.75;
            this.grid = grid;
        },

        draw:function() {
            var lineCount = 0;
            var grid = this.grid;
            var beamImage = this.beamImage;
            var color = this.color;
            grid.sensors.forEach(function resetFlag(sensor) {
                if(sensor.sensorColor == color) {
                    sensor.lit = false;
                }
            });
            grid.filters.forEach(function resetFlag(filter) {
                if(filter.filterColor == color) {
                    filter.lit = false;
                }
            });
            var fireLaser = function(startRow, startColumn, dir, color) {
                var row = startRow;
                var column = startColumn;
                var startX = grid.columnX(column);
                var startY = grid.rowY(row);
                var ctx = pc.device.ctx;
                for(;;) {
                    switch(dir) {
                        case 'down': row++; break;
                        case 'up': row--; break;
                        case 'left': column--; break;
                        case 'right': column++; break;
                    }
                    var y = grid.rowY(row);
                    var x = grid.columnX(column);

                    var drawSegment = function() {
                        var x1 = Math.min(x,startX);
                        var y1 = Math.min(y,startY);
                        var x2 = Math.max(x,startX);
                        var y2 = Math.max(y,startY)
                        var height = Math.max(1,y2-y1);
                        var width = Math.max(1, x2-x1);
                        var angle = (x1==x2) ? 0 : 90;
                        beamImage.setScale(1,
                                              Math.max(width,height));
                        beamImage.draw(ctx, 0, 0,
                            x1+width/2-beamImage.width/2,
                            y1+height/2,
                         beamImage.width, beamImage.height, angle);

                        startX = x;
                        startY = y;
                    }
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

                        drawSegment();
                        break;
                    }

                    drawSegment();

                    var filter = grid.lookup(row, column);
                    if(filter && filter.filterColor != 'clear' && filter.filterColor != color) {
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
                // Only process lasers with a matching color for this layer
                if(laserColor != this.color)
                    return;
                if(laser.column == grid.leftColumn) {
                    fireLaser.call(this, laser.row, laser.column, 'right', laserColor);
                } else if(laser.row == grid.topRow) {
                    fireLaser.call(this, laser.row, laser.column, 'down', laserColor);
                }
            };
            this.grid.lasers.forEach(drawLaser, this);

            this.grid.sensors.forEach(function(sensor) {
                var sprite = sensor.getComponent('sprite');
                var img = sensor.lit ? 'sensor_'+sensor.sensorColor : 'sensor_'+sensor.sensorColor+'_off';
                if(sprite.sprite.spriteSheet.image.name != img) {
                    sprite.sprite.spriteSheet.image = pc.device.loader.get(img).resource;
                }
            });

        }

    });

GameScene = pc.Scene.extend('GameScene',
    {

    },
    {
        gridLayer:null,
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
                this.topRowY = 150;
                this.bottomRowY = 625;
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
        },


        clearGrid: function() {
            this.grid.clear();
        },
        setupGrid: function(level) {
            var rows = level.length;
            var columns = level[0].length;
            var scene = this;
            var grid = this.grid;
            grid.setDimensions(rows,columns);

            if(rows <= 2) {
                alert("Need more than 2 rows for a real level.  Something must be wrong.");
                return;
            }
            level.forEach(function(rowSpec, n) {
                if(rowSpec.length != columns) {
                    console.log("Row "+(n+1)+" ("+rowSpec+") isn't the same width as the first row.");
                }
            });


            var layer = this.gridLayer;

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
                laser.laserColor = laserColor;
                laser.row = row;
                laser.column = column;
                grid.update(row, column, laser);
                grid.lasers.push(laser);
            };

            var setupSensor = function(row,column,sensorColor,angle) {
                if(! sensorColor)
                {
                    scene.warn("Invalid laser color at row "+row+" column "+column);
                    return;
                }
                var sensorImage = pc.device.loader.get('sensor_'+sensorColor+'_off').resource;
                var sensorSheet = new pc.SpriteSheet({
                    image:sensorImage,
                    useRotation:true,
                    scaleX:grid.scale,
                    scaleY:grid.scale
                });
                var sensor = pc.Entity.create(layer);
                sensor.addComponent(pc.components.Sprite.create({ spriteSheet: sensorSheet }));
                sensor.addComponent(pc.components.Spatial.create({
                    x: grid.columnX(column)-(sensorImage.width*0.5),
                    y: grid.rowY(row)-(sensorImage.height*0.5),
                    dir:(angle+270)%360
                }));
                sensor.sensorColor = sensorColor;
                sensor.row = row;
                sensor.column = column;
                grid.update(row, column, sensor);
                grid.sensors.push(sensor);
            };

            var colorLetterToWord = {r:"red", g:"green", b:"blue", m:"mirror", " ":"clear"};
            var setupTopLasers = function(rowSpec) {
                var row = grid.topRow;
                for(var column=1; column < columns-1; column++) {
                    var colChar = rowSpec[column];
                    if(colChar != ' ') {
                        setupLaser(row, column, colorLetterToWord[colChar], 180);
                    }
                }
            };
            var setupBottomSensors = function(rowSpec) {
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
            };
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
                    playSound('pivot_sound', 0.5);
                    setupPivot(row, column, bl, tl, tr, br);
                };
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
                            setupPivot(row, column, tl, tr, br, bl);
                        }
                    }
                }
            });


        },

        onAction:function(actionName) {
            if(this.game.levelStarted == false)
                return;

            var self = this;
            var whatIsUnderTheMouse = function whatIsUnderTheMouse() {
                var x = pc.device.input.mousePos.x;
                var y = pc.device.input.mousePos.y;
                var foundPivot = null;
                var grid = self.grid;
                self.grid.pivots.forEach(function(pivot) {
                    var leftX = grid.columnX(pivot.column)-filterOffset/2;
                    var rightX = grid.columnX(pivot.column+1)+filterOffset/2;
                    var topY = grid.rowY(pivot.row)-filterOffset/2;
                    var bottomY = grid.rowY(pivot.row+1)+filterOffset/2;
                    if(x >= leftX && x <= rightX && y >= topY && y <= bottomY) {
                        foundPivot = pivot;
                    }
                });
                return foundPivot;
            };
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

        init:function (game)
        {
            this._super();

            this.game = game;
            this.addLayer(new ImageLayer('bg', 'bg layer', 0));

            this.gridLayer = this.addLayer(new pc.EntityLayer("puzzle pieces"));
            this.gridLayer.setZIndex(5);
            this.gridLayer.addSystem(new pc.systems.Render());

            this.addLayer(new LaserLayer('red', this.grid, 'Red Laser Layer', 2));
            this.addLayer(new LaserLayer('green', this.grid, 'Green Laser Layer', 2));
            this.addLayer(new LaserLayer('blue', this.grid, 'Blue Laser Layer', 2));

            this.addLayer(new MenuLayer(game, 'Menu Layer', 11));

            this.addLayer(new DoorLayer(game, 'Door Layer', 9));
            this.addLayer(new ImageLayer('frame', 'frame layer', 10));

            pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
            pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
            pc.device.input.bindAction(this, 'press', 'TOUCH');
            pc.device.input.bindAction(this, 'release', 'TOUCH_END');
        },

        startLevel:function() {
            this.clearGrid();
            var level = this.game.level;
            var levelSpec = levels[level % levels.length];
            scrambleLevel(levelSpec);
            this.setupGrid(levelSpec);
        },
        process:function() {
            this._super();
            var numSensorsLit = 0;
            this.grid.sensors.forEach(function(sensor) {
                if(sensor.lit == true) {
                    numSensorsLit ++;
                }
            });
            this.solved = (numSensorsLit > 0) && numSensorsLit == this.grid.sensors.length;
        }



    });
TheGame = pc.Game.extend('TheGame',
    {},
    {
        gameScene:null,
        level:0,
        levelStarted:false,
        complete:false,

        onReady:function ()
        {
            this._super(); // call the base class' onReady

            // disable caching when developing
            if (pc.device.devMode)
                pc.device.loader.setDisableCache();

            var loadImage = function(name) {
                var path = 'images/'+name;
                var id = name.replace(/\....$/, "");
                pc.device.loader.add(new pc.Image(id, path));
            };
            var loadSound = function(id, maxPlaying) {
                var path = 'sounds/'+id;
                pc.device.loader.add(new pc.Sound(id, path, ['ogg','mp3'], maxPlaying || 1));
            };
            // load up resources
            loadImage('bg.jpg');
            loadImage('frame.png');
            loadImage('but_start.png');
            loadImage('but_start_rollover.png');
            loadImage('but_start_hit.png');
            loadImage('but_nextlevel.png');
            loadImage('but_nextlevel_rollover.png');
            loadImage('but_nextlevel_hit.png');
            loadImage('filter_blue.png');
            loadImage('filter_green.png');
            loadImage('filter_red.png');
            loadImage('filter_mirror.png');
            loadImage('filter_clear.png');
            loadImage('laser_off.png');
            loadImage('laser_red.png');
            loadImage('laser_green.png');
            loadImage('laser_blue.png');
            loadImage('sensor_red.png');
            loadImage('sensor_green.png');
            loadImage('sensor_blue.png');
            loadImage('sensor_red_off.png');
            loadImage('sensor_green_off.png');
            loadImage('sensor_blue_off.png');
            loadImage('door_top.png');
            loadImage('door_bottom.png');
            loadImage('pivot.png');
            loadImage('you_win.png');
            loadImage('beam_red_end.png');
            loadImage('beam_red_mid.png');
            loadImage('beam_green_end.png');
            loadImage('beam_green_mid.png');
            loadImage('beam_blue_end.png');
            loadImage('beam_blue_mid.png');
            for(var n=0; n < 6; n++) {
                loadImage("level_"+(n+1)+".png");
            }
            loadImage('level_complete.png');

            loadSound('door_open_sound');
            loadSound('applause');
            loadSound('level_complete_sound');
            loadSound('beep');
            loadSound('pivot_sound', 5);

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
            // Erase loading screen
            var ctx = pc.device.ctx;
            ctx.clearRect(0, 0, pc.device.canvasWidth, pc.device.canvasHeight);

            // we're ready; make the magic happen
            this.gameScene = new GameScene(this);
            this.addScene(this.gameScene);

            pc.device.input.bindAction(this, 'cheat', 'F8');

        },

        onAction:function(actionName) {
            if(actionName == 'cheat') {
                this.onLevelComplete();
            }
        },

        playDoorSound:function() {
            playSound('door_open_sound');
        },

        startGame:function() {
            if(!this.levelStarted) {
                this.levelStarted = true;
                this.gameScene.startLevel();
                this.playDoorSound();
                playSound('beep');
            }
        },

        nextLevel:function() {
            if(!this.levelStarted) {
                this.levelStarted = true;
                this.gameScene.startLevel();
                this.playDoorSound();
                playSound('beep');
            }
        },

        onLevelComplete:function() {
            this.levelStarted = false;
            this.level ++;
            playSound('level_complete_sound');
            if(this.level == levels.length) {
                this.complete = true;
                playSound('applause');
            }
            this.playDoorSound();
        },
        process:function() {
            if(this._super()) {
                if(this.levelStarted && this.gameScene.solved) {
                    this.onLevelComplete();
                }
                return true;
            } else {
                return false;
            }
        }

    });


