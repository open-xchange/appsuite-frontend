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
 * @author Richard Petersen <richard.petersen@open-xchange.com>
 */

define('io.ox/calendar/edit/timezone-dialog', [
    'io.ox/core/extensions',
    'io.ox/core/tk/dialogs',
    'gettext!io.ox/calendar/edit/main',
    'settings!io.ox/core',
    'io.ox/backbone/mini-views/timezonepicker',
    'io.ox/calendar/util'
], function (ext, dialogs, gt, coreSettings, TimezonePicker, util) {

    'use strict';

    ext.point('io.ox/calendar/edit/timezone-dialog').extend({
        id: 'start-date-selection',
        index: 100,
        draw: function (baton) {
            var guid = _.uniqueId('form-control-label-');
            this.append(
                $('<div class="form-group">').append(
                    $('<label>').attr('for', guid).text(gt('Start date timezone')),
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
                    $('<label>').attr('for', guid).text(gt('End date timezone')),
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

    function open(opt) {
        var model = new Backbone.Model({
            startTimezone: opt.model.getMoment('startDate').tz(),
            endTimezone: opt.model.getMoment('endDate').tz()
        });

        new dialogs.ModalDialog()
            .header($('<h4>').text(gt('Change timezone')))
            .addPrimaryButton('change', gt('Change'), 'change')
            .addButton('cancel', gt('Cancel'), 'cancel')
            .build(function () {
                ext.point('io.ox/calendar/edit/timezone-dialog').invoke('draw', this.getContentNode(), { model: model });
            })
            .on('change', function () {
                var startDate = opt.model.getMoment('startDate').tz(model.get('startTimezone')),
                    endDate = opt.model.getMoment('endDate').tz(model.get('endTimezone'));
                opt.model.set({
                    startDate: { value: startDate.clone().utc().format(util.ZULU_FORMAT), tzid: startDate.tz() },
                    endDate: { value: endDate.clone().utc().format(util.ZULU_FORMAT), tzid: endDate.tz() }
                });
            })
            .show();
    }

    return { open: open };
});
