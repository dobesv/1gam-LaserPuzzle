
GameScene = pc.Scene.extend('GameScene',
    {

    },
    {
      gridLayer:null,
      grid: null,
      pivotSystem: null,

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
          var laserImage = getImage('laser_'+laserColor);
          var laserSheet = new pc.SpriteSheet({
            image:laserImage,
            useRotation:true,
            scaleX:grid.scale,
            scaleY:grid.scale
          });
          var vertical = (angle%180) == 0;
          var laser = pc.Entity.create(layer);
          laser.addComponent(pc.components.Sprite.create({ spriteSheet: laserSheet }));
          var spatialParams;
          laser.addComponent(pc.components.Spatial.create(spatialParams = {
            x: grid.columnX(column)-(laserImage.width*(column==grid.rightColumn?0.35:vertical?0.5:0.65)),
            y: grid.rowY(row)-(laserImage.height*(row==grid.bottomRow?0.35:vertical?0.65:0.5)),
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
          var vertical = (angle%180) == 0;
          var sensorImage = getImage('sensor_'+sensorColor+'_off');
          var sensorSheet = new pc.SpriteSheet({
            image:sensorImage,
            useRotation:true,
            scaleX:grid.scale,
            scaleY:grid.scale
          });
          var sensor = pc.Entity.create(layer);
          sensor.addComponent(pc.components.Sprite.create({ spriteSheet: sensorSheet }));
          var spatialParams;
          sensor.addComponent(pc.components.Spatial.create(spatialParams = {
            x: grid.columnX(column)-(sensorImage.width*(column==0?0.65:vertical?0.5:0.35)),
            y: grid.rowY(row)-(sensorImage.height*(row==0?0.7:vertical?0.35:0.5)),
            w: sensorImage.width,
            h: sensorImage.height,
            dir:(angle+270)%360
          }));
          sensor.sensorColor = sensorColor;
          sensor.row = row;
          sensor.column = column;
          grid.update(row, column, sensor);
          grid.sensors.push(sensor);
        };
        var colorLetterToWord = {r:"red", g:"green", b:"blue", m:"mirror", M:"mirror90", " ":"clear", "x":"solid"};
        var setupLaserOrSensor = function(row, column, colChar) {
          var f = isUpperCase(colChar)?setupSensor:setupLaser;
          var color = colorLetterToWord[colChar.toLowerCase()];
          if(color == 'clear')
            return;
          var angle =
              row == grid.topRow ? 180 :
              row == grid.bottomRow ? 0 :
              column == grid.leftColumn ? 90 :
              column == grid.rightColumn ? 270 :
              0;
          f(row, column, color, angle);

        }
        var setupTopRow = function(rowSpec) {
          var row = grid.topRow;
          for(var column=1; column < columns-1; column++) {
            setupLaserOrSensor(row, column, rowSpec[column]);
          }
        };
        var setupBottomRow = function(rowSpec) {
          var row = grid.bottomRow;
          for(var column=1; column < columns-1; column++) {
            setupLaserOrSensor(row, column, rowSpec[column]);
          }
        };
        var setupFilter = function(row, column, color, pivot) {
          var top = (row%2) == 1;
          var left = (column%2) == 1;
          var at45 = (top == left);
          var mirror90 = color == 'mirror90';
          if(mirror90) {
            color = 'mirror';
            at45 = ! at45;
          }
          var filterImage = getImage('filter_'+color);
          var filterSheet = new pc.SpriteSheet({
            image:filterImage,
            useRotation:true,
            scaleX:grid.scale,
            scaleY:grid.scale
          });
          var filter = pc.Entity.create(layer);
          filter.addComponent(pc.components.Sprite.create({ spriteSheet: filterSheet }));
          var dir = top?(left?90:180):(left?0:270);
          if(mirror90) dir += 90;
          var x = grid.columnX(column) - (filterImage.width / 2);
          var y = grid.rowY(row) - (filterImage.height / 2);
          filter.addComponent(pc.components.Spatial.create({
            x: x,
            y: y,
            dir: dir
          }));
          filter.addComponent(FilterComponent.create({
            color:color,
            row:row,
            column:column,
            pivot:pivot,
            dir: dir,
            x: x,
            y: y,
            image:filterImage
          }));
          filter.filterColor = color;
          filter.row = row;
          filter.column = column;
          filter.pivot = pivot;
          if(color == 'mirror') {
            filter.reflection = {
              down:at45?'left':'right',
              up:at45?'right':'left',
              left:at45?'down':'up',
              right:at45?'up':'down'
            };
          } else if(color == 'mirror90') {
            filter.reflection = {
              down:at45?'left':'right',
              up:at45?'right':'left',
              left:at45?'down':'up',
              right:at45?'up':'down'
            };
          }
          grid.update(row, column, filter);
          grid.filters.push(filter);
        };
        var setupPivot = function(row, column, tl, tr, br, bl, turning) {
          if(!(tl && tr && br && bl))
            return; // Bad color somewhere
          var pivotImage = getImage('pivot');
          var pivotSheet = new pc.SpriteSheet({
            image:pivotImage,
            useRotation:true,
            scaleX:grid.scale,
            scaleY:grid.scale
          });
          var pivot = pc.Entity.create(layer);
          pivot.addComponent(pc.components.Sprite.create({ spriteSheet: pivotSheet }));
          var centerX = grid.columnX(column) + grid.columnWidth / 2;
          var centerY = grid.rowY(row) + grid.columnWidth / 2;
          var x = centerX - pivotImage.width / 2;
          var y = centerY - pivotImage.height / 2;
          pivot.addComponent(pc.components.Spatial.create({
            x: x,
            y: y,
            w: pivotImage.width,
            h: pivotImage.height
          }));
          pivot.addComponent(PivotComponent.create({
            turning:turning,
            row:row,
            column:column,
            centerX: centerX,
            centerY: centerY,
            x:x,
            y:y,
            image:pivotImage,
            filterColors:[tl,tr,br,bl]
          }));
          setupFilter.call(this, row,   column,   tl, pivot);
          setupFilter.call(this, row,   column+1, tr, pivot);
          setupFilter.call(this, row+1, column+1, br, pivot);
          setupFilter.call(this, row+1, column,   bl, pivot);
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
            setupPivot.call(scene, row, column, bl, tl, tr, br, pivot.getComponent('pivot').turning + 1);
            this.pivotSystem.processAll();
          }.bind(this);
          grid.pivots.push(pivot);
        };
        var bottomRow = grid.bottomRow;
        level.forEach(function(rowSpec, row) {
          if(row == 0) {
            setupTopRow(rowSpec);
          } else if(row == bottomRow) {
            setupBottomRow(rowSpec);
          } else {
            setupLaserOrSensor(row, 0, rowSpec[0]);
            setupLaserOrSensor(row, grid.rightColumn, rowSpec[grid.rightColumn]);
            if(row < (rows-1) && (row % 2) == 1) {
              var nextRowSpec = level[row+1];
              for(var column=1; column < columns-1; column += 2) {
                var tl = colorLetterToWord[rowSpec[column]];
                var tr = colorLetterToWord[rowSpec[column+1]];
                var br = colorLetterToWord[nextRowSpec[column+1]];
                var bl = colorLetterToWord[nextRowSpec[column]];
                setupPivot.call(this, row, column, tl, tr, br, bl);
              }
            }
          }
        }, this);


      },

      onAction:function(actionName, event, pos) {
        if(this.game.levelStarted == false)
          return;

        var self = this;
        var whatIsUnderTheMouse = function whatIsUnderTheMouse() {
          var x = this.game.worldX(pos.x);
          var y = this.game.worldY(pos.y);
          var foundPivot = null;
          var grid = self.grid;
          self.grid.pivots.forEach(function(pivot) {
            var leftX = grid.columnX(pivot.column)-filterOffset*grid.scale;
            var rightX = grid.columnX(pivot.column+1)+filterOffset*grid.scale;
            var topY = grid.rowY(pivot.row)-filterOffset*grid.scale;
            var bottomY = grid.rowY(pivot.row+1)+filterOffset*grid.scale;
            if(x >= leftX && x <= rightX && y >= topY && y <= bottomY) {
              foundPivot = pivot;
            }
          });
          return foundPivot;
        }.bind(this);
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
        this.grid = new Grid();
        this.addLayer(new ImageLayer('bg', 'bg layer', 0));

        this.gridLayer = this.addLayer(new pc.EntityLayer("puzzle pieces"));
        this.gridLayer.setZIndex(5);
        this.gridLayer.addSystem(new pc.systems.Render());
        this.gridLayer.addSystem(this.pivotSystem = new PivotSystem());
        this.addLayer(new LaserLayer('red', this.grid, 'Red Laser Layer', 2));
        this.addLayer(new LaserLayer('green', this.grid, 'Green Laser Layer', 2));
        this.addLayer(new LaserLayer('blue', this.grid, 'Blue Laser Layer', 2));

        this.addLayer(new MenuLayer(game, 'Menu Layer', 11));

        this.addLayer(new DoorLayer(game, 'Door Layer', 9));
        this.addLayer(new ImageLayer('frame', 'frame layer', 10));

        pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
        pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
        //pc.device.input.bindAction(this, 'touch', 'TOUCH');
      },

      startLevel:function() {
        this.clearGrid();
        var level = this.game.level;
        var levelSpec = scrambleLevel(levels[level % levels.length]);
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
      },
      onResize:function (width, height) {
        // pretend its 1024,768 because of our scaling hack
        this._super(1024,768);
      }
    });
