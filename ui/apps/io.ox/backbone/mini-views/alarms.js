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
    // TODO enable email when mw supports this
    var standardTypes = ['DISPLAY', 'AUDIO'/*, 'EMAIL'*/],
        relatedLabels = {
            //#. Used in a selectbox when the reminder for an appointment is before the start time
            'START-': gt.format('before start'),
            //#. Used in a selectbox when the reminder for an appointment is after the start time
            'START': gt.format('after start'),
            //#. Used in a selectbox when the reminder for an appointment is before the end time
            'END-': gt.format('before end'),
            //#. Used in a selectbox when the reminder for an appointment is after the end time
            'END': gt.format('after end')
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
            this.list = $('<ul class="list-unstyled alarm-list">');

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

                        self.list.append(self.createNodeFromAlarm({ action: 'DISPLAY', trigger: { duration: duration, related: 'START' } }));
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

            var row, container;

            container = $('<li class="alarm-list-item">').append(row = $('<div class="item">')).data('id', alarm.uid);
            if (_(standardTypes).indexOf(alarm.action) === -1) {
                row.append($('<div class="alarm-action">').text(alarm.action).val(alarm.action));
            } else {
                row.append(
                    $('<select class="form-control alarm-action">').append(
                        $('<option>').text(gt('Notification')).val('DISPLAY'),
                        $('<option>').text(gt('Audio')).val('AUDIO')
                        // TODO enable when mw supports this
                        //$('<option>').text(gt('Mail')).val('EMAIL')
                    ).val(alarm.action)
                );
            }

            if (alarm.trigger.duration) {
                var selectbox, relatedbox;
                row.append(
                    selectbox = $('<select class="form-control alarm-time">').append(_.map(util.getReminderOptions(), function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    })),
                    relatedbox = $('<select class="form-control alarm-related">').append(_.map(relatedLabels, function (key, val) {
                        return '<option value="' + val + '">' + key + '</option>';
                    }))
                );

                // add custom option so we can show non standard times
                if (_(_(util.getReminderOptions()).keys()).indexOf(alarm.trigger.duration.replace('-', '')) === -1) {
                    selectbox.append($('<option>').val(alarm.trigger.duration.replace('-', '')).text(new moment.duration(alarm.trigger.duration).humanize()));
                }

                relatedbox.val((alarm.trigger.related || 'START') + alarm.trigger.duration.replace(/\w*/g, ''));
                selectbox.val(alarm.trigger.duration.replace('-', ''));
            } else {
                row.append($('<div class="alarm-time">').text(new moment(alarm.trigger.dateTime).format('LLL')).val(alarm.trigger.dateTime));
            }

            row.append(
                $('<span role="button" tabindex="0" class="alarm-remove">').append($('<i class="alarm-remove fa fa-trash">'))
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
            var node = $('<ul class="list-unstyled alarm--link-list">');
            _(this.model.get(this.attribute)).each(function (alarm) {
                if (!alarm || !alarm.trigger) return;
                var type, duration, related, text;

                if (_(standardTypes).indexOf(alarm.action) === -1) {
                    // unknown type
                    type = alarm.action;
                } else {
                    switch (alarm.action) {
                        case 'DISPLAY':
                            type = gt('Notification');
                            break;
                        case 'AUDIO':
                            type = gt('Audio');
                            break;
                            //no default
                    }
                }

                if (alarm.trigger.duration) {
                    duration = util.getReminderOptions()[alarm.trigger.duration.replace('-', '')] || new moment.duration(alarm.trigger.duration).humanize();
                    related = relatedLabels[(alarm.trigger.related || 'START') + alarm.trigger.duration.replace(/\w*/g, '')];
                    //#. string to describe reminders for appointments,
                    //#. %1$s: the reminder type, audio/email/notification etc
                    //#. %2$s: the time the reminder should pop up. relative date: 15 minutes, 3 days etc
                    //#. %3$s: describes how this reminder is related to the appointment: before start, after start, before end, after end
                    //#. This should produces sentences like: Notification 15 minutes before start.
                    text = gt.format('%1$s %2$s %3$s.', type, duration, related);
                } else {
                    duration = new moment(alarm.trigger.dateTime).format('LLL');
                    //#. string to describe reminders for appointments,
                    //#. %1$s: the reminder type, audio/email/notification etc
                    //#. %2$s: the time the reminder should pop up. absolute date: something like September 4, 1986 8:30 PM
                    //#. This should produces sentences like: Notification September 4, 1986 8:30 PM.
                    text = gt.format('%1$s %2$s', type, duration);
                }

                node.append($('<li>').append($('<button type="button" class="alarm-link btn btn-link">').text(text)));
            });
            return node;
        },
        openDialog: function () {
            var self = this;

            require(['io.ox/backbone/views/modal'], function (ModalDialog) {
                var model = {}, alarmView;
                model[self.attribute] = self.model.get(self.attribute);
                alarmView = new alarmsView({ model: new Backbone.Model(model), attribute: self.attribute });
                new ModalDialog({
                    title: gt('Edit reminders'),
                    width: 600
                })
                .build(function () {
                    this.$body.append(alarmView.render().$el);
                    this.$el.addClass('alarms-view-dialog');
                })
                .addCancelButton()
                .addButton({ action: 'apply', label: gt('apply') })
                .on('apply', function () {
                    //set alarms back to previous value
                    self.model.set('alarms', alarmView.getAlarmsArray());
                })
                .open();
            });
        }
    });

    return {
        linkView: linkView,
        alarmsView: alarmsView
    };

});
