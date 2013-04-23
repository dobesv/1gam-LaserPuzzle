LaserLayer = pc.Layer.extend('LaserLayer',
    {},
    {
      grid: null,
      beamImage:null,
      color:null,

      init:function(color,grid,name,zIndex) {
        this._super(name,zIndex);
        this.color = color;
        var beamImage = this.beamImage = getImage("beam_"+color+"_mid");
        this.beamImage.alpha = 0.75;
        var frames = this.beamFrames = [];
        for(var frame=0; frame < 12; frame++) {
          var frameWidth = beamImage.width/12;
          var frameX = (frame * frameWidth) % beamImage.width;
          frames.push(new pc.Subimage(beamImage, {x:frameX+1,y:0,w:frameWidth-2,h:beamImage.height}));
        }
        this.grid = grid;
      },

      draw:function() {
        var lineCount = 0;
        var grid = this.grid;
        var color = this.color;
        var frame = Math.abs((new Date()).getTime() * 0.01);
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
        var segmentCount = 0;
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
              var angle;
              switch(dir) {
                case 'down': angle = 180; break;
                case 'up': angle = 0; break;
                case 'left': angle = -90; break;
                case 'right': angle = 90; break;
              }
              var beamImage = this.beamFrames[Math.round((frame + (segmentCount * 12))) % this.beamFrames.length];
              beamImage.setScale(pulse,
                  Math.max(width,height)/beamImage.height);
              beamImage.draw(ctx, 0, 0,
                  Math.floor(x1+width/2-beamImage.width/2),
                  Math.floor(y1+height/2-beamImage.height/2),
                  beamImage.width, beamImage.height, angle);

              startX = x;
              startY = y;
              segmentCount++;
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

              drawSegment.call(this);
              break;
            }

            var filter = grid.lookup(row, column);
            if(filter) {
              var c = filter.getComponent('filter');
              if(c.isTurning() || !c.letsThrough(color)) {
                drawSegment.call(this);
                break; // Stop here, turning filters always opaque
              }
              if(c.color == 'mirror') {
                drawSegment.call(this);
                dir = filter.reflection[dir];
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
