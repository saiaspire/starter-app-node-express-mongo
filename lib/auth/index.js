"use strict";
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/auth';
var PORT = 3000;
var SESSION_SECRET = 'session_top_secret';
var SESSION_NAME = 'app_session';

var express = require('express');
var pass = require('pwd');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var bodyParser = require('body-parser');
var q = require('q');
var validator = require('validator');

var User = require('../../models/user');

var app = module.exports = express();

app.use(bodyParser.json());

var sessionMiddleware = session({
    name: SESSION_NAME,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    store: new RedisStore(),
    secret: SESSION_SECRET
});
app.use(sessionMiddleware);

// Retry 3 times before session doesn't come through for a request
app.use(function (req, res, next) {
    var retryCount = 3;

    function lookupSession(error) {
        if (error) {
            return next(error)
        }

        retryCount -= 1;

        if (req.session !== undefined) {
            return next()
        }

        if (retryCount < 0) {
            return next(new Error('Redis Session Error'))
        }
        sessionMiddleware(req, res, lookupSession)
    }

    lookupSession();
});

app.post('/user', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name;
    var email = req.body.email;

    if (!username || !validator.isAlphanumeric(username)) {
        return res.status(400).json({error: {message: "Username must contain only letters and numbers"}});
    } else if (!password || !validator.isLength(password, 8, 16)) {
        return res.status(400).json({error: {message: "Password must be between 8 to 16 characters long"}});
    } else if (!name || !validator.isAlpha(validator.blacklist(name, ' '))) {
        return res.status(400).json({error: {message: "Name must contain only letters"}});
    } else if (!email || !validator.isEmail(email)) {
        return res.status(400).json({error: {message: "Not a valid email address"}});
    }

    User.findOne({email: email}).exec().then(function (existingEmail) {
        if (existingEmail) {
            return res.status(409).json({error: {message: "Email already registered to another account"}});
        }

        User.findOne({username: username}).exec().then(function (existingUser) {
            if (existingUser) {
                return res.status(409).json({error: {message: "Username already exists"}});
            }

            q.nfcall(createUser, name, username, email, password).then(function (user) {
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

});

app.get('/user', function (req, res) {
    if (!req.session.user) {
        res.status(401).json({error: {message: "Not logged in"}});
    } else {
        User.findOne({username: req.session.user.username}).exec().then(function (user) {
            res.status(200).json({user: {name: user.name, username: user.username, email: user.email}});
        });
    }
});

app.delete('/user', function (req, res) {
    if (!req.session.user) {
        res.status(401).json({error: {message: "Not logged in"}});
    } else {
        User.remove({username: req.session.user.username}, function () {
            req.session.destroy(function () {
                res.status(200).json({status: "Deleted user successfully"});
            });
        });
    }
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
    User.findOne({username: username}).exec().then(function (user) {
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

function createUser(name, username, email, password, callback) {
    var user = {name: name, username: username, email: email};
    // Season password with salt, hash it and store it
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