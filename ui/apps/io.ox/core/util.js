/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/util', [/* only add light core deps, not stuff like account API or mail API */], function () {

    'use strict';

    return {

        // remove unwanted quotes from display names
        // "World, Hello" becomes World, Hello
        // but "Say \"Hello\"" becomes Say "Hello"
        unescapeDisplayName: function (str) {

            str = $.trim(str || '');

            // remove outer quotes
            while (str.length > 1 && /^["'\\\s]/.test(str[0]) && str[0] === str.substr(-1)) {
                str = $.trim(str.substr(1, str.length - 2));
            }

            // unescape inner quotes
            str = str.replace(/\\"/g, '"');

            return str;
        },

        // split long character sequences
        breakableHTML: function (text, node) {
            // inject zero width space and replace by <wbr>
            var substrings = String(text || '').replace(/(\S{20})/g, '$1\u200B').split('\u200B');
            return _(substrings).map(_.escape).join('<wbr/>');
        },

        breakableText: function (text) {
            return String(text || '').replace(/(\S{20})/g, '$1\u200B');
        },

        isValidMailAddress: (function () {

            var regQuotes = /^"[^"]+"$/,
                regLocal = /@/,
                regInvalid = /["\\,:; ]/,
                regDot = /^\./,
                regDoubleDots = /\.\./,
                regDomainIPAddress = /^\[(\d{1,3}\.){3}\d{1,3}\]$/,
                regDomainIPv6 = /^\[IPv6(:\w{0,4}){0,8}\]$/i, // yep, vage
                regDomain = /[a-z]$/i;

            // email address validation is not trivial
            // this in not 100% RFC but a good check (https://tools.ietf.org/html/rfc3696#page-5)
            function validate(val) {
                // empty is ok!
                if (val === '') return true;
                // has no @?
                var index = val.lastIndexOf('@');
                if (index <= 0) return false;
                // get local and domain part
                var local = val.substr(0, index), domain = val.substr(index + 1);
                // check local part length
                if (local.length > 64 && local.length > 0) return false;
                // check domain part length
                if (domain.length > 255) return false;
                // no quotes?
                if (!regQuotes.test(local)) {
                    // ... but another @? ... start with dot? ... consective dots? ... invalid chars?
                    if (regLocal.test(local) || regDot.test(local) || regDoubleDots.test(local) || regInvalid.test(local)) return false;
                }
                // valid domain?
                if (regDomainIPAddress.test(domain) || regDomainIPv6.test(domain) || regDomain.test(domain)) return true;
                // no?
                return false;
            }

            return function (val) {
                return validate($.trim(val));
            };

        }()),

        isValidPhoneNumber: (function () {

            var regex = /^\+?[0-9 .,;\-\/\(\)\*\#]+$/,
                tooShort = /^\+\d{0,2}$/;

            function validate(val) {
                // empty is ok!
                if (val === '') return true;
                if (tooShort.test(val)) return false;
                return regex.test(val);
            }

            return function (val) {
                return validate($.trim(val));
            };
        }())
    };
});

/*
function test(val, expected) {
    var util = require('io.ox/core/util'),
        valid = util.isValidMailAddress(val) === expected;
    console[valid ? 'log' : 'error'](val);
}
test('name@domain.com', true);
test('name@host', true);
test('name@123', false);
test('name@[1.2.3.4]', true);
test('name@[1.2.3.4.5]', false);
test('name@[1.2.3.A]', false);
test('name@[1.2.3.4444]', false);
test('name@[IPv6:2001:db8:1ff::a0b:dbd0]', true);
test('name@[2001:db8:1ff::a0b:dbd0]', false);
test('@domain.com', false);
test('name@', false);
test('@', false);
test('name@abc@domain.com', false);
test('first.last@domain.com', true);
test('first,last@domain.com', false);
test('first last@domain.com', false);
test('first\\last@domain.com', false);
test('first"last@domain.com', false);
test('first..last@domain.com', false);
test('.first.last@domain.com', false);
test('"quoted"@domain.com', true);
test('"another@"@domain.com', true);
test('"but"not"@domain.com', false);
*/

/*
function test(val, expected) {
    var util = require('io.ox/core/util'),
        valid = util.isValidPhoneNumber(val) === expected;
    console[valid ? 'log' : 'error'](val);
}
test('', true);
test(' ', true);
test('01234567', true);
test('0123 4567', true);
test('+491234567', true);
test('0123+4567', false);
test('+49 (0) 1234567', true);
test('+1', false);
test('+49', false);
test('+49 0 1234567', true);
test('+49-0-1234567', true);
test('+49-0-1234567#1', true);
test('+49-0-1234567,1,2', true);
test('+49.0.1234567', true);
test('+49 0 / 1234567', true);
test('+49 0 / 123456 - 7', true);
test('+49 0 / 123456 - ABC', false);
test('+49 0::1234567', false);
test('+49 0 1234 [567]', false);
test('++49 0 1234567', false);
test('+49_0_1234567', false);
test('+49 0 1234567 \\ 23', false);
*/
