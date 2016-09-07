#!/usr/bin/env node

const htmlparser = require("htmlparser2");
const Rx         = require("rx");
const reporter   = require("./reporters/default");
const objectAssign = require("object-assign");
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

    cb = cb || function () {};
    cli.flags = cli.flags || {};

    if (!cli.input.length) {
        return cli.showHelp();
    }

    function report (incoming) {
        if (cli.flags.reporter) {
            require(cli.flags.reporter)(incoming, cli, function () {
                cb(null, incoming);
            })
        } else {
            reporter(incoming, cli, function () {
                cb(null, incoming);
            });
        }
    }

    getRunner(cli.input)
        .subscribe(report);
}

function getRunner (input, userOpts) {
    const defaults = {};
    const opts  = objectAssign({}, defaults, userOpts);
    const queue = utils
        .convertToQueue(input)
        .filter(x => x);

    return Rx.Observable
        .from(queue)
        .mergeAll()
        .flatMap(x => {
            return oneObs(x.content).map(errors => ({from: x.from, errors, subject: x.content}));
        });
}

function processString(string, cb) {

    var handler = new Dom(function (err, dom) {
        if (err) {
            return cb(err);
        }
        cb(err, utils.verifyDom(dom, string, tests.map(x => require(x)), []));
    }, {}, {});
    var parser = new htmlparser.Parser(handler);
    parser.write(string);
    parser.done();
}

module.exports = handleCli;
module.exports.getRunner = getRunner;
