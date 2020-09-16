/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/util', [
    'io.ox/core/extensions',
    'settings!io.ox/core',
    'static/3rd.party/purify.min.js'
], function (ext, settings, DOMPurify) {

    'use strict';

    var LENGTH = 30,
        prefix = ox.serverConfig.prefix || '/ajax',
        regSeqSoft = /(\S{30,})/g,
        regSeqHard = /(\S{30})/g,
        regHyphenation = /([^.,;:-=()]+[.,;:-=()])/,
        regImageSrc = new RegExp('^' + prefix);

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
    //             $('<span class="fa fa-circle" style="display: inline-block; font-size: 90%; float: none; margin-right: 0.5em;" aria-hidden="true">')
    //             .css('color', '#c00 #77AC40 #F89406 #ccc'.split(' ')[Math.random() * 4 >> 0])
    //         );
    //     }
    // });

    var regUrl = /(((https?|ftps?):\/\/)[^\s"]+)/gim;

    var that = {

        replacePrefix: function (data, replacement) {
            data = data || '';
            replacement = replacement || '';

            return data.replace(regImageSrc, replacement);
        },

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
                name: options.full_name || options.display_name || options.name || options.cn || options.email,
                // halo view looks for email1
                email: options.email,
                email1: options.email,
                // user id
                user_id: options.user_id
            };

            // add contact data if available, (extended entities for attendees for example)
            if (options.contact) halo.contact = options.contact;

            if (data && data.nohalo) options.$el = $('<span>');

            var baton = new ext.Baton({ data: data || {}, halo: halo, html: options.html });

            // get node
            var node = options.$el || (
                halo.email || halo.user_id ?
                    $('<a href="#" role="button" class="halo-link">').attr('title', halo.email).data(halo) :
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
            url = url.replace(/([.,;!?<>(){}[\]|]+)$/, function (all, marks) {
                suffix = marks + suffix;
                return '';
            });
            return { url: url, suffix: suffix };
        },

        // remove (almost) all quotes from a string
        removeQuotes: function (str) {
            // remove all outer single and double quotes; also remove all inner quotes
            return $.trim(str).replace(/^["'\\]+|["'\\]+$/g, '').replace(/\\?"/g, '');
        },

        // detect URLs in plain text
        urlify: function (text) {
            text = (text || '').replace(regUrl, function (url) {
                var fix = this.fixUrlSuffix(url);
                // soft-break long words (like long URLs)
                var node = $('<a target="_blank" rel="noopener">').attr('href', fix.url).append(that.breakableHTML(fix.url));
                return node.prop('outerHTML') + fix.suffix;
            }.bind(this));
            text = DOMPurify.sanitize(text, { ALLOW_DATA_ATTR: false, ALLOWED_TAGS: ['a', 'wbr'], ALLOWED_ATTR: ['target', 'rel', 'href'], SAFE_FOR_JQUERY: true });
            text = that.injectAttribute(text, 'a', 'rel', 'noopener');
            return text;

        },

        injectAttribute: function (text, tagName, attr, value) {
            var tmp = document.createElement('div');
            tmp.innerHTML = text;
            _(tmp.getElementsByTagName(tagName)).each(function (node) {
                node.setAttribute(attr, value);
            });
            return tmp.innerHTML;
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
            return _(substrings.split('\u200B')).map(_.escape).join('<wbr>').replace(/\u00a0/g, '\u00a0<wbr>');
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

            var regex = /^\+?[0-9 .,;\-/()*#]+$/,
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
            var folder, id = '';
            if (data.folder_id === undefined) {
                folder = '&folder=' + encodeURIComponent(data.id);
            } else {
                folder = '&folder=' + encodeURIComponent(data.folder_id);
                id = '&id=' + (/^[\d/]+$/.test(data.id) ? data.id : encodeURIComponent(data.id));
            }
            return ox.abs + ox.root + '/#!&app=' + app + folder + id;
        },

        // recognize addresses in a string (see bug 49937)
        // delimiters: comma, semi-colon, tab, newline, space; ignores delimiters in quotes
        // display name can contain a-z plus \u00C0-\u024F, i.e. Latin supplement, Latin Extended-A, and Latin Extended-B (see OXUI-297)
        // the local part is either a quoted string or latin (see above) plus . ! # $ % & ' * + - / = ? ^ _ ` { | } ~
        // returns array of addresses
        getAddresses: function (str) {
            // cover simple case separately; simple string without comma, semi-colon or white-space (see bug 57870)
            if (/^[^,;\s]+$/.test(str)) return [str];
            var addresses = String(str).match(/("[^"]+"|'[^']+'|\w[\w\u00C0-\u024F.!#$%&'*+-/=?^_`{|}~]*)@[^,;\x20\t\n]+|[\w\u00C0-\u024F][\w\u00C0-\u024F\-\x20]+\s<[^>]+>|("[^"]+"|'[^']+')\s<[^>]+>/g) || [];
            return addresses.map(function (str) {
                return str.replace(/^([^"]+)\s</, '"$1" <');
            });
        },

        getShardingRoot: (function () {
            var defaultUrl = location.host + ox.apiRoot,
                hosts = [].concat(settings.get('shardingSubdomains', defaultUrl));
            function sum(s) {
                var i = s.length - 1, sum = 0;
                for (; i; i--) sum += s.charCodeAt(i);
                return sum;
            }
            return function (url) {
                var index = 0;
                // special case, if url already has the root and the protocol attached
                if (url.indexOf('//' + defaultUrl) === 0) url = url.substr(defaultUrl.length + 2);
                if (hosts.length > 1) index = sum(url) % hosts.length;
                if (!/^\//.test(url)) url = '/' + url;
                // do not use sharding when on development system
                if (ox.debug) return '//' + defaultUrl + url;
                return '//' + hosts[index] + url;
            };
        }()),

        getScrollBarWidth: _.memoize(function () {
            var $outer = $('<div>').css({ visibility: 'hidden', width: 100, overflow: 'scroll' }).appendTo('body'),
                widthWithScroll = $('<div>').css({ width: '100%' }).appendTo($outer).outerWidth();
            $outer.remove();
            return 100 - widthWithScroll;
        }),

        // helper function to get userNames from different objects. It helps to get usernames from different contexts
        // type should be "created" or "modified", default is created
        // data is the object containing the created_by or modified_by attributes
        getName: function (data, type) {
            console.log('getName');
            if (data === undefined) return $.Deferred().reject({ error: 'Unknown User' });
            type = type || 'created';

            // try extended data first (no need to request data from the server)
            var userData = data[type + '_from'];

            var name = checkForName(userData);
            if (name) return $.when(name);

            // try to get name via user id second
            userData = data[type + '_by'];

            if (userData !== undefined) {
                return require(['io.ox/core/api/user']).then(function (userAPI) {
                    return userAPI.getName(userData);
                });
            }

            return $.Deferred().reject({ error: 'Unknown User' });
        },

        getTextNode: function (data, type) {
            console.log('getTextNode');
            if (data === undefined) return '';
            type = type || 'created';
            var node = document.createTextNode(''),
                // try extended data first (no need to request data from the server)
                userData = data[type + '_from'];

            var name = checkForName(userData);
            if (name) {
                node.nodeValue = name;
                return node;
            }

            // try to get name via user id second
            userData = data[type + '_by'];

            if (userData !== undefined) {
                require(['io.ox/core/api/user']).then(function (userAPI) {
                    userAPI.get(userData)
                    .done(function (data) {
                        node.nodeValue = data.display_name || data.email1 || '';
                    })
                    .always(function () {
                        // use defer! otherwise we return null on cache hit
                        _.defer(function () {
                            // don't leak
                            node = null;
                        });
                    });
                });
            }
            return node;
        }
    };

    // helper to find the first usable name with mail as fallback
    function checkForName(userData) {
        var result;
        if (userData && (userData.displayName || !_.isEmpty(userData.contact))) {
            // display name first
            if (userData.displayName) {
                result = userData.displayName;
            // try to get name via contact data
            } else if (userData.contact.firstName && userData.contact.lastName) {
                result = userData.contact.firstName + ' ' + userData.contact.lastName;
            } else if (userData.contact.firstName || userData.contact.lastName) {
                result = userData.contact.firstName || userData.contact.lastName;
            // email
            } else if (userData.contact.email1) {
                result = userData.contact.email1;
            }
        }

        return result;
    }

    return that;
});
