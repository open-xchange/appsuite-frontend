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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define(['io.ox/core/util'], function (util) {

    describe('core/util.js', function () {

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

        describe('isValidMailAddress()', function () {

            it('handles domain part properly', function () {
                expect(util.isValidMailAddress('name@domain.com')).toBe(true);
                expect(util.isValidMailAddress('name@host')).toBe(true);
                expect(util.isValidMailAddress('name@1337')).toBe(true);
                expect(util.isValidMailAddress('name@[1.2.3.4]')).toBe(true);
                expect(util.isValidMailAddress('name@[1.2.3.4.5]')).toBe(false);
                expect(util.isValidMailAddress('name@[1.2.3.A]')).toBe(false);
                expect(util.isValidMailAddress('name@[1.2.3.4444]')).toBe(false);
                expect(util.isValidMailAddress('name@[IPv6:2001:db8:1ff::a0b:dbd0]')).toBe(true);
                expect(util.isValidMailAddress('name@[2001:db8:1ff::a0b:dbd0]')).toBe(false);
            });

            it('handles partial addresses properly', function () {
                expect(util.isValidMailAddress('@domain.com')).toBe(false);
                expect(util.isValidMailAddress('name@')).toBe(false);
                expect(util.isValidMailAddress('@')).toBe(false);
            });

            it('handles local part properly', function () {
                expect(util.isValidMailAddress('name@abc@domain.com')).toBe(false);
                expect(util.isValidMailAddress('first.last@domain.com')).toBe(true);
                expect(util.isValidMailAddress('first,last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('first last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('first\\last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('first"last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('first..last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('.first.last@domain.com')).toBe(false);
                expect(util.isValidMailAddress('"quoted"@domain.com')).toBe(true);
                expect(util.isValidMailAddress('"another@"@domain.com')).toBe(true);
                expect(util.isValidMailAddress('"but"not"@domain.com')).toBe(false);
            });
        });

        describe('isValidPhoneNumber()', function () {

            it('handles empty strings properly', function () {
                expect(util.isValidPhoneNumber('')).toBe(true);
                expect(util.isValidPhoneNumber(' ')).toBe(true);
            });

            it('handles too short numbers properly', function () {
                expect(util.isValidPhoneNumber('+1')).toBe(false);
                expect(util.isValidPhoneNumber('+49')).toBe(false);
            });

            it('handles numbers properly', function () {
                expect(util.isValidPhoneNumber('01234567')).toBe(true);
                expect(util.isValidPhoneNumber('0123 4567')).toBe(true);
                expect(util.isValidPhoneNumber('+491234567')).toBe(true);
                expect(util.isValidPhoneNumber('0123+4567')).toBe(false);
                expect(util.isValidPhoneNumber('+49 (0) 1234567')).toBe(true);
                expect(util.isValidPhoneNumber('+49 0 1234567')).toBe(true);
                expect(util.isValidPhoneNumber('+49-0-1234567')).toBe(true);
                expect(util.isValidPhoneNumber('+49-0-1234567#1')).toBe(true);
                expect(util.isValidPhoneNumber('+49-0-1234567,1,2')).toBe(true);
                expect(util.isValidPhoneNumber('+49.0.1234567')).toBe(true);
                expect(util.isValidPhoneNumber('+49 0 / 1234567')).toBe(true);
                expect(util.isValidPhoneNumber('+49 0 / 123456 - 7')).toBe(true);
                expect(util.isValidPhoneNumber('+49 0 / 123456 - ABC')).toBe(false);
                expect(util.isValidPhoneNumber('+49 0::1234567')).toBe(false);
                expect(util.isValidPhoneNumber('+49 0 1234 [567]')).toBe(false);
                expect(util.isValidPhoneNumber('++49 0 1234567')).toBe(false);
                expect(util.isValidPhoneNumber('+49_0_1234567')).toBe(false);
                expect(util.isValidPhoneNumber('+49 0 1234567 \\ 23')).toBe(false);
            });
        });

        describe('breakableHTML()', function () {

            it('doesnt change white space', function () {
                expect(util.breakableHTML('')).toBe('');
                expect(util.breakableHTML(' ')).toBe(' ');
            });

            it('doesnt change short strings', function () {
                expect(util.breakableHTML('Hello World')).toBe('Hello World');
            });

            it('escapes HTML', function () {
                expect(util.breakableHTML('Hello<br>World')).toBe('Hello&lt;br&gt;World');
            });

            it('breaks longs strings properly', function () {
                expect(util.breakableHTML('com.openexchange.session.contextId=1337')).toBe('com.<wbr>openexchange.<wbr>session.<wbr>contextId=<wbr>1337<wbr>');
                expect(util.breakableHTML('com.openexchange 01234567890123456789 01234567890123456789')).toBe('com.openexchange 01234567890123456789 01234567890123456789');
                expect(util.breakableHTML('com.openexchange.0123456789012345678901234567890123456789')).toBe('com.<wbr>openexchange.<wbr>012345678901234567890123456789<wbr>0123456789');
            });
        });
    });
});
