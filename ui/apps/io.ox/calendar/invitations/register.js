/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/calendar/invitations/register',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'settings!io.ox/calendar',
     'io.ox/calendar/util',
     'gettext!io.ox/calendar/main',
     'io.ox/core/notifications',
     'less!io.ox/calendar/style.less'
    ], function (ext, http, settings, util, gt, notifications) {

    'use strict';

    var regex = /text\/calendar.*?method=(.+)/i;

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
        'accept_and_replace': 'btn-inverse',
        'accept_and_ignore_conflicts': 'btn-success ignore',
        'accept_party_crasher': 'btn-inverse',
        'create': 'pull-left btn-inverse',
        'update': 'pull-left btn-inverse',
        'delete': 'pull-left btn-inverse',
        'declinecounter': 'pull-left btn-danger',
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

    var priority = ['update', 'ignore', 'accept', 'tentative', 'decline', 'declinecounter', 'accept_and_replace', 'accept_and_ignore_conflicts', 'accept_party_crasher', 'create', 'delete'];

    function discoverIMipAttachment(baton) {
        return _(baton.data.attachments).find(function (attachment) {
            var match = attachment.content_type.match(regex);
            if (match && match[1].toLowerCase() !== 'publish') {
                var index = match[1].indexOf(';');
                var method = index !== -1 ? match[1].substr(0, index) : match[1];
                method = method.toLowerCase();

                return method !== 'publish';
            }
            return false;
        });
    }

    function analyzeAttachment(baton) {
        if (baton.data.folder_id && baton.data.id && baton.imip.attachment.id) {
            return http.PUT({
                module: 'calendar/itip',
                params: {
                    action: 'analyze',
                    dataSource: 'com.openexchange.mail.ical',
                    descriptionFormat: 'html',
                    timezone: 'UTC'
                },
                data: {
                    'com.openexchange.mail.conversion.fullname': baton.data.folder_id,
                    'com.openexchange.mail.conversion.mailid': baton.data.id,
                    'com.openexchange.mail.conversion.sequenceid': baton.imip.attachment.id
                }
            });
        } else {
            return $.Deferred().resolve({});
        }
    }

    function renderAnalysis($node, baton) {

        function rerender(baton) {
            analyzeAttachment(baton).done(function (results) {
                baton.analysis = results[baton.index];
                render(baton);
            });
        }

        function render(baton) {

            if (!baton.analysis) {
                if (baton.$.well) baton.$.well.remove();
                return;
            }

            if (baton.analysis.actions.length !== 1 || baton.analysis.actions[0] !== 'ignore') {

                var appointments = [],
                    introductions = [];

                _(baton.analysis.annotations).each(function (annotation) {
                    if (annotation.appointment) {
                        appointments.push(annotation.appointment);
                    }
                });

                _(baton.analysis.changes).each(function (change) {
                    var appointment = change.deletedAppointment || change.newAppointment || change.currentAppointment;
                    if (appointment) {
                        appointments.push(appointment);
                    }
                    introductions.push(change.introduction);
                });

                var appointment = appointments[0],
                    status = util.getConfirmationStatus(appointment),
                    selector = getConfirmationSelector(status),
                    accepted = status === 1,
                    $well = drawWell();

                if (baton.$.well) {
                    baton.$.well.replaceWith($well);
                }

                drawScaffold.call(baton.$.well = $well, 'appointment');

                if (accepted) {
                    baton.analysis.actions = _(baton.analysis.actions).without('decline', 'tentative', 'accept');
                }

                var actionButtons = _(priority).chain()
                    .filter(function (action) {
                        return _(baton.analysis.actions).contains(action);
                    })
                    .map(function (action) {
                        var button = $('<button type="button" class="btn">')
                            .attr('data-action', action)
                            .addClass(buttonClasses[action])
                            .text(i18n[action]);
                        return button
                            .add($('<span>').text('\u00A0'))
                            .addClass(button.hasClass('pull-left') ? 'pull-left' : '');
                    })
                    .value();

                if (actionButtons && actionButtons.length > 0) {
                    baton.$.well
                        .find('.itip-actions')
                        .addClass('block')
                        .append(actionButtons)
                        .on('click', 'button', function (e) {
                            e.preventDefault();
                            var action = $(this).attr('data-action');

                            // be busy
                            baton.$.well.empty().busy();
                            http.PUT({
                                module: 'calendar/itip',
                                params: {
                                    action: action,
                                    dataSource: 'com.openexchange.mail.ical',
                                    descriptionFormat: 'html'
                                },
                                data: {
                                    'com.openexchange.mail.conversion.fullname': baton.data.folder_id,
                                    'com.openexchange.mail.conversion.mailid': baton.data.id,
                                    'com.openexchange.mail.conversion.sequenceid': baton.imip.attachment.id
                                }
                            })
                            .then(
                                function done() {
                                    // api refresh
                                    require(['io.ox/calendar/api']).then(function (api) {
                                        api.refresh();
                                        notifications.yell('success', success[action]);
                                        rerender(baton);
                                    });
                                },
                                function fail(e) {
                                    notifications.yell(e);
                                    rerender(baton);
                                }
                            );
                        })
                        // disable buttons - don't know why we have an array of appointments but just one set of buttons
                        // so, let's use the first one
                        .find(selector).addClass('disabled').prop('disabled', true);
                } else {
                    baton.$.well.find('.itip-action-container').remove();
                }

                if (baton.analysis.messageType !== 'request' && introductions[0]) {
                    baton.$.well.find('.muted').html(introductions[0]);
                }

                _(baton.analysis.changes).each(function (change) {
                    var app = change.deletedAppointment || change.newAppointment || change.currentAppointment;
                    baton.$.well.find('.appointmentInfo').append(
                        $('<div>').append(drawSummary(app)), renderDiffDescription(change)
                    );
                });

                if (appointments.length === 0) {
                    baton.$.well.find('.muted').remove();
                }

                $node.append(baton.$.well.show());
            } else {
                if (baton.$.well) baton.$.well.remove();
            }

            // draw appointment details and well
            var $analysisNode = $('<div class="io-ox-calendar-itip-analysis">');
            if (baton.$.analysis) {
                baton.$.analysis.replaceWith($analysisNode);
            }

            $node.append(baton.$.analysis = $analysisNode);

            // Annotations
            _(baton.analysis.annotations).each(function (annotation) {
                renderAnnotation(baton.$.analysis, annotation, baton.analysis, baton);
            });

            // Changes
            _(baton.analysis.changes).each(function (change) {
                renderChange(baton.$.analysis, change, baton.analysis, baton);
            });
        }

        baton.imip.analysis = baton.analysis;

        // Let's remove the ITip Attachments
        baton.data.attachments = _(baton.data.attachments).filter(function (attachment) {
            return !(/\.ics$/).test(attachment.filename);
        });

        // draw well
        render(baton);
    }

    function renderAnnotation($node, annotation, analysis, baton) {
        $node.append(
            $('<div class="annotation">').append(
                $('<div class="message alert">').append(annotation.message),
                renderAppointment(annotation.appointment, baton)
            )
        );
    }

    function renderChange($node, change, analysis, baton) {
        $node.append(
            $('<div class="change">').append(
                renderConflicts(change),
                // preference on currentAppointment, so that we can show the current status
                renderAppointment(change.currentAppointment || change.newAppointment || change.deletedAppointment, baton)
            )
        );
    }

    function renderAppointment(appointment) {
        if (!appointment) {
            return $();
        }
        var node = $('<div class="appointment well">'),
            baton = ext.Baton.ensure(appointment);
        // disable actions and appointment-details in detail view
        baton.disable('io.ox/calendar/detail', 'inline-actions');
        baton.disable('io.ox/calendar/detail', 'details');
        require(['io.ox/calendar/view-detail'], function (viewDetail) {
            node.append(viewDetail.draw(baton));
        });

        return node;
    }

    function renderTask(task) {
        if (!task) {
            return $();
        }
        var node = $('<div class="task well">'),
            baton = ext.Baton.ensure(task);
        // disable actions and appointment-details in detail view
        baton.disable('io.ox/tasks/detail-inline', 'inline-links');
        require(['io.ox/tasks/view-detail'], function (viewDetail) {
            node.append(viewDetail.draw(baton));
        });

        return node;
    }

    function renderDiffDescription(change) {
        if (!change.diffDescription) {
            return $();
        }

        var $list = $('<div class="changes">');

        _(change.diffDescription || []).each(function (diffEntry) {
            $list.append($('<p>').html(diffEntry));
        });

        return $list;
    }

    function renderConflicts(change) {
        if (!change.conflicts) {
            return $();
        }
        var $node = $('<div>');
        var text = gt.format(gt.ngettext('There is already %1$d appointment in this timeframe.',
            'There are already %1$d appointments in this timeframe.', change.conflicts.length), change.conflicts.length);

        $node.append(
            $('<div class="alert alert-info">').append(
                $.txt(text),
                $.txt(' '),
                $('<a href="#">').text(gt('Show conflicts')).on('click', function (e) {
                    e.preventDefault();
                    require(['io.ox/calendar/conflicts/conflictList'], function (conflictList) {
                        $node.find('.alert').remove();
                        $node.append(
                            $('<div>').css({marginTop: '2em', marginBottom: '2em'}).append(
                                conflictList.drawList(change.conflicts)
                            )
                        );
                    });
                })
            )
        );

        return $node;
    }

    ext.point('io.ox/mail/detail').extend({
        index: 'first',
        id: 'imip-check',
        draw: function (baton) {
            // look for itip
            var imipAttachment = discoverIMipAttachment(baton);
            if (imipAttachment) {
                baton.imip = { attachment: imipAttachment };
                baton.hideOriginalMail = true;
                // change flow
                // baton.disable('io.ox/mail/detail', 'content');
            }
        }
    });

    ext.point('io.ox/mail/detail').extend({
        before: 'content',
        id: 'imip',
        draw: function (baton) {
            if (baton.imip) {
                var node;
                this.append(
                    node = $('<section class="itip-section">').busy()
                );
                analyzeAttachment(baton).done(function (analysis) {
                    node.idle();
                    _(analysis).each(function (a, index) {
                        var clone = baton.clone({ analysis: a, index: index });
                        renderAnalysis(node, clone);
                    });
                });
            }
        }
    });

    function drawWell() {
        return $('<div class="well io-ox-calendar-itip-analysis">').hide();
    }

    function drawScaffold(type) {
        var text = type !== 'task' ?
            gt('This email contains an appointment') :
            gt('This email contains a task');

        return this.append(
            $('<div class="muted">').text(text),
            $('<div class="appointmentInfo">'),
            $('<div class="itip-action-container">')
                .css({ textAlign: 'right', marginTop: '1em', minHeight: '30px' })
                .append(
                    $('<div class="itip-actions">')
                )
        );
    }

    function loadAppointment(baton) {
        return require(['io.ox/calendar/api', 'settings!io.ox/calendar']).then(function (api, settings) {
            return api.get({ folder: baton.appointment.folder_id, id: baton.appointment.id }).then(
                function success(appointment) {
                    appointment.type = 'appointment';
                    baton.appointment = appointment;
                    drawDetails(baton, api, settings);
                    return appointment;
                }
                /* see Bug 26489 for more information */
                // ,
                // function fail(e) {
                //     // bad luck or most probably the appointment is deleted
                //     baton.$.well
                //         .addClass('auto-height')
                //         .find('.appointmentInfo').text(
                //             gt('Failed to load detailed appointment data; most probably the appointment has been deleted.')
                //         )
                //         .end()
                //         .find('.itip-action-container').remove()
                //         .end()
                //         .show();
                // }
            );
        });
    }

    function loadTask(baton) {
        return require(['io.ox/tasks/api', 'settings!io.ox/tasks']).then(function (api, settings) {
            return api.get({ folder: baton.task.folder_id, id: baton.task.id }).then(
                function success(task) {
                    task.type = 'task';
                    baton.task = task;
                    drawDetails(baton, api, settings);
                    return task;
                }
                /* see Bug 26489 for more information */
                // ,
                // function fail(e) {
                //     // bad luck or most probably the appointment is deleted
                //     baton.$.well
                //         .addClass('auto-height')
                //         .find('.appointmentInfo').text(
                //             gt('Failed to load detailed task data; most probably the task has been deleted.')
                //         )
                //         .end()
                //         .find('.itip-action-container').remove()
                //         .end()
                //         .show();
                // }
            );
        });
    }

    function getConfirmationSelector(status) {
        if (status === 1) return 'button.btn-success.accept';
        if (status === 2) return 'button.btn-danger';
        if (status === 3) return 'button.btn-warning';
        return '';
    }

    function drawConfirmation(data) {
        // 0 = none, 1 = accepted, 2 = declined, 3 = tentative
        var status = util.getConfirmationStatus(data),
            message = '', className = '';

        if (data.organizerId === ox.user_id) {
            message = gt('You are the organizer');
            className = 'organizer';
            return $('<div class="confirmation-status">').addClass(className).text(message);
        }

        if (status > 0) {
            switch (status) {
            case 1:
                message = data.type !== 'task' ?
                    gt('You have accepted this appointment') :
                    gt('You have accepted this task');
                className = 'accepted';
                break;
            case 2:
                message = data.type !== 'task' ?
                    gt('You declined this appointment') :
                    gt('You declined this task');
                className = 'declined';
                break;
            case 3:
                message = data.type !== 'task' ?
                    gt('You tentatively accepted this invitation') :
                    gt('You tentatively accepted this task');
                className = 'tentative';
                break;
            }
            return $('<div class="confirmation-status">').addClass(className).text(message);
        }

        return $();
    }

    function drawSummary(data) {
        var recurrenceString = util.getRecurrenceString(data),
            separator = data.title ? $.txt(', ') : $.txt('');
        return [
            $('<b>').text(data.title), separator,
            $('<span class="day">').append(
                $.txt(gt.noI18n(util.getDateInterval(data))),
                $.txt(gt.noI18n((recurrenceString !== '' ? ' \u2013 ' + recurrenceString : '')))
            ),
            // confirmation
            drawConfirmation(data)
        ];
    }

    function drawDetails(baton, api, settings) {

        var defaultReminder = parseInt(settings.get('defaultReminder', 15), 10),
            reminderSelect = $(),
            data = baton.appointment || baton.task,
            status = util.getConfirmationStatus(data),
            selector = getConfirmationSelector(status),
            accepted = status === 1;

        baton.$.well.find('.appointmentInfo').append(
            drawSummary(data)
        );
        if (accepted) {

            baton.$.well.find('.itip-action-container').remove();

        } else {

            baton.$.well.find('.itip-actions')
            .before(
                reminderSelect = $('<div>').css({'text-align': 'left', 'display': 'inline-block'}).append(
                    $('<label class="control-label" for="reminderSelect">').text(gt('Reminder')),
                    $('<div class="controls">').append(
                        $('<select id="reminderSelect" data-property="reminder">')
                        .css({ margin: '0' })
                        .append(function () {
                            var self = $(this),
                                options = util.getReminderOptions();
                            _(options).each(function (label, value) {
                                self.append($('<option>', {value: value}).text(label));
                            });
                        }).val(defaultReminder)
                    )
                )
            )
            .append(
                $('<button type="button" class="btn btn-success" data-action="1">').text(gt('Accept')),
                '&nbsp;',
                $('<button type="button" class="btn btn-warning" data-action="3">').text(gt('Tentative')),
                '&nbsp;',
                $('<button type="button" class="btn btn-danger" data-action="2">').text(gt('Decline'))
            )
            .on('click', 'button', function (e) {

                baton.$.well.empty().busy();

                api.confirm({
                    folder: data.folder_id,
                    id: data.id,
                    data: {
                        confirmation: Number($(e.target).data('action'))
                    }
                })
                .done(function () {
                    if (!accepted) {
                        var reminder = parseInt(reminderSelect.find('select').val(), 10);
                        if (reminder !== defaultReminder) {
                            //don't use whole data object here, because it overwrites the confirmations with it's users attribute
                            var tempdata = {
                                    id: data.id,
                                    folder_id: data.folder_id,
                                    alarm: reminder
                                };
                            if (data.recurrence_position) {
                                tempdata.recurrence_position = data.recurrence_position;
                            }
                            if (baton.task) {//tasks use absolute timestamps
                                tempdata.alarm = _.utc() + tempdata.alarm;
                            }
                            api.update(tempdata);
                        }
                    }
                    var dep = data.type === 'appointment' ? 'settings!io.ox/calendar' : 'settings!io.ox/tasks';
                    require(['io.ox/mail/api', dep], function (api, settings) {
                        if (settings.get('deleteInvitationMailAfterAction')) {
                            // remove mail
                            notifications.yell('success', successInternal[Number($(e.target).data('action'))]);
                            api.remove([baton.data]);
                        } else {
                            // update well
                            drawScaffold.call(baton.$.well.idle(), data.type);
                            if (data.type === 'appointment') {
                                loadAppointment(baton);
                            } else if (data.type === 'task') {
                                loadTask(baton);
                            }
                        }
                    });
                })
                .fail(function () {
                    //appointment or task was deleted in the meantime
                    baton.$.well.idle();
                    baton.$.well.hide();
                    if (data.type === 'appointment') {
                        notifications.yell('error', gt('Failed to update confirmation status; most probably the appointment has been deleted.'));
                    } else {
                        notifications.yell('error', gt('Failed to update confirmation status; most probably the task has been deleted.'));
                    }
                });
            })
            // disable button matching current status
            .find(selector).addClass('disabled').prop('disabled', true);
        }

        baton.$.well.show();
    }

    ext.point('io.ox/mail/detail').extend({
        before: 'content',
        id: 'accept-decline',
        draw: function (baton) {
            var module,
                reminder = baton.data.headers['X-OX-Reminder'],
                address,
                node;

            if (reminder) {
                baton.imip = true;
                module = baton.data.headers['X-Open-Xchange-Module'];

                this.append(
                    node = $('<section class="itip-section">')
                );

                // appointment or task?
                if (/^(Appointments|Tasks)/.test(module)) {

                    address = reminder.split(/,\s*/);

                    if (module === 'Appointments') {
                        node.append(
                            drawScaffold.call(baton.$.well = drawWell(), 'appointment')
                        );
                        baton.appointment = { folder_id: address[1], id: address[0] };

                        loadAppointment(baton).then(function (app) {
                            node.append(
                                $('<div>').addClass('alert alert-info cursor-pointer').append(
                                    $('<a href="#" role="button">').text(gt('Show appointment'))
                                ).on('click', function () {
                                    node.append(
                                        $('<div class="io-ox-calendar-itip-analysis">').append(
                                            $('<div class="change">').append(renderAppointment(app))
                                        )
                                    );
                                    $(this).remove();
                                })
                            );
                        });

                    }

                    if (module === 'Tasks') {
                        node.append(
                            drawScaffold.call(baton.$.well = drawWell(), 'task')
                        );
                        baton.task = { folder_id: address[1], id: address[0] };

                        loadTask(baton).then(function (task) {
                            node.append(
                                $('<div>').addClass('alert alert-info cursor-pointer').append(
                                    $('<a href="#" role="button">').text(gt('Show task'))
                                ).on('click', function () {
                                    node.append(
                                        $('<div class="io-ox-calendar-itip-analysis">').append(
                                            $('<div class="change">').append(renderTask(task))
                                        )
                                    );
                                    $(this).remove();
                                })
                            );
                        });
                    }

                    return $.when();
                }
            }
        }
    });

});
