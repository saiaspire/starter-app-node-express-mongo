var auth = require('../lib/auth');
var should = require('should');
var requestify = require('requestify');

var PORT = 3000;
var BASE_URL = "http://localhost:" + PORT;

var server;

describe('Authentication Module Tests', function () {

    before(function (done) {
        server = auth.listen(PORT, done);
    });

    after(function (done) {
        server.close(done);
    });

    it('should be ready', function () {
        should.exist(auth);
    });

    it('should throw an error when creating a user without username', function (done) {
        requestify.post(BASE_URL + '/user', {}).then(null, function (response) {
            try {
                response.getCode().should.equal(400);
                var body = response.getBody();
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("No username provided");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should throw an error when creating a user without password', function (done) {
        requestify.post(BASE_URL + '/user', {username: "test"}).then(null, function (response) {
            try {
                response.getCode().should.equal(400);
                var body = response.getBody();
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("No password provided");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should throw an error when creating a user without name', function (done) {
        requestify.post(BASE_URL + '/user', {
            username: "test",
            password: "testingpassword"
        }).then(null, function (response) {
            try {
                response.getCode().should.equal(400);
                var body = response.getBody();
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("No name provided");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should have password with atleast 8 characters', function (done) {
        requestify.post(BASE_URL + '/user', {
            username: "test",
            password: "testing",
            name: "Tester"
        }).then(null, function (response) {
            try {
                response.getCode().should.equal(400);
                var body = response.getBody();
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Password must be atleast 8 characters long");
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should create an user and session when everything is in order', function (done) {
        requestify.post(BASE_URL + '/user', {
            username: "test",
            password: "testingpassword",
            name: "Tester"
        }).then(function (response) {
            try {
                response.getCode().should.equal(201);
                var body = response.getBody();
                body.should.have.property("status");
                body.status.should.equal("Successfully registered user");
                should.exist(response.getHeader('set-cookie'));
                response.getHeader('set-cookie').should.be.an.Array;
                response.getHeader('set-cookie').should.not.be.empty;
                response.getHeader('set-cookie').pop().should.containEql('expensior_session');
                done();
            } catch (err) {
                done(err);
            }
        }, done);
    });

    it('should not create an username if it already exists', function (done) {
        requestify.post(BASE_URL + '/user', {
            username: "test",
            password: "testingpassword",
            name: "Tester"
        }).then(null, function (response) {
            try {
                response.getCode().should.equal(409);
                var body = response.getBody();
                body.should.have.property("error");
                body.error.should.have.property("message");
                body.error.message.should.equal("Username already exists");
                done();
            } catch (err) {
                done(err);
            }
        }, done);
    });
});


