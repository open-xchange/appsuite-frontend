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

    var regMailComplexMatch = /^([\s\S]*?)(?:&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(?:\s|<br>)+(?:<|&#60;)([^@]+@[^&].*?)(?:>|&#62;)([\s\S]*)$/;

    function processComplexMailAddress(node) {

        var matches = node.nodeValue.match(regMailComplexMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], name = matches[2] || matches[3] || matches[4], address = matches[5], suffix = matches[6];

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
                return regMailComplexMatch.test(node.nodeValue) && $(node).closest('a').length === 0;
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
                return text.length >= 30 && /[\S\u00A0]{30}/.test(text) && $(node).closest('a').length === 0;
            },
            process: function (node) {
                return { node: node, replacement: $.parseHTML(util.breakableHTML(node.nodeValue)) };
            }
        }
    };

    if (settings.get('features/recognizeDates', false)) {

        (function () {

            var regTest = {}, regReplace = {}, patterns;

            var weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                weekdaysI18n = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'],
                year = moment().year();

            patterns = {
                names: '(((this|next|last|diesen|nächsten|letzten)\\s)?(' + weekdays.join('|') + '|' + weekdaysI18n.join('|') + '))',
                relative: '(yesterday|today|tomorrow|day\\safter\\stomorrow|gestern|heute|morgen|übermorgen)',
                date: '(\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}|\\d{1,2}\\.\\d{1,2}\\.|(cw|kw|week)\\s?\\d{1,2})',
                time: '(\\d{1,2}\\:\\d\\d)(\\s?(h|a|am|p|pm))?',
                range: '((from|von)\s)?(\\d{1,2}\\:\\d\\d)\s?(-|to|bis)\s?(\\d{1,2}\\:\\d\\d)'
            };

            patterns.day = '(' + patterns.names + '|' + patterns.relative + '|' + patterns.date + ')';

            ['day', 'name', 'date', 'time'].forEach(function (id) {
                regTest[id] = new RegExp(patterns[id], 'i');
                regReplace[id] = new RegExp(patterns[id], 'ig');
            });

            var today = moment().hour(12).minute(0), noon = ' 12:00', dot = 'DD.MM.YYYY HH:mm', slash = 'MM/DD/YYYY HH:mm';

            var parsers = [
                [/\d{1,2}\.\d{1,2}\.\d{2,4}/, function (s) { return moment(s + noon, dot); }],
                [/\d{1,2}\.\d{1,2}\./, function (s) { return moment(s + year + noon, dot); }],
                [/\d{1,2}\/\d{1,2}\/\d{2,4}/, function (s) { return moment(s + noon, slash); }],
                [/\d{1,2}\/\d{1,2}/, function (s) { return moment(s + year + noon, slash); }],
                [/(cw|kw|week)\s?(\d{1,2})/i, function (s, match) { return m().week(match[2]); }]
            ];

            var timeParsers = [
                [/(\d{1,2}):(\d\d)h?/, function (s, match) { return moment(0).hour(match[1]).minute(match[2]); }],
                [/(\d{1,2}):(\d\d)\s?(am|pm|a|p)/, function (s, match) { return moment(0).hour(match[1]).minute(match[2]).add(m[3][0] === 'p' ? 12 : 0, 'h'); }]
            ];

            var replacements = {
                'yesterday': function () { return m().subtract(1, 'd'); },
                'today': function () { return m(); },
                'tomorrow': function () { return m().add(1, 'd'); },
                'day after tomorrow': function () { return m().add(2, 'd'); }
            };

            var i18n = {
                'gestern': 'yesterday',
                'heute': 'today',
                'morgen': 'tomorrow',
                'übermorgen': 'day after tomorrow'
            };

            _.range(0, 7).forEach(function (i) {
                var day = weekdays[i], dayI18n = weekdaysI18n[i];
                replacements['this ' + day] = function () { return m().day(i); };
                replacements['last ' + day] = function () { return m().day(i - 7); };
                replacements['next ' + day] = replacements[day] = function () { return m().day(i + 7); };
                i18n['diesen ' + dayI18n] = 'this ' + day;
                i18n['letzten ' + dayI18n] = 'last ' + day;
                i18n['nächsten ' + dayI18n] = i18n[dayI18n] = 'next ' + day;
            });

            function m() {
                return moment(today);
            }

            function replace(base, part) {
                var date = base === null ? part : base,
                    timestamp = getDateTimestamp(date), time;
                // ignore invalid dates
                if (!timestamp.isValid()) return part;
                // consider part as time?
                if (base !== null) {
                    time = getTime(part);
                    if (time && time.isValid()) timestamp.hour(time.hour()).minute(time.minute());
                }
                // return link
                return '<a href="#" class="calendar-link" data-start-time="' + timestamp + '" role="button" tabindex="1">' + part + '</a>';
            }

            function getRecentDate(str) {
                var date = str.match(regTest.day);
                return date ? date[0] : null;
            }

            function getSentences(str) {
                // escape text to be reinserted as HTML
                return _.escape(str).replace(/(\w\w[.?!]\s|$)/g, '$1\x1D').replace(/\x1D$/, '').split(/\x1D/);
            }

            function getTime(str) {
                for (var i in timeParsers) {
                    var match = timeParsers[i][0].exec(str);
                    if (match) return timeParsers[i][1](str, match);
                }
                return 0;
            }

            function getDateTimestamp(str) {
                // formatted?
                for (var i in parsers) {
                    var match = parsers[i][0].exec(str);
                    if (match) return parsers[i][1](str, match);
                }
                // check names
                str = str.toLowerCase();
                if (i18n[str]) str = i18n[str];
                if (replacements[str]) return replacements[str]();
                console.error('Unsupported date "' + str + '"');
                return moment();
            }

            // debug
            $(document).on('click', '.calendar-link', function (e) {
                e.preventDefault();
                var start_date = $(this).data('startTime'),
                    end_date = $(this).data('endTime') || (start_date + 3600000);
                // console.log('AHA!', moment(start_date).format('DD. MMMM YYYY HH:mm'));
                ox.load(['io.ox/calendar/edit/main']).done(function (edit) {
                    edit.getApp().launch().done(function () {
                        this.create({ start_date: start_date, end_date: end_date });
                    });
                });
            });

            handlers.dates = {
                test: function (node) {
                    var text = node.nodeValue;
                    return (regTest.day.test(text) || regTest.time.test(text)) && (!node.parentNode || node.parentNode.tagName !== 'A');
                },
                process: function (node) {
                    // break into sentences first
                    var sentences = getSentences(node.nodeValue),
                        recentDate,
                        html = _(sentences).reduce(function (html, sentence) {
                            recentDate = getRecentDate(sentence) || recentDate || 'today';
                            return html + sentence
                                .replace(regReplace.day, replace.bind(null, null))
                                .replace(regReplace.range, replace.bind(null, recentDate))
                                .replace(regReplace.time, replace.bind(null, recentDate));
                        }, '');
                    return { node: node, replacement: $.parseHTML(html) };
                }
            };

        }());
    }

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
