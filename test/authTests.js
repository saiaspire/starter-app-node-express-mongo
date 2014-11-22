"use strict";
var auth = require('../lib/auth');
var should = require('should');
var request = require('request');
var mongoose = require('mongoose');
var q = require('q');

var PORT = 3000;
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/auth_test';
var BASE_URL = "http://localhost:" + PORT;
var helper = require('./lib/helper')({url: BASE_URL});

var server;

var User = require('../models/user');

describe('Authentication Tests', function () {
    before(function (done) {
        mongoose.connect(MONGODB_CONNECTION_STRING, function (err) {
            if (err) {
                done(err);
            }
            User.remove(function () {
                server = auth.listen(PORT, done);
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
        should.exist(auth);
        should.exist(mongoose.connection)
    });

    describe('User signup validation tests', function () {
        it('should throw an error when creating a user without username', function (done) {
            request.post(BASE_URL + '/user', {json: true, body: {}}, function (err, response, body) {
                if (err) {
                    done(err);
                }
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username must contain only letters and numbers");
                done();
            });
        });

        it('should throw an error when creating a username with special characters', function (done) {
            request.post(BASE_URL + '/user', {
                json: true,
                body: {username: "test11**!@"}
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username must contain only letters and numbers");
                done();
            });
        });

        it('should throw an error when creating a user without password', function (done) {
            request.post(BASE_URL + '/user', {json: true, body: {username: "test"}}, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Password must be between 8 to 16 characters long");
                done();
            });
        });

        it('should throw an error when creating a user without name', function (done) {
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: "test",
                    password: "testingpassword"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Name must contain only letters");
                done();
            });
        });

        it('should throw an error when creating a user name containing numbers or special characters', function (done) {
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: "test",
                    password: "testingpassword",
                    name: "832098ads! &&$"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Name must contain only letters");
                done();
            });
        });

        it('should throw an error when creating a user without email', function (done) {
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: "test",
                    password: "testingpassword",
                    name: "Test User"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Not a valid email address");
                done();
            });
        });

        it('should throw an error when creating a user with invalid email', function (done) {
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: "test",
                    password: "testingpassword",
                    name: "Test User",
                    email: "jash89"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Not a valid email address");
                done();
            });
        });

        it('should have password with atleast 8 characters', function (done) {
            request.post(BASE_URL + '/user', {
                json: true,
                body: {
                    username: "test",
                    password: "testing",
                    name: "Tester",
                    email: "test@test.com"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Password must be between 8 to 16 characters long");
                done();
            });
        });

        it('should have password less than or equal to 16 characters', function (done) {
            request.post(BASE_URL + '/user', {
                json: true,
                body: {
                    username: "test",
                    password: "testingtestingtes",
                    name: "Tester",
                    email: "test@test.com"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(400);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Password must be between 8 to 16 characters long");
                done();
            });
        });
    });

    describe('User creation tests', function () {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        beforeEach(function (done) {
            User.remove(done)
        });

        it('should create an user and session when everything is in order', function (done) {
            var cookies = request.jar();
            helper.createUserAndSetSessionCookie(username, password, name, email, cookies).then(function (data) {
                data.response.statusCode.should.equal(201);
                data.body.should.have.property("status");
                data.body.status.should.equal("Successfully registered user");
                cookies.getCookies(BASE_URL).pop().key.should.equal("app_session");
                done();
            }).fail(done);
        });

        it('should not create user if username already exists', function (done) {
            helper.createUserAndSetSessionCookie(username, password, name, email).then(function () {
                return helper.createUserAndSetSessionCookie(username, "somepassword", "somebody", "test2@test.com");
            }).then(function (data) {
                data.response.statusCode.should.equal(409);
                data.body.should.have.property("error");
                data.body.error.should.have.property("message");
                data.body.error.message.should.equal("Username already exists");
                done();
            }).fail(done);
        });

        it('should not create user if the email is already registered to someone else', function (done) {
            helper.createUserAndSetSessionCookie(username, password, name, email).then(function () {
                return helper.createUserAndSetSessionCookie("someotheruser", "somepassword", "someguy", email);
            }).then(function (data) {
                data.response.statusCode.should.equal(409);
                data.body.should.have.property("error");
                data.body.error.should.have.property("message");
                data.body.error.message.should.equal("Email already registered to another account");
                done();
            }).fail(done);
        });
    });

    describe('User login and logout tests', function () {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        var cookies = request.jar();

        beforeEach(function (done) {
            User.remove(function () {
                helper.createUserAndSetSessionCookie(username, password, name, email, cookies).then(function () {
                    done();
                }, done);
            });
        });

        it('should not login if password is incorrect', function (done) {
            request.post(BASE_URL + '/session', {
                json: true, body: {
                    username: username,
                    password: "wrongpassword"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(401);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username or password is invalid");
                done();
            });
        });

        it('should not login if user is not registered', function (done) {
            request.post(BASE_URL + '/session', {
                json: true, body: {
                    username: "nouser",
                    password: "testingpassword",
                    name: "Tester",
                    email: "test@test.com"
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(401);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username does not exist");
                done();
            });
        });

        it('should login and set session cookie if username and password is correct', function (done) {
            request.post(BASE_URL + '/session', {
                json: true, body: {
                    username: username,
                    password: password
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(201);
                body.should.have.property("status");
                body.status.should.equal("Logged in successfully");
                cookies.getCookies(BASE_URL).pop().key.should.equal("app_session");
                done();
            });
        });

        it('should not login again if session exists', function (done) {
            request.post(BASE_URL + '/session', {
                json: true, jar: cookies, body: {
                    username: username,
                    password: password
                }
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(200);
                body.should.have.property("status");
                body.status.should.equal("Already logged in");
                done();
            });
        });

        it('should logout if session exists', function (done) {
            request.del(BASE_URL + '/session', {
                json: true, jar: cookies, body: {}
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(200);
                body.should.have.property("status");
                body.status.should.equal("Logged out successfully");
                done();
            });
        });

        it('should identify we are already logged out if session does not exist', function (done) {
            request.del(BASE_URL + '/session', {
                json: true, body: {}
            }, function (err, response, body) {
                if (err) {
                    done(err);
                }
                response.statusCode.should.equal(200);
                body.should.have.property("status");
                body.status.should.equal("Already logged out");
                done();
            });
        });
    });

    describe('User information tests', function () {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        beforeEach(function (done) {
            User.remove(done);
        });

        it('should not return any user information if not logged in', function (done) {
            request.get(BASE_URL + '/user', {
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

        it('should return details of currently logged in user', function (done) {
            var cookies = request.jar();
            helper.createUserAndSetSessionCookie(username, password, name, email, cookies).then(function () {
                var deferred = q.defer();
                request.get(BASE_URL + '/user', {
                    json: true, jar: cookies
                }, function (err, response, body) {
                    if (err) {
                        deferred.reject(err);
                    }
                    deferred.resolve({response: response, body: body});
                });
                return deferred.promise;
            }).then(function (data) {
                data.response.statusCode.should.equal(200);
                data.body.should.have.property("user");
                data.body.user.should.have.property("username");
                data.body.user.should.have.property("name");
                data.body.user.should.have.property("email");
                data.body.user.username.should.equal(username);
                data.body.user.name.should.equal(name);
                data.body.user.email.should.equal(email);
                done();
            }).fail(done);
        });
    });

    describe('User deletion tests', function () {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        beforeEach(function (done) {
            User.remove(done);
        });

        it('should not delete any user if not logged in', function (done) {
            request.get(BASE_URL + '/user', {
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

        it('should return details of currently logged in user', function (done) {
            var cookies = request.jar();
            helper.createUserAndSetSessionCookie(username, password, name, email, cookies).then(function () {
                var deferred = q.defer();
                request.del(BASE_URL + '/user', {
                    json: true, jar: cookies, body: {}
                }, function (err, response, body) {
                    if (err) {
                        deferred.reject(err);
                    }
                    deferred.resolve({response: response, body: body});
                });
                return deferred.promise;
            }).then(function (data) {
                data.response.statusCode.should.equal(200);
                data.body.should.have.property("status");
                data.body.status.should.equal("Deleted user successfully");
                return User.findOne({username: username}).exec();
            }).then(function (user) {
                should(user).be.null;
                done();
            }).fail(done);
        });
    });
});

