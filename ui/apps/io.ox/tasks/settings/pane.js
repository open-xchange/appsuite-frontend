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

define('io.ox/tasks/settings/pane',
    ['settings!io.ox/tasks',
     'io.ox/tasks/settings/model',
     'io.ox/core/extensions',
     'gettext!io.ox/tasks'
    ], function (settings, tasksSettingsModel, ext, gt) {

    'use strict';

    var model =  settings.createModel(tasksSettingsModel),
        POINT = 'io.ox/tasks/settings/detail';

    model.on('change', function (model) {
        model.saveAndYell();
    });

    ext.point(POINT).extend({
        index: 100,
        id: 'taskssettings',
        draw: function () {

            var self = this,
                pane = $('<div class="io-ox-tasks-settings">'),
                holder = $('<div>').css('max-width', '800px');
            self.append(pane.append(holder));
            ext.point(POINT + '/pane').invoke('draw', holder);
        }

    });

    ext.point(POINT + '/pane').extend({
        index: 100,
        id: 'header',
        draw: function () {
            this.append(
                $('<h1>').text(gt.pgettext('app', 'Tasks'))
            );
        }
    });

    ext.point(POINT + '/pane').extend({
        index: 200,
        id: 'notifications',
        draw: function () {
            var preferences = [{label: gt('Yes'), value: true}, {label: gt('No'), value: false}],

                buildInputRadio = function (list, name) {
                    return _.map(list, function (option) {
                        var o = $('<input type="radio" name="' + name + '">').val(option.value)
                        .on('change', function () {
                            model.set(name, boolParser(this.value));
                        });
                        if (model.get(name) === option.value) o.prop('checked', true);
                        return $('<label class="radio">').text(option.label).append(o);
                    });
                },

                boolParser = function (value) {
                    return value === 'true' ? true : false;
                };

            this.append(
               $('<legend>').addClass('sectiontitle expertmode').text(gt('Email notification for task')),
               $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for New, Changed, Deleted?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(preferences, 'notifyNewModifiedDeleted')
                        )
                    )
                ),
               $('<legend>').addClass('sectiontitle expertmode').text(gt('Email notification for Accept/Declined')),
               $('<div>').addClass('form-horizontal').append(
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for task creator?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(preferences, 'notifyAcceptedDeclinedAsCreator')
                        )
                    ),
                    $('<div>').addClass('control-group expertmode').append(
                        $('<label>').addClass('control-label').text(gt('Email notification for task participant?')),
                        $('<div>').addClass('controls').append(
                            buildInputRadio(preferences, 'notifyAcceptedDeclinedAsParticipant')
                        )
                    )
                )
            );
        }
    });

});
