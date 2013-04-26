
MenuLayer = pc.Layer.extend('MenuLayer',
    {},
    {
      startButton: null,
      nextLevelButton: null,
      youWinImage: null,
      levelCompleteImage: null,
      levelDigits: [],
      helpImage: null,
      sfxButton: null,
      musicButton: null,
      soundState: { muted:null, all:null, noMusic:null, up:null, hover:null },
      infoButton:null,
      showInfo:false,
      infoImage:null,

      init:function(game, name, zIndex) {
        this._super(name, zIndex);
        function button(id, x, y) {
          var up = getImage(id+"_up");
          return { up: up,
            down:getImage(id+"_down"),
            hover:getImage(id+"_hover"),
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
        this.infoButton = button("but_info", 853, 515);
        this.infoButton.handleClick = function() {
          this.showInfo = !this.showInfo;
        }.bind(this);

        this.infoImage = getImage("credit_text");
        this.infoImage.x = 185;
        this.infoImage.y = 146;

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
        this.helpImage.timeLeft = 3000;

        [this.soundState.all = getImage('but_sound_all'),
          this.soundState.noMusic = getImage('but_sound_fx'),
          this.soundState.muted = getImage('but_sound_mute'),
          this.soundState.up = getImage('but_sound_up'),
          this.soundState.hover = getImage('but_sound_hover')].forEach(function(s) {
              s.x = 853;
              s.y = 407;
        });
        this.soundState.x = this.soundState.up.x;
        this.soundState.y = this.soundState.up.y;
        this.soundState.width = this.soundState.up.width;
        this.soundState.height = this.soundState.up.height;

        this.soundState.handleClick = function() {
          game.cycleSoundMode();
        };
        for(var n=0; n < 10; n++) {
          this.levelDigits.push(getImage("level_number_"+n));
        }

        this.game = game;
        if(!(pc.device.isiPad || pc.device.isiOS)) {
          pc.device.input.bindAction(this, 'press', 'MOUSE_BUTTON_LEFT_DOWN');
          pc.device.input.bindAction(this, 'release', 'MOUSE_BUTTON_LEFT_UP');
        }
        pc.device.input.bindAction(this, 'touch', 'TOUCH');
      },
      drawButton:function(but, down) {
        var toDraw = but.up;
        if(pc.checked(down, this.pressed == but)) {
          toDraw = but.down;
        } else if(this.game.isPosOverImage(pc.device.input.mousePos, but)) {
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
        if(this.game.level == 0 && this.helpImage.timeLeft > 0) {
          this.drawIcon(this.helpImage);
          this.helpImage.setAlpha(Math.max(0, Math.min(1, this.helpImage.timeLeft/1000)));
          this.helpImage.timeLeft -= pc.device.elapsed;
        }
      },

      draw:function() {
        if(pc.device.soundEnabled) {
          this.drawButton(this.soundState, false);
          this.drawIcon(this.game.muted?this.soundState.muted :
                        this.game.musicPlaying?this.soundState.all :
                        this.soundState.noMusic);
        }

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

        this.drawButton(this.infoButton);

        if(this.showInfo) {
          pc.device.ctx.fillStyle = 'rgba(0,0,0,0.7)';
          pc.device.ctx.fillRect(0,0,pc.device.canvasWidth,pc.device.canvasHeight);
          pc.device.ctx.stroke();
          this.drawIcon(this.infoImage);

        }
      },
      onAction:function(actionName, event, pos) {
        var self = this;
        var game = this.game;
        var whatIsUnderTheMouse = function() {
          if(self.showInfo || game.isPosOverImage(pos, self.infoButton)) {
            return self.infoButton;
          }
          if(pc.device.soundEnabled) {
            if(game.isPosOverImage(pos, self.soundState.all)) {
              return self.soundState;
            }
          }
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
        //console.log(actionName+" for menulayer at "+this.game.worldX(pos.x)+","+this.game.worldY(pos.y));
        if(actionName == 'press') {
          this.pressed = whatIsUnderTheMouse();
        } else if(actionName == 'release') {
          if(!this.pressed)
            return;
          var onWhat = whatIsUnderTheMouse();
          if(onWhat === this.pressed) {
            onWhat.handleClick();
          }
          this.pressed = null;
        } else if(actionName == 'touch') {
          var onWhat = whatIsUnderTheMouse();
          if(onWhat) {
            onWhat.handleClick();
            event.preventDefault();
          }
        }
      }
    }
);
