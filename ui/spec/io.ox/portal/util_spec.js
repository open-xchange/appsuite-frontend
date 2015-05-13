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
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
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
                }),
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
