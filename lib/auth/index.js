var express = require('express');
var pass = require('pwd');
var session = require('express-session');
var bodyParser = require('body-parser');

var app = module.exports = express();

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

    if (users[username]) {
        return res.status(409).json({error: {message: "Username already exists"}});
    }

    if (password.length < 8) {
        return res.status(400).json({error: {message: "Password must be atleast 8 characters long"}});
    }

    createUser(name, username, password, function (err, user) {
        if (err) {
            return res.status(500).json({error: {message: err.message}});
        }

        // Set session after successful registration
        req.session.regenerate(function () {
            req.session.user = user;
            res.status(201).json({status: "Successfully registered user"});
        });
    });
});

app.post('/session', function (req, res) {
    if (req.session.user) {
        return res.status(200).json({status: "Already logged in"});
    }

    authenticateUser(req.body.username, req.body.password, function (err, user) {
        if (err) {
            return res.status(401).json({error: {message: err.message}});
        }

        req.session.regenerate(function () {
            req.session.user = user;
            res.status(201).json({status: "Logged in successfully"});
        });
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
    var user = users[username];

    if (!user) return callback(new Error('Username does not exist'));

    pass.hash(password, user.salt, function (err, hash) {
        if (err) return callback(err);
        if (hash === user.hash) return callback(null, user);

        callback(new Error('Username or password is invalid'));
    });
}

function createUser(name, username, password, callback) {
    // Add user to Fake DB
    users[username] = {name: name};
    // Hash password with added salt and store it
    pass.hash(password, function (err, salt, hash) {
        if (err) {
            return callback(err);
        }
        users[username].salt = salt;
        users[username].hash = hash;
        callback(null, users[username]);
    });
}

if (!module.parent) {
    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("Auth Listening at http://%s:%s", host, port);
    });
}