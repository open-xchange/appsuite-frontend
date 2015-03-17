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
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/notifications/calendar/register',
    ['io.ox/calendar/api',
     'io.ox/core/api/reminder',
     'io.ox/core/extensions',
     'gettext!plugins/notifications'
    ], function (calAPI, reminderAPI, ext, gt) {

    'use strict';

    ext.point('io.ox/core/notifications/invites/header').extend({
        draw: function () {
            this.append(
                $('<h1 class="section-title">').text(gt('Appointment invitations')),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({ tabindex: 1,
                        'aria-label': gt('Hide all appointment invitations.'),
                        'data-action': 'clear',
                        'focus-id': 'calendar-invite-clear'
                }),
                $('<ul class="items list-unstyled">')
            );
        }
    });

    ext.point('io.ox/core/notifications/reminder/header').extend({
        draw: function () {
            this.append(
                $('<h1 class="section-title">').text(gt('Appointment reminders')),
                $('<button type="button" class="btn btn-link clear-button fa fa-times refocus">')
                    .attr({ tabindex: 1,
                        'aria-label': gt('Hide all appointment reminders.'),
                        'data-action': 'clear',
                        'focus-id': 'calendar-reminder-notification-clear'
                }),
                $('<ul class="items list-unstyled">')
            );
        }
    });

    ext.point('io.ox/core/notifications/invites/item').extend({
        draw: function (baton) {
            var model = baton.model,
                self = this,
                descriptionId = _.uniqueId('notification-description-');
            require(['io.ox/calendar/util'], function (util) {
                self.attr({
                    role: 'listitem',
                    'data-cid': model.get('cid'),
                    'focus-id': 'calendar-invite-' + model.get('cid'),
                    'aria-describedby': descriptionId,
                    'tabindex': 1,
                                //#. %1$s Appointment title
                                //#. %2$s Appointment date
                                //#. %3$s Appointment time
                                //#. %4$s Appointment location
                                //#. %5$s Appointment Organizer
                                //#, c-format
                    'aria-label': gt('%1$s %2$s %3$s %4$s %5$s.',
                            _.noI18n(model.get('title')), _.noI18n(util.getDateIntervalA11y(model.get('data'))),
                            _.noI18n(util.getTimeIntervalA11y(model.get('data'))), _.noI18n(model.get('location')) || '',
                            _.noI18n(model.get('organizer')))
                }).append(
                    $('<span class="sr-only" aria-hiden="true">').text(gt('Press [enter] to open')).attr('id', descriptionId),
                    $('<span class="span-to-div time">').text(model.get('time')),
                    $('<span class="span-to-div date">').text(model.get('date')),
                    $('<span class="span-to-div title">').text(model.get('title')),
                    $('<span class="span-to-div location">').text(model.get('location')),
                    $('<span class="span-to-div organizer">').text(model.get('organizer')),
                    $('<div class="actions">').append(
                        $('<button type="button" tabindex="1" class="refocus btn btn-default" data-action="accept_decline">')
                            .attr('focus-id', 'calendar-invite-' + model.get('cid') + '-accept-decline')
                            .css('margin-right', '14px')
                            .text(gt('Accept / Decline')),
                        $('<button type="button" tabindex="1" class="refocus btn btn-success" data-action="accept">')
                            .attr({'aria-label': gt('Accept invitation'),
                                   'focus-id': 'calendar-invite-' + model.get('cid') + '-accept'})
                            .append('<i class="fa fa-check">')
                    )
                );
            });
        }
    });

    ext.point('io.ox/core/notifications/reminder/item').extend({
        draw: function (baton) {
            //build selectoptions
            var minutes = [5, 10, 15, 45],
                options = [],
                self = this;
            for (var i = 0; i < minutes.length; i++) {
                options.push([minutes[i], gt.format(gt.npgettext('in', 'in %d minute', 'in %d minutes', minutes[i]), minutes[i])]);
            }
            require(['io.ox/core/tk/reminder-util'], function (reminderUtil) {
                reminderUtil.draw(self, baton.model, options);
            });
        }
    });

    var InviteView = Backbone.View.extend({

        className: 'item refocus',
        tagName: 'li',
        events: {
            'click': 'onClickItem',
            'keydown': 'onClickItem',
            'click [data-action="accept_decline"]': 'onClickChangeStatus',
            'click [data-action="accept"]': 'onClickAccept'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/invites/item').invoke('draw', this.$el, baton);
            return this;
        },

        onClickItem: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button')) {
                //ignore chevron and dropdownlinks
                return;
            }
            if ((e.type !== 'click') && (e.which !== 13)) { return; }
            var obj = this.model.get('data'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                lastFocus = e.target,
                cid = String(overlay.find('[data-cid]').data('cid'));
            // toggle?
            if (sidepopup && cid === _.cid(obj)) {
                sidepopup.close();
            } else {
                // fetch proper appointment first
                calAPI.get(obj).done(function (data) {
                    require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-detail'], function (dialogs, view) {
                        // open SidePopup without array
                        new dialogs.SidePopup({ arrow: false, side: 'right' })
                            .setTarget(overlay.empty())
                            .on('close', function () {
                                if (_.device('smartphone') && overlay.children().length > 0) {
                                    overlay.addClass('active');
                                } else if (_.device('smartphone')) {
                                    overlay.removeClass('active');
                                    $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                                }
                                //restore focus
                                $(lastFocus).focus();
                            })
                            .show(e, function (popup) {
                                popup.append(view.draw(data));
                                if (_.device('smartphone')) {
                                    $('#io-ox-notifications').removeClass('active');
                                }
                            });
                    });
                });
            }
        },

        onClickAccept: function (e) {
            e.stopPropagation();
            var o = calAPI.reduce(this.model.get('data')),
                appointmentData = this.model.get('data');
                require(['io.ox/core/folder/api', 'settings!io.ox/calendar'], function (folderAPI, settings) {
                    folderAPI.get(o.folder).done(function (folder) {
                    o.data = {
                        // default reminder
                        alarm: parseInt(settings.get('defaultReminder', 15), 10),
                        confirmmessage: '',
                        confirmation: 1
                    };
                    // add current user id in shared or public folder
                    if (folderAPI.is('shared', folder)) {
                        o.data.id = folder.created_by;
                    }
                    calAPI.checkConflicts(appointmentData).done(function (conflicts) {
                        if (conflicts.length === 0) {
                            calAPI.confirm(o);
                        } else {
                            ox.load(['io.ox/calendar/conflicts/conflictList', 'io.ox/core/tk/dialogs']).done(function (conflictView, dialogs) {
                                var dialog = new dialogs.ModalDialog()
                                    .header(conflictView.drawHeader());

                                dialog.append(conflictView.drawList(conflicts, dialog).addClass('additional-info'));
                                dialog.addDangerButton('ignore', gt('Ignore conflicts'), 'ignore', {tabIndex: '1'});

                                dialog.addButton('cancel', gt('Cancel'), 'cancel', {tabIndex: '1'})
                                    .show()
                                    .done(function (action) {
                                        if (action === 'cancel') {
                                            return;
                                        }
                                        if (action === 'ignore') {
                                            calAPI.confirm(o);
                                        }
                                    });
                            });
                        }
                    });
                });
            });
        },

        onClickChangeStatus: function (e) {
            // stopPropagation could be prevented by another markup structure
            e.stopPropagation();
            var self = this;
            require(['io.ox/calendar/acceptdeny']).done(function (acceptdeny) {
                acceptdeny(self.model.get('data')).done(function (status) {
                    if (status !== 'cancel') {
                        self.collection.remove(self.model);
                    }
                });
            });
        }
    });

    var ReminderView = Backbone.View.extend({

        className: 'item',
        tagName: 'li',
        events: {
            'click': 'onClickItem',
            'keydown': 'onClickItem',
            'change [data-action="reminder"]': 'onClickReminder',
            'click [data-action="reminder"]': 'onClickReminder',
            'click [data-action="ok"]': 'onClickOk'
        },

        render: function () {
            var baton = ext.Baton({ model: this.model, view: this });
            ext.point('io.ox/core/notifications/reminder/item').invoke('draw', this.$el, baton);
            $('.dropdown-menu', this.$el).on('click', 'a', $.proxy(this.onClickReminder, this));
            return this;
        },

        onClickItem: function (e) {
            if ($(e.target).is('a') || $(e.target).is('i') || $(e.target).is('button')) {
                //ignore chevron and dropdownlinks
                return;
            }
            if ((e.type !== 'click') && (e.which !== 13)) { return; }
            var obj = this.model.get('remdata'),
                overlay = $('#io-ox-notifications-overlay'),
                sidepopup = overlay.prop('sidepopup'),
                lastFocus = e.target,
                cid = String(overlay.find('[data-cid]').data('cid'));
            obj = {id: obj.target_id, folder: obj.folder};
            // toggle?
            if (sidepopup && cid === _.cid(obj)) {
                sidepopup.close();
            } else {
                var data = this.model.get('caldata');
                require(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-detail'], function (dialogs, view) {
                    // open SidePopup without array
                    new dialogs.SidePopup({ arrow: false, side: 'right' })
                        .setTarget(overlay.empty())
                        .on('close', function () {
                            if (_.device('smartphone') && overlay.children().length > 0) {
                                overlay.addClass('active');
                            } else if (_.device('smartphone')) {
                                overlay.removeClass('active');
                                $('[data-app-name="io.ox/portal"]').removeClass('notifications-open');
                            }
                            //restore focus
                            $(lastFocus).focus();
                        })
                        .show(e, function (popup) {
                            popup.append(view.draw(data));
                            if (_.device('smartphone')) {
                                $('#io-ox-notifications').removeClass('active');
                            }
                        });
                });
            }
        },

        onClickReminder: function (e) {
            e.stopPropagation();
            var self = this,
                min = $(e.target).data('value') || $(e.target).val(),
                reminder = self.model;
            if (min !== '0') {
                //0 means 'pick a time here' was selected. Do nothing.
                hiddenCalReminderItems[_.ecid(reminder.get('remdata'))] = true;
                self.collection.remove(self.model);
                setTimeout(function () {
                    //get updated data
                    calAPI.get(reminder.get('caldata')).done(function (calObj) {
                        if (calObj.alarm) {
                            //alarmtime was removed in the meantime, so no reminder to add
                            require(['io.ox/calendar/util'], function (util) {
                                delete hiddenCalReminderItems[_.ecid(reminder.get('remdata'))];
                                //fill in new data
                                reminder.set('caldata', calObj);
                                reminder.set('title', calObj.title);
                                reminder.set('location', calObj.location);
                                reminder.set('time', util.getTimeInterval(calObj));
                                self.collection.add(reminder);
                            });
                        }
                    });

                }, min * 60000);
            }
        },

        onClickOk: function (e) {
            // stopPropagation could be prevented by another markup structure
            e.stopPropagation();
            var self = this;
            var obj = { id: self.model.get('remdata').id };
            if (self.model.get('remdata').recurrence_position) {
                obj.recurrence_position = self.model.get('remdata').recurrence_position;
            }
            reminderAPI.deleteReminder(obj).done(function () {
                self.collection.remove(self.model);
            });
        }
    });

    var InviteNotificationsView = Backbone.View.extend({

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-calendar',

        events: {
            'keydown [data-action="clear"]': 'clearItems',
            'click [data-action="clear"]': 'clearItems'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var baton = ext.Baton({ view: this });
                ext.point('io.ox/core/notifications/invites/header').invoke('draw', this.$el, baton);

                this.collection.each(function (model) {
                    this.$el.find('.items').append(
                        new InviteView({ model: model, collection: this.collection }).render().$el
                    );
                }, this);
            }
            return this;
        },

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                hiddenCalInvitationItems[_.ecid(item.attributes.data)] = true;
            });
            this.collection.reset();
        }
    });

    var ReminderNotificationsView = Backbone.View.extend({

        tagName: 'div',
        className: 'notifications',
        id: 'io-ox-notifications-calendar-reminder',

        events: {
            'keydown [data-action="clear"]': 'clearItems',
            'click [data-action="clear"]': 'clearItems'
        },

        render: function () {

            this.$el.empty();
            if (this.collection.length) {
                var baton = ext.Baton({ view: this });
                ext.point('io.ox/core/notifications/reminder/header').invoke('draw', this.$el, baton);

                this.collection.each(function (model) {
                    this.$el.find('.items').append(
                        new ReminderView({ model: model, collection: this.collection }).render().$el
                    );
                }, this);
            }
            return this;
        },

        clearItems: function (e) {
            if ((e.type === 'keydown') && (e.which !== 13)) { return; }
            //hide all items from view
            this.collection.each(function (item) {
                hiddenCalReminderItems[_.ecid(item.attributes.remdata)] = true;
            });
            this.collection.reset();
        }
    });

    var hiddenCalInvitationItems = {},
        hiddenCalReminderItems = {};

    ext.point('io.ox/core/notifications/register').extend({
        id: 'appointmentReminder',
        index: 100,
        register: function (controller) {
            var ReminderNotifications = controller.get('io.ox/calendarreminder', ReminderNotificationsView);

            function removeReminders(e, reminders) {
                //make sure we have an array
                reminders = reminders ? [].concat(reminders) : [];
                _(reminders).each(function (reminder) {
                    for (var i = 0; ReminderNotifications.collection.length > i; i++) {
                        var model = ReminderNotifications.collection.models[i];
                        if (model.attributes.caldata.id === reminder.id && model.attributes.caldata.folder_id === (reminder.folder || reminder.folder_id)) {
                            ReminderNotifications.collection.remove(model);
                        }
                    }
                });
            }

            reminderAPI
                .on('set:calendar:reminder', function (e, reminders) {

                    var appointmentIds = [];

                    _(reminders).each(function (reminder) {
                        if (!hiddenCalReminderItems[_.ecid(reminder)]) {
                            appointmentIds.push({id: reminder.target_id,
                                          recurrence_position: reminder.recurrence_position,
                                          folder: reminder.folder});
                        }
                    });

                    //no reminders to display
                    if (appointmentIds.length === 0) {
                        ReminderNotifications.collection.reset([]);
                        return;
                    }

                    $.when.apply($, _(appointmentIds).map(function (id) {
                        return calAPI.get(id);
                    })).done(function () {
                        //remove timestamps (cached data has no timestamp, real requests do)
                        var appointments = appointmentIds.length === 1 ? [arguments[0]] : _.map(arguments, function (item) {
                            if (_.isArray(item)) {
                                return item[0];
                            } else {
                                return item;
                            }
                        });

                        require(['io.ox/calendar/util'], function (util) {

                            var models = [],
                                remindersToDelete  = [];
                            _(appointments).each(function (data) {
                                _(reminders).each(function (rem) {
                                    if (rem.target_id === data.id) {
                                        //don't show reminders for old appointments
                                        if (data.end_date < _.now()) {
                                            var obj = { id: rem.id };
                                            if (rem.recurrence_position) {
                                                obj.recurrence_position = rem.recurrence_position;
                                            }
                                            remindersToDelete.push(obj);
                                        } else {
                                            models.push({
                                                    cid: _.cid(rem),
                                                    title: data.title,
                                                    location: data.location,
                                                    time: util.getTimeInterval(data),
                                                    date: util.getDateInterval(data),
                                                    remdata: rem,
                                                    caldata: data
                                                });
                                        }
                                    }
                                });
                            });
                            if (remindersToDelete.length > 0) {
                                //remove reminders correctly from server too
                                reminderAPI.deleteReminder(remindersToDelete);
                            }
                            ReminderNotifications.collection.reset(models);
                        });
                    });
                });
            calAPI.on('delete:appointment', removeReminders)
                  .on('delete:appointment', function () {
                        reminderAPI.getReminders();
                    })
                  .on('mark:invite:confirmed', function (e, obj) {
                        //remove reminders for declined appointments
                        if (obj.data.confirmation === 2) {
                            removeReminders(e, obj);
                        }
                    });
            reminderAPI.getReminders();
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'appointmentInvitations',
        index: 300,
        register: function (controller) {
            var InviteNotifications = controller.get('io.ox/calendar', InviteNotificationsView);

            calAPI
                .on('new-invites', function (e, invites) {
                    var tmp = [];
                    if (invites.length > 0) {
                        require(['io.ox/calendar/util', 'io.ox/core/api/user'], function (util, userAPI) {
                            $.when.apply($,
                                _(invites).map(function (invite) {
                                    //test if this invites are hidden
                                    if (hiddenCalInvitationItems[_.ecid(invite)]) {
                                        return undefined;
                                    }
                                    var inObj = {
                                        cid: _.cid(invite),
                                        title: invite.title,
                                        location: invite.location || '',
                                        date: util.getDateInterval(invite),
                                        time: util.getTimeInterval(invite),
                                        data: invite
                                    };
                                    // TODO: ignore organizerId until we know better
                                    var def = $.Deferred();
                                    userAPI.get({ id: invite.organizerId || invite.created_by })
                                        .done(function (user) {
                                            inObj.organizer = user.display_name;
                                            tmp.push(inObj);
                                            def.resolve();
                                        })
                                        .fail(function () {
                                            // no organizer
                                            inObj.organizer = invite.organizer || false;
                                            tmp.push(inObj);
                                            def.resolve();
                                        });
                                    return def;
                                })
                            )
                            .done(function () {
                                InviteNotifications.collection.reset(tmp);
                            });
                        });
                    } else {
                        InviteNotifications.collection.reset(tmp);
                    }

                })
                .on('mark:invite:confirmed', removeInvites)
                .on('delete:appointment', removeInvites)
                .getInvites();

            function removeInvites(e, invites) {
              //make sure we have an array
                invites = invites ? [].concat(invites) : [];
                _(invites).each(function (invite) {
                    for (var i = 0; InviteNotifications.collection.length > i; i++) {
                        var model = InviteNotifications.collection.models[i];
                        if (model.attributes.data.id === invite.id && model.attributes.data.folder_id === (invite.folder || invite.folder_id)) {
                            InviteNotifications.collection.remove(model);
                        }
                    }
                });
            }
        }
    });

    return true;
});
