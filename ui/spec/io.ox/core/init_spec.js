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
define([], function () {
    describe('checking dependencies', function () {
        it('loads underscore', function () {
            expect(_).toBeDefined();
        });

        it('loads jQuery', function () {
            expect($).toBeDefined();
        });

        it('loads underscore', function () {
            expect(_).toBeDefined();
        });
    });
});
