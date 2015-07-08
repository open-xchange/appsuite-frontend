/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */
define([
    'io.ox/core/capabilities',
    'spec/shared/capabilities'
], function (capabilities, caputil) {

    var capabilityWrapper = caputil.preset('none');

    describe('Core capabilities', function () {

        beforeEach(function (done) {
            capabilityWrapper.enable(['webmail', 'contacts']).done(function () {
                done();
            });
        });

        afterEach(function (done) {
            capabilityWrapper.reset().done(function () {
                done();
            });
        });

        describe('can evaluate expressions', function () {
            it('as single string', function () {
                expect(capabilities.has('webmail')).to.be.true;
            });

            it('as negated string', function () {
                expect(capabilities.has('!webmail')).to.be.false;
            });

            it('as multiple string', function () {
                expect(capabilities.has('webmail contacts')).to.be.true;
            });

            it('as formula string', function () {
                expect(capabilities.has('(webmail && contacts) || (webmail && tasks)')).to.be.true;
            });

            it('as multiple arguments', function () {
                expect(capabilities.has('webmail', 'contacts', '!tasks')).to.be.true;
            });

            it('as arrays', function () {
                expect(capabilities.has(['webmail'], ['contacts', '!tasks'])).to.be.true;
            });
        });
    });
});
