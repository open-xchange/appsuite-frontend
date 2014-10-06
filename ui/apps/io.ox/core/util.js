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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/util', ['io.ox/core/extensions'], function (ext) {

    'use strict';

    var LENGTH = 30,
        regSeqSoft = /(\S{30,})/g,
        regSeqHard = /(\S{30})/g,
        regHyphenation = /([^.,;:-=()]+[.,;:-=()])/;

    ext.point('io.ox/core/person').extend({
        id: 'default',
        index: 100,
        draw: function (baton) {
            if (baton.html !== false) this.append(baton.html); else this.text(baton.data.name);
        }
    });

    return {

        // render a person's name
        renderPersonalName: function (options) {

            options = _.extend({
                $el: undefined,
                html: false, // must be properly escaped!
                tagName: 'span' // to support different tags
            }, options);

            var data = {
                // alternative fields to get the name
                name: options.full_name || options.display_name || options.name,
                // halo view looks for email1
                email: options.email,
                email1: options.email,
                // user id
                user_id: options.user_id
            };

            var baton = new ext.Baton({ data: data, html: options.html });

            // get node
            var node = options.$el || (
                data.email || data.user_id ?
                $('<a href="#" class="halo-link" tabindex="1">').attr('title', data.email).data(data) :
                $('<' + options.tagName + '>')
            );

            ext.point('io.ox/core/person').invoke('draw', node.empty(), baton);

            return node;
        },

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
        breakableHTML: function (text) {
            // inject zero width space and replace by <wbr>
            var substrings = String(text || '').replace(regSeqSoft, function (match) {
                // soft break long sequences
                return _(match.split(regHyphenation))
                    .map(function (str) {
                        // hard break long sequences
                        if (str.length === 0) return '';
                        if (str.length < LENGTH) return str + '\u200B';
                        return str.replace(regSeqHard, '$1\u200B');
                    })
                    .join('');
            });
            // split at \u200B, escape HTML and inject <wbr> tag
            return _(substrings.split('\u200B')).map(_.escape).join('<wbr>');
        },

        breakableText: function (text) {
            return String(text || '').replace(/(\S{20})([^$])/g, '$1\u200B$2');
        },

        isValidMailAddress: (function () {

            var regQuotes = /^"[^"]+"$/,
                regLocal = /@/,
                regInvalid = /["\\,:; ]/,
                regDot = /^\./,
                regDoubleDots = /\.\./,
                regDomainIPAddress = /^\[(\d{1,3}\.){3}\d{1,3}\]$/,
                regDomainIPv6 = /^\[IPv6(:\w{0,4}){0,8}\]$/i, // yep, vage
                regDomain = /[a-z0-9]$/i;

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
