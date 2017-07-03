/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2017 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 */

define('io.ox/backbone/mini-views/alarms', [
    'io.ox/calendar/util',
    'io.ox/backbone/views/disposable',
    'gettext!io.ox/calendar',
    'settings!io.ox/mail',
    'less!io.ox/backbone/mini-views/alarms'
], function (util, DisposableView, gt, mailSettings) {

    'use strict';

    var alarms = DisposableView.extend({
        className: 'alarms-view',
        events: {
            'click .alarm-remove': 'onRemove',
            'change .alarm-action': 'update',
            'change .alarm-time': 'update'
        },
        initialize: function (options) {
            options = options || {};
            this.attribute = options.attribute || 'alarms';
            this.list = $('<ul class="list-unstyled alarm-list">');
        },
        render: function () {
            var self = this;
            this.$el.empty().append(
                self.list,
                $('<button class="btn btn-default" type="button">').text(gt('Add new Reminder'))
                    .on('click', function () {
                        self.list.append(self.createNodeFromAlarm({ action: 'DISPLAY', trigger: '15' }));
                        self.updateModel();
                    })
            );
            this.updateView();
            return this;
        },
        onRemove: function () {
            var item = $(arguments[0].target).closest('.alarm-list-item');
            item.remove();
            this.updateModel();

        },
        updateModel: function () {
            if (!this.model) return;
            this.model.set(this.attribute, this.getAlarmsArray());
        },
        updateView: function () {
            var self = this;
            this.list.empty().append(this.model ? _(this.model.get(this.attribute)).map(self.createNodeFromAlarm) : []);
        },
        createNodeFromAlarm: function (alarm) {
            return $('<li class="alarm-list-item">').append(
                $('<div class="row">').append(
                    $('<div class="col-md-6">').append(
                        $('<select class="form-control alarm-action">').append(
                            $('<option>').text(gt('Message')).val('DISPLAY'),
                            $('<option>').text(gt('Audio')).val('AUDIO'),
                            $('<option>').text(gt('Mail')).val('EMAIL')
                        ).val(alarm.action)
                    ),
                    $('<div class="col-md-5">').append(
                        $('<select class="form-control alarm-time">').append(_.map(util.getReminderOptions(), function (key, val) {
                            return '<option value="' + val + '">' + key + '</option>';
                        })).val(alarm.trigger)
                    ),
                    $('<span role="button" tabindex="0" class="alarm-remove pull-right">').append($('<i class="alarm-remove fa fa-trash">'))
                ));
        },
        getAlarmsArray: function () {
            var self = this;
            return _(this.list.children()).map(function (item) {
                var alarm = { action: $(item).find('.alarm-action').val(), trigger: $(item).find('.alarm-time').val() };
                switch (alarm.action) {
                    case 'EMAIL':
                        alarm.summary = self.model ? self.model.get('summary') || '' : '';
                        alarm.description = self.model ? self.model.get('description') || '' : '';
                        alarm.attendee = 'mailto:' + mailSettings.get('defaultaddress');
                        break;
                    case 'DISPLAY':
                        alarm.description = self.model ? self.model.get('summary') || '' : '';
                        break;
                    // no default
                }
                return alarm;
            });
        }
    });

    return alarms;

});
