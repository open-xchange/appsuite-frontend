/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
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
        };

    beforeEach(function () {
        this.addMatchers(fakeServerMatchers);
    });
}
