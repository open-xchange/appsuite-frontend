const { util, Assertion } = require('chai');

util.addProperty(Assertion.prototype, 'accessible', function () {
    const problems = JSON.stringify(this._obj.violations, null, 4);
    this.assert(
        this._obj.violations.length === 0,
        `expected to have no violations, but these rules have been violated: ${problems}`,
        'expected to have violations'
    );
});
