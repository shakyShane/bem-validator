const logger  = require("eazy-logger").Logger({
    prefix: "{magenta:[BV] }",
    useLevelPrefixes: false
});

const objassign = require('object-assign');

var totalCount  = 0;
var taskCount   = 0;

const defaults  = {
    logZeroErrors: true
};

function reportErrors (incoming, cli, cb) {

    cli       = cli || {};
    cli.flags = objassign({}, defaults, cli.flags);

    const logQueue = [{level: 'info', msg: ['{cyan:%s}', incoming.from]}];

    taskCount = 0;

    cli.nls = getNewlineIndexes(incoming.subject);

    report(incoming.errors, logQueue);

    logQueue.push({level: 'info', msg: ['{grey:Total Errors {bold.grey:[%s]}} {grey:[%s]}', taskCount, incoming.from]});

    if (taskCount !== 0) {
        logQueue.forEach(function (item) {
            logger[item.level].apply(logger, item.msg);
        });
    }

    cb(null);

    /**
     * Report recursively
     * @param items
     * @param nls
     */
    function report(items) {
        return items.forEach((x) => {
            reportOne(x, cli, logQueue);
            if (x.children.length) {
                report(x.children);
            }
        });
    }
}

function getNewlineIndexes (str) {
    const nls = [];
    str.replace(/\r\n|\r|\n/g, function () {
        nls.push(arguments[1]);
    });
    return nls;
}


/**
 * htmlparser2 does not track line numbers, but we can figure
 * it out using an index
 * @param loc
 * @param nls
 * @returns {number}
 */
function convertToLine (loc, nls) {
    var index = 0;
    nls.forEach(function (nlIndex, i) {
        if (loc.start >= nlIndex+1 && loc.start < nls[i+1]) {
            index = i + 2; // todo: I have not looked at why this is needed
        }
    });
    return index;
}

/**
 * Report on a single node. Note that a node can
 * have multiple errors;
 * @param node
 * @param nls
 */
function reportOne(node, opts, logQueue) {
    if (node.errors.length) {
        var line = convertToLine(node.loc, opts.nls);
        node.errors.forEach(function (err) {
            taskCount  += 1;
            totalCount += 1;
            logQueue.push({level: 'info', msg: [`{red:[line: %s]} %s`, line, err.message]});
        });

        if (opts.flags.codeBlocks) {
            //console.log('');
            //console.log(leftPad(getCodeBlock(node.subject, node.loc), 3) + '...');
            //console.log('');
        }
    }
}

function getCodeBlock (subject, loc) {

    return subject.substring(loc.start, loc.end + 1);
}

function leftPad(subject, limit) {

    const sub = subject
        .split(/\r\n|\r|\n/g)
        .map(x => '    ' + x);

    if (limit) {
        return sub.slice(0, limit + 1).join('\n');
    }

    return sub.join('\n');
}

module.exports = reportErrors;
