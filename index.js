#!/usr/bin/env node

const htmlparser = require("htmlparser2");
const Rx         = require("rx");
const reporter   = require("./reporters/default");
const fs         = require('fs');
const utils      = require('./lib/utils');
const Dom        = require('./lib/domhandler');
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
            return oneObs(x.content).map(errors => ({from: x.from, errors, subject: x.content}));
        })
        .subscribe(x => {
            if (cli.flags.reporter) {
                require(cli.flags.reporter)(x, cli, function () {
                    cb(null, x);
                })
            } else {
                reporter(x, cli, function () {
                    cb(null, x);
                });
            }
        }, err => cb(err))
}

function processString(string, cb) {

    var handler = new Dom(function (err, dom) {
        if (err) {
            return cb(err);
        }
        cb(err, utils.verifyDom(dom, string, tests.map(x => require(x)), []));
    }, {}, {
        onopentag: function (elem) {
            elem.parserLoc = {start: parser.startIndex}
        },
        onclosetag: function (elem) {
            if (elem.parserLoc) {
                elem.parserLoc.end = parser.endIndex
            }
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(string);
    parser.done();
}

module.exports = handleCli;
