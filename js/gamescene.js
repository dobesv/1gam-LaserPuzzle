
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
          var laserImage = pc.device.loader.get('laser_'+laserColor).resource;
          var laserSheet = new pc.SpriteSheet({
            image:laserImage,
            useRotation:true,
            scaleX:grid.scale,
            scaleY:grid.scale
          });
          var vertical = (angle%180) == 0;
          var laser = pc.Entity.create(layer);
          laser.addComponent(pc.components.Sprite.create({ spriteSheet: laserSheet }));
          laser.addComponent(pc.components.Spatial.create({
            x: grid.columnX(column)-(laserImage.width*(vertical?0.5:0.65)),
            y: grid.rowY(row)-(laserImage.height*(vertical?0.65:0.5)),
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
          sensor.addComponent(pc.components.Spatial.create({
            x: grid.columnX(column)-(sensorImage.width*(vertical?0.5:0.35)),
            y: grid.rowY(row)-(sensorImage.height*(vertical?0.35:0.5)),
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
          var dir = top?(left?90:180):(left?0:270);
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
              down:(top == left)?'left':'right',
              up:(top == left)?'right':'left',
              left:(top == left)?'down':'up',
              right:(top == left)?'up':'down'
            };
          }
          grid.update(row, column, filter);
          grid.filters.push(filter);
        };
        var setupPivot = function(row, column, tl, tr, br, bl, turning) {
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
                setupPivot.call(this, row, column, tl, tr, br, bl);
              }
            }
          }
        }, this);


      },

      onAction:function(actionName) {
        if(this.game.levelStarted == false)
          return;

        var self = this;
        var whatIsUnderTheMouse = function whatIsUnderTheMouse() {
          var x = this.game.worldMouseX();
          var y = this.game.worldMouseY();
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
      },
      onResize:function (width, height) {
        // ignore 
      }
    });
