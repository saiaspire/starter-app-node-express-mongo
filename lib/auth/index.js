"use strict";
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/auth';
var PORT = 3000;
var SESSION_SECRET = 'cat out the bag';

var express = require('express');
var pass = require('pwd');
var session = require('express-session');
var bodyParser = require('body-parser');
var q = require('q');

var User = require('../../models/user');

var app = module.exports = express();

app.use(bodyParser.json());
app.use(session({
    name: "expensior_session",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: SESSION_SECRET
}));

app.post('/user', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name;

    if (!username || !username.length > 0) {
        return res.status(400).json({error: {message: "No username provided"}});
    } else if (!password || !password.length > 0) {
        return res.status(400).json({error: {message: "No password provided"}});
    } else if (!name || !name.length > 0) {
        return res.status(400).json({error: {message: "No name provided"}});
    }

    if (password.length < 8) {
        return res.status(400).json({error: {message: "Password must be atleast 8 characters long"}});
    }

    User.findOne({username: username}).exec().then(function (existingUser) {
        if (existingUser) {
            return res.status(409).json({error: {message: "Username already exists"}});
        }

        q.nfcall(createUser, name, username, password).then(function (user) {
                // Set session after successful registration
                req.session.regenerate(function () {
                    req.session.user = user;
                    res.status(201).json({status: "Successfully registered user"});
                });
            },
            function (err) {
                return res.status(500).json({error: {message: err.message}});
            });

    });
});

app.post('/session', function (req, res) {
    if (req.session.user) {
        return res.status(200).json({status: "Already logged in"});
    }

    q.nfcall(authenticateUser, req.body.username, req.body.password).then(function (user) {
        req.session.regenerate(function () {
            req.session.user = user;
            res.status(201).json({status: "Logged in successfully"});
        });
    }, function (err) {
        return res.status(401).json({error: {message: err.message}});
    });
});

app.delete('/session', function (req, res) {
    if (!req.session.user) {
        res.status(200).json({status: "Already logged out"});
    } else {
        req.session.destroy(function () {
            res.status(200).json({status: "Logged out successfully"});
        });
    }
});

function authenticateUser(username, password, callback) {
    var prom = User.findOne({username: username}).exec();

    prom.then(function (user) {
        if (!user) {
            callback(new Error('Username does not exist'));
        }

        pass.hash(password, user.salt, function (err, hash) {
            if (err) return callback(err);
            if (hash === user.hash) return callback(null, user);

            callback(new Error('Username or password is invalid'));
        });
    });
}

function createUser(name, username, password, callback) {
    var user = {name: name, username: username};
    // Hash password with added salt and store it
    pass.hash(password, function (err, salt, hash) {
        if (err) {
            return callback(err);
        }
        user.salt = salt;
        user.hash = hash;
        User.create(user, callback);
    });
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
            console.log("Auth listening at http://%s:%s", host, port);
        });
    });
}