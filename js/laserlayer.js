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
        var pulse = pc.device.game.levelStarted?
              1:
              1+0.2*(1+Math.sin((new Date()).getTime() * 0.0075));

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
              var y2 = Math.max(y,startY);
              var height = Math.max(1,y2-y1);
              var width = Math.max(1, x2-x1);
              var angle = (x1==x2) ? 0 : 90;
              beamImage.setScale(pulse,
                  Math.max(width,height));
              beamImage.draw(ctx, 0, 0,
                  Math.floor(x1+width/2-beamImage.width*0.5),
                  Math.floor(y1+height/2),
                  beamImage.width, beamImage.height, angle);

              startX = x;
              startY = y;
            };
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
            if(filter) {
              var c = filter.getComponent('filter');
              if(c.isTurning()) {
                break; // Stop here, turning filters always opaque
              }
              if(c.color == 'mirror') {
                dir = filter.reflection[dir];
              } else if(!c.letsThrough(color)) {
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
          if(laserColor != color)
            return;
          var dir =
              laser.column == grid.leftColumn ? 'right' :
              laser.column == grid.rightColumn ? 'left' :
              laser.row == grid.topRow ? 'down' :
              laser.row == grid.bottomRow ? 'up' :
                fail('Unexpected laser position.');
          fireLaser.call(this, laser.row, laser.column, dir, laserColor);
        };
        this.grid.lasers.forEach(drawLaser, this);

        this.grid.sensors.forEach(function(sensor) {
          var sprite = sensor.getComponent('sprite');
          var img = sensor.lit ? 'sensor_'+sensor.sensorColor : 'sensor_'+sensor.sensorColor+'_off';
          if(sprite.sprite.spriteSheet.image.name != img) {
            sprite.sprite.spriteSheet.image = getImage(img);
          }
        });

      }

    });
