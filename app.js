"use strict";
var express = require('express');
var auth = require('./lib/auth');
var api = require('./lib/api');
var error = require('./lib/error');

var app = module.exports = express();

app.use(auth);
app.use(api);
app.use(error);

if (!module.parent) {
    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("App Listening at http://%s:%s", host, port);
    });
}