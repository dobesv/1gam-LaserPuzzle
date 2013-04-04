

var filterOffset=80;
var filterGridSize = filterOffset*2;
var globalScale=1;


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
                if (pc.device.soundEnabled)
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
            loadImage('credit_text.png');

            loadSound('door_open_sound');
            loadSound('applause');
            loadSound('level_complete_sound');
            loadSound('beep');
            loadSound('pivot_sound', 5);
            loadSound('music');

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

            playSound('music', 0.6, true);

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

        onDoorsClosed:function() {
            this.gameScene.clearGrid();
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


