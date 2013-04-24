// Created with TexturePacker (http://www.texturepacker.com)  Update key: {{smartUpdateKey}}
(function() {
  var TP = (typeof(window.TexturePacker) == 'undefined' ? window.TexturePacker = {} : window.TexturePacker);
  if(typeof TP.images == 'undefined') TexturePacker.images = [];
  if(typeof TP.frames == 'undefined') TexturePacker.frames = {};
  TP.images.push("{{settings.textureSubPath}}{{texture.fullName}}");
  {% for sprite in allSprites %}
  TP.frames["{{sprite.trimmedName}}"] = {x:{{sprite.frameRect.x}}, y:{{sprite.frameRect.y}}, w:{{sprite.frameRect.width}}, h:{{sprite.frameRect.height}}};{% endfor %}
})();
