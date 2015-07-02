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
            if (baton.html !== false) this.append(baton.html); else this.text(baton.halo.name);
        }
    });

    // require('io.ox/core/extensions').point('io.ox/core/person').extend({
    //     id: 'presence',
    //     index: 200,
    //     draw: function () {
    //         this.prepend(
    //             $('<span class="fa fa-circle" style="display: inline-block; font-size: 90%; float: none; margin-right: 0.5em;">')
    //             .css('color', '#c00 #77AC40 #F89406 #ccc'.split(' ')[Math.random() * 4 >> 0])
    //         );
    //     }
    // });

    var regUrl = /((https?|ftps?)\:\/\/[^\s"]+)/gim;

    var that = {

        // render a person's name
        renderPersonalName: function (options, data) {

            options = _.extend({
                $el: undefined,
                // must be properly escaped!
                html: false,
                // to support different tags
                tagName: 'span'
            }, options);

            var halo = {
                // alternative fields to get the name
                name: options.full_name || options.display_name || options.name,
                // halo view looks for email1
                email: options.email,
                email1: options.email,
                // user id
                user_id: options.user_id
            };

            var baton = new ext.Baton({ data: data || {}, halo: halo, html: options.html });

            // get node
            var node = options.$el || (
                halo.email || halo.user_id ?
                $('<a href="#" class="halo-link" tabindex="1">').attr('title', halo.email).data(halo) :
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

            // unescape escaped backslashes
            str = str.replace(/\\{2}/g, '\\');

            return str;
        },

        // fix punctuation marks and brackets at end of URLs
        // central helper to solve this only once
        fixUrlSuffix: function (url, suffix) {
            suffix = suffix || '';
            url = url.replace(/([.,;!?<>\(\)\{\}\[\]\|]+)$/, function (all, marks) {
                suffix = marks + suffix;
                return '';
            });
            return { url: url, suffix: suffix };
        },

        // detect URLs in plain text
        urlify: function (text) {
            return text.replace(regUrl, function (url) {
                var fix = this.fixUrlSuffix(url);
                // soft-break long words (like long URLs)
                return '<a href="' + fix.url + '" target="_blank">' + that.breakableHTML(fix.url) + '</a>' + fix.suffix;
            }.bind(this));
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
            var result = String(text || '').replace(/(\S{20})/g, '$1\u200B');
            if (result[result.length - 1] === '\u200B') {
                result = result.slice(0, -1);
            }
            return result;
        },

        isValidMailAddress: (function () {

            var regQuotes = /^"[^"]+"$/,
                regLocal = /@/,
                regInvalid = /["\\,:; ]/,
                regDot = /^\./,
                regDoubleDots = /\.\./,
                regDomainIPAddress = /^\[(\d{1,3}\.){3}\d{1,3}\]$/,
                // yep, vage
                regDomainIPv6 = /^\[IPv6(:\w{0,4}){0,8}\]$/i,
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
        }()),

        // return deep link for a given file
        getDeepLink: function (app, data) {

            var folder = encodeURIComponent(data.folder_id),
                id = encodeURIComponent(data.id);

            return ox.abs + ox.root + '/#!&app=' + app + '&folder=' + folder + '&id=' + id;
        }
    };

    return that;
});
