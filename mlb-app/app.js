/*
 * app.js - Express server with routing
 */

/*jslint         node    : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 50,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
 */
/*global */

// ------------ BEGIN MODULE SCOPE VARIABLES --------------
'use strict';
var
    http    = require( 'http'),
    express = require( 'express'),
    MongoClient = require('mongodb').MongoClient,
    routes  = require( './routes'),
    path    = require( 'path'),
    config     = require('./config'), cfg,
    dbConfig   = require('./db-config'),
    app     = express(),
    server  = http.createServer( app);

// ------------- END MODULE SCOPE VARIABLES ---------------

// ------------- BEGIN SERVER CONFIGURATION ---------------

// No need to set env. By default environment will be set to development
// app.set('env', 'development');

cfg = config[app.get('env')];

MongoClient.connect(cfg.mongoDbUri, function(err, db) {
    "use strict";
    if(err) throw err;

    // configuration for all environments
    app.configure( function () {
        app.set('port', process.env.PORT || 5000);
        app.set('views', path.join(__dirname, 'views'));
        app.set('view engine', 'jade');
        app.use(express.favicon());
        app.use(express.logger('dev'));
        app.use( express.bodyParser() ); // json + urlencoded + multipart
        app.use( app.router );
        app.use( express.static( __dirname + '/public', {maxAge : cfg.maxAgeS} ));

        // Not sure this usage is documented
        app.use('/templates',
            express.static( __dirname + '/templates', {maxAge : cfg.maxAgeS}));
    });

    // development environment only
    app.configure( 'development', function () {
        // app.use( express.logger() );
        app.use( express.errorHandler({
            dumpExceptions : true,
            showStack      : true
        }) );
    });

    // production environment only
    app.configure( 'production', function () {
        app.use( express.errorHandler() );
    });

    // Config mongo db  indexes etc.
    dbConfig(cfg, db);

    // Application routes
    routes(app, cfg, db);
// -------------- END SERVER CONFIGURATION ----------------

// ----------------- BEGIN START SERVER -------------------
    server.listen(app.get('port'), function() {
        console.log('*** mlb-db server running in', app.get('env'),
            'mode (port', app.get('port') + ') ***');
    });

// ------------------ END START SERVER --------------------

});


