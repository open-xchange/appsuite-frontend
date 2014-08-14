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

define('io.ox/mail/detail/links',
    ['io.ox/mail/api',
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
                var sidePopup = new dialogs.SidePopup({ tabTrap: true });
                sidePopup.show(e, function (popupNode) {
                    popupNode.busy();
                    api.get(_.cid(data.id)).done(function (data) {
                        popupNode.idle().append(view.draw(data));
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
        ox.launch('io.ox/contacts/main', { folder: data.folder}).done(function () {
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
        ox.launch('io.ox/tasks/main', { folder: data.folder}).done(function () {
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

    // fix hosts (still need a configurable list on the backend)
    // ox.serverConfig.hosts = (ox.serverConfig.hosts || []).concat('localhost', 'appsuite-dev.open-xchange.com', 'ui-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com');

    function isValidHost(url) {
        var match = url.match(/^https?:\/\/([^\/#]+)/i);
        if (match === null || match.length === 0) return false;
        if (match[1] === 'test') return true;
        return _(ox.serverConfig.hosts).indexOf(match[1]) > -1;
    }

    function replace(node, prefix, link, suffix) {

        // replace
        var replacement = $()
            .add(processTextNode(prefix))
            .add(link)
            .add(processTextNode(suffix));

        $(node).replaceWith(replacement);
        return replacement;
    }

    //
    // Deep links
    //

    var isDeepLink, parseDeepLink, processDeepLink;

    (function () {

        var keys = 'all prefix link app params param name suffix'.split(' '),
            app = { contacts: 'contacts', calendar: 'calendar', task: 'tasks', infostore: 'files' },
            items = { contacts: gt('Contact'), calendar: gt('Appointment'), tasks: gt('Task'), files: gt('File') },
            folders = { contacts: gt('Address Book'), calendar: gt('Calendar'), tasks: gt('Tasks'), files: gt('Folder') },
            regDeepLink = /^(.*)(http[^#]+#!?&?app=io\.ox\/(contacts|calendar|tasks|files)((&(folder|id|perspective)=[^&\s]+)+))(.*)$/i,
            regDeepLinkAlt = /^(.*)(http[^#]+#m=(contacts|calendar|tasks|infostore)((&(f|i)=[^&\s]+)+))(.*)$/i;

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
            if ($(node).parent().attr('href') === data.link) node = $(node).parent();

            return replace(node, data.prefix, link, data.suffix);
        };

    }());

    //
    // URL
    //

    var regUrl = /^(.*)((http|https|ftp|ftps)\:\/\/\S+)(.*)$/i,
        regUrlMatch = /^(.*)((http|https|ftp|ftps)\:\/\/\S+)(.*)$/i; /* dedicated one to avoid strange side effects */

    function processUrl(node) {

        var matches = node.nodeValue.match(regUrlMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], url = matches[2], suffix = matches[4];

        // fix punctuation marks
        url = url.replace(/([.,;!?]+)$/, function (all, marks) {
            suffix = marks + suffix;
            return '';
        });

        var link = $('<a href="#" target="_blank">').attr('href', _.escape(url)).text(url);

        return replace(node, prefix, link, suffix);
    }

    //
    // Mail Address
    //

    var regMail = /^(.*?)([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})(.*)$/i,
        regMailMatch = /^(.*?)([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})(.*)$/i; /* dedicated one to avoid strange side effects */

    function processMailAddress(node) {

        var matches = node.nodeValue.match(regMailMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], address = matches[2], suffix = matches[4];

        var link = $('<a href="#" target="_blank">').attr('href', 'mailto:' + address).text(address);

        return replace(node, prefix, link, suffix);
    }

    //
    // Complex Mail Address: "name" <address>
    //

    var regMailComplex = /^(.*?)(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+<([^@]+@[^&]+)>(.*)$/,
        regMailComplexMatch = /^(.*?)(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+<([^@]+@[^&]+)>(.*)$/;

    function processComplexMailAddress(node) {

        var matches = node.nodeValue.match(regMailComplexMatch);
        if (matches === null || matches.length === 0) return node;
        var prefix = matches[1], name = matches[4], address = matches[7], suffix = matches[8];

        var link = $('<a href="#" target="_blank">').attr('href', 'mailto:' + address).text(name);

        return replace(node, prefix, link, suffix);
    }

    //
    // Text nodes
    //

    function processTextNode(node) {

        if (_.isString(node)) node = $.txt(node);
        if (node.nodeType !== 3) return;

        var text = node.nodeValue, length = text.length, $node = $(node);

        if (isDeepLink(text)) {
            return processDeepLink(node);
        }
        else if (regMailComplex.test(text) && $node.closest('a').length === 0) {
            return processComplexMailAddress(node);
        }
        else if (regMail.test(text) && $node.closest('a').length === 0) {
            return processMailAddress(node);
        }
        else if (regUrl.test(text) && $node.closest('a').length === 0) {
            return processUrl(node);
        }
        else if (length >= 30 && /\S{30}/.test(text)) {
            // split long character sequences for better wrapping
            $node.replaceWith(
                $.parseHTML(coreUtil.breakableHTML(text))
            );
        }
        else {
            return node;
        }
    }

    ext.point('io.ox/mail/detail/content').extend({
        id: 'links',
        index: 100,
        process: function (baton) {
            // process all text nodes unless mail is too large (> 512 KB)
            if (baton.isLarge) return;
            // don't combine these two lines via add() - very slow!
            this.contents().each(function () {
                processTextNode(this);
            });
            this.find('*').not('style').contents().each(function () {
                processTextNode(this);
            });
        }
    });

    return {
        isDeepLink: isDeepLink,
        parseDeepLink: parseDeepLink,
        processDeepLink: processDeepLink,
        processTextNode: processTextNode
    };
});
