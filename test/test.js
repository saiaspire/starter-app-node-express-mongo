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

    it('should throw error when creating a user without username', function (done) {
        requestify.post(BASE_URL + '/user', {}).then(null, function (response) {
            try {
                response.code.should.equal(400);
                done();
            } catch (err) {
                done(err);
            }
        });
    });
});


