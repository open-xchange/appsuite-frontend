var tests = [];
for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/spec\.js$/.test(file)) {
            tests.push(file);
        }
    }
}

require(['io.ox/core/extPatterns/stage'], function (Stage) {
    new Stage('io.ox/core/stages', {
        id: 'run_tests',
        index: 99999,
        run: function (baton) {
            requirejs.config({
                // Karma serves files from '/base/apps'
                baseUrl: '/base/apps',

                // ask Require.js to load these files (all our tests)
                deps: tests,

                // start test run, once Require.js is done
                callback: window.__karma__.start
            });
        }
    });
});

if (jasmine) {
    /**
     * Hack pending specs/expected fails
     *
     * It’s possible to provide an option parameter to the sharedExamples
     * call with an attribute 'markedPending'. This must contain an object
     * with attributes for each (full) spec name representing a truthy value.
     *
     * This method will then fail the spec if the test is marked pending and doesn’t fail.
     * Or it will just skip it otherwise.
     *
     * Jasmine from master branch supports pending specs, so once we update, we can change
     * this to native jasmine.
     *
     */
    jasmine.Spec.prototype.handleExpectedFail = function (markedPending) {
        if (!markedPending[this.getFullName()]) {
            return;
        }

        if (this.results().passed()) {
            console.error('expected to fail: ' + this.getFullName());
            this.results_.totalCount++;
            this.results_.failedCount++;
            return;
        }
        this.results_.skipped = true;
        this.results_.items_ = [];
        this.results_.totalCount = 1;
        this.results_.passedCount = 1;
        this.results_.failedCount = 0;
    };
}
