const { util, Assertion } = require('chai');

util.addProperty(Assertion.prototype, 'accessible', function () {
    const problems = this._obj.violations.map(rule => rule.help);
    this.assert(
        this._obj.violations.length === 0,
        `expected to have no violations, but these rules have been violated: [\n"${problems.join('"\n"')}"\n]`,
        'expected to have violations'
    );
});
