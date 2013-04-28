var scrambleLevel = function scrambleLevel(levelSpec) {
  var level = levelSpec[0].slice(0);
  var offsets = levelSpec[1];
  var n=0;
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
      var turns = offsets[n % offsets.length];
      n++;
      newRowSpec1 += pivotSpec[turns] + pivotSpec[(turns+1)%4];
      newRowSpec2 += pivotSpec[(turns+3)%4] + pivotSpec[(turns+2)%4];
    }
    newRowSpec1 += rowSpec1[rowSpec1.length-1];
    newRowSpec2 += rowSpec2[rowSpec2.length-1];
    level[row] = newRowSpec1;
    level[row+1] = newRowSpec2;
  }
  return level;
};

var stopSound = function(id) {
  if (!pc.device.soundEnabled) return;
  var sound = pc.device.loader.get(id).resource;
  sound.pause();
};

var restartSound = function(id, volume, loop) {
  stopSound(id);
  playSound(id, volume, loop);
};

var playSound = function(id, volume, loop) {
  if (!pc.device.soundEnabled || pc.device.game.muted) return;
  var sound = pc.device.loader.get(id).resource;
  sound.setVolume(volume || 1);
  sound.play(loop || false);
};

var getImage = function(id) {
  if(pc.valid(TexturePacker) && id in TexturePacker.frames)
    return new pc.Subimage(pc.device.loader.get('spritesheet').resource, TexturePacker.frames[id]);
  return pc.device.loader.get(id).resource;
};

var isUpperCase = function(s) {
  return /[A-Z]/.test(s);
};

var isLowerCase = function(s) {
  return /[a-z]/.test(s);
};

var fail = function(s) {
  throw new Error(s);
}

function createCookie(name,value,days) {
  if(typeof(localStorage)!=="undefined")
  {
    if(days < 0)
      localStorage.removeItem(name);
    else
      localStorage.setItem(name, value);
  }
  else if(typeof(document.cookie) !== 'undefined')
  {
    // Sorry! No web storage support..
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  }
}

function readCookie(name, defaultValue) {
  if(typeof(localStorage)!=="undefined")
  {
    var value = localStorage.getItem(name);
    console.log('reading '+name+' from localStorage gives '+value);
    if(value !== null)
      return value;
  }
  else if(typeof(document.cookie) !== 'undefined')
  {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
  }
  return arguments.length == 1 ? null : defaultValue;
}

function eraseCookie(name) {
  createCookie(name,"",-1);
}

function setBoolCookie(name, v) {
  createCookie(name,""+pc.checked(v, true),365);
}

function getBoolCookie(name, defaultValue) {
  return readCookie(name, String(defaultValue)) == 'true';
}