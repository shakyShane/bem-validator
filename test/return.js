const cli = require('../');
const assert = require('chai').assert;

describe('return type of running the api', function () {
	it('returns an observable', function (done) {
        this.timeout(10000);
        const runner = cli.getRunner(['test/fixtures/01.valid.html'])
            .toArray()
            .subscribe(x => {
                assert.equal(x.length, 1);
                runner.dispose();
                done();
            });
	});
    it('return value has error property', function (done) {
        this.timeout(10000);
        const runner = cli.getRunner(['test/fixtures/01.valid.html'])
            .toArray()
            .subscribe(x => {
                assert.equal(x.length, 1);
                runner.dispose();
                done();
            });
    });
});

