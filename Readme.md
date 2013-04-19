# Lazer Puzzle

This is a prototype of a mini-game concept for a bigger game that we're working on.

How to play: rotate the pieces until the lasers reach the sensors.  When all the sensors are
activated, you win!

For development you probably want to put a full copy of [playcraft](http://playcraftlabs.com/) in here so that playcraftjs/lib
has files in it, and then use dev.html instead of index.html to run the game.  That way you'll
get some development goodies and better debugging (but slower startup time and possibly slower
game performance).

Play the game here: <http://dobesv.github.com/1gam-LaserPuzzle>

## Credits

All the graphics are original artwork by my partner in crime [Glenn Martin](http://bunyep.com).

Game mechanic by Duncan Shields (thought of the rotating pieces) with help from Dobes Vandermeer,
Leigh Tingle, and Glenn Martin.

Programming by [Dobes Vandermeer](http://dobesv.com).

Original music by [Christopher Tyler Nickel](http://www.christophernickel.com/)

Sounds:

- Door noise from http://www.trekcore.com/audio/
- Applause from http://www.soundjay.com/applause-sounds-1.html
- Level complete from http://noproblo.dayjo.org/ZeldaSounds/
- Beep from http://archive.org/details/TickSound
- Pivot sound from http://soundcli.ps/sound/camera-shutter-3

## Repacking Textures

The app uses one big sprite sheet for most of the images.  Use [TexturePacker](http://www.codeandweb.com/texturepacker)
to repack the spritesheet if you make changes.

First you'll have to set the TexturePacker exporters folder to the texturepacker-exporter folder in here, or
copy its contents to your existing TexturePacker exporter folder.

Then you can open images/spritesheet.tps in TexturePacker and click Publish to build a new spritesheet.png.

## Legal

The game, its source code, and its audio assets are provided as-is without any warrantees as to their suitability
for any purpose.  Use at your own risk.

Graphics and audio are provided for example purposes only and may only be re-used with explicit permission from
their creators.

The javascript and HTML source code can be copied and re-used freely in other projects.  Consider it public domain.




