var express = require('express');
var bodyParser = require('body-parser');

var app = module.exports = express();

app.use(bodyParser.json());

app.get('/api/restricted', requireAuthentication, function (req, res) {
    res.send('Access Granted!');
});

function requireAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({error: {message: "Unauthorized. Please login."}})
    }
}

if (!module.parent) {
    var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("API Listening at http://%s:%s", host, port);
    });
}