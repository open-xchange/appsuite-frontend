/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */
define(['io.ox/portal/util', 'settings!io.ox/portal'], function (util, settings) {

    describe('Utilities for files:', function () {
        var expect = chai.expect;
        describe('getWidgets function', function () {
            it('should always return an array', function () {
                expect(util.getWidgets(undefined)).to.be.an('array');
                if (settings.get('widgets/user'))
                    expect(util.getWidgets(undefined)).to.be.empty;
                else
                    expect(util.getWidgets(undefined)).to.be.not.empty;
            });
        });
        describe('getWidgetsByType function', function () {
            it('should always return an array', function () {
                expect(util.getWidgetsByType(undefined)).to.be.an('array');
                expect(util.getWidgetsByType(undefined)).to.be.empty;
                expect(util.getWidgetsByType('notExistingType')).to.be.empty;
            });
        });
    });
});
