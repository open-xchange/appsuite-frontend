/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/whatsnew/main', [
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'settings!io.ox/core',
    'io.ox/core/extPatterns/stage',
    'gettext!io.ox/core',
    'io.ox/core/whatsnew/meta',
    'io.ox/backbone/views/modal',
    'less!io.ox/core/whatsnew/style'
], function (ext, capabilities, settings, Stage, gt, meta, ModalDialog) {

    'use strict';

    // This is not the whats new TOUR this is the whats new DIALOG
    // that's why it is part of core and not the tours package

    // no dialog for guests
    // no features to show, missing capabilities etc
    if (capabilities.has('guest') || meta.getFeatures().length === 0) return;

    var showDialog = function () {
        var def = new $.Deferred(),
            dialog = new ModalDialog({
                point: 'tours/whatsnew/dialog',
                title: gt('What\'s new in this version'),
                // yes em, this is about 500px but scales with text zoom so we don't have problems with 200% text zoom support
                width: '36em'
            })
            .extend({
                featurelist: function () {
                    var featurelist = _(meta.getFeatures()).map(function (feature) {
                        return $('<li>').append(
                            $('<span class="feature-name">').text(feature.name + ':'),
                            $('<span >').text(feature.description)
                        );
                    });

                    this.$el.addClass('whats-new-dialog');
                    this.$body.append(
                        $('<ul class="list-unstyled">').append(featurelist)
                    );
                }

            })
            // no attribute adds close button with cancel action
            .addButton()
            .on('close', function () {
                settings.set('whatsNew/lastSeenVersion', meta.getLatestVersion()).save();
                def.resolve();
            });

        if (meta.getLink()) {
            dialog
                .addButton({ className: 'btn-default', placement: 'left', action: 'info', label: gt('Learn more') })
                .on('info', function () {
                    window.open(meta.getLink());
                });
        }
        dialog.open();
        return def;
    };

    // dropdown link
    if (settings.get('whatsNew/menuEntry', true)) {
        // account menu on smartphones help menu on desktop
        ext.point(_.device('smartphone') ? 'io.ox/core/appcontrol/right/account' : 'io.ox/core/appcontrol/right/help').extend({
            id: 'whats-new',
            index: 260,
            extend: function () {
                this.append(
                    $('<a href="#" data-action="whats-new" role="menuitem">')
                    .text(gt('What\'s new'))
                    .on('click', function (e) {
                        e.preventDefault();
                        showDialog();
                    })
                );
            }
        });
    }
    var autoStart = settings.get('whatsNew/autoStart', true) && (settings.get('whatsNew/lastSeenVersion', -1) < meta.getLatestVersion());
    // autostart if user has not seen the features of this version yet
    if (autoStart) {
        new Stage('io.ox/core/stages', {
            id: 'whatsnewdialog',
            // just keep the index before the tours, see OXUIB-665
            index: 950,
            run: function (baton) {
                if (_.device('karma')) return $.when();
                baton.data.popups.push({ name: 'whats-new-dialog' });
                return showDialog();
            }
        });
    }
});
