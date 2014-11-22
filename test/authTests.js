var auth = require('../lib/auth');
var should = require('should');
var request = require('request');
var jar = request.jar();
var mongoose = require('mongoose');

var PORT = 3000;
var MONGODB_CONNECTION_STRING = 'mongodb://localhost/expensior_test';
var BASE_URL = "http://localhost:" + PORT;

var server;

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

    it('should be ready', function () {
        should.exist(auth);
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
        var registrationJar = request.jar();
        request.post(BASE_URL + '/user', {
            json: true, jar: registrationJar, body: {
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
            registrationJar.getCookies(BASE_URL).pop().key.should.equal("expensior_session");
            done();
        });
    });

    it('should not create an username if it already exists', function (done) {
        request.post(BASE_URL + '/user', {
            json: true, body: {
                username: "test",
                password: "testingpassword",
                name: "Tester",
                email: "test2@test.com"
            }
        }, function (err, response, body) {
            if (err) {
                done(err);
            }
            response.statusCode.should.equal(409);
            body.should.have.property("error");
            body.error.should.have.property("message");
            body.error.message.should.equal("Username already exists");
            done();
        });
    });

    it('should not create an user if the email is already registered to someone else', function (done) {
        request.post(BASE_URL + '/user', {
            json: true, body: {
                username: "testemail",
                password: "testingpassword",
                name: "Tester",
                email: "test@test.com"
            }
        }, function (err, response, body) {
            if (err) {
                done(err);
            }
            response.statusCode.should.equal(409);
            body.should.have.property("error");
            body.error.should.have.property("message");
            body.error.message.should.equal("Email already registered to another account");
            done();
        });
    });

    it('should not login if password is incorrect', function (done) {
        request.post(BASE_URL + '/session', {
            json: true, body: {
                username: "test",
                password: "wrongpassword",
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
            json: true, jar: jar, body: {
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
            body.status.should.equal("Logged in successfully");
            jar.getCookies(BASE_URL).pop().key.should.equal("expensior_session");
            done();
        });
    });

    it('should not login again if session exists', function (done) {
        request.post(BASE_URL + '/session', {
            json: true, jar: jar, body: {
                username: "test",
                password: "testingpassword",
                name: "Tester",
                email: "test@test.com"
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
            json: true, jar: jar, body: {}
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
            json: true, jar: jar, body: {}
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


