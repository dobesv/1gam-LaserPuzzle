//
// Playcraft Engine Simpler Server
// This is a simple example server to run games locally, it's not intended for production use
//

var requirejs = require('requirejs');
var express = require('express');
var app = express(2020);

// Configuration
app.configure(function()
{
    app.use(express.logger());
    app.set('view engine', 'jade');
    app.set('view options', { doctype:'html', pretty:true, layout:false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static('../'));

    // if you want to make your own projects appear using different directories, add a static line here, e.g.
    //app.use(express.static('/myprojects/mygame/'));

    app.use(express.static('static'));
    app.engine('html', require('ejs').renderFile);

});


app.configure('development', function()
{
    app.use(express.logger());
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function()
{
    app.use(express.logger());
    app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res)
{
    app.set('views', '../');
    res.render('index.html');
});

//////////////////////////////////////////////////////////////////////////////
//
// Fire it all up!
//
//////////////////////////////////////////////////////////////////////////////


// Start the app server
app.listen(2020, function ()
{
    console.log("Playcraft Engine is running");
    console.log("Connect using http://localhost:2020");
});



