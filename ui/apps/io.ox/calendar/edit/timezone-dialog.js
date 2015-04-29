/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2015 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/edit/timezone-dialog', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/calendar/edit/main',
    'settings!io.ox/core',
    'io.ox/backbone/mini-views/timezonepicker',
    'io.ox/backbone/mini-views/common'
], function (ext, dialogs, gt, coreSettings, TimezonePicker, mini) {

    'use strict';

    var TimezoneModel = Backbone.Model.extend({
        defaults: {
            startTimezone: coreSettings.get('timezone'),
            endTimezone: coreSettings.get('timezone'),
            convertTime: false
        }
    });

    ext.point('io.ox/calendar/edit/timezone-dialog').extend({
        id: 'start-date-selection',
        index: 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="form-group">').append(
                    $('<label>')
                        .attr('for', guid)
                        .text(gt('Start date timezone')),
                    new TimezonePicker({
                        id: guid,
                        name: 'startTimezone',
                        model: baton.model,
                        className: 'form-control',
                        showFavorites: true
                    }).render().$el
                )
            );
        }
    });

    ext.point('io.ox/calendar/edit/timezone-dialog').extend({
        id: 'end-date-selection',
        index: 200,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="form-group">').append(
                    $('<label>')
                        .attr('for', guid)
                        .text(gt('End date timezone')),
                    new TimezonePicker({
                        id: guid,
                        name: 'endTimezone',
                        model: baton.model,
                        className: 'form-control',
                        showFavorites: true
                    }).render().$el
                )
            );
        }
    });

    ext.point('io.ox/calendar/edit/timezone-dialog').extend({
        id: 'start-end-notice',
        index: 300,
        draw: function (baton) {
            var node = $('<div class="form-group">');

            function drawNotice() {
                node.empty();
                if (baton.model.get('startTimezone') !== baton.model.get('endTimezone')) {
                    node.text(gt('If you select different timezones, the appointment\'s start and end dates are saved in the timezone of the appointment\'s start date. A different end date timezone only allows a convenient conversion.'));
                }
            }

            baton.model.on({
                'change:startTimezone': drawNotice,
                'change:endTimezone': drawNotice
            });
            this.append(node);
            drawNotice();
        }
    });

    ext.point('io.ox/calendar/edit/timezone-dialog').extend({
        id: 'keep-utc',
        index: 400,
        draw: function (baton) {
            this.append(
                $('<div class="form-group">').append(
                    $('<div class="checkbox">').append(
                        $('<label>').text(gt('Convert the entered start and end dates to match the modified timezones')).prepend(
                            new mini.CheckboxView({ name: 'convertTime', model: baton.model }).render().$el
                        )
                    )
                )
            );
        }
    });

    function open(opt) {
        var model = new TimezoneModel({
            startTimezone: opt.model.get('timezone'),
            endTimezone: opt.model.get('endTimezone') || opt.model.get('timezone')
        });

        function getUtc(attribute, timezone) {
            var formatStr = 'l LT',
                timestamp = parseInt(opt.model[opt.model.getDate ? 'getDate' : 'get'](attribute), 10),
                oldTime = moment.tz(timestamp, opt.model.get('timezone')),
                newTime = moment.tz(oldTime.format(formatStr), formatStr, timezone);

            return newTime.valueOf();
        }

        model.on('change:startTimezone', function (model, value) {
            if (model.previous('startTimezone') === model.get('endTimezone')) {
                model.set('endTimezone', value);
            } else {
                model.off('change:startTimezone');
            }
        });

        new dialogs.ModalDialog()
            .header($('<h4>').text(gt('Change timezone')))
            .addPrimaryButton('change', gt('Change'), 'change', { tabIndex: 1 })
            .addButton('cancel', gt('Cancel'), 'cancel', { tabIndex: 1 })
            .build(function () {
                ext.point('io.ox/calendar/edit/timezone-dialog').invoke('draw', this.getContentNode(), { model: model });
            })
            .on('change', function () {
                if (model.get('convertTime')) {
                    var utcStart = getUtc('start_date', model.get('startTimezone')),
                        utcEnd = getUtc('end_date', model.get('endTimezone'));

                    opt.model.set({
                        'timezone': model.get('startTimezone'),
                        'endTimezone': model.get('endTimezone'),
                        'start_date': utcStart,
                        'end_date': utcEnd
                    });
                } else {
                    opt.model.set({
                        'timezone': model.get('startTimezone'),
                        'endTimezone': model.get('endTimezone')
                    });
                }
            })
            .show();
    }

    return { open: open };
});
