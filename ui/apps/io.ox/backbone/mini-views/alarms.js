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
    var standardTypes = ['DISPLAY', 'AUDIO'/*, 'EMAIL'*/],
        relatedLabels = {
            //#. Used in a selectbox when the reminder for an appointment is before the start time
            'START-': gt.format('before the start'),
            //#. Used in a selectbox when the reminder for an appointment is after the start time
            'START': gt.format('after the start'),
            //#. Used in a selectbox when the reminder for an appointment is before the end time
            'END-': gt.format('before the end'),
            //#. Used in a selectbox when the reminder for an appointment is after the end time
            'END': gt.format('after the end')
        };

    var alarms = DisposableView.extend({
        className: 'alarms-view',
        events: {
            'click .alarm-remove': 'onRemove',
            'change .alarm-action': 'updateModel',
            'change .alarm-time': 'updateModel',
            'change .alarm-relation': 'updateModel'
        },
        initialize: function (options) {
            this.options = options || {};
            this.attribute = options.attribute || 'alarms';
            this.list = $('<ul class="list-unstyled alarm-list">');

            if (this.model) {
                this.model.on('change:' + this.attribute, _(this.updateView).bind(this));
            }
        },
        render: function () {
            var self = this;
            this.$el.empty().append(
                $('<button class="btn btn-default" type="button">').text(gt('Add new Reminder'))
                    .on('click', function () {
                        var duration;

                        if (self.attribute === 'alarms' && self.model) {
                            duration = util.isAllday(self.model) ? '-PT12H' : '-PT15M';
                        } else if (self.attribute === 'chronos/defaultAlarmDate' || self.attribute === 'birthdays/defaultAlarmDate') {
                            duration = '-PT12H';
                        } else {
                            duration = '-PT15M';
                        }

                        self.list.append(self.createNodeFromAlarm({ action: 'DISPLAY', trigger: { duration: duration, related: 'START' } }));
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
            // trigger event, so we know the user changed the alarm
            // used by edit view, to determine, if the default alarms should be applied on allday change
            this.model.trigger('userChangedAlarms');
        },
        updateView: function () {
            var self = this;
            this.list.empty().append(this.model ? _(this.model.get(this.attribute)).map(self.createNodeFromAlarm.bind(self)) : []);
        },
        createNodeFromAlarm: function (alarm) {
            if (!alarm || !alarm.trigger) return;

            var self = this,
                row, container;

            container = $('<li class="alarm-list-item">').append(row = $('<div class="row">')).data('id', alarm.uid);
            if (_(standardTypes).indexOf(alarm.action) === -1) {
                row.append($('<div class="col-xs-3 alarm-action">').text(alarm.action).val(alarm.action));
            } else {
                row.append($('<div class="col-xs-3">').append(
                    $('<select class="form-control alarm-action">').append(
                        $('<option>').text(gt('Message')).val('DISPLAY'),
                        $('<option>').text(gt('Audio')).val('AUDIO')
                        // TODO enable when mw supports this
                        //$('<option>').text(gt('Mail')).val('EMAIL')
                    ).val(alarm.action)
                ));
            }

            if (alarm.trigger.duration) {
                var selectbox, relatedbox;
                row.append($('<div>').addClass('col-xs-3').append(
                    selectbox = $('<select class="form-control alarm-time">').append(_.map(util.getReminderOptions(), function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    }))
                ),
                $('<div>').addClass(self.options.smallLayout ? 'col-xs-4' : 'col-xs-5').append(
                    relatedbox = $('<select class="form-control alarm-related">').append(_.map(relatedLabels, function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    }))
                ));

                // add custom option so we can show non standard times
                if (_(_(util.getReminderOptions()).keys()).indexOf(alarm.trigger.duration.replace('-', '')) === -1) {
                    selectbox.append($('<option>').val(alarm.trigger.duration.replace('-', '')).text(new moment.duration(alarm.trigger.duration).humanize()));
                }

                relatedbox.val((alarm.trigger.related || 'START') + alarm.trigger.duration.replace(/\w*/g, ''));
                selectbox.val(alarm.trigger.duration.replace('-', ''));
            } else {
                row.append($('<div class="alarm-time">').addClass('col-xs-5').text(new moment(alarm.trigger.dateTime).format('LLL')).val(alarm.trigger.dateTime));
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
                    time = $(item).find('.alarm-time').val(),
                    related = $(item).find('.alarm-related').val();

                if (time.indexOf('-P') === 0 || time.indexOf('P') === 0) {
                    alarm.trigger = { duration:  related.replace(/\w*/g, '') + time, related: related.replace(/\W*/g, '') };
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
