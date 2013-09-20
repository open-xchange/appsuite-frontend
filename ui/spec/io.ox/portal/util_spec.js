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

    describe('Utilities for portal:', function () {
        var expect = chai.expect;
        describe('getWidgets function', function () {
            it('should always return an array', function () {
                expect(util.getWidgets(undefined)).to.be.an('array');
            });
            //FIXME: some race condition here... test fails sometimes
            xit('should return an array of specific length depending on current settings value', function () {
                var widgets = settings.get('widgets/user'),
                    length = widgets.length || 0,
                    result = util.getWidgets(undefined).length;
                expect(result).to.equals(length);
            });
        });
        describe('getWidgetsByType function', function () {
            it('should always return an array', function () {
                expect(util.getWidgetsByType(undefined)).to.be.an('array');
            });
            it('should return an empty array if type is not used in portal', function () {
                expect(util.getWidgetsByType(undefined)).to.be.empty;
                expect(util.getWidgetsByType('notExistingType')).to.be.empty;
            });
        });
    });
});
