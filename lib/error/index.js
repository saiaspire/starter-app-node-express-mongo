"use strict";
module.exports = function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json({error: {message: "Internal Server Error"}});
};