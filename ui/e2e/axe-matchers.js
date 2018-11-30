const { util, Assertion } = require('chai');
const _ = require('underscore');

util.addProperty(Assertion.prototype, 'accessible', function () {
    // console.log(JSON.stringify(this._obj.violations, null, 4));
    const problems = ['\n', 'Accessibility Violations (' + this._obj.violations.length + ')', '---'],
        pad = '\n        ';
    if (this._obj.violations.length) {
        for (const violation of this._obj.violations) {
            problems.push(pad + '[' + violation.impact.toUpperCase() + '] ' + violation.help + ' (ID: ' + violation.id + ')\n');
            for (const node of violation.nodes) {
                problems.push(node.failureSummary.split('\n').join(pad));
                problems.push('    ' + node.target + ' => ' + node.html);
                const relatedNodes = [];
                for (const combinedNodes of [node.all, node.any, node.none]) {
                    if (!_.isEmpty(combinedNodes)) {
                        for (const any of combinedNodes) {
                            for (const relatedNode of any.relatedNodes) {
                                relatedNodes.push('      ' + relatedNode.target + ' => ' + relatedNode.html);
                            }
                        }
                    }
                }
                if (!_.isEmpty(relatedNodes)) problems.push(relatedNodes.join(pad));
            }
            problems.push(pad + '---\n');
        }
    }
    this.assert(
        this._obj.violations.length === 0,
        `expected to have no violations:\n        ${problems.join(pad)}`,
        'expected to have violations'
    );
});
