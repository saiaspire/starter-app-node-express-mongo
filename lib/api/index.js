"use strict";
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/api';
var PORT = 3000;

var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports = express();

app.use(bodyParser.json());

app.get('/api/restricted', authenticationMiddleware, function (req, res) {
    res.status(200).json({status: "Access Granted"});
});

function authenticationMiddleware(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({error: {message: "Not logged in"}})
    }
}

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
            console.log("API listening at http://%s:%s", host, port);
        });
    });
}