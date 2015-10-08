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

    describe('Core utils', function () {

        describe('unified display name', function () {

            it('returns empty string when called with null object', function () {
                expect(util.unescapeDisplayName()).to.be.empty;
            });

            it('should remove trailing white-space', function () {
                expect(util.unescapeDisplayName(' Hello World  ')).to.equal('Hello World');
            });

            it('should remove surrounding brackets', function () {
                expect(util.unescapeDisplayName('""Hello World""')).to.equal('Hello World');
            });

            it('should remove escaped brackets', function () {
                expect(util.unescapeDisplayName('\"Hello World\"')).to.equal('Hello World');
            });

            it('should not remove brackets that are not surrounding', function () {
                expect(util.unescapeDisplayName('Hello "World"')).to.equal('Hello "World"');
            });

            it('should remove escaping backslashes before brackets', function () {
                expect(util.unescapeDisplayName('"Say \"Hello\""')).to.equal('Say "Hello"');
            });
        });

        describe('isValidMailAddress()', function () {

            it('handles domain part properly', function () {
                expect(util.isValidMailAddress('name@domain.com'), 'name@domain.com is valid').to.be.true;
                expect(util.isValidMailAddress('name@host'), 'name@host is valid').to.be.true;
                expect(util.isValidMailAddress('name@1337'), 'name@1337 is valid').to.be.true;
                expect(util.isValidMailAddress('name@[1.2.3.4]'), 'name@[1.2.3.4] is valid').to.be.true;
                expect(util.isValidMailAddress('name@[1.2.3.4.5]'), 'name@[1.2.3.4.5] is valid').to.be.false;
                expect(util.isValidMailAddress('name@[1.2.3.A]'), 'name@[1.2.3.A] is valid').to.be.false;
                expect(util.isValidMailAddress('name@[1.2.3.4444]'), 'name@[1.2.3.4444] is valid').to.be.false;
                expect(util.isValidMailAddress('name@[IPv6:2001:db8:1ff::a0b:dbd0]'), 'name@[IPv6:2001:db8:1ff::a0b:dbd0] is valid').to.be.true;
                expect(util.isValidMailAddress('name@[2001:db8:1ff::a0b:dbd0]'), 'name@[2001:db8:1ff::a0b:dbd0] is valid').to.be.false;
            });

            it('handles partial addresses properly', function () {
                expect(util.isValidMailAddress('@domain.com')).to.be.false;
                expect(util.isValidMailAddress('name@')).to.be.false;
                expect(util.isValidMailAddress('@')).to.be.false;
            });

            it('handles local part properly', function () {
                expect(util.isValidMailAddress('name@abc@domain.com')).to.be.false;
                expect(util.isValidMailAddress('first.last@domain.com')).to.be.true;
                expect(util.isValidMailAddress('first,last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('first last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('first\\last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('first"last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('first..last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('.first.last@domain.com')).to.be.false;
                expect(util.isValidMailAddress('"quoted"@domain.com')).to.be.true;
                expect(util.isValidMailAddress('"another@"@domain.com')).to.be.true;
                expect(util.isValidMailAddress('"but"not"@domain.com')).to.be.false;
            });
        });

        describe('isValidPhoneNumber()', function () {

            it('handles empty strings properly', function () {
                expect(util.isValidPhoneNumber('')).to.be.true;
                expect(util.isValidPhoneNumber(' ')).to.be.true;
            });

            it('handles too short numbers properly', function () {
                expect(util.isValidPhoneNumber('+1')).to.be.false;
                expect(util.isValidPhoneNumber('+49')).to.be.false;
            });

            it('handles numbers properly', function () {
                expect(util.isValidPhoneNumber('01234567')).to.be.true;
                expect(util.isValidPhoneNumber('0123 4567')).to.be.true;
                expect(util.isValidPhoneNumber('+491234567')).to.be.true;
                expect(util.isValidPhoneNumber('0123+4567')).to.be.false;
                expect(util.isValidPhoneNumber('+49 (0) 1234567')).to.be.true;
                expect(util.isValidPhoneNumber('+49 0 1234567')).to.be.true;
                expect(util.isValidPhoneNumber('+49-0-1234567')).to.be.true;
                expect(util.isValidPhoneNumber('+49-0-1234567#1')).to.be.true;
                expect(util.isValidPhoneNumber('+49-0-1234567,1,2')).to.be.true;
                expect(util.isValidPhoneNumber('+49.0.1234567')).to.be.true;
                expect(util.isValidPhoneNumber('+49 0 / 1234567')).to.be.true;
                expect(util.isValidPhoneNumber('+49 0 / 123456 - 7')).to.be.true;
                expect(util.isValidPhoneNumber('+49 0 / 123456 - ABC')).to.be.false;
                expect(util.isValidPhoneNumber('+49 0::1234567')).to.be.false;
                expect(util.isValidPhoneNumber('+49 0 1234 [567]')).to.be.false;
                expect(util.isValidPhoneNumber('++49 0 1234567')).to.be.false;
                expect(util.isValidPhoneNumber('+49_0_1234567')).to.be.false;
                expect(util.isValidPhoneNumber('+49 0 1234567 \\ 23')).to.be.false;
            });
        });

        describe('breakableHTML()', function () {

            it('doesnt change white space', function () {
                expect(util.breakableHTML('')).to.be.empty;
                expect(util.breakableHTML(' ')).to.equal(' ');
            });

            it('doesnt change short strings', function () {
                expect(util.breakableHTML('Hello World')).to.equal('Hello World');
            });

            it('escapes HTML', function () {
                expect(util.breakableHTML('Hello<br>World')).to.equal('Hello&lt;br&gt;World');
            });

            it('breaks longs strings properly', function () {
                expect(util.breakableHTML('com.openexchange.session.contextId=1337')).to.equal('com.<wbr>openexchange.<wbr>session.<wbr>contextId=<wbr>1337<wbr>');
                expect(util.breakableHTML('com.openexchange 01234567890123456789 01234567890123456789')).to.equal('com.openexchange 01234567890123456789 01234567890123456789');
                expect(util.breakableHTML('com.openexchange.0123456789012345678901234567890123456789')).to.equal('com.<wbr>openexchange.<wbr>012345678901234567890123456789<wbr>0123456789');
            });
        });

        describe('breakableText()', function () {
            it('doesnt change white space', function () {
                expect(util.breakableText('')).to.be.empty;
                expect(util.breakableText(' ')).to.equal(' ');
            });

            it('doesnt change short strings', function () {
                expect(util.breakableText('Hello World')).to.equal('Hello World');
            });

            it('does not inseart breaks on text boundaries', function () {
                expect(util.breakableText('01234567890123456789')).to.equal('01234567890123456789');
                expect(util.breakableText('0123456789012345678901234567890123456789')).to.equal('01234567890123456789\u200B01234567890123456789');
                expect(util.breakableText('012345678901234567890123456789012345678901')).to.equal('01234567890123456789\u200B01234567890123456789\u200B01');
            });

            it('breaks longs strings properly', function () {
                expect(util.breakableText('com.openexchange.session.contextId=1337')).to.equal('com.openexchange.ses\u200Bsion.contextId=1337');
            });
        });

        describe('urlify()', function () {

            it('doesnt change normal text', function () {
                expect(util.urlify('Hello World!')).to.equal('Hello World!');
            });

            it('recognizes a simple URL', function () {
                expect(util.urlify('http://www.foo.com/path')).to.equal('<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>');
            });

            it('recognizes a simple URL (uppercase)', function () {
                expect(util.urlify('HTTP://www.foo.com/path')).to.equal('<a href="HTTP://www.foo.com/path" target="_blank">HTTP://www.foo.com/path</a>');
            });

            it('recognizes a secure URL', function () {
                expect(util.urlify('https://www.foo.com/path')).to.equal('<a href="https://www.foo.com/path" target="_blank">https://www.foo.com/path</a>');
            });

            it('recognizes a simple URL within text', function () {
                expect(util.urlify('Lorem ipsum http://www.foo.com/path Lorem ipsum')).to.equal('Lorem ipsum <a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a> Lorem ipsum');
            });

            it('recognizes multiple simple URL', function () {
                expect(util.urlify('Lorem ipsum http://www.foo.com/path Lorem ipsum http://www.foo.com/path Lorem ipsum')).to.equal('Lorem ipsum <a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a> Lorem ipsum <a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a> Lorem ipsum');
            });

            it('recognizes a URLs across newlines', function () {
                expect(util.urlify('Lorem ipsum\nhttp://www.foo.com/path\nLorem ipsum')).to.equal('Lorem ipsum\n<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>\nLorem ipsum');
            });

            it('handles punctuation marks properly', function () {
                expect(util.urlify('http://www.foo.com/path.')).to.equal('<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>.');
                expect(util.urlify('http://www.foo.com/path!')).to.equal('<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>!');
                expect(util.urlify('http://www.foo.com/path?')).to.equal('<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>?');
                expect(util.urlify('<http://www.foo.com/path>')).to.equal('<<a href="http://www.foo.com/path" target="_blank">http://www.foo.com/path</a>>');
            });
        });
    });
});
