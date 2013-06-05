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
define(['io.ox/core/util'], function (util) {
    describe('core utilities:', function () {
        describe('unified display name', function () {
            it('returns empty string when called with null object', function () {
                expect(util.unescapeDisplayName()).toEqual('');
            });

            it('should remove trailing white-space', function () {
                expect(util.unescapeDisplayName(' Hello World  ')).toEqual('Hello World');
            });

            it('should remove surrounding brackets', function () {
                expect(util.unescapeDisplayName('""Hello World""')).toEqual('Hello World');
            });

            it('should remove escaped brackets', function () {
                expect(util.unescapeDisplayName('\"Hello World\"')).toEqual('Hello World');
            });

            it('should not remove brackets that are not surrounding', function () {
                expect(util.unescapeDisplayName('Hello "World"')).toEqual('Hello "World"');
            });

            it('should remove escaping backslashes before brackets', function () {
                expect(util.unescapeDisplayName('"Say \"Hello\""')).toEqual('Say "Hello"');
            });
        });
    });
});
