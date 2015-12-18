const cli = require('./');
const runner = cli.getRunner([
    'test/fixtures/01.valid.html'
]).toArray()
.subscribe(x => {
    console.log('called', x);
});