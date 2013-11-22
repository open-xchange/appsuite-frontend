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
 * @author Julian Bäume <julian.baeume@open-xchange.com>
 */
define(function () {
    describe('require static files', function () {
        it('should fetch static files via backend', function () {
            var def = require(['apps/file/doesnt/exist.js']);

            waitsFor(function () {
                return def.state() !== 'pending';
            }, 'loading fake file failed', 500);

            def.fail(function (err) {
                expect(err.requireType).toBe('define');
                expect(err.message).toBe('Could not read \'file/doesnt/exist.js\'');
            });
        });
    });
});
