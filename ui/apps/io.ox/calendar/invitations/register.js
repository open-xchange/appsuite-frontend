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
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/calendar/invitations/register', [
    'io.ox/core/extensions',
    'io.ox/core/http',
    'io.ox/calendar/util',
    'settings!io.ox/chronos',
    'gettext!io.ox/calendar/main',
    'io.ox/core/notifications',
    'less!io.ox/calendar/style'
], function (ext, http, util, settings, gt, notifications) {

    'use strict';

    var i18n = {
        'accept': gt('Accept'),
        'accept_and_replace': gt('Accept changes'),
        'accept_and_ignore_conflicts': gt('Accept'),
        'accept_party_crasher': gt('Add new participant'),
        'create': gt('Accept'),
        'update': gt('Accept changes'),
        'delete': gt('Delete'),
        'declinecounter': gt('Reject changes'),
        'tentative': gt('Tentative'),
        'decline': gt('Decline'),
        'ignore': gt('Ignore')
    };

    var buttonClasses = {
        'accept': 'btn-success accept',
        'accept_and_replace': 'btn-success',
        'accept_and_ignore_conflicts': 'btn-success ignore',
        'accept_party_crasher': '',
        'create': '',
        'update': 'btn-success',
        'delete': '',
        'declinecounter': 'btn-danger',
        'tentative': 'btn-warning',
        'decline': 'btn-danger',
        'ignore': ''
    };

    var success = {
        'accept': gt('You have accepted the appointment'),
        'accept_and_replace': gt('Changes have been saved'),
        'accept_and_ignore_conflicts': gt('You have accepted the appointment'),
        'accept_party_crasher': gt('Added the new participant'),
        'create': gt('You have accepted the appointment'),
        'update': gt('The appointment has been updated'),
        'delete': gt('The appointment has been deleted'),
        'declinecounter': gt('The changes have been rejected'),
        'tentative': gt('You have tentatively accepted the appointment'),
        'decline': gt('You have declined the appointment')
    };

    var successInternal = {
        1: gt('You have accepted the appointment'),
        2: gt('You have declined the appointment'),
        3: gt('You have tentatively accepted the appointment')
    };

    var priority = ['update', 'ignore', 'create', 'delete', 'decline', 'tentative', 'accept', 'declinecounter', 'accept_and_replace', 'accept_and_ignore_conflicts', 'accept_party_crasher'];

    function analyzeIMIPAttachment(imip) {

        if (!imip || !imip.id) return $.Deferred().reject();

        return http.PUT({
            module: 'calendar/itip',
            params: {
                action: 'analyze',
                dataSource: 'com.openexchange.mail.ical',
                descriptionFormat: 'html',
                timezone: 'UTC'
            },
            data: {
                'com.openexchange.mail.conversion.fullname': imip.mail.folder_id,
                'com.openexchange.mail.conversion.mailid': imip.mail.id,
                'com.openexchange.mail.conversion.sequenceid': imip.id
            }
        });
    }

    //
    // Abstract View
    // expects data to be in the this.event variable and works only on the new events model
    // if other data (external appointments, tasks) are used, overwrite according functions
    //
    var AbstractView = Backbone.View.extend({

        className: 'itip-item',

        events: {
            'click .show-details': 'onShowDetails',
            'click .itip-actions button': 'onAction',
            'keydown': 'onKeydown'
        },

        onKeydown: function (e) {
            // temporary fix; bootstrap a11y plugin causes problems here (space key)
            e.stopPropagation();
        },

        onShowDetails: function (e) {
            e.preventDefault();
            var self = this;
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/calendar/view-detail']).done(function (dialogs, viewDetail) {
                new dialogs.SidePopup({ tabTrap: true }).show(e, function (popup) {
                    popup.append(viewDetail.draw(self.event));
                });
            });
        },

        renderScaffold: function () {
            return this.$el.append(
                $('<div class="headline">').append(
                    $('<span>').text(this.getInfoText()), $.txt('. '),
                    $('<a href="#" role="button" class="show-details">').text(this.getLinkText())
                ),
                $('<div class="itip-details">'),
                $('<div class="itip-annotations">'),
                $('<div class="itip-changes">'),
                $('<div class="itip-comment">'),
                $('<div class="itip-controls">')
            );
        },

        getInfoText: function () {
            return gt('This email contains an appointment');
        },

        getLinkText: function () {
            return gt('Show appointment details');
        },

        renderConfirmation: function () {
            var status = this.getConfirmationStatus(), // NEEDS-ACTION ACCEPTED DECLINED TENTATIVE
                message = '';

            if (this.isOrganizer()) {
                message = gt('You are the organizer');
                return $('<div class="confirmation-status">').addClass('organizer').text(message);
            }

            switch (status) {
                case 'ACCEPTED':
                    message = this.getAcceptedMessage();
                    break;
                case 'DECLINED':
                    message = this.getRejectedMessage();
                    break;
                case 'TENTATIVE':
                    message = this.getTentativeMessage();
                    break;
                default:

            }

            if (message) return $('<div class="confirmation-status">').addClass(status.toLowerCase()).text(message);
            return $();
        },

        getAcceptedMessage: function () {
            return gt('You have accepted this appointment');
        },

        getRejectedMessage: function () {
            return gt('You declined this appointment');
        },

        getTentativeMessage: function () {
            return gt('You tentatively accepted this invitation');
        },

        isOrganizer: function () {
            return this.event.has('createdBy') && this.event.get('createdBy').entity === ox.user_id;
        },

        getConfirmationStatus: function () {
            return util.getConfirmationStatus(this.event.attributes);
        },

        getEvent: function () {
            return this.event;
        },

        renderSummary: function () {

            var dateStrings = this.getDateTimeIntervalMarkup(),
                recurrenceString = this.getRecurrenceString(),
                title = this.getTitle(),
                separator = title ? $.txt(', ') : $.txt('');

            this.$el.find('.itip-details').append(
                $('<b>').text(title), separator,
                $('<span class="day">').append(
                    $.txt(dateStrings.dateStr),
                    $.txt(' '),
                    $.txt(dateStrings.timeStr),
                    $.txt(recurrenceString && recurrenceString.length ? ' \u2013 ' + recurrenceString : '')
                ),
                // confirmation
                this.renderConfirmation()
            );
        },

        getTitle: function () {
            this.event.get('summary');
        },

        getDateTimeIntervalMarkup: function () {
            return util.getDateTimeIntervalMarkup(this.event.attributes, { output: 'strings' });
        },

        getRecurrenceString: function () {
            util.getRecurrenceString(this.event);
        },

        renderAnnotations: function () {
        },

        renderChanges: function () {
        },

        renderReminder: function () {
        },

        getActions: function () {
            return ['decline', 'tentative', 'accept'];
        },

        getButtons: function (actions) {
            return _(priority)
                .chain()
                .filter(function (action) {
                    return _(actions).contains(action);
                })
                .map(function (action) {
                    return $('<button type="button" class="btn btn-default">')
                        .attr('data-action', action)
                        .addClass(buttonClasses[action])
                        .text(i18n[action]);
                })
                .value();
        },

        getConfirmationSelector: function (status) {
            if (status === 'ACCEPTED') return 'button.btn-success.accept';
            if (status === 'DECLINED') return 'button.btn-danger';
            if (status === 'TENTATIVE') return 'button.btn-warning';
            return '';
        },

        disableCurrentButton: function () {

            if (this.supportsComment()) return;

            var status = this.getConfirmationStatus(),
                selector = this.getConfirmationSelector(status);
            // disable buttons - don't know why we have an array of appointments but just one set of buttons
            // so, let's use the first one
            this.$('.itip-actions').find(selector).addClass('disabled').prop('disabled', true);
        },

        supportsComment: function () {
            // show comment field if we have a accept, tentative, or decline button
            return this.$('[data-action="accept"], [data-action="tentative"], [data-action="decline"]').length > 0;
        },

        getUserComment: function () {
            return this.$el.find('.itip-comment input').val();
        },

        renderComment: function () {
            if (!this.supportsComment()) return;
            this.$el.find('.itip-comment').append(
                $('<input type="text" class="form-control" data-property="comment">')
                .attr('placeholder', gt('Comment'))
                .val(this.getConfirmationMessage())
            );
        },

        getConfirmationMessage: function () {
            return util.getConfirmationMessage(this.event.attributes);
        },

        render: function () {

            this.$el.empty().fadeIn(300);

            var actions = this.getActions(), status, accepted, buttons;

            this.renderScaffold();
            this.renderAnnotations();

            this.event = this.getEvent() || this.event;
            if (!this.event) {
                // remove "Show appointment" link
                this.$el.find('.show-details').remove();
                return this;
            }

            this.renderSummary();
            this.renderChanges();

            status = this.getConfirmationStatus();
            accepted = status === 'ACCEPTED';

            // don't offer standard buttons if appointment is already accepted
            if (accepted) actions = _(actions).without('decline', 'tentative', 'accept');

            // get standard buttons
            buttons = this.getButtons(actions);
            if (buttons.length === 0) return this;
            // use doesn't need any controls to "ignore" the message
            if (actions.length === 1 && actions[0] === 'ignore') return this;

            this.$el.find('.itip-controls').append(
                $('<div class="itip-actions">').append(buttons)
            );

            this.disableCurrentButton();
            this.renderComment();
            this.renderReminder();

            return this;
        },

        dispose: function () {
            this.stopListening();
            this.model = this.options = null;
        }
    });

    //
    // Functions based on json object for tasks and external invitations
    //

    var jsonExtensions = {
        getTitle: function () {
            return this.event.title;
        },

        isOrganizer: function () {
            return this.event.organizerId === ox.user_id;
        },

        getConfirmationStatus: (function () {
            var confirmations = ['NEEDS-ACTION', 'ACCEPTED', 'DECLINED', 'TENTATIVE'];
            return function () {
                var index = this.util.getConfirmationStatus(this.event);
                if (index >= 0 && index < confirmations.length) return confirmations[index];
                return 'NEEDS-ACTION';
            };
        }()),

        getConfirmationMessage: function () {
            return this.util.getConfirmationMessage(this.event);
        },

        getDateTimeIntervalMarkup: function () {
            return this.util.getDateTimeIntervalMarkup(this.event, { output: 'strings' });
        }
    };

    //
    // External invitations
    //

    var ExternalView = AbstractView.extend(_.extend({}, jsonExtensions, {

        onAction: function (e) {

            e.preventDefault();

            var action = $(e.currentTarget).attr('data-action'), self = this,
                doConflictCheck = action !== 'decline';

            function performConfirm() {
                http.PUT({
                    module: 'calendar/itip',
                    params: {
                        action: action,
                        dataSource: 'com.openexchange.mail.ical',
                        descriptionFormat: 'html',
                        message: self.getUserComment()
                    },
                    data: {
                        'com.openexchange.mail.conversion.fullname': self.imip.mail.folder_id,
                        'com.openexchange.mail.conversion.mailid': self.imip.mail.id,
                        'com.openexchange.mail.conversion.sequenceid': self.imip.id
                    }
                })
                .then(
                    function done() {
                        // api refresh
                        var refresh = require(['io.ox/calendar/chronos-api']).then(
                            function (api) {
                                api.refresh();
                                if (self.options.yell !== false) {
                                    notifications.yell('success', success[action]);
                                }
                            });

                        if (self.settings.get('deleteInvitationMailAfterAction', false)) {
                            // remove mail
                            require(['io.ox/mail/api'], function (api) {
                                api.remove([self.imip.mail]);
                            });
                        } else {
                            // repaint only if there is something left to repaint
                            refresh.then(function () {
                                // if the delete action was succesfull we don't need the button anymore, see Bug 40852
                                if (action === 'delete') {
                                    self.model.set('actions', _(self.model.get('actions')).without('delete'));
                                }
                                self.repaint();
                            });
                        }
                    },
                    function fail(e) {
                        notifications.yell(e);
                        self.repaint();
                    }
                );
            }

            ox.load(['io.ox/calendar/actions/change-confirmation']).done(function (action) {
                action(self.imip, {
                    api: {
                        checkConflicts: function () {
                            var conflicts = [];
                            // no need to check if appointment was declined
                            if (doConflictCheck) {
                                _(self.model.get('changes')).each(function (change) {
                                    if (change.conflicts) conflicts = conflicts.concat(change.conflicts);
                                });
                            }
                            return $.when(conflicts);
                        }
                    }
                }).done(performConfirm).fail(function (err) {
                    if (err) notifications.yell(err);
                });
            });
        },

        initialize: function (options) {
            this.options = _.extend({}, options);
            this.imip = options.imip;
            this.$el.hide();
        },

        getActions: function () {
            return this.model.get('actions');
        },

        getAnnotations: function () {
            return _(this.model.get('annotations'))
                .chain()
                .pluck('message')
                .compact()
                .value();
        },

        getEvent: function () {
            // extract appointments data from changes
            return _(this.model.get('changes'))
                .chain()
                .map(function (change) {
                    return change.deletedAppointment || change.newAppointment || change.currentAppointment;
                })
                .compact()
                .first()
                .value();
        },

        renderAnnotations: function () {
            // ignore annotations for requests
            // if (this.model.get('messageType') === 'request') return;
            // -- don't know why this message type should be skipped;
            // still helpful to get an annotataion
            var node = this.$el.find('.itip-annotations');
            _(this.getAnnotations()).each(function (annotation) {
                node.append(
                    $('<div class="annotation">').html(annotation)
                );
            });
        },

        renderChanges: function () {
            var node = this.$el.find('.itip-changes');
            return _(this.model.get('changes')).each(function (change) {
                if (!change.diffDescription) return;
                _(change.diffDescription).each(function (description) {
                    node.append($('<p>').html(description));
                });
            });
        },

        repaint: function () {
            var self = this;
            analyzeIMIPAttachment(this.imip)
                .done(function (analyses) {
                    var data = _(analyses).findWhere({ uid: self.model.get('uid') });
                    this.model.set(data);
                    this.render();
                }.bind(this));
        },

        render: function () {
            var self = this;
            require(['io.ox/tasks/util'], function (util) {
                // use tasks util here, since this works on json as well (instead of the new chronos model)
                self.util = util;
                AbstractView.prototype.render.call(self);
            });
            return this;
        }

    }));

    //
    //  Internal invitations
    //

    var InternalView = AbstractView.extend({

        initialize: function (options) {
            this.options = _.extend({}, options);
            this.listenTo(this.model, 'change:headers', this.render);
            this.$el.on('dispose', this.dispose.bind(this));
            this.cid = options.cid;
            this.$el.hide();
        },

        load: function () {
            return $.when();
        },

        render: function () {
            var self = this;
            this.$el.attr({ 'data-type': this.type, 'data-cid': this.cid });
            this.load().then(function () {
                AbstractView.prototype.render.call(self);
            });
            return this;
        }

    });

    var InternalAppointmentView = InternalView.extend({

        load: function () {
            var self = this;
            return require([
                'io.ox/calendar/chronos-api',
                'io.ox/calendar/util',
                'settings!io.ox/chronos',
                'io.ox/backbone/mini-views/alarms'
            ]).then(function (api, util, settings, AlarmsView) {
                self.api = api;
                self.util = util;
                self.settings = settings;
                self.AlarmsView = AlarmsView;
                var cid = api.cid(self.cid);
                return api.get({ folder: 'cal://0/' + cid.folder, id: cid.id });
            }).then(function (event) {
                if (self.event) self.stopListening(self.event);
                self.listenTo(event, 'change', self.render);
                self.event = event;
                self.previousConfirmation = _(event.get('attendees')).findWhere({ entity: ox.user_id });
            });
        },

        renderReminder: function () {
            // backbone model is fine. No need to require chronos model
            this.alarmsModel = new Backbone.Model(this.event);

            this.$el.find('.itip-actions').before(
                $('<div class="itip-reminder">').append(
                    $('<legend>').text(gt('Reminder')),
                    new this.AlarmsView({ model: this.alarmsModel, smallLayout: true }).render().$el
                )
            );
        },

        onAction: function (e) {

            var self = this,
                action = $(e.currentTarget).attr('data-action'),
                hash = { accept: 'ACCEPTED', tentative: 'TENTATIVE', decline: 'DECLINED' },
                comment = this.getUserComment();

            function performConfirm(checkConflicts) {
                self.api.confirm({
                    attendee: _.extend({}, self.previousConfirmation, {
                        partStat: hash[action],
                        comment: comment
                    }),
                    id: self.event.get('id'),
                    folder: self.event.get('folder'),
                    alarms: self.alarmsModel.get('alarms')
                }, { ignore_conflicts: !checkConflicts })
                .then(function success(data) {
                    if (data && data.conflicts) {
                        ox.load(['io.ox/calendar/conflicts/conflictList']).done(function (conflictView) {
                            conflictView.dialog(data.conflicts)
                                .on('cancel', function () {
                                    self.$el.idle();
                                    self.render();
                                })
                                .on('ignore', function () {
                                    performConfirm(false);
                                });
                        });
                        return;
                    }

                    if (settings.get('deleteInvitationMailAfterAction', false)) {
                        // remove mail
                        if (self.options.yell !== false) {
                            notifications.yell('success', successInternal[action]);
                        }
                        require(['io.ox/mail/api'], function (api) {
                            api.remove([self.model.toJSON()]);
                        });
                    } else {
                        // update well
                        self.$el.idle();
                        self.render();
                    }
                }, function fail() {
                    self.$el.idle().hide();
                    notifications.yell('error', gt('Failed to update confirmation status; most probably the appointment has been deleted.'));
                });
            }

            self.$el.busy(true);
            performConfirm(true);
        }

    });

    var InternalTaskView = InternalView.extend(_.extend({}, jsonExtensions, {

        onShowDetails: function (e) {
            e.preventDefault();
            var self = this;
            ox.load(['io.ox/core/tk/dialogs', 'io.ox/tasks/view-detail']).done(function (dialogs, viewDetail) {
                new dialogs.SidePopup({ tabTrap: true }).show(e, function (popup) {
                    popup.append(viewDetail.draw(self.event));
                });
            });
        },

        load: function () {
            var self = this;
            return require([
                'io.ox/tasks/api',
                'io.ox/tasks/util',
                'settings!io.ox/tasks'
            ]).then(function (api, util, settings) {
                self.api = api;
                self.util = util;
                self.settings = settings;
                return api.get(_.cid(self.cid));
            }).then(function (task) {
                self.event = task;
            });
        },

        getInfoText: function () {
            return gt('This email contains a task');
        },

        getLinkText: function () {
            return gt('Show task details');
        },

        getAcceptedMessage: function () {
            return gt('You have accepted this task');
        },

        getRejectedMessage: function () {
            return gt('You declined this task');
        },

        getTentativeMessage: function () {
            return gt('You tentatively accepted this task');
        },

        renderReminder: function () {
            var view = this;
            this.$el.find('.itip-actions').before(
                $('<div class="itip-reminder inline">').append(
                    $('<label class="control-label" for="reminderSelect">').text(gt('Reminder')),
                    $('<div class="controls">').append(
                        $('<select id="reminderSelect" class="reminder-select form-control" data-property="reminder">')
                        .append(function () {
                            var self = $(this),
                                options = view.util.getReminderOptions();
                            _(options).each(function (label, value) {
                                self.append($('<option>', { value: value }).text(label));
                            });
                        })
                        .val(this.getDefaultReminder())
                    )
                )
            );
        },

        getDefaultReminder: function () {
            return parseInt(this.settings.get('defaultReminder', 15), 10);
        },

        onActionSuccess: function (action, updated) {

            var reminder = this.reminder,
                tempdata;

            if (reminder) {
                // don't use whole data object here, because it overwrites the confirmations with it's users attribute
                tempdata = {
                    id: this.event.id,
                    folder_id: this.event.folder_id,
                    alarm: reminder
                };
                if (this.event.recurrence_position) {
                    tempdata.recurrence_position = this.event.recurrence_position;
                }
                //tasks use absolute timestamps
                tempdata.alarm = _.utc() + tempdata.alarm;
                this.api.update(tempdata);
            }

            this.event = updated;

            if (settings.get('deleteInvitationMailAfterAction', false)) {
                // remove mail
                if (this.options.yell !== false) {
                    notifications.yell('success', successInternal[action]);
                }
                require(['io.ox/mail/api'], function (api) {
                    api.remove([this.model.toJSON()]);
                }.bind(this));
            } else {
                // update well
                this.$el.idle();
                this.render();
            }
        },

        onActionFail: function () {
            // appointment or task was deleted in the meantime
            this.$el.idle().hide();
            notifications.yell('error', gt('Failed to update confirmation status; most probably the task has been deleted.'));
        },

        onAction: function (e) {

            var self = this,
                action = $(e.currentTarget).attr('data-action'),
                hash = { accept: 1, decline: 2, tentative: 3 },
                confirmation = hash[action],
                status = this.getConfirmationStatus(),
                accepted = status === 'ACCEPTED',
                comment = this.getUserComment();

            this.reminder = accepted ? false : parseInt(this.$el.find('.reminder-select').val(), 10);

            self.$el.busy(true);

            self.api.confirm({
                folder: this.event.folder_id,
                id: this.event.id,
                data: { confirmation: confirmation, confirmmessage: comment }
            })
            .then(self.onActionSuccess.bind(self, confirmation), self.onActionFail.bind(self, action));
        }

    }));

    //
    // Container view. Checks mail data and adds internal or external view
    //

    var ItipView = Backbone.View.extend({

        className: 'itip',

        initialize: function (options) {
            this.options = _.extend({}, options);
            // if headers are already available, call update()
            // otherwise wait for model change
            if (this.model.has('headers')) {
                this.update();
            } else {
                this.listenToOnce(this.model, 'change:headers', this.update);
            }
            this.$el.on('dispose', this.dispose.bind(this));
        },

        getIMIPAttachment: function () {
            var regex = /text\/calendar.*?method=(.+)/i;
            // loop over attachments to find first attachment with mime-type text/calendar
            return _(this.model.get('attachments')).find(function (attachment) {
                var match = attachment.content_type.match(regex), index, method;
                if (match && match[1].toLowerCase() !== 'publish') {
                    index = match[1].indexOf(';');
                    method = index !== -1 ? match[1].substr(0, index) : match[1];
                    return method.toLowerCase() !== 'publish';
                }
                return false;
            });
        },

        update: function () {

            var headers, reminder, type, cid, $el = this.$el, imip,
                yell = this.options && this.options.yell;

            // external?
            if ((imip = this.getIMIPAttachment())) {
                // mark this mail as "imipMail"
                this.model.set('imipMail', true, { silent: true });
                imip.mail = { folder_id: this.model.get('folder_id'), id: this.model.get('id') };
                return analyzeIMIPAttachment(imip).done(function (analyses) {
                    _(analyses).each(function (analysis) {
                        var model = new Backbone.Model(analysis),
                            view = new ExternalView({
                                model: model,
                                imip: imip,
                                yell: yell
                            });
                        $el.append(view.render().$el);
                    });
                });
            }

            // internal
            // check if we already have all required data
            if (!(headers = this.model.get('headers'))) return;
            if (!(reminder = headers['X-OX-Reminder'])) return;
            if (!(type = headers['X-Open-Xchange-Module'])) return;

            // get the object id
            reminder = reminder.split(/,\s*/);
            cid = reminder[1] + '.' + reminder[0];

            var View = type === 'Appointments' ? InternalAppointmentView : InternalTaskView;

            this.$el.append(
                new View({
                    model: this.model,
                    cid: cid,
                    yell: yell
                }).render().$el
            );
        },

        render: function () {
            return this;
        },

        dispose: function () {
            this.stopListening();
            this.model = this.options = null;
        }
    });

    ext.point('io.ox/mail/detail/notifications').extend({
        index: 1000000000000,
        id: 'accept-decline',
        draw: function (baton) {
            var view = new ItipView(_.extend({ model: baton.model }, baton.options));
            this.append(view.render().$el);
        }
    });
});
