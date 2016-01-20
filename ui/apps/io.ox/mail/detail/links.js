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

define('io.ox/mail/detail/links', [
    'io.ox/mail/api',
    'io.ox/core/util',
    'io.ox/core/emoji/util',
    'io.ox/core/extensions',
    'settings!io.ox/mail',
    'gettext!io.ox/mail'
], function (api, util, emoji, ext, settings, gt) {
    'use strict';

    // fix hosts (still need a configurable list on the backend)
    // ox.serverConfig.hosts = (ox.serverConfig.hosts || []).concat('localhost', 'appsuite-dev.open-xchange.com', 'ui-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com');

    function isValidHost(url) {
        var match = url.match(/^https?:\/\/([^\/#]+)/i);
        if (match === null || match.length === 0) return false;
        if (match[1] === 'test') return true;
        return _(ox.serverConfig.hosts).indexOf(match[1]) > -1;
    }

    //
    // Handle replacement
    //

    function replace(result) {
        // get replacement
        var set = $();
        if (result.prefix) set = set.add(processTextNode(result.prefix));
        set = set.add(result.replacement);
        if (result.suffix) set = set.add(processTextNode(result.suffix));
        // now replace
        $(result.node).replaceWith(set);
        return set;
    }

    // Note on regex: [\s\S]* is intended because the dot "." does not include newlines.
    // unfortunately, javascript doesn't support the //s modifier (dotall). [\s\S] is the proper workaround
    // the //m modifier doesn't work in call cases becasue it would drop prefixes before a match in next line
    // see bug 36975

    //
    // Deep links
    //

    var isDeepLink, isInternalDeepLink, parseDeepLink, processDeepLink;

    (function () {

        var keys = 'all prefix link app params param name suffix'.split(' '),
            app = {
                'io.ox/contacts': 'contacts',
                'io.ox/calendar': 'calendar',
                'io.ox/tasks': 'tasks',
                'io.ox/infostore': 'files',
                'io.ox/files': 'files',
                'infostore': 'files'
            },
            items = {
                contacts: gt('Contact'),
                calendar: gt('Appointment'),
                tasks: gt('Task'),
                files: gt('File'),
                infostore: gt('File'),
                'io.ox/office/text': gt('Document'),
                'io.ox/office/spreadsheet': gt('Spreadsheet')
            },
            folders = {
                contacts: gt('Address Book'),
                calendar: gt('Calendar'),
                tasks: gt('Tasks'),
                files: gt('Folder')
            },
            regDeepLink = /^([\s\S]*)(http[^#]+#!{0,2}&?app=([^&]+)((&(folder|id|item|perspective)=[^&\s]+)+))([\s\S]*)$/i,
            regDeepLinkAlt = /^([\s\S]*)(http[^#]+#m=(contacts|calendar|tasks|infostore)((&(f|i)=[^&\s]+)+))([\s\S]*)$/i;

        isDeepLink = function (str) {
            return regDeepLink.test(str) || regDeepLinkAlt.test(str);
        };

        isInternalDeepLink = function (str) {
            return isDeepLink(str) && isValidHost(str);
        };

        parseDeepLink = function (str) {
            var matches = String(str).match(regDeepLink.test(str) ? regDeepLink : regDeepLinkAlt),
                data = _.object(keys, matches),
                params = _.deserialize(data.params, '&');
            // fix app
            data.app = app[data.app] || data.app;
            // class name
            if (/^(files|infostore)$/.test(data.app)) {
                data.className = 'deep-link-files';
            } else if (/^(contacts|calendar|tasks)$/.test(data.app)) {
                data.className = 'deep-link-' + data.app;
            } else {
                data.className = 'deep-link-app';
            }
            // add folder, id, perspective (jQuery's extend to skip undefined)
            // share links use "item" instead of "id" (for whatever reason)
            return $.extend(data, { folder: params.f, id: params.i }, { folder: params.folder, id: params.id || params.item, perspective: params.perspective });
        };

        // node must be a plain text node or a string
        processDeepLink = function (node) {

            var data = parseDeepLink(node.nodeValue),
                text = ('id' in data ? items[data.app] : folders[data.app]) || gt('Link'),
                link = $('<a href="#" target="_blank" class="deep-link" role="button">')
                    .attr('href', data.link)
                    .text(text);

            // internal document?
            if (isValidHost(data.link)) {
                // add either specific css class or generic "app" deep-link
                link.addClass(data.className).data(data);
            }

            // move up?
            if ($(node).parent().attr('href') === data.link) node = $(node).parent().get(0);

            return { node: node, prefix: data.prefix, replacement: link, suffix: data.suffix };
        };

    }());

    //
    // URL
    //

    var regUrl = /^([\s\S]*?)(((http|https|ftp|ftps)\:\/\/|www\.)\S+)([\s\S]*)$/i,
        regUrlMatch = /^([\s\S]*?)(((http|https|ftp|ftps)\:\/\/|www\.)\S+)([\s\S]*)$/i; /* dedicated one to avoid strange side effects */

    function processUrl(node) {

        var matches = node.nodeValue.match(regUrlMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], url = matches[2], suffix = matches[5];

        // fix punctuation marks and brackets
        var fix = util.fixUrlSuffix(url, suffix), href = fix.url;
        if (!/^http/i.test(href)) href = 'http://' + href;
        var link = $('<a href="#" target="_blank">').attr('href', href).text(fix.url);

        return { node: node, prefix: prefix, replacement: link, suffix: fix.suffix };
    }

    //
    // Mail Address (RFC 6531 allows unicode beycond 0x7F)
    // Until we discover real use-cases we stick to [\u0000-\u00FF] to support extended ASCII, e.g. umlauts
    // This excludes Kanji in local part, for example (see bug 37051)

    var regMail = /^([\s\S]*?)([^"\s<,:;\(\)\[\]\u0100-\uFFFF]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})([\s\S]*)$/i,
        regMailMatch = /^([\s\S]*?)([^"\s<,:;\(\)\[\]\u0100-\uFFFF]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})([\s\S]*)$/i; /* dedicated one to avoid strange side effects */

    function processMailAddress(node) {

        var matches = node.nodeValue.match(regMailMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], address = matches[2], suffix = matches[4];

        var link = $('<a href="#" class="mailto-link" target="_blank">').attr('href', 'mailto:' + address)
            .data({ address: address })
            .text(address);

        return { node: node, prefix: prefix, replacement: link, suffix: suffix };
    }

    //
    // Complex Mail Address: "name" <address>
    //

    var regMailComplex = /^([\s\S]*?)(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+<([^@]+@[^&]+)>([\s\S]*)$/,
        regMailComplexMatch = /^([\s\S]*?)(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+<([^@]+@[^&]+)>([\s\S]*)$/;

    function processComplexMailAddress(node) {

        var matches = node.nodeValue.match(regMailComplexMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], name = matches[4], address = matches[7], suffix = matches[8];

        var link = $('<a href="#" class="mailto-link" target="_blank">').attr('href', 'mailto:' + address)
            .data({ address: address, name: name })
            .text(name);

        return { node: node, prefix: prefix, replacement: link, suffix: suffix };
    }

    //
    // Handlers
    //

    // A handler must implement test() and process().
    // test() gets the current text node and returns true/false.
    // process() gets current text node and returns an object
    // that contains node, prefix, replacement, suffix.
    // prefix and suffix are the text parts before and after the
    // replacement that might be need further processing

    var handlers = {

        'deeplink': {
            test: function (node) {
                // quick check
                if (node.nodeValue.indexOf('http') === -1) return false;
                // precise check
                return isDeepLink(node.nodeValue);
            },
            process: processDeepLink
        },

        'mail-address-complex': {
            test: function (node) {
                // quick check
                if (node.nodeValue.indexOf('@') === -1) return false;
                // precise check
                return regMailComplex.test(node.nodeValue) && $(node).closest('a').length === 0;
            },
            process: processComplexMailAddress
        },

        'mail-address': {
            test: function (node) {
                // quick check
                if (node.nodeValue.indexOf('@') === -1) return false;
                // precise check
                return regMail.test(node.nodeValue) && $(node).closest('a').length === 0;
            },
            process: processMailAddress
        },

        'url': {
            test: function (node) {
                // quick check
                if (!/(http|www\.)/.test(node.nodeValue)) return false;
                // precise check
                return regUrl.test(node.nodeValue) && $(node).closest('a').length === 0;
            },
            process: processUrl
        },

        'long-character-sequences': {
            test: function (node) {
                var text = node.nodeValue;
                return text.length >= 30 && /\S{30}/.test(text) && $(node).closest('a').length === 0;
            },
            process: function (node) {
                return { node: node, replacement: $.parseHTML(util.breakableHTML(node.nodeValue)) };
            }
        },

        'long-non-breaking-space-sequence': {
            test: function (node) {
                var text = node.nodeValue;
                return text.length >= 30 && /(\S|\u00a0){40}/.test(text) && $(node).closest('a').length === 0;
            },
            process: function (node) {
                var replacement = node.nodeValue.replace(/\u00a0/g, ' ');
                return { node: node, replacement: $.parseHTML(replacement) };
            }
        }
    };

    //
    // Text nodes
    //

    function processTextNode(node) {

        if (_.isString(node)) node = $.txt(node);
        if (node.nodeType !== 3) return;

        for (var id in handlers) {
            var handler = handlers[id];
            if (handler.test(node)) {
                return replace(handler.process(node));
            }
        }

        return node;
    }

    ext.point('io.ox/mail/detail/content').extend({
        id: 'links',
        index: 100,
        process: function (baton) {
            // process all text nodes unless mail is too large (> 512 KB)
            if (baton.isLarge) return;
            // don't combine these two lines via add() - very slow!
            $(this).contents().each(function () {
                processTextNode(this);
            });
            $(this).find('*:not(style)').contents().each(function () {
                processTextNode(this);
            });
        }
    });

    return {
        handlers: handlers,
        isValidHost: isValidHost,
        isDeepLink: isDeepLink,
        isInternalDeepLink: isInternalDeepLink,
        parseDeepLink: parseDeepLink,
        processDeepLink: processDeepLink,
        processTextNode: processTextNode
    };
});
