function elementWithoutBlock (node, utils) {
    if (!node.attribs.class) {
        return [];
    }

    var split = utils.splitClasses(node.attribs.class);

    return split.reduce(function (all, className) {

        var match = className.split("__");

        if (match.length === 1) {
            return all;
        }

        var BLOCK_CLASS = match[0];

        // now check if the block above exists in parents
        var result = utils.searchParentsForClass(node, BLOCK_CLASS);

        if (!result) {
            return all.concat({
                failure: className,
                message: [
                    `Using the class \`${className}\` requires a parent element with the `,
                    `class \`${BLOCK_CLASS}\`. You cannot use an element outside of a block`
                ].join(''),
                type: utils.errors.ELEMENT_NO_BLOCK
            });
        }
        return all;
    }, []);
}

module.exports = elementWithoutBlock;