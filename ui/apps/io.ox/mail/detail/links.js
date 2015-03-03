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
], function (api, coreUtil, emoji, ext, settings, gt) {

    'use strict';

    $(document).on('click', '.deep-link-files', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            // open file in side-popup
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/files/api', 'io.ox/files/fluid/view-detail','io.ox/core/notifications']).done(function (dialogs, api, view, notifications) {
                var sidePopup = new dialogs.SidePopup({ tabTrap: true }),
                    // this pseudo app is used instead of the real files app to save resources. Because the real files app is not required when displaying a side popup.
                    pseudoApp = {
                        getName: function () { return 'io.ox/files'; },
                        folder: _.extend({
                            set: function (folderId) {
                                ox.launch('io.ox/files/main', { folder: folderId, perspective: 'fluid:list' }).done(function () {
                                    var app = this;
                                    // switch to proper perspective
                                    ox.ui.Perspective.show(app, 'fluid:list').done(function () {
                                        // set proper folder
                                        if (app.folder.get() === folderId) {
                                            app.selection.set(folderId);
                                        } else {
                                            app.folder.set(folderId).done(function () {
                                                app.selection.set(folderId);
                                            });
                                        }
                                    });
                                });
                            },
                            getData: function () {
                                return $.Deferred().resolve(data);
                            }
                        }, data)
                    };

                sidePopup.show(e, function (popupNode) {
                    popupNode.busy();
                    api.get(_.cid(data.id)).done(function (data) {
                        popupNode.idle().append(view.draw(data, pseudoApp));
                    }).fail(function (e) {
                        sidePopup.close();
                        notifications.yell(e);
                    });
                });
            });
        } else {
            // open files app
            ox.launch('io.ox/files/main', { folder: data.folder, perspective: 'fluid:list' }).done(function () {
                var app = this, folder = data.folder, id = data.id;
                // switch to proper perspective
                ox.ui.Perspective.show(app, 'fluid:list').done(function () {
                    // set proper folder
                    if (app.folder.get() === folder) {
                        app.selection.set(id);
                    } else {
                        app.folder.set(folder).done(function () {
                            app.selection.set(id);
                        });
                    }
                });
            });
        }
    });

    $(document).on('click', '.deep-link-contacts', function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/contacts/main', { folder: data.folder }).done(function () {
            var app = this, folder = data.folder, id = data.id;
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    });

    $(document).on('click', '.deep-link-calendar', function (e) {
        e.preventDefault();
        var data = $(this).data();
        if (data.id) {
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/api', 'io.ox/calendar/view-detail']).done(function (dialogs, api, view) {
                new dialogs.SidePopup({ tabTrap: true }).show(e, function (popup) {
                    popup.busy();
                    api.get(data).done(function (data) {
                        popup.idle().append(view.draw(data));
                    });
                });
            });

        } else {
            ox.launch('io.ox/calendar/main', { folder: data.folder, perspective: 'list' }).done(function () {
                var app = this, folder = data.folder;
                // switch to proper perspective
                ox.ui.Perspective.show(app, 'week:week').done(function (p) {
                    // set proper folder
                    if (app.folder.get() === folder) {
                        p.view.trigger('showAppointment', e, data);
                    } else {
                        app.folder.set(folder).done(function () {
                            p.view.trigger('showAppointment', e, data);
                        });
                    }
                });
            });
        }
    });

    $(document).on('click', '.deep-link-tasks', function (e) {
        e.preventDefault();
        var data = $(this).data();
        ox.launch('io.ox/tasks/main', { folder: data.folder }).done(function () {
            var app = this, folder = data.folder, id = data.id;
            if (app.folder.get() === folder) {
                app.getGrid().selection.set(id);
            } else {
                app.folder.set(folder).done(function () {
                    app.getGrid().selection.set(id);
                });
            }
        });
    });

    $(document).on('click', '.mailto-link', function (e) {

        e.preventDefault();

        var node = $(this), data = node.data(), address, name, tmp, params = {};

        // has data?
        if (data.address) {
            // use existing address and name
            address = data.address;
            name = data.name || data.address;
        } else {
            // parse mailto string
            // cut off leading "mailto:" and split at "?"
            tmp = node.attr('href').substr(7).split(/\?/, 2);
            // address
            address = tmp[0];
            // use link text as display name
            name = node.text();
            // process additional parameters; all lower-case (see bug #31345)
            params = _.deserialize(tmp[1]);
            for (var key in params) params[key.toLowerCase()] = params[key];
        }

        // go!
        ox.registry.call('mail-compose', 'compose', {
            to: [[name, address]],
            subject: params.subject || '',
            attachments: [{ content: params.body || '' }]
        });
    });

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

    var isDeepLink, parseDeepLink, processDeepLink;

    (function () {

        var keys = 'all prefix link app params param name suffix'.split(' '),
            app = { contacts: 'contacts', calendar: 'calendar', task: 'tasks', infostore: 'files' },
            items = { contacts: gt('Contact'), calendar: gt('Appointment'), tasks: gt('Task'), files: gt('File') },
            folders = { contacts: gt('Address Book'), calendar: gt('Calendar'), tasks: gt('Tasks'), files: gt('Folder') },
            regDeepLink = /^([\s\S]*)(http[^#]+#!?&?app=io\.ox\/(contacts|calendar|tasks|files)((&(folder|id|perspective)=[^&\s]+)+))([\s\S]*)$/i,
            regDeepLinkAlt = /^([\s\S]*)(http[^#]+#m=(contacts|calendar|tasks|infostore)((&(f|i)=[^&\s]+)+))([\s\S]*)$/i;

        isDeepLink = function (str) {
            return regDeepLink.test(str) || regDeepLinkAlt.test(str);
        };

        parseDeepLink = function (str) {
            var matches = String(str).match(regDeepLink.test(str) ? regDeepLink : regDeepLinkAlt),
                data = _.object(keys, matches),
                params = _.deserialize(data.params, '&');
            // fix app
            data.app = app[data.app] || data.app;
            // add folder, id, perspective (jQuery's extend to skip undefined)
            return $.extend(data, { folder: params.f, id: params.i }, { folder: params.folder, id: params.id, perspective: params.perspective });
        };

        // node must be a plain text node or a string
        processDeepLink = function (node) {

            var data = parseDeepLink(node.nodeValue),
                link = $('<a role="button" href="#" target="_blank" class="deep-link btn btn-primary btn-xs" style="font-family: Arial; color: white; text-decoration: none;">')
                    .attr('href', data.link)
                    .text('id' in data ? items[data.app] : folders[data.app]);

            // internal document?
            if (isValidHost(data.link)) {
                link.addClass('deep-link-' + data.app).data(data);
            }

            // move up?
            if ($(node).parent().attr('href') === data.link) node = $(node).parent().get(0);

            return { node: node, prefix: data.prefix, replacement: link, suffix: data.suffix };
        };

    }());

    //
    // URL
    //

    var regUrl = /^([\s\S]*)((http|https|ftp|ftps)\:\/\/\S+)([\s\S]*)$/i,
        regUrlMatch = /^([\s\S]*)((http|https|ftp|ftps)\:\/\/\S+)([\s\S]*)$/i; /* dedicated one to avoid strange side effects */

    function processUrl(node) {

        var matches = node.nodeValue.match(regUrlMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], url = matches[2], suffix = matches[4];

        // fix punctuation marks
        url = url.replace(/([.,;!?]+)$/, function (all, marks) {
            suffix = marks + suffix;
            return '';
        });

        var link = $('<a href="#" target="_blank">').attr('href', url).text(url);

        return { node: node, prefix: prefix, replacement: link, suffix: suffix };
    }

    //
    // Mail Address
    //

    var regMail = /^([\s\S]*?)([^"\s<,:;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})([\s\S]*)$/i,
        regMailMatch = /^([\s\S]*?)([^"\s<,:;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})([\s\S]*)$/i; /* dedicated one to avoid strange side effects */

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
            test: function (node) {
                // quick check
                if (node.nodeValue.indexOf('@') === -1) return false;
                // precise check
                return regMailComplex.test(node.nodeValue) && $(node).closest('a').length === 0;
            },
            process: processComplexMailAddress
        },

        'mail-address': {
            test: function (node) {
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
                if (node.nodeValue.indexOf('http') === -1) return false;
                // precise check
                return regUrl.test(node.nodeValue) && $(node).closest('a').length === 0;
            },
            process: processUrl
        },

        'long-character-sequences': {
            test: function (node) {
                var text = node.nodeValue;
                return text.length >= 30 && /\S{30}/.test(text);
            },
            process: function (node) {
                return { node: node, replacement: $.parseHTML(coreUtil.breakableHTML(node.nodeValue)) };
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
        isDeepLink: isDeepLink,
        parseDeepLink: parseDeepLink,
        processDeepLink: processDeepLink,
        processTextNode: processTextNode
    };
});
