/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2014 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(['waitsFor'], function (waitsFor) {
    describe('waitsFor function', function () {
        it('should work with simple callback returning true', function (done) {
            waitsFor(function () {
                return true;
            }).done(done);
        });

        it('should work when deferred', function (done) {
            var test = false;
            waitsFor(function () {
                return test === true;
            }).done(done);

            _.defer(function () {
                test = true;
            });
        });
    });
});
