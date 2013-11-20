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

    var regMail = /([^\s<;\(\)\[\]]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/i,
        regMailReplace = /([^\s<;\(\)\[\]\|\"]+@([a-z0-9äöüß\-]+\.)+[a-z]{2,})/ig, /* dedicated one to avoid strange side effects */
        regMailComplex = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/, /* "name" <address> */
        regMailComplexReplace = /(&quot;([^&]+)&quot;|"([^"]+)"|'([^']+)')(\s|<br>)+&lt;([^@]+@[^&]+)&gt;/g; /* "name" <address> */

    $(document).on('click', '.deep-link-files', function (e) {
        e.preventDefault();
        var data = $(this).data();
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
        ox.launch('io.ox/calendar/main', { folder: data.folder, perspective: 'list' }).done(function () {
            var app = this, folder = data.folder, id = data.id;
            // switch to proper perspective
            ox.ui.Perspective.show(app, 'list').done(function () {
                // set proper folder
                if (app.folder.get() === folder) {
                    app.trigger('show:appointment', { id: id, folder_id: folder, recurrence_position: 0 }, true);
                } else {
                    app.folder.set(folder).done(function () {
                        app.trigger('show:appointment', { id: id, folder_id: folder, recurrence_position: 0 }, true);
                    });
                }
            });
        });
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
    ox.serverConfig.hosts = (ox.serverConfig.hosts || []).concat('localhost', 'appsuite-dev.open-xchange.com', 'ui-dev.open-xchange.com', 'ox6-dev.open-xchange.com', 'ox6.open-xchange.com');

    var isValidHost = function (url) {
        var match = url.match(/^https?:\/\/([^\/#]+)/i);
        return match && match.length && _(ox.serverConfig.hosts).indexOf(match[1]) > -1;
    };

    var isDeepLink, processDeepLink;

    (function () {

        var keys = 'all prefix link app params param name suffix'.split(' '),
            app = { contacts: 'contacts', calendar: 'calendar', task: 'tasks', infostore: 'files' },
            items = { contacts: gt('Contact'), calendar: gt('Appointment'), tasks: gt('Task'), files: gt('File') },
            folders = { contacts: gt('Address Book'), calendar: gt('Calendar'), tasks: gt('Tasks'), files: gt('Folder') },
            regDeepLink = /^(\s*)(http[^#]+#!?&?app=io\.ox\/(contacts|calendar|tasks|files)((&(folder|id|perspective)=[^&\s]+)+))(\s*)$/i,
            regDeepLinkAlt = /^(\s*)(http[^#]+#m=(contacts|calendar|tasks|infostore)((&(f|i)=[^&\s]+)+))(\s*)$/i;

        function parse(str) {
            var matches = String(str).match(regDeepLink.test(str) ? regDeepLink : regDeepLinkAlt),
                data = _.object(keys, matches),
                params = _.deserialize(data.params, '&');
            // fix app
            data.app = app[data.app] || data.app;
            // add folder, id, perspective (jQuery's extend to skip undefined)
            return $.extend(data, { folder: params.f, id: params.i }, { folder: params.folder, id: params.id, perspective: params.perspective });
        }

        isDeepLink = function (str) {
            return regDeepLink.test(str) || regDeepLinkAlt.test(str);
        };

        processDeepLink = function (text, node) {

            var data = parse(text),
                link = $('<a>', { href: data.link, target: '_blank' })
                    .addClass('deep-link')
                    .css({ textDecoration: 'none', fontFamily: 'Arial' })
                    .append(
                        $('<span class="label label-info">').text(
                            'id' in data ? items[data.app] : folders[data.app]
                        )
                    );

            // internal document?
            if (isValidHost(data.link)) {
                link.addClass('deep-link-' + data.app).data(data);
            }

            // move up?
            if (node.parent().attr('href') === data.link) node = node.parent();

            // replace
            node.replaceWith(
                $($.txt(data.prefix)).add(link).add($.txt(data.suffix))
            );
        };

    }());

    function processTextNode(baton) {

        if (this.nodeType !== 3) return;

        var node = $(this), text = this.nodeValue, length = text.length;

        if (isDeepLink(text)) {
            return processDeepLink(text, node);
        }
        else if (regMail.test(text) && node.closest('a').length === 0) {
            // links
            // escape first
            text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            // try the "NAME" <ADDRESS> pattern
            if (baton.isHTML && regMailComplex.test(text)) {
                node.replaceWith(
                    $('<div>')
                    .html(text.replace(regMailComplexReplace, '<a href="mailto:$6">$2$3</a>'))
                    .contents()
                );
            } else {
                node.replaceWith(
                    $('<div>')
                    .html(text.replace(regMailReplace, '<a href="mailto:$1">$1</a>'))
                    .contents()
                );
            }
        }
        else if (length >= 30 && /\S{30}/.test(text)) {
            // split long character sequences for better wrapping
            node.replaceWith(
                $.parseHTML(coreUtil.breakableHTML(text))
            );
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
                processTextNode.call(this, baton);
            });
            this.find('*').not('style').contents().each(function () {
                processTextNode.call(this, baton);
            });
        }
    });

    return {
        isDeepLink: isDeepLink,
        processDeepLink: processDeepLink,
        processTextNode: processTextNode
    };
});
