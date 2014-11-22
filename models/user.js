"use strict";
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create an export function to encapsulate the model creation
module.exports = function () {
    // define schema
    var UserSchema = new Schema({
        name: {type: String, trim: true, required: true},
        username: {type: String, unique: true, required: true},
        //email: {type: String, unique: true, required: true},
        hash: {type: String, required: true},
        salt: {type: String, required: true},
        tags: {type: Array, "default": ["Eating Out", "Fun", "Utilities"]}
    });

    // return model
    return mongoose.model('User', UserSchema);
}();