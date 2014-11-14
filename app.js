"use strict";
var express = require('express');
var bodyParser = require('body-parser');
var pass = require('pwd');
var session = require('express-session');
var app = express();

app.use(bodyParser.json());
app.use(session({
    name: "expensior_session",
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'cat out the bag'
}));


// Fake DB of users
var users = {saiaspire: {name: "Saikrishnan"}};

// Fake create a new user
pass.hash("adminadmin11", function (err, salt, hash) {
    users.saiaspire.salt = salt;
    users.saiaspire.hash = hash;
});

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var name = req.body.name;

    if (!username || !username.length > 0) {
        res.json({error: "No username provided"})
    } else if (!password || !password.length > 0) {
        res.json({error: "No password provided"})
    } else if (!name || !name.length > 0) {
        res.json({error: "No name provided"})
    }

    if (users[username]) {
        res.json({error: "Username already exists"})
    }

    if (password.length < 8) {
        res.json({error: "Password must be atleast 8 characters long"})
    }

    // Add user to Fake DB
    users[username] = {name: name};
    pass.hash(password, function (err, salt, hash) {
        if (err) {
            res.json({error: "Password is too weak"})
        }
        users[username].salt = salt;
        users[username].hash = hash;

        // Set session after successful registration
        req.session.regenerate(function () {
            req.session.user = users[username];
            res.json({success: "Successfully registered"})
        });
    });
});

app.post('/login', function (req, res) {
    if (req.session.user) {
        res.json({success: "Already logged in"});
        return;
    }

    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.regenerate(function () {
                req.session.user = user;
                res.json({success: "Logged in successfully"});
            });
        } else {
            res.json({error: err.message});
        }
    });
});

app.get('/logout', function (req, res) {
    if (!req.session.user) {
        res.json({error: "No user logged in"});
    } else {
        req.session.destroy(function () {
            res.json({success: "Logged out successfully"});
        });
    }
});

app.get('/restricted', restrict, function (req, res) {
    res.send('Access Granted!');
});

// This should be the last middleware, after all the route definitions
app.use(errorHandler);

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Listening at http://%s:%s", host, port);
});


function errorHandler(err, req, res, next) {
    res.status(500);
    // Don't send internal messages in production, send a static one
    res.json({error: err.message});
}

function authenticate(username, password, callback) {
    var user = users[username];

    if (!user) return callback(new Error('User not found'));

    pass.hash(password, user.salt, function (err, hash) {
        if (err) return callback(err);
        if (hash === user.hash) return callback(null, user);

        callback(new Error('Invalid password'));
    });
}

function restrict(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.send({error: "No user is logged in"})
    }
}
