function elementWithoutBlock (node, utils) {

    if (!node.attribs.class) {
        return [];
    }

    var split       = utils.splitClasses(node.attribs.class);
    var hasModifier = split.filter(x => x.indexOf('--') > -1);

    if (hasModifier.length) {
        return hasModifier.reduce((all, CURRENT_CLASS) => {
            var REQUIRED_CLASS = CURRENT_CLASS.split('--')[0];
            if (split.indexOf(REQUIRED_CLASS) === -1) {
                return all.concat({
                    failure: REQUIRED_CLASS,
                    message: [
                        `Using the modifier class \`${CURRENT_CLASS}\` requires this element `,
                        `to also have the class \`${REQUIRED_CLASS}\``
                    ].join(''),
                    type: utils.errors.MODIFIER_NO_BLOCK
                });
            }
            return all;
        }, []);
    } else {
        return [];
    }
}

module.exports = elementWithoutBlock;