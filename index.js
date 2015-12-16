const htmlparser = require("htmlparser2");
const Rx         = require("rx");
const reporter   = require("./reporters/default");
const fs         = require('fs');
const utils      = require('./lib/utils');
const tests      = [
    './lib/elementWithoutBlockTest',
    './lib/modifierWithoutBlockOrElementTest'
];

if (!module.parent) {
    handleCli(require('meow')({
        help: `Usage: bem-validate <file|url>`
    }), function (err, output) {
        if (err) {
            throw err;
        }
    });
}

function oneObs (content) {
    return Rx.Observable.create(obs => {
        processString(content, function (err, output) {
            if (err) {
                return obs.onError(err);
            }
            obs.onNext(output);
            obs.onCompleted();
        });
    });
}

function handleCli(cli, cb) {
    cli.flags = cli.flags || {};

    if (!cli.input.length) {
        return cli.showHelp();
    }

    var queue = utils.convertToQueue(cli.input)
        .filter(x => x);

    Rx.Observable
        .from(queue)
        .concatAll()
        .flatMap(x => {
            return oneObs(x.content).map(errors => ({from: x.from, errors}));
        })
        .subscribe(x => {
            if (cli.flags.reporter) {
                require(cli.flags.reporter)(x)
            } else {
                reporter(x);
            }
        }, err => console.log('e', err.stack), cb)
}

function processString(string, cb) {
    var handler = new htmlparser.DomHandler(function (err, dom) {
        if (err) {
            return cb(err);
        }
        cb(err, utils.verifyDom(dom, string, tests.map(x => require(x)), []));
    }, {}, {
        open: function (elem) {
        	elem.startIndex = parser.startIndex;
        },
        close: function (elem) {
            elem.endIndex = parser.endIndex;
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(string);
    parser.done();
}

module.exports = handleCli;