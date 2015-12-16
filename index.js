var htmlparser = require("htmlparser2");
var request = require("request");
var Rx = require("rx");
var reporter = require("./reporters/default");
var errors     = {
    ELEMENT_NO_BLOCK: 'ELEMENT_NO_BLOCK',
    MODIFIER_NO_BLOCK: 'MODIFIER_NO_BLOCK'
};

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
            } else {
                return searchParentsForClass(node.parent, BLOCK_CLASS);
            }
        }
    }
    return false
}

function collectErrors(item) {
    return [
        require('./lib/elementWithoutBlockTest'),
        require('./lib/modifierWithoutBlockOrElementTest')
    ].reduce((all, x) => {
        return all.concat(x.apply(null, [item, {searchParentsForClass, splitClasses, errors}]));
    }, []);
}

function verifyDom(dom, initial) {
    return dom
        .filter(x => x.name && x.type === 'tag' && x.attribs)
        .reduce((all, item) => {
            if (item.children.length) {
                return all.concat({
                    name: item.name,
                    errors: collectErrors(item),
                    children: verifyDom(item.children, [])
                });
            }
            return all.concat({
                name: item.name,
                errors: collectErrors(item),
                children: []
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

var fs = require('fs');
var readFile = Rx.Observable.fromNodeCallback(fs.readFile);
var exists = Rx.Observable.fromNodeCallback(fs.exists);
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
    if (!cli.input.length) {
        return cli.showHelp();
    }

    var queue = convertToQueue(cli.input)
        .filter(x => x);

    Rx.Observable
        .from(queue)
        .concatAll()
        .flatMap(x => {
            return oneObs(x.content).map(errors => ({from: x.from, errors}));
        })
        .subscribe(x => {
            reporter(x);
        }, err => console.log('e', err), cb)
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

function processString(string, cb) {
    var handler = new htmlparser.DomHandler(function (err, dom) {
        //console.log(error);
        //var out = doOne(dom, []);
        //console.log(out);
        if (err) {
            return cb(err);
        }
        cb(err, verifyDom(dom, []));
    }, {}, function (elem) {
        //elem.startIndex = parser.startIndex;
        //elem.endIndex = parser.endIndex + 1;
    });
    var parser = new htmlparser.Parser(handler);
    parser.write(string);
    parser.done();
}

