"use strict";
var app = require('../app');
var should = require('should');
var request = require('request');
var mongoose = require('mongoose');

var PORT = 3000;
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/app_test';
var BASE_URL = "http://localhost:" + PORT;
var helper = require('./lib/helper')({url: BASE_URL});

var server;

var User = require('../models/user');

var username = "apptest",
    name = "test",
    email = "app@test.com",
    password = "password";

var cookies = request.jar();

describe('App Tests', function () {
    before(function (done) {
        mongoose.connect(MONGODB_CONNECTION_STRING, function (err) {
            if (err) {
                done(err);
            }

            User.remove(function () {
                server = app.listen(PORT, function () {
                    helper.createUserAndSetSessionCookie(username, password, name, email, cookies).then(function () {
                        done();
                    }, done);
                });
            });
        });
    });

    after(function (done) {
        server.close(function () {
            mongoose.connection.db.dropDatabase(function () {
                mongoose.connection.close(done);
            });
        });
    });

    it('should be ready', function () {
        should.exist(app);
        should.exist(mongoose.connection)
    });

    it('should not be able to access the api if user is not logged in', function (done) {
        request.get(BASE_URL + '/api/restricted', {
            json: true
        }, function (err, response, body) {
            if (err) {
                done(err);
            }
            response.statusCode.should.equal(401);
            body.should.have.property("error");
            body.error.should.have.property("message");
            body.error.message.should.equal("Not logged in");
            done();
        });
    });

    it('should be able to access the api after logging in', function (done) {
        request.get(BASE_URL + '/api/restricted', {
            json: true, jar: cookies
        }, function (err, response, body) {
            if (err) {
                done(err);
            }
            response.statusCode.should.equal(200);
            body.should.have.property("status");
            body.status.should.equal("Access Granted");
            done();
        });
    });
});