/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
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
    // no features to show, missing capabilities etc
    if (meta.getFeatures().length === 0) return;

    var showDialog = function () {
        new ModalDialog({
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
        .addButton({ className: 'btn-default', placement: 'left', action: 'info', label: gt('Learn more') })
        // no attribute adds close button with cancel action
        .addButton()
        .on('info', function () {
            window.open(meta.getLink());
        })
        .on('close', function () {
            settings.set('whatsNew/lastSeenVersion', meta.getLatestVersion()).save();
        })
        .open();
    };

    // dropdown link
    if (settings.get('whatsNew/menuEntry', true)) {
        ext.point('io.ox/core/appcontrol/right/help').extend({
            id: 'whats-new',
            index: 260,
            extend: function () {
                if (capabilities.has('guest')) return;
                if (_.device('smartphone')) return;
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

    // autoshow if user has not seen the features of this version yet
    if (settings.get('whatsNew/lastSeenVersion', -1) < meta.getLatestVersion()) {
        new Stage('io.ox/core/stages', {
            id: 'whatsnewdialog',
            index: 1100,
            run: function () {
                if (_.device('karma')) return $.when();
                showDialog();
                return $.when();
            }
        });
    }

    return {
        showDialog: showDialog
    };
});
