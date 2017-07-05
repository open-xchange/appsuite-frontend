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
    'io.ox/core/extensions',
    'io.ox/backbone/views/extensible',
    'io.ox/core/capabilities',
    'io.ox/backbone/mini-views',
    'io.ox/core/settings/util',
    'settings!io.ox/files',
    'gettext!io.ox/files'
], function (ext, ExtensibleView, capabilities, mini, util, settings, gt) {

    'use strict';

    // not really relevant for guests (as of today)
    if (capabilities.has('guest')) return;

    // change events

    settings.on('change', function () {
        settings.saveAndYell();
    });

    settings.on('change:showHidden', function () {
        require(['io.ox/core/folder/api'], function (folderAPI) {
            folderAPI.refresh();
        });
    });

    //
    // Extensible View
    //

    ext.point('io.ox/files/settings/detail').extend({
        index: 100,
        id: 'view',
        draw: function () {
            this.append(
                new ExtensibleView({ point: 'io.ox/files/settings/detail/view', model: settings })
                .inject({
                    getUploadOptions: function () {
                        return [
                            { label: gt('Add new version'), value: 'newVersion' },
                            { label: gt('Add new version and show notification'), value: 'announceNewVersion' },
                            { label: gt('Add separate file'), value: 'newFile' }
                        ];
                    },
                    getAutoPlayOptions: function () {
                        return [
                            { label: gt('Show all images just once'), value: 'loopOnceOnly' },
                            { label: gt('Repeat slideshow'), value: 'loopEndlessly' }
                        ];
                    },
                    getAutoPlayPauseOptions: function () {
                        return _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40, 50, 60], function (i) {
                            i = String(i);
                            return { value: i, label: gt('%1$d seconds', i) };
                        });
                    }
                })
                .render().$el
            );
        }
    });

    var INDEX = 0;

    ext.point('io.ox/files/settings/detail/view').extend(
        //
        // Header
        //
        {
            id: 'header',
            index: INDEX += 100,
            render: function () {
                this.$el.addClass('io-ox-drive-settings').append(
                    util.header(gt.pgettext('app', 'Drive'))
                );
            }
        },
        //
        // Upload
        //
        {
            id: 'upload',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(
                        gt('Adding files with identical names'),
                        new mini.CustomRadioView({ name: 'uploadHandling', model: settings, list: this.getUploadOptions() }).render().$el
                    )
                );
            }
        },
        //
        // Autoplay
        //
        {
            id: 'autoplay',
            index: INDEX += 100,
            render: function () {
                this.$el.append(
                    util.fieldset(gt('Slideshow / Autoplay mode for images'),
                        $('<div class="form-group">').append(
                            new mini.CustomRadioView({ name: 'autoplayLoopMode', model: settings, list: this.getAutoPlayOptions() }).render().$el
                        ),
                        util.compactSelect('autoplayPause', gt('Duration per image'), settings, this.getAutoPlayPauseOptions(), { width: 3 })
                    )
                );
            }
        },
        //
        // Advanced
        //
        {
            id: 'advanced',
            index: INDEX += 100,
            render: function () {

                if (!settings.isConfigurable('showHidden')) return;

                this.$el.append(
                    util.fieldset(
                        gt('Advanced settings'),
                        util.checkbox('showHidden', gt('Show hidden files and folders'), settings)
                    )
                );
            }
        }
    );
});
