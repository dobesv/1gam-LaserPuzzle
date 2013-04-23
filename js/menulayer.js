
MenuLayer = pc.Layer.extend('MenuLayer',
    {},
    {
      startButton: null,
      nextLevelButton: null,
      youWinImage: null,
      levelCompleteImage: null,
      levelDigits: [],
      helpImage: null,

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
        this.startButton = button("but_start", 800, 175);
        this.startButton.handleClick = function() {
          game.startGame();
        };
        this.nextLevelButton = button("but_nextlevel", 780, 250);
        this.nextLevelButton.handleClick = function() {
          game.nextLevel();
        };

        this.youWinImage = getImage("you_win");
        this.youWinImage.x = 780;
        this.youWinImage.y = 185;

        this.levelCompleteImage = getImage("level_complete");
        this.levelCompleteImage.x = 775;
        this.levelCompleteImage.y = 175;

        this.levelBg = getImage('level_number_display');
        this.levelBg.x = 800;
        this.levelBg.y = 175;

        this.helpImage = getImage('tutorial_1');
        this.helpImage.x = 370;
        this.helpImage.y = -2;
        this.helpImage.timeLeft = 5000;

        for(var n=0; n < 10; n++) {
          this.levelDigits.push(getImage("level_number_"+n));
        }

        this.game = game;
        pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
        pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
//        pc.device.input.bindAction(this, 'touch', 'TOUCH');
      },
      drawButton:function(but) {
        var toDraw = but.up;
        if(this.pressed == but) {
          toDraw = but.down;
        } else if(this.game.isMouseOverImage(but)) {
          toDraw = but.hover;
        }
        toDraw.draw(pc.device.ctx,but.x,but.y);
      },
      drawIcon:function(ico) {
        if(ico)
          ico.draw(pc.device.ctx,ico.x,ico.y);
      },
      drawLevelNumber: function () {
        this.drawIcon(this.levelBg);
        var digits = [];
        var n = this.game.level+1;
        var w = 0;
        while (n > 0) {
          var levelDigit = this.levelDigits[n % 10];
          w += levelDigit.width;
          digits.push(levelDigit);
          n = Math.floor(n / 10);
        }
        digits.reverse();
        var numLeft = this.levelBg.x + (this.levelBg.width - w) / 2 | 0;
        for (var i = 0; i < digits.length; i++) {
          var digit = digits[i];
          var numTop = Math.floor(this.levelBg.y + (this.levelBg.height - digit.height)*0.72);
          digit.draw(pc.device.ctx, numLeft, numTop);
          numLeft += digit.width;
        }
      },

      drawHelp:function() {
        if(this.helpImage) {
          this.drawIcon(this.helpImage);
          this.helpImage.setAlpha(Math.max(0, Math.min(1, this.helpImage.timeLeft/1000)));
          this.helpImage.timeLeft -= pc.device.elapsed;
          if(this.helpImage.timeLeft <= 0) {
            this.helpImage = null;
          }
        }
      },

      draw:function() {
        if(this.game.complete) {
          // You win!
          this.drawIcon(this.youWinImage);
        } else if(this.game.levelStarted) {
          this.drawLevelNumber();
          this.drawHelp();
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
      onAction:function(actionName, event, pos) {
        var self = this;
        var game = this.game;
        var whatIsUnderTheMouse = function() {
          if(game.levelStarted) {

          } else {
            if(game.level >= levels.length) {
              // Show "you won!"
            } else if(game.level > 0) {
              if(game.isPosOverImage(pos, self.nextLevelButton)) {
                return self.nextLevelButton;
              }
            } else {
              // Did we press on the start button?
              if(game.isPosOverImage(pos, self.startButton)) {
                return self.startButton;
              }

            }
          }
          return null;
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
//        } else if(actionName == 'touch') {
//          var onWhat = whatIsUnderTheMouse();
//          if(onWhat) onWhat.handleClick();
        }
      }
    }
);
