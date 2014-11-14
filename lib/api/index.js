var express = require('express');
var app = module.exports = express();

app.get('/api/restricted', requireAuthentication, function (req, res) {
    res.send('Access Granted!');
});

function requireAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({error: "Unauthorized. Please login."})
    }
}