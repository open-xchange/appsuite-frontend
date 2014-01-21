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

define('io.ox/files/settings/pane',
    ['settings!io.ox/files',
     'io.ox/files/settings/model',
     'io.ox/core/extensions',
     'gettext!io.ox/files'
    ], function (settings, filesSettingsModel, ext, gt) {

    'use strict';

    var model = settings.createModel(filesSettingsModel),
        POINT = 'io.ox/files/settings/detail';

    model.on('change', function (model) {
        model.saveAndYell();
    });

    model.on('change:showHidden', function () {
        require(['io.ox/core/api/folder'], function (folderAPI) {
            folderAPI.clearCaches();
            folderAPI.trigger('refresh');
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

                var optionsView = [
                    {label: gt('List'), value: 'fluid:list'},
                    {label: gt('Icons'), value: 'fluid:icon'},
                    {label: gt('Tiles'), value: 'fluid:tile'}
                ],
                    preferencesView = settings.get('view', 'fluid:list'),
                    preferencesShowHidden = settings.get('showHidden'),

                    buildOptionsSelect = function (list, selected, name) {
                        var select = $('<select>').addClass('input-xlarge').on('change', function () {
                            model.set(name, this.value);
                        });
                        return _.map(list, function (option) {
                            var o = $('<option>').attr({ value: option.value}).text(option.label)
                            ;
                            if (selected === option.value) o.prop('checked', true);
                            return select.append(o);
                        });
                    },

                    buildCheckbox = function (selected, name) {
                        var checkbox = $('<input type="checkbox">')
                        .on('change', function () {
                            model.set(name, checkbox.prop('checked'));
                        }).addClass('input-xlarge');
                        checkbox.prop('checked', selected);
                        return checkbox;

                    };

                this.append(
                    $('<div>').addClass('control-group').append(
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('checkbox').text(gt('Show hidden files and folders')).append(
                                buildCheckbox(preferencesShowHidden, 'showHidden')
                            )
                        )
                    ),
                    $('<div>').addClass('control-group').append(
                        $('<label>').attr({'for': 'default_view'}).addClass('control-label').text(gt('Default view')),
                        $('<div>').addClass('controls').append(
                            $('<label>').addClass('select').append(
                                buildOptionsSelect(optionsView, preferencesView, 'view')
                            )
                        )
                    )
                );
            }
        });

});
