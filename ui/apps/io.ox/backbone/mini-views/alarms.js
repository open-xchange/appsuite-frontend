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
    // TODO enable when mw supports this
    var standardTypes = ['DISPLAY', 'AUDIO'/*, 'EMAIL'*/];

    var alarms = DisposableView.extend({
        className: 'alarms-view',
        events: {
            'click .alarm-remove': 'onRemove',
            'change .alarm-action': 'updateModel',
            'change .alarm-time': 'updateModel'
        },
        initialize: function (options) {
            this.options = options || {};
            this.attribute = options.attribute || 'alarms';
            this.list = $('<ul class="list-unstyled alarm-list">');
        },
        render: function () {
            var self = this;
            this.$el.empty().append(
                $('<button class="btn btn-default" type="button">').text(gt('Add new Reminder'))
                    .on('click', function () {
                        self.list.append(self.createNodeFromAlarm({ action: 'DISPLAY', trigger: { duration: '-PT15M', related: 'START' } }));
                        self.updateModel();
                    }),
                self.list
            );
            this.updateView();
            return this;
        },
        onRemove: function (e) {
            e.stopPropagation();
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
            this.list.empty().append(this.model ? _(this.model.get(this.attribute)).map(self.createNodeFromAlarm.bind(self)) : []);
        },
        createNodeFromAlarm: function (alarm) {
            var self = this,
                row, container;

            container = $('<li class="alarm-list-item">').append(row = $('<div class="row">')).data('id', alarm.uid);
            if (_(standardTypes).indexOf(alarm.action) === -1) {
                row.append($('<div class="col-xs-6 alarm-action">').text(alarm.action).val(alarm.action));
            } else {
                row.append($('<div class="col-xs-6">').append(
                    $('<select class="form-control alarm-action">').append(
                        $('<option>').text(gt('Message')).val('DISPLAY'),
                        $('<option>').text(gt('Audio')).val('AUDIO')
                        // TODO enable when mw supports this
                        //$('<option>').text(gt('Mail')).val('EMAIL')
                    ).val(alarm.action)
                ));
            }

            if (alarm.trigger.duration) {
                var selectbox;
                row.append($('<div>').addClass(self.options.smallLayout ? 'col-xs-4' : 'col-xs-5').append(
                    selectbox = $('<select class="form-control alarm-time">').append(_.map(util.getReminderOptions(), function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    }))
                ));

                if (_(_(util.getReminderOptions()).keys()).indexOf(alarm.trigger.duration) === -1) {
                    var index = 0, customLabels;
                    if (alarm.trigger.duration.indexOf('-') !== 0) {
                        index = index + 1;
                    }
                    if (alarm.trigger.related === 'END') {
                        index = index + 2;
                    }
                    customLabels = [
                        //#. %1$s is the reminder time (for example: 2 hours)
                        gt.format('%1$s before the start time', new moment.duration(alarm.trigger.duration).humanize()),
                        //#. %1$s is the reminder time (for example: 2 hours)
                        gt.format('%1$s after the start time', new moment.duration(alarm.trigger.duration).humanize()),
                        //#. %1$s is the reminder time (for example: 2 hours)
                        gt.format('%1$s before the end time', new moment.duration(alarm.trigger.duration).humanize()),
                        //#. %1$s is the reminder time (for example: 2 hours)
                        gt.format('%1$s after the end time', new moment.duration(alarm.trigger.duration).humanize())
                    ];
                    selectbox.append($('<option>').val(alarm.trigger.duration).text(customLabels[index]).data('related', alarm.trigger.related));
                }
                selectbox.val(alarm.trigger.duration);
            } else {
                row.append($('<div class="alarm-time">').addClass(self.options.smallLayout ? 'col-xs-4' : 'col-xs-5').text(new moment(alarm.trigger.dateTime).format('LLL')).val(alarm.trigger.dateTime));
            }

            row.append(
                $('<span role="button" tabindex="0" class="alarm-remove pull-right">').append($('<i class="alarm-remove fa fa-trash">'))
            );

            return container;
        },
        getAlarmsArray: function () {
            var self = this;
            return _(this.list.children()).map(function (item) {
                var alarm = { action: $(item).find('.alarm-action').val() },
                    time = $(item).find('.alarm-time').val();
                if (time.indexOf('-P') === 0 || time.indexOf('P') === 0) {
                    alarm.trigger = { duration: time, related: $(item).find('.alarm-time option[value=' + time + ']').data('related') || 'START' };
                } else {
                    alarm.trigger = { dateTime: time };
                }
                if ($(item).data('id')) {
                    alarm = _.extend(_(self.model.get('alarms')).findWhere({ 'uid': $(item).data('id') }), alarm);
                }

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
