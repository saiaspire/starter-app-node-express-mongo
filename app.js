"use strict";
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/app';
var PORT = 3000;

var express = require('express');
var mongoose = require('mongoose');
var auth = require('./lib/auth');
var api = require('./lib/api');
var error = require('./lib/error');

var app = module.exports = express();

app.use(auth);
app.use(api);
app.use(error);

if (!module.parent) {
    mongoose.connect(MONGODB_CONNECTION_STRING, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log("MongoDB connected to mongodb://%s:%s", mongoose.connection.host, mongoose.connection.port);
        var server = app.listen(PORT, function () {
            var host = server.address().address;
            var port = server.address().port;
            console.log("App listening at http://%s:%s", host, port);
        });
    });
}

