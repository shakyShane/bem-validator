function reportErrors (incoming) {
    console.log('Errors from', incoming.from);
    report(incoming.errors);
}

function report(items) {
    return items.forEach((x) => {
        reportOne(x);
        if (x.children.length) {
            report(x.children, []);
        }
    });
}

function reportOne(node) {
    if (node.errors.length) {
        console.log(node.subject.substring(node.loc.open, node.loc.close + 1));
        node.errors.forEach(function (err) {

            console.log(' -> (ul)', err.message);
        });
    }
}

module.exports = reportErrors;