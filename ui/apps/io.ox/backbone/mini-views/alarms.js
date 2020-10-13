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
    'settings!io.ox/calendar',
    'less!io.ox/backbone/mini-views/alarms'
], function (util, DisposableView, gt, settings) {

    'use strict';

    var supportedTypes = settings.get('availableAlarmTypes', ['DISPLAY', 'AUDIO', 'EMAIL']),
        typeTranslations = {
            DISPLAY: gt('Notification'),
            AUDIO: gt('Audio'),
            EMAIL: gt('Mail'),
            SMS: gt('SMS')
        },
        relatedLabels = {
            //#. Used in a selectbox when the reminder for an appointment is before the start time
            'START-': gt('before start'),
            //#. Used in a selectbox when the reminder for an appointment is after the start time
            'START': gt('after start'),
            //#. Used in a selectbox when the reminder for an appointment is before the end time
            'END-': gt('before end'),
            //#. Used in a selectbox when the reminder for an appointment is after the end time
            'END': gt('after end')
        },
        predefinedSentences = {
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'DISPLAYSTART-': gt('Notify %1$s before start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'DISPLAYSTART': gt('Notify %1$s after start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'DISPLAYEND-': gt('Notify %1$s before end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'DISPLAYEND': gt('Notify %1$s after end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. absolute date with time: something like September 4, 1986 8:30 PM
            'DISPLAYABS': gt('Notify at %1$s.'),
            //#. Used to display reminders for appointments
            'DISPLAYSTART0': gt('Notify at start.'),
            //#. Used to display reminders for appointments
            'DISPLAYEND0': gt('Notify at end.'),

            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'AUDIOSTART-': gt('Play sound %1$s before start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'AUDIOSTART': gt('Play sound %1$s after start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'AUDIOEND-': gt('Play sound %1$s before end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'AUDIOEND': gt('Play sound %1$s after end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. absolute date with time: something like September 4, 1986 8:30 PM
            'AUDIOABS': gt('Play sound at %1$s.'),
            //#. Used to display reminders for appointments
            'AUDIOSTART0': gt('Play sound at start.'),
            //#. Used to display reminders for appointments
            'AUDIOEND0': gt('Play sound at end.'),

            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'EMAILSTART-': gt('Send mail %1$s before start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'EMAILSTART': gt('Send mail %1$s after start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'EMAILEND-': gt('Send mail %1$s before end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'EMAILEND': gt('Send mail %1$s after end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the time the reminder should pop up. absolute date with time: something like September 4, 1986 8:30 PM
            'EMAILABS': gt('Send mail at %1$s.'),
            //#. Used to display reminders for appointments
            'EMAILSTART0': gt('Send mail at start.'),
            //#. Used to display reminders for appointments
            'EMAILEND0': gt('Send mail at end.'),

            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            //#. %2$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'GENERICSTART-': gt('%1$s %2$s before start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            //#. %2$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'GENERICSTART': gt('%1$s %2$s after start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            //#. %2$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'GENERICEND-': gt('%1$s %2$s before end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            //#. %2$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
            'GENERICEND': gt('%1$s %2$s after end.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            //#. %2$s: the time the reminder should pop up. absolute date with time: something like September 4, 1986 8:30 PM
            'GENERICABS': gt('%1$s at %2$s.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            'GENERICSTART0': gt('%1$s at start.'),
            //#. Used to display reminders for appointments
            //#. %1$s: the reminder type, SMS etc
            'GENERICEND0': gt('%1$s at end.')
        };

    var alarmsView = DisposableView.extend({
        className: 'alarms-view',
        events: {
            'click .alarm-remove': 'onRemove',
            'change .alarm-action': 'updateModel',
            'change .alarm-time': 'updateModel',
            'change .alarm-related': 'updateModel'
        },
        initialize: function (options) {
            this.options = options || {};
            this.attribute = options.attribute || 'alarms';
            this.phoneNumber = options.phoneNumber;
            this.supportedTypes = options.phoneNumber ? supportedTypes : _(supportedTypes).without('SMS');
            this.list = $('<div class="alarm-list">');

            if (this.model) {
                this.listenTo(this.model, 'change:' + this.attribute, this.updateView);
            }
        },
        render: function () {
            var self = this;
            this.$el.empty().append(
                self.list,
                $('<button class="btn btn-default" type="button">').text(gt('Add reminder'))
                    .on('click', function () {
                        var duration;

                        if (self.attribute === 'alarms' && self.model) {
                            duration = util.isAllday(self.model) ? '-PT12H' : '-PT15M';
                        } else if (self.attribute === 'chronos/defaultAlarmDate' || self.attribute === 'birthdays/defaultAlarmDate') {
                            duration = '-PT12H';
                        } else {
                            duration = '-PT15M';
                        }
                        var action = _(supportedTypes).indexOf('DISPLAY') === -1 ? supportedTypes[0] || 'DISPLAY' : 'DISPLAY',
                            node = self.createNodeFromAlarm({ action: action, trigger: { duration: duration, related: 'START' } });
                        self.list.append(node);
                        // focus newly added alarm, to offer feedback for screenreaders etc
                        node.find('.alarm-action').focus();
                        self.updateModel();
                    })
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
            this.changedByUser = true;
            this.model.set(this.attribute, this.getAlarmsArray());
            this.changedByUser = false;
        },
        updateView: function () {
            // user induced changes don't need a redraw, the view is already in the correct state (redraw would also cause a focus loss)
            if (this.changedByUser) return;
            var self = this;
            this.list.empty().append(this.model ? _(this.model.get(this.attribute)).map(self.createNodeFromAlarm.bind(self)) : []);
        },
        createNodeFromAlarm: function (alarm, index) {
            index = (index || this.list.children().length) + 1;
            if (!alarm || !alarm.trigger) return;

            var row, container, uid = _.uniqueId();

            // fieldset does not support display flex so we need an inner div to do this
            container = $('<fieldset class="alarm-list-item">').data('id', alarm.uid).append(
                //#. %1$d: is the number of the reminder
                $('<legend class="sr-only">').text(gt('Reminder %1$d', index)),
                row = $('<div class="item">'));
            if (this.supportedTypes.length === 1 || _(this.supportedTypes).indexOf(alarm.action) === -1) {
                row.append($('<div class="alarm-action" tabindex="0">').text(typeTranslations[alarm.action] || alarm.action).val(alarm.action));
            } else {
                row.append(
                    //#. screenreader label for the reminder type (audio, notification, etc)
                    $('<label class="sr-only">').attr('for', 'action-' + uid).text(gt('type')),
                    $('<select class="form-control alarm-action">').attr('id', 'action-' + uid).append(
                        _(this.supportedTypes).map(function (type) {
                            return $('<option>').text(typeTranslations[type] || type).val(type);
                        })
                    ).val(alarm.action)
                );
            }

            if (alarm.trigger.duration) {
                var selectbox, relatedbox;
                row.append(
                    //#. screenreader label for the reminder timeframe (15 minutes, etc)
                    $('<label class="sr-only">').attr('for', 'time-' + uid).text(gt('timeframe')),
                    selectbox = $('<select class="form-control alarm-time">').attr('id', 'time-' + uid).append(_.map(util.getReminderOptions(), function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    })),
                    //#. screenreader label for the reminder timeframe relation (before start, after end, etc)
                    $('<label class="sr-only">').attr('for', 'related-' + uid).text(gt('timeframe relation')),
                    relatedbox = $('<select class="form-control alarm-related">').attr('id', 'related-' + uid).append(_.map(relatedLabels, function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    }))
                );

                // add custom option so we can show non standard times
                if (_(_(util.getReminderOptions()).keys()).indexOf(alarm.trigger.duration.replace('-', '')) === -1) {
                    // test if we just have a special 0 value
                    if (/^[-+]?PT0[SHDW]$/.test(alarm.trigger.duration)) {
                        selectbox.find('[value="PT0M"]').val(alarm.trigger.duration.replace('-', ''));
                    } else {
                        selectbox.append($('<option>').val(alarm.trigger.duration.replace('-', '')).text(new moment.duration(alarm.trigger.duration).humanize()));
                    }
                }

                relatedbox.val((alarm.trigger.related || 'START') + alarm.trigger.duration.replace(/\w*/g, ''));
                selectbox.val(alarm.trigger.duration.replace('-', ''));
            } else {
                row.append($('<div class="alarm-time" tabindex="0">').text(new moment(alarm.trigger.dateTime).format('LLL')).val(alarm.trigger.dateTime));
            }

            row.append(
                $('<button type="button" class="btn btn-link alarm-remove">').attr('aria-label', gt('Remove reminder')).append($('<i class="fa fa-trash">'))
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
                    // don't use empty string as summary or description if not available. Produces problems with ical
                    // with mail or audio alarms everything is optional and handled by the backend (we could add attendees, description, attachments etc but we want to keep things simple until needed)
                    // do not overwrite existing descriptions
                    case 'DISPLAY':
                        if (!alarm.description) alarm.description = self.model ? self.model.get('summary') || 'reminder' : 'reminder';
                        break;
                    case 'SMS':
                        if (!alarm.description) alarm.description = self.model ? self.model.get('summary') || 'reminder' : 'reminder';
                        if (!alarm.attendees && self.phoneNumber) alarm.attendees = [{ uri: 'tel:' + self.phoneNumber }];
                        break;
                    // no default
                }
                return alarm;
            });
        }
    });

    var linkView  = DisposableView.extend({
        className: 'alarms-link-view',
        events: {
            'click .alarm-link': 'openDialog'
        },
        initialize: function (options) {
            this.options = options || {};
            this.attribute = options.attribute || 'alarms';
            if (this.model) {
                this.listenTo(this.model, 'change:' + this.attribute, this.render);
            }
        },
        render: function () {
            this.$el.empty().append(
                (this.model.get(this.attribute) || []).length === 0 ? $('<button type="button" class="alarm-link btn btn-link">').text(gt('No reminder')) : this.drawList()
            );
            return this;
        },
        drawList: function () {
            var node = $('<ul class="list-unstyled alarm-link-list">');
            _(this.model.get(this.attribute)).each(function (alarm) {
                if (!alarm || !alarm.trigger) return;
                var options = [], key;

                if (alarm.trigger.duration) {
                    options.push(util.getReminderOptions()[alarm.trigger.duration.replace('-', '')] || new moment.duration(alarm.trigger.duration).humanize());
                    key = (alarm.trigger.related || 'START') + (alarm.trigger.duration.indexOf('PT0') === -1 ? alarm.trigger.duration.replace(/\w*/g, '') : '0');
                } else {
                    options.push(new moment(alarm.trigger.dateTime).format('LLL'));
                    key = 'ABS';
                }
                options.push(alarm.action);
                options.unshift(predefinedSentences[alarm.action + key] || predefinedSentences['GENERIC' + key]);
                node.append($('<li>').append($('<button type="button" class="alarm-link btn btn-link">').text(gt.format.apply(undefined, options))));
            });
            return node;
        },
        openDialog: function (options) {
            options = options || {};
            var self = this;

            require(['io.ox/backbone/views/modal', 'io.ox/core/api/user'], function (ModalDialog, userApi) {
                userApi.get({ id: options.userId }).always(function (data) {
                    data = data || {};

                    var model = {},
                        phoneNumber = data.cellular_telephone1 || data.cellular_telephone2,
                        alarmView;
                    // deepclone is needed here or the models are not detached and the attribute is bound by reference
                    model[self.attribute] = _.deepClone(self.model.get(self.attribute));
                    alarmView = new alarmsView({ model: new Backbone.Model(model), attribute: self.attribute, phoneNumber: phoneNumber });
                    new ModalDialog({
                        title: gt('Edit reminders'),
                        width: 600
                    })
                    .build(function () {
                        this.$body.append(alarmView.render().$el);
                        this.$el.addClass('alarms-view-dialog');
                    })
                    .addCancelButton({ left: true })
                    .addButton({ action: 'apply', label: gt('Apply') })
                    .on('apply', function () {
                        // trigger event, so we know the user set the alarms manually
                        // used by edit view, to determine, if the default alarms should be applied on allday change
                        self.model.trigger('userChangedAlarms');
                        // if the length of the array doesn't change the model doesn't trigger a change event,so we trigger it manually
                        self.model.set(self.attribute, alarmView.getAlarmsArray()).trigger('change:' + self.attribute);
                    })
                    .open();
                });
            });
        }
    });

    return {
        linkView: linkView,
        alarmsView: alarmsView
    };

});
