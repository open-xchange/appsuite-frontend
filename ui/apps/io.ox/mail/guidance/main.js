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

define('io.ox/mail/guidance/main',
    ['io.ox/core/extensions',
     'io.ox/core/tk/dialogs',
     'gettext!io.ox/mail'
    ], function (ext, dialogs, gt) {

    'use strict';

    function sidePopup(app, e) {

        var id = app.get('name'),
            folder = app.folder.get();

        new dialogs.SidePopup({ closely: true }).show(e, function (popup) {
            app.folder.getData().done(function (data) {
                var baton = new ext.Baton({ id: id, app: app, folder: folder, data: data, options: { type: 'mail' } });
                ext.point('io.ox/mail/guidance').invoke('draw', popup.addClass('guidance'), baton);
            });
        });
    }

    var INDEX = 100;

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
                $('<link href="http://fonts.googleapis.com/css?family=Nunito" rel="stylesheet" type="text/css">')
            );

            var node = $('<section>')
                .css({
                    fontFamily: '"Nunito", Arial, sans-serif',
                    fontSize: '24px',
                    lineHeight: '28px',
                    padding: '14px',
                    color: '#fff',
                    backgroundColor: '#FF5F13', // kind of nato orange
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

    ext.point('io.ox/mail/guidance').extend({
        id: 'folder-statistic-hour',
        index: INDEX += 100,
        draw: function (baton) {

            var node = $('<section>').busy();
            this.append(node);

            require(['io.ox/mail/statistics'], function (statistics) {
                statistics.hour(node, { folder: baton.folder });
            });
        }
    });

    return { sidePopup: sidePopup };
});
