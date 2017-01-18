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
    'io.ox/backbone/mini-views'
], function (settings, ext, capabilities, gt, mini) {

    'use strict';

    // not really relevant for guests (as of today)
    if (capabilities.has('guest')) return;

    function isConfigurable(id) {
        return settings.isConfigurable(id);
    }

    function optionsAutoplayPause() {
        return _.map([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25, 30, 35, 40, 50, 60], function (i) {
            i = String(i);
            return { label: gt.noI18n(i), value: i };
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
            var holder = $('<div>').css('max-width', '800px');
            this.append(holder);
            ext.point(POINT + '/pane').invoke('draw', holder);
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt.pgettext('app', 'Drive'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'common',
        draw: function () {

            if (!isConfigurable('showHidden')) return;

            this.append(
                $('<div class="form-group">').append(
                    $('<div class="row">').append(
                        $('<div class="col-sm-8">').append(
                            $('<div class="checkbox">').append(
                                $('<label class="control-label">').text(gt('Show hidden files and folders')).prepend(
                                    new mini.CheckboxView({ name: 'showHidden', model: settings }).render().$el
                                )
                            )
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
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle').append(
                        $('<h2>').text(gt('Adding files with identical names'))
                    ),
                    new mini.RadioView({ list: preferences, name: 'uploadHandling', model: settings }).render().$el
                )
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 400,
        id: 'displayerviewAutoplay',
        draw: function () {
            var preferences = [
                { label: gt('Loop once only'), value: 'loopOnceOnly' },
                { label: gt('Keep looping endlessly'), value: 'loopEndlessly' }
            ];
            this.append(
                $('<fieldset>').append(
                    $('<legend>').addClass('sectiontitle expertmode').append(
                        $('<h2>').text(gt('Slideshow / Autoplay mode'))
                    ),
                    new mini.RadioView({ list: preferences, name: 'autoplayLoopMode', model: settings }).render().$el,

                    $('<div>').addClass('form-group expertmode').append(
                        $('<div>').addClass('row').append(
                            $('<label>').attr('for', 'autoplayPause').addClass('control-label col-sm-4').text(gt('Autoplay pause in seconds')),
                            $('<div>').addClass('col-sm-4').append(
                                new mini.SelectView({ list: optionsAutoplayPause(), name: 'autoplayPause', model: settings, id: 'autoplayPause', className: 'form-control' }).render().$el
                            )
                        )
                    )
                )
            );
        }
    });
});
