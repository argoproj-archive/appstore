var express = require('express');
var path = require('path');
var app = express();

// Define the port to run on
app.set('port', 80);

app.use(express.static(path.join(__dirname, 'public')));

// Listen for requests
var server = app.listen(app.get('port'), function() {
    var port = server.address().port;
    console.log('Magic happens on port ' + port);
});

//'use strict';

//const express = require('express');

// Constants
//const PORT = 80;

// App
//const app = express();
//app.use(express.static(path.join(__dirname)));

//app.get('/', function(req, res) {
//  res.send('<!DOCTYPE html > <html lang = "en" >  <head> <title> Node.js App </title> <img class ="logo" src= "ApplatixLogo_charcol.png" alt = "AXLogo" > </body> </html>');
//res.send('<img>Simple node app by Applatix\n</h1>'); 

//});

//app.listen(PORT);
//console.log('Running on http://localhost:' + PORT);