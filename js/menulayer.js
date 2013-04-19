
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
          var up = getSpriteSheetPng(id)
          return { up: up,
            down:getSpriteSheetPng(id+"_hit"),
            hover:getSpriteSheetPng(id+"_rollover"),
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

        this.youWinImage = getSpriteSheetPng("you_win");
        this.youWinImage.x = 780;
        this.youWinImage.y = 185;

        this.levelCompleteImage = getSpriteSheetPng("level_complete");
        this.levelCompleteImage.x = 775;
        this.levelCompleteImage.y = 175;
        for(var n=0; n < levels.length; n++) {
          var levelImage = getSpriteSheetPng("level_"+(n+1));
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
        } else if(this.game.isMouseOverImage(but)) {
          toDraw = but.hover;
        }
        toDraw.draw(pc.device.ctx,but.x,but.y);
      },
      drawIcon:function(ico) {
        if(ico)
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
              if(game.isMouseOverImage(self.nextLevelButton)) {
                return self.nextLevelButton;
              }
            } else {
              // Did we press on the start button?
              if(game.isMouseOverImage(self.startButton)) {
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
        }
      }
    }
);
