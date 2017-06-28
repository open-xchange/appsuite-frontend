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
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/files/settings/pane', [
    'settings!io.ox/files',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/files',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util'
], function (settings, ext, capabilities, gt, mini, util) {

    'use strict';

    // not really relevant for guests (as of today)
    if (capabilities.has('guest')) return;

    function optionsAutoplayPause() {
        return _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40, 50, 60], function (i) {
            i = String(i);
            return { label: i, value: i };
        });
    }

    var POINT = 'io.ox/files/settings/detail';

    settings.on('change', function () {
        settings.saveAndYell();
    });

    settings.on('change:showHidden', function () {
        require(['io.ox/core/folder/api'], function (folderAPI) {
            folderAPI.refresh();
        });
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'filessettings',
        draw: function () {
            var holder = $('<div class="io-ox-drive-settings">');
            this.append(holder);
            ext.point(POINT + '/pane').invoke('draw', holder);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(util.header(gt.pgettext('app', 'Drive')));
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'common',
        draw: function () {
            if (!settings.isConfigurable('showHidden')) return;

            this.append(
                $('<div class="form-group">').append(
                    $('<div class="row">').append(
                        $('<div class="col-sm-8">').append(
                            util.checkbox('showHidden', gt('Show hidden files and folders'), settings)
                        )
                    )
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 300,
        id: 'uploadHandling',
        draw: function () {
            var preferences = [
                { label: gt('Add new version'), value: 'newVersion' },
                { label: gt('Add new version and show notification'), value: 'announceNewVersion' },
                { label: gt('Add separate file'), value: 'newFile' }

            ];
            this.append(
                util.fieldset(gt('Adding files with identical names'),
                    new mini.CustomRadioView({ list: preferences, name: 'uploadHandling', model: settings }).render().$el
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'displayerviewAutoplay',
        draw: function () {
            var preferences = [
                { label: gt('Show all images just once'), value: 'loopOnceOnly' },
                { label: gt('Repeat slideshow'), value: 'loopEndlessly' }
            ];
            this.append(
                util.fieldset(gt('Slideshow / Autoplay mode for images'),
                    new mini.CustomRadioView({ list: preferences, name: 'autoplayLoopMode', model: settings }).render().$el,

                    $('<div class="form-group">').append(
                        $('<div class="row" style="margin: auto">').append(
                            //.# Used as settings label, User can select a numeric value of seconds. Final "sentence" i.e. "show all images for 5 seconds"
                            util.inlineSelect('autoplayPause', gt('Show all images for'), gt('seconds'), settings, optionsAutoplayPause())
                        )
                    )
                )
            );
        }
    });
});
