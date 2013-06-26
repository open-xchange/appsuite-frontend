/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/guidance/perspective',
    ['io.ox/core/extensions',
     'gettext!io.ox/mail'
    ], function (ext, gt) {

    'use strict';

    var perspective = new ox.ui.Perspective('guidance');

    perspective.render = function (app) {

        var id = app.get('name'),
            folder = app.folder.get(),
            node = this.main.busy().addClass('guidance default-content-padding fade');

        // add this perspective next to "window-panel"
        app.getWindow().nodes.panel.after(this.main);

        app.folder.getData().done(function (data) {
            node.idle();
            var baton = new ext.Baton({ id: id, app: app, folder: folder, data: data, options: { type: 'mail' } });
            ext.point('io.ox/mail/guidance').invoke('draw', node, baton);
            node.addClass('in');

            perspective.afterShow = function () {
                this.main.addClass('in');
            };

            perspective.afterHide = function () {
                this.main.removeClass('in');
            };
        });
    };

    function back(e) {
        e.preventDefault();
        var baton = e.data.baton;
        ox.ui.Perspective.show(baton.app, 'main');
    }

    function openFolderView(e) {
        e.preventDefault();
        var baton = e.data.baton;
        baton.app.showFolderView();
        ox.ui.Perspective.show(baton.app, 'main');
    }

    function compose(e) {
        require(['io.ox/core/extPatterns/actions'], function (actions) {
            actions.invoke('io.ox/mail/actions/compose', null, e.data.baton);
        });
    }

    var INDEX = 100;

    ext.point('io.ox/mail/guidance').extend({
        id: 'header',
        index: INDEX += 100,
        draw: function (baton) {
            var section = $('<header class="primary-actions">');
            ext.point('io.ox/mail/guidance/header').invoke('draw', section, baton);
            this.append(section);
        }
    });

    ext.point('io.ox/mail/guidance/header').extend({
        id: 'back',
        index: 100,
        draw: function (baton) {
            this.append(
                $('<a href="#">').append(
                    $('<i class="icon-chevron-left">'),
                    $.txt(' '),
                    $.txt(gt('Back to application'))
                )
                .on('click', { baton: baton }, back),
                $.txt('\u00A0\u00A0 ')
            );
        }
    });

    ext.point('io.ox/mail/guidance/header').extend({
        id: 'primary-actions',
        index: 200,
        draw: function (baton) {
            this.append(
                $('<a href="#">').append(
                    $('<i class="icon-pencil">'),
                    $.txt(' '),
                    $.txt(gt('Compose new mail'))
                )
                .on('click', { baton: baton }, compose)
            );
        }
    });

    ext.point('io.ox/mail/guidance').extend({
        id: 'foldername',
        index: INDEX += 100,
        draw: function (baton) {
            this.append(
                $('<h1 class="folder-name">').text(baton.data.title)
            );
        }
    });

    ext.point('io.ox/mail/guidance').extend({
        id: 'folder-summary',
        index: INDEX += 100,
        draw: function (baton) {

            var data = baton.data,
                total = data.total,
                text,
                ul,
                link = $();

            if (total === 0) {
                text = gt('No mails');
            } else {
                if (data.unread === 0) {
                    text = gt.format(
                        gt.ngettext('%1$s mail', '%1$s mails', data.total),
                        data.total
                    );
                } else {
                    text = gt.format(
                        gt.ngettext('%1$s mail, %2$s unread', '%1$s mails, %2$s unread', data.total),
                        data.total, data.unread
                    );
                }
            }

            this.append(
                $('<section class="folder-summary">').append(

                    $('<span>').text(text),
                    $.txt('\u00A0\u00A0 '),

                    $('<a href="#">').text(gt('Change folder')).on('click', { baton: baton }, openFolderView),
                    $.txt('\u00A0\u00A0 '),

                    // drop-down
                    $('<span class="dropdown">').append(
                        $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1" >').text(gt('Folder actions')),
                        ul = $('<ul class="dropdown-menu compact" role="menu">')
                    )
                )
            );

            ext.point('io.ox/mail/folderview/sidepanel/toolbar/options').invoke('draw', ul, baton);
        }
    });

    // Help

    ext.point('io.ox/mail/guidance').extend({
        id: 'folder-statistic-help',
        index: INDEX += 100,
        draw: function (baton) {

            var topics = {
                'Die Bestandteile von Mail': 'http://localhost/appsuite/help/de_DE/ox.appsuite.user.sect.email.gui.html',
                'E-Mails organisieren': 'http://localhost/appsuite/help/de_DE/ox.appsuite.user.sect.email.manage.html',
                'E-Mails im Team': 'http://localhost/appsuite/help/de_DE/ox.appsuite.user.sect.email.share.html',
                'Externe E-Mail-Accounts': 'http://localhost/appsuite/help/de_DE/ox.appsuite.user.sect.email.externalaccounts.html',
                'E-Mail-Einstellungen': 'http://localhost/appsuite/help/de_DE/ox.appsuite.user.sect.email.settings.html'
            };

            this.append(
                $('<h2>').text('Related articles'),
                $('<section>').append(
                    _(topics).map(function (link, text) {
                        return $('<div>').append(
                            $('<a>', { href: link, target: 'help' }).text(text)
                        );
                    })
                )
            );
        }
    });

    // Upsell

    ext.point('io.ox/mail/guidance').extend({
        id: 'upsell',
        index: INDEX += 100,
        draw: function (baton) {

            $('head').append(
                $('<link href="http://fonts.googleapis.com/css?family=Rokkitt" rel="stylesheet" type="text/css">')
            );

            var node = $('<section>')
                .css({
                    fontFamily: '"Rokkitt", cursive',
                    fontSize: '28px',
                    lineHeight: '28px',
                    padding: '14px',
                    color: '#fff',
                    backgroundColor: '#6C7DA0',
                    borderRadius: '5px',
                    textShadow: '1px 1px 3px #000',
                    maxWidth: '450px',
                    whiteSpace: 'pre'
                })
                .text('Upgrade to premium.\nGet a 90-day free trial ...');

            this.append(node);
        }
    });

    // Statistics

    ext.point('io.ox/mail/guidance').extend({
        id: 'folder-statistic-from',
        index: INDEX += 100,
        draw: function (baton) {

            var node = $('<section>').busy();
            this.append(node);

            require(['io.ox/mail/statistics'], function (statistics) {
                statistics.sender(node, { folder: baton.folder });
            });
        }
    });

    ext.point('io.ox/mail/guidance').extend({
        id: 'folder-statistic-weekday',
        index: INDEX += 100,
        draw: function (baton) {

            var node = $('<section>').busy();
            this.append(node);

            require(['io.ox/mail/statistics'], function (statistics) {
                statistics.weekday(node, { folder: baton.folder });
            });
        }
    });

    // ext.point('io.ox/mail/guidance').extend({
    //     id: 'folder-statistic-hour',
    //     index: INDEX += 100,
    //     draw: function (baton) {

    //         var node = $('<section>').busy();
    //         this.append(node);

    //         require(['io.ox/mail/statistics'], function (statistics) {
    //             statistics.hour(node, { folder: baton.folder });
    //         });
    //     }
    // });

    return perspective;
});
