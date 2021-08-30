/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define(['io.ox/portal/util', 'settings!io.ox/portal'], function (util, settings) {

    describe('Portal Utilities', function () {
        var expect = chai.expect;
        describe('getWidgets function', function () {
            it('should always return an array', function () {
                expect(util.getWidgets()).to.be.an('array');
            });
            it('should return an array of widgets stored in the settings', function () {
                settings.set('widgets/user');
                expect(util.getWidgets().length).to.equal(0);
                settings.set('widgets/user', {
                    dummyWidget: { props: {} }
                });
                expect(util.getWidgets().length).to.equal(1);
            });
        });
        describe('getWidgetsByType function', function () {
            it('should always return an array', function () {
                expect(util.getWidgetsByType(undefined)).to.be.an('array');
            });
            it('should return an empty array if type is not used in portal', function () {
                settings.set('widgets/user');
                expect(util.getWidgetsByType(undefined)).to.be.empty;
                expect(util.getWidgetsByType('notExistingType')).to.be.empty;
            });
        });
    });
});
