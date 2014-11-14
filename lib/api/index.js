var express = require('express');
var app = module.exports = express();

app.get('/api/restricted', function (req, res) {
    res.send('Access Granted!');
});