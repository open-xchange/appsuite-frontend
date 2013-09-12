if (jasmine) {
    var fakeServerMatchers = {
        toRespondUntilResolved: function (promise) {
            var actual = this.actual;

            waitsFor(function () {
                actual.respond();
                return promise.state() === 'resolved';
            }, 'deferred object did not resolve in time', 1000);

            return true;
        }
    }

    beforeEach(function () {
        this.addMatchers(fakeServerMatchers);
    });
};
