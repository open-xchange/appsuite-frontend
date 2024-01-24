/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define([
    'io.ox/core/capabilities',
    'spec/shared/capabilities'
], function (capabilities, caputil) {

    var capabilityWrapper = caputil.preset('none');

    describe.skip('Core capabilities', function () {

        beforeEach(function () {
            return capabilityWrapper.enable(['webmail', 'contacts', 'foo.dot', 'foo-dash', 'foo/slash']);
        });

        afterEach(function () {
            return capabilityWrapper.reset();
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

            it('supports OR (1)', function () {
                expect(capabilities.has('foo || webmail || contacts')).to.be.true;
            });

            it('supports OR (2)', function () {
                expect(capabilities.has('foo || bar', 'webmail')).to.be.false;
            });

            it('supports OR (3)', function () {
                expect(capabilities.has('webmail', 'foo || bar')).to.be.false;
            });

            it('supports dots in names', function () {
                expect(capabilities.has('webmail && foo.dot')).to.be.true;
            });

            it('supports dashes in names', function () {
                expect(capabilities.has('webmail && foo-dash')).to.be.true;
            });

            it('supports slashes in names', function () {
                expect(capabilities.has('webmail && foo/slash')).to.be.true;
            });

            it('does not crash on bad syntax', function () {
                expect(capabilities.has('webmail && foo)slash')).to.be.false;
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
