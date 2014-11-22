"use strict";
var BASE_URL;

var request = require('request');
var q = require('q');

module.exports = function (options) {
    if (!options || !options.url) {
        throw new Error("Please set the base application URL");
    }
    BASE_URL = options.url;
    return {
        createUserAndSetSessionCookie: createUserAndSetSessionCookie
    }
};

// Creates the user and sets the session cookie in the provided (optional) cookies jar
function createUserAndSetSessionCookie(username, password, name, email, cookies) {
    var deferred = q.defer();
    request.post(BASE_URL + '/user', {
        json: true, jar: cookies, body: {
            username: username,
            password: password,
            name: name,
            email: email
        }
    }, function (err, response, body) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve({response: response, body: body});
        }
    });
    return deferred.promise;
}