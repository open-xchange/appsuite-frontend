/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Kopp <christoph.kopp@open-xchange.com>
 */

define('io.ox/files/settings/pane', [
    'settings!io.ox/files',
    'io.ox/files/settings/model',
    'io.ox/core/extensions',
    'io.ox/core/capabilities',
    'gettext!io.ox/files',
    'io.ox/backbone/mini-views'
], function (settings, filesSettingsModel, ext, capabilities, gt, mini) {

    'use strict';

    // not really relevant for guests (as of today)
    if (capabilities.has('guest')) return;

    var model = settings.createModel(filesSettingsModel),
        POINT = 'io.ox/files/settings/detail';

    model.on('change', function (model) {
        model.saveAndYell();
    });

    model.on('change:showHidden', function () {
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
            this.append(
                $('<div>').addClass('form-group').append(
                    $('<div>').addClass('row').append(
                        $('<div>').addClass('col-sm-8').append(
                            $('<div>').addClass('checkbox').append(
                                $('<label>').addClass('control-label').text(gt('Show hidden files and folders')).prepend(
                                    new mini.CheckboxView({ name: 'showHidden', model: model }).render().$el
                                )
                            )
                        )
                    )
                )
            );
        }
    });
});
