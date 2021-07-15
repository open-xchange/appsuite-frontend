/*
*
* @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
* @license AGPL-3.0
*
* This code is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.

* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
*
* Any use of the work other than as authorized under this license or copyright law is prohibited.
*
*/

/* eslint no-useless-escape: 0 */

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
                expect(util.breakableHTML('0123456789\u00a00123456789\u00a00123456789\u00a01')).to.equal('0123456789\u00a0<wbr>0123456789\u00a0<wbr>0123456789\u00a0<wbr>1');
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
                expect(util.urlify('http://www.foo.com/path')).to.equal('<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>');
            });

            it('recognizes a simple URL (uppercase)', function () {
                expect(util.urlify('HTTP://www.foo.com/path')).to.equal('<a href="HTTP://www.foo.com/path" rel="noopener" target="_blank">HTTP://www.foo.com/path</a>');
            });

            it('recognizes a secure URL', function () {
                expect(util.urlify('https://www.foo.com/path')).to.equal('<a href="https://www.foo.com/path" rel="noopener" target="_blank">https://www.foo.com/path</a>');
            });

            it('recognizes a simple URL within text', function () {
                expect(util.urlify('Lorem ipsum http://www.foo.com/path Lorem ipsum')).to.equal('Lorem ipsum <a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a> Lorem ipsum');
            });

            it('recognizes multiple simple URL', function () {
                expect(util.urlify('Lorem ipsum http://www.foo.com/path Lorem ipsum http://www.foo.com/path Lorem ipsum')).to.equal('Lorem ipsum <a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a> Lorem ipsum <a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a> Lorem ipsum');
            });

            it('recognizes a URLs across newlines', function () {
                expect(util.urlify('Lorem ipsum\nhttp://www.foo.com/path\nLorem ipsum')).to.equal('Lorem ipsum\n<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>\nLorem ipsum');
            });

            it('handles punctuation marks properly', function () {
                expect(util.urlify('http://www.foo.com/path.')).to.equal('<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>.');
                expect(util.urlify('http://www.foo.com/path!')).to.equal('<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>!');
                expect(util.urlify('http://www.foo.com/path?')).to.equal('<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>?');
                expect(util.urlify('<http://www.foo.com/path>')).to.equal('&lt;<a href="http://www.foo.com/path" rel="noopener" target="_blank">http://www.foo.com/path</a>&gt;');
            });

            it('removes malicious code', function () {
                expect(util.urlify('abc <script> alert(1337); </script> 123')).to.equal('abc  123');
            });

            it('removes data attributes', function () {
                expect(util.urlify('<a href="#z" data-toggle="dropdown" data-target="<img src=x onerror=alert(1337)>">XSS?</a>')).to.equal('<a href="#z" rel="noopener">XSS?</a>');
            });
        });

        describe('getAddresses', function () {

            it('recognizes a simple address', function () {
                expect(util.getAddresses('email1@domain.tld')).to.deep.equal(['email1@domain.tld']);
            });

            it('recognizes a simple address without domain part', function () {
                expect(util.getAddresses('email1')).to.deep.equal(['email1']);
            });

            it('recognizes comma-separated addresses', function () {
                expect(util.getAddresses('email1@domain.tld,email2@domain.tld,email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes semi-colon-separated addresses', function () {
                expect(util.getAddresses('email1@domain.tld;email2@domain.tld;email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes tab-separated addresses', function () {
                expect(util.getAddresses('email1@domain.tld\temail2@domain.tld\temail3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes newline-separated addresses', function () {
                expect(util.getAddresses('email1@domain.tld\nemail2@domain.tld\nemail3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes space-separated addresses', function () {
                expect(util.getAddresses('email1@domain.tld email2@domain.tld email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes addresses with display name without quotes', function () {
                expect(util.getAddresses('email1@domain.tld display name <email2@domain.tld> email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', '"display name" <email2@domain.tld>', 'email3@domain.tld']);
            });

            it('recognizes addresses with display name with quotes', function () {
                expect(util.getAddresses('email1@domain.tld "display name" <email2@domain.tld> email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', '"display name" <email2@domain.tld>', 'email3@domain.tld']);
            });

            it('recognizes addresses with display name with quotes that contain delimiters', function () {
                expect(util.getAddresses('email1@domain.tld "name, display" <email2@domain.tld> email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', '"name, display" <email2@domain.tld>', 'email3@domain.tld']);
            });

            it('recognizes addresses with bareword display names', function () {
                expect(util.getAddresses('name <email1@domain.tld>, another-name <email2@domain.tld>, AND another-näme <email3@domain.tld>'))
                    .to.deep.equal(['"name" <email1@domain.tld>', '"another-name" <email2@domain.tld>', '"AND another-näme" <email3@domain.tld>']);
            });

            it('recognizes addresses with special characters in local part', function () {
                // full list: . ! # $ % & ' * + - / = ? ^ _ ` { | } ~
                expect(util.getAddresses('email.1@x, email!2@x, email#3@x, email$4@x, email\'5@x, email/6@x, email{7}@x, email|8@x, email~9@x'))
                    .to.deep.equal(['email.1@x', 'email!2@x', 'email#3@x', 'email$4@x', 'email\'5@x', 'email/6@x', 'email{7}@x', 'email|8@x', 'email~9@x']);
            });

            it('recognizes addresses with escaped local part', function () {
                expect(util.getAddresses('email1@domain.tld "email2"@domain.tld email3@domain.tld'))
                    .to.deep.equal(['email1@domain.tld', '"email2"@domain.tld', 'email3@domain.tld']);
            });

            it('recognizes addresses with only one character in local part', function () {
                expect(util.getAddresses('a@domain.tld'))
                    .to.deep.equal(['a@domain.tld']);
            });

            it('recognizes addresses with IP address as domain part', function () {
                expect(util.getAddresses('email1@domain.tld email2@domain.tld email3@8.8.8.8'))
                    .to.deep.equal(['email1@domain.tld', 'email2@domain.tld', 'email3@8.8.8.8']);
            });

            it('recognizes complex addresses', function () {
                expect(util.getAddresses('email1@domain.tld "quoted" <email2@domain.tld>, display name <email3@domain.tld>\t"email4"@domain.tld email5@[8.8.8.8],email6@domain.tld; bäre wörd <email7@domain.tld>'))
                    .to.deep.equal(['email1@domain.tld', '"quoted" <email2@domain.tld>', '"display name" <email3@domain.tld>', '"email4"@domain.tld', 'email5@[8.8.8.8]', 'email6@domain.tld', '"bäre wörd" <email7@domain.tld>']);
            });
        });
    });
});
