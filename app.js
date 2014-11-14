"use strict";
var express = require('express');
var bodyParser = require('body-parser');

var app = express();

var auth = require('./lib/auth');
var api = require('./lib/api')
var error = require('./lib/error');

app.use(bodyParser.json());

app.use(auth);
app.use(api);
app.use(error);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at http://%s:%s", host, port);
});