/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
if (jasmine) {
    var deferredMatchers = {

        toBeDeferred: function () {
            var def = this.actual;
            expect(def.promise).toBeFunction();
            return true;
        },
        toBePromise: function () {
            var def = this.actual;
            deferredMatchers.toBeDeferred.call(this);
            expect(def.reject).not.toBeDefined();
            expect(def.resolve).not.toBeDefined();
            return true;
        },
        toResolve: function () {
            var actual = this.actual;
            waitsFor(function () {
                return actual.state() === 'resolved';
            }, 'Deferred object never resolved', 1000);
            return true;
        },
        toReject: function () {
            var actual = this.actual;
            waitsFor(function () {
                return actual.state() === 'rejected';
            }, 'Deferred object never rejected', 1000);
            return true;
        },
        toStayPending: function () {
            var actual = this.actual;
            waitsFor(function () {
                return actual.state() === 'pending';
            }, 'Deferred object not pending anymore', 1000);
            return true;
        },
        toResolveWith: function (expected) {
            var actual = this.actual,
                isNot = this.isNot,
                callback = expected instanceof Function ? _.bind(expected, this) : undefined;

            waitsFor(function () {
                return actual.state() === 'resolved';
            }, 'Deferred object never resolved', 1000);

            runs(function () {
                actual.done(function (result) {
                    if (callback) {
                        //to fail use expect() within callback body or return false
                        expect(callback(result)).not.toEqual(false);
                        //notice not useful usage of 'isNot'
                        expect(isNot).not.toBeTruthy();
                    } else if (isNot) {
                        expect(result).not.toEqual(expected);
                    } else {
                        expect(result).toEqual(expected);
                    }
                });
            });
            this.isNot = false;
            return true;
        }
    };

    beforeEach(function () {
        this.addMatchers(deferredMatchers);
    });
};
