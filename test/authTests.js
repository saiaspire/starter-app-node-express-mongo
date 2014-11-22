var auth = require('../lib/auth');
var should = require('should');
var request = require('request');
var mongoose = require('mongoose');
var q = require('q');

var PORT = 3000;
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/expensior_test';
var BASE_URL = "http://localhost:" + PORT;

var server;

var User = require('../models/user')

describe('Authentication Module Tests', function () {

    before(function (done) {
        mongoose.connect(MONGODB_CONNECTION_STRING, function (err) {
            if (err) {
                console.error(err);
                done();
                return;
            }
            server = auth.listen(PORT, done);
        });
    });

    after(function (done) {
        server.close(function () {
            mongoose.connection.db.dropDatabase(function () {
                mongoose.connection.close(done);
            });
        });
    });

    beforeEach(function (done) {
        User.remove(done)
    });

    it('should be ready', function () {
        should.exist(auth);
        should.exist(mongoose.connection)
    });

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
        request.post(BASE_URL + '/user', {json: true, body: {username: "test11**!@"}}, function (err, response, body) {
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

    it('should create an user and session when everything is in order', function (done) {
        var cookies = request.jar();
        request.post(BASE_URL + '/user', {
            json: true, jar: cookies, body: {
                username: "test",
                password: "testingpassword",
                name: "Tester",
                email: "test@test.com"
            }
        }, function (err, response, body) {
            if (err) {
                done(err);
            }
            response.statusCode.should.equal(201);
            body.should.have.property("status");
            body.status.should.equal("Successfully registered user");
            cookies.getCookies(BASE_URL).pop().key.should.equal("expensior_session");
            done();
        });
    });

    it('should not create an username if it already exists', function (done) {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        createTestUser(username, password, name, email).then(function () {
            var deferred = q.defer();
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: username,
                    password: password,
                    name: name,
                    email: "test2@test.com"
                }
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err);
                }
                response.statusCode.should.equal(409);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username already exists");
                deferred.resolve();
            });
            return deferred.promise;
        }).then(done, done);
    });

    it('should not create an user if the email is already registered to someone else', function (done) {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        createTestUser(username, password, name, email).then(function () {
            var deferred = q.defer();
            request.post(BASE_URL + '/user', {
                json: true, body: {
                    username: "test2",
                    password: "testingpassword",
                    name: "Tester",
                    email: email
                }
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err);
                }
                response.statusCode.should.equal(409);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Email already registered to another account");
                deferred.resolve();
            });
            return deferred.promise;
        }).then(done, done);
    });

    it('should not login if password is incorrect', function (done) {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        createTestUser(username, password, name, email).then(function () {
            var deferred = q.defer();
            request.post(BASE_URL + '/session', {
                json: true, body: {
                    username: username,
                    password: "wrongpassword"
                }
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err);
                }
                response.statusCode.should.equal(401);
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username or password is invalid");
                deferred.resolve()
            });
            return deferred.promise;
        }).then(done, done);
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
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        var cookies = request.jar();

        createTestUser(username, password, name, email).then(function () {
            var deferred = q.defer();
            request.post(BASE_URL + '/session', {
                json: true, jar: cookies, body: {
                    username: username,
                    password: password
                }
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err)
                }
                response.statusCode.should.equal(201);
                body.should.have.property("status");
                body.status.should.equal("Logged in successfully");
                cookies.getCookies(BASE_URL).pop().key.should.equal("expensior_session");
                deferred.resolve();
            });
            return deferred.promise;
        }).then(done, done);
    });

    it('should not login again if session exists', function (done) {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        var cookies = request.jar();

        createTestUser(username, password, name, email, cookies).then(function () {
            var deferred = q.defer();
            request.post(BASE_URL + '/session', {
                json: true, jar: cookies, body: {
                    username: username,
                    password: password
                }
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err);
                }
                response.statusCode.should.equal(200);
                body.should.have.property("status");
                body.status.should.equal("Already logged in");
                deferred.resolve();
            });
            return deferred.promise;
        }).then(done, done);
    });

    it('should logout if session exists', function (done) {
        var username = "test",
            password = "testingpassword",
            name = "Tester",
            email = "test@test.com";

        var cookies = request.jar();

        createTestUser(username, password, name, email, cookies).then(function () {
            var deferred = q.defer();
            request.del(BASE_URL + '/session', {
                json: true, jar: cookies, body: {}
            }, function (err, response, body) {
                if (err) {
                    deferred.reject(err);
                }
                response.statusCode.should.equal(200);
                body.should.have.property("status");
                body.status.should.equal("Logged out successfully");
                deferred.resolve();
            });
            return deferred.promise;
        }).then(done, done);
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

function createTestUser(username, password, name, email, cookies) {
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

