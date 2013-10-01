/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012
 * Mail: info@open-xchange.com
 *
 * @author Mario Scheliga <mario.scheliga@open-xchange.com>
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('plugins/notifications/calendar/register',
    ['io.ox/calendar/api',
     'io.ox/core/api/reminder',
     'io.ox/calendar/util',
     'io.ox/core/extensions',
     'io.ox/core/api/user',
     'io.ox/core/tk/reminder-util',
     'gettext!plugins/notifications'
    ], function (calAPI, reminderAPI, util, ext, userAPI, reminderUtil, gt) {

    'use strict';

    ext.point('io.ox/core/notifications/invites/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Invitations')),
                $('<div class="notifications">')
            );
        }
    });

    ext.point('io.ox/core/notifications/reminder/header').extend({
        draw: function () {
            this.append(
                $('<legend class="section-title">').text(gt('Reminder')),
                $('<div class="reminder">')
            );
        }
    });

    ext.point('io.ox/core/notifications/invites/item').extend({
        draw: function (baton) {
            var model = baton.model;
            this.attr({
                'data-cid': model.get('cid'),
                'tabindex': 1
            }).append(
                $('<div class="time">').text(model.get('time')),
                $('<div class="date">').text(model.get('date')),
                $('<div class="title">').text(model.get('title')),
                $('<div class="location">').text(model.get('location')),
                $('<div class="organizer">').text(model.get('blue')),
                $('<div class="actions">').append(
                    $('<button type="button" tabindex="1" class="btn btn-inverse" data-action="accept_decline">').text(gt('Accept / Decline'))
                )
            );
        }
    });

    ext.point('io.ox/core/notifications/reminder/item').extend({
        draw: function (baton) {
            //build selectoptions
            var minutes = [5, 10, 15, 45],
                options = [];
            for (var i = 0; i < minutes.length; i++) {
                options.push([minutes[i], gt.format(gt.npgettext('in', 'in %d minute', 'in %d minutes', minutes[i]), minutes[i])]);
            }
            reminderUtil.draw(this, baton.model, options);
        }
    });

    var InviteView = Backbone.View.extend({

        className: 'item',

        events: {
            'click': 'onClickItem',
            'keydown': 'onClickItem',
            'click [data-action="accept_decline"]': 'onClickChangeStatus'
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

        events: {
            'click': 'onClickItem',
            'keydown': 'onClickItem',
            'change [data-action="selector"]': 'onClickReminder',
            'click [data-action="selector"]': 'onClickReminder',
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
            if (min !== '0') {//0 means 'pick a time here' was selected. Do nothing.
                self.collection.remove(self.model);
                self.collection.hidden.push(self.model.get('cid'));
                setTimeout(function () {
                    //get updated data
                    calAPI.get(reminder.get('caldata')).done(function (calObj) {
                        self.collection.hidden = _.without(self.collection.hidden, reminder.get('cid'));
                        //fill in new data
                        reminder.set('caldata', calObj);
                        reminder.set('title', calObj.title);
                        reminder.set('location', calObj.location);
                        reminder.set('time', util.getTimeInterval(calObj));
                        self.collection.add(reminder);
                    });

                }, min * 60000);
            }
        },

        onClickOk: function (e) {
            // stopPropagation could be prevented by another markup structure
            e.stopPropagation();
            var self = this;
            reminderAPI.deleteReminder(self.model.get('remdata').id).done(function () {
                self.collection.remove(self.model);
            });
        }
    });

    var InviteNotificationsView = Backbone.View.extend({

        className: 'notifications',
        id: 'io-ox-notifications-calendar',

        initialize: function () {
            this.collection.on('reset add remove', this.render, this);
        },

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/invites/header').invoke('draw', this.$el.empty(), baton);

            this.collection.each(function (model) {
                this.$el.append(
                    new InviteView({ model: model, collection: this.collection }).render().$el
                );
            }, this);

            return this;
        }
    });

    var ReminderNotificationsView = Backbone.View.extend({

        className: 'notifications-rem',
        id: 'io-ox-notifications-calendar-reminder',

        initialize: function () {
            this.collection.hidden = [];
        },

        render: function () {

            var baton = ext.Baton({ view: this });
            ext.point('io.ox/core/notifications/reminder/header').invoke('draw', this.$el.empty(), baton);
            if (this.collection.length > 0) {
                this.$el.show();
                this.collection.each(function (model) {
                    this.$el.append(
                        new ReminderView({ model: model, collection: this.collection }).render().$el
                    );
                }, this);
            } else {
                this.$el.hide();
            }

            return this;
        }
    });

    ext.point('io.ox/core/notifications/register').extend({
        id: 'appointments',
        index: 100,
        register: function (controller) {
            var InviteNotifications = controller.get('io.ox/calendar', InviteNotificationsView),
                ReminderNotifications = controller.get('io.ox/calendarreminder', ReminderNotificationsView);
            ReminderNotifications.collection.hidden = [];
            calAPI
                .on('new-invites', function (e, invites) {
                    var tmp = [];

                    $.when.apply($,
                        _(invites).map(function (invite) {
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
                .on('add:calendar:reminder', function (e, reminder) {

                    var counter = reminder.length,
                        now = _.now();

                    _(reminder).each(function (remObj) {
                        var obj = {
                            id: remObj.target_id,
                            folder: remObj.folder,
                            recurrence_position: remObj.recurrence_position
                        };
                        calAPI.get(obj).done(function (data) {

                            var inObj = {
                                cid: _.cid(remObj),
                                title: data.title,
                                location: data.location,
                                time: util.getTimeInterval(data),
                                date: util.getDateInterval(data),
                                remdata: remObj,
                                caldata: data
                            };

                            // ignore appointments that are over
                            var isOver = data.end_date < now;

                            if (!isOver) {
                                _(ReminderNotifications.collection.models).each(function (reminderModel) {//remove outdated versions of the model
                                    if (reminderModel.get('cid') === inObj.cid) {
                                        ReminderNotifications.collection.remove(reminderModel);
                                    }
                                });

                                // do not add user suppressed ('remind me later') reminders
                                if (ReminderNotifications.collection.hidden.length === 0 || _.indexOf(ReminderNotifications.collection.hidden, _.cid(remObj)) === -1) {
                                    ReminderNotifications.collection.add(new Backbone.Model(inObj));
                                }
                            }

                            counter--;

                            if (counter === 0) {
                                //all data processed. Update Collection
                                ReminderNotifications.collection.trigger('add');
                            }
                        });
                    });
                });
            calAPI.on('delete:appointment', removeReminders)
                  .on('delete:appointment', function () {
                        reminderAPI.getReminders();
                    })
                  .on('mark:invite:confirmed', function (e, obj) {
                        if (obj.data.confirmation === 2) {//remove reminders for declined appointments
                            removeReminders(e, obj);
                        }
                    });
            reminderAPI.getReminders();
        }
    });
    return true;
});

