const utils    = exports;
const Rx       = require("rx");
const errors   = require('./errors');
const fs       = require('fs');
const request  = require("request");
const readFile = Rx.Observable.fromNodeCallback(fs.readFile);

function splitClasses(classes) {
    return classes
        .split(' ').map(x => x.trim()).filter(x => x);
}

function searchParentsForClass(node, BLOCK_CLASS) {
    if (node.parent) {
        if (node.parent.attribs && node.parent.attribs.class) {
            var classes = splitClasses(node.parent.attribs.class);
            if (classes.indexOf(BLOCK_CLASS) > -1) {
                return true;
            }
        }
        return searchParentsForClass(node.parent, BLOCK_CLASS);
    }
    return false
}


function collectErrors(item, tests) {
    return tests.reduce((all, x) => {
        return all.concat(x.apply(null, [item, {searchParentsForClass, splitClasses, errors}]));
    }, []);
}

function verifyDom(dom, subject, tests, initial) {
    return dom
        .filter(x => x.name && x.type === 'tag' && x.attribs)
        .reduce((all, item) => {
            if (item.children.length) {
                return all.concat({
                    name: item.name,
                    subject: subject,
                    errors: collectErrors(item, tests),
                    children: verifyDom(item.children, subject, tests, []),
                    loc: item.loc
                });
            }
            return all.concat({
                name: item.name,
                subject: subject,
                errors: collectErrors(item, tests),
                children: [],
                loc: item.loc
            });
        }, initial);
}

function checkNode(node, className) {
    var classes = (node.attribs.class || '').split(' ').map(x => x.trim());
    if (classes.indexOf(className) > -1) {
        return true;
    }
    if (node.parent) {
        return checkNode(node.parent, className);
    }
    return false;
}

function convertToQueue(input) {
    return input.map(x => {
        if (x.match(/^https?:\/\//)) {
            return getUrl(x);
        } else {
            return getFile(x);
        }
    })
}

function getUrl (url) {
    return Rx.Observable.create(obs => {
        request(url, {}, function (err, res, body) {
            if (err) {
                return obs.onError(err);
            }
            obs.onNext({
                content: body,
                from: url,
                res: res
            })
        });
    })
}

function getFile (path) {
    if (fs.existsSync(path)) {
        return readFile(path).map(x => {
            return {
                content: x.toString(),
                from: path
            }
        });
    }
}

utils.convertToQueue = convertToQueue;
utils.verifyDom = verifyDom;
