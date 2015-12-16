function reportErrors (incoming) {
    console.log('Errors from', incoming.from);
    report(incoming.errors);
}

function report(items) {
    items.forEach((x) => {
        reportOne(x);
        if (x.children.length) {
            report(x.children, []);
        }
    });
}

function reportOne(node) {
    if (node.errors.length) {
        node.errors.forEach(function (err) {
            console.log('->',err.message)
        });
    }
}

module.exports = reportErrors;