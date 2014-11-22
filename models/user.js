"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = function () {
    var UserSchema = new Schema({
        name: {type: String, trim: true, required: true},
        username: {type: String, unique: true, required: true},
        email: {type: String, unique: true, required: true},
        hash: {type: String, required: true},
        salt: {type: String, required: true},
    });

    return mongoose.model('User', UserSchema);
}();