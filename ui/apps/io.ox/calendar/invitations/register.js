/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Francisco Laguna <francisco.laguna@open-xchange.com>
 */

define('io.ox/calendar/invitations/register',
    ['io.ox/core/extensions',
     'io.ox/core/http',
     'settings!io.ox/calendar',
     'gettext!io.ox/calendar/main',
     "io.ox/core/notifications",
     "less!io.ox/calendar/style.css"], function (ext, http, settings, gt, notifications) {

    'use strict';

    // we set this once we need it (stupid workaround, otherwise we always load full calendar)
    var util;

    var regex = /text\/calendar.*?method=(.+)/i;

    var i18n = {
        'accept': gt("Accept"),
        'accept_and_replace': gt("Accept changes"),
        'accept_and_ignore_conflicts': gt("Accept"),
        'accept_party_crasher': gt("Add new participant"),
        'create': gt("Accept"),
        'update': gt("Accept changes"),
        'delete': gt("Delete"),
        'declinecounter': gt("Reject changes"),
        'tentative': gt("Tentative"),
        'decline': gt("Decline"),
        'ignore': gt("Ignore")
    };

    var buttonClasses = {
        'accept': 'btn-success',
        'accept_and_replace': 'btn-primary',
        'accept_and_ignore_conflicts': 'btn-success',
        'accept_party_crasher': 'btn-primary',
        'create': 'pull-left btn-primary',
        'update': 'pull-left btn-primary',
        'delete': 'pull-left btn-primary',
        'declinecounter': 'pull-left btn-danger',
        'tentative': 'btn-warning',
        'decline': 'btn-danger',
        'ignore': ''
    };

    var success = {
        'accept': gt("You have accepted the appointment"),
        'accept_and_replace': gt("Changes have been saved"),
        'accept_and_ignore_conflicts': gt("You have accepted the appointment"),
        'accept_party_crasher': gt("Added the new participant"),
        'create': gt("You have accepted the appointment"),
        'update': gt("The appointment has been updated"),
        'delete': gt("The appointment has been deleted"),
        'declinecounter': gt("The changes have been rejected"),
        'tentative': gt("You have tentatively accepted the appointment"),
        'decline': gt("You have declined the appointment")
    };

    var successInternal = {
        1: gt("You have accepted the appointment"),
        2: gt("You have declined the appointment"),
        3: gt("You have tentatively accepted the appointment")
    };

    var priority = ['update', 'ignore', 'decline', 'tentative', 'accept', 'declinecounter', 'accept_and_replace', 'accept_and_ignore_conflicts', 'accept_party_crasher', 'create', 'delete'];



    function discoverIMipAttachment(baton) {
        return _(baton.data.attachments).find(function (attachment) {
            var match = attachment.content_type.match(regex);
            if (match && match[1].toLowerCase() !== "publish") {
                var index = match[1].indexOf(";");
                var method = index !== -1 ? match[1].substr(0, index) : match[1];
                method = method.toLowerCase();

                return method !== 'publish';
            }
            return false;
        });
    }

    function analyzeAttachment(baton) {
        return http.PUT({
            module: 'calendar/itip',
            params: {
                action: 'analyze',
                dataSource: 'com.openexchange.mail.ical',
                descriptionFormat: 'html',
                timezone: "UTC"
            },
            data: {
                "com.openexchange.mail.conversion.fullname": baton.data.folder_id,
                "com.openexchange.mail.conversion.mailid": baton.data.id,
                "com.openexchange.mail.conversion.sequenceid": baton.imip.attachment.id
            }
        });
    }

    function renderAnalysis($node, analysis, detailPoint, baton) {
        var replace = {
            content: function () {
                var $analysisNode;
                $node.append($analysisNode = $('<div class="io-ox-calendar-itip-analysis">'));
                // Annotations
                _(analysis.annotations).each(function (annotation) {
                    renderAnnotation($analysisNode, annotation, analysis, detailPoint, baton);
                });
                // Changes
                _(analysis.changes).each(function (change) {
                    renderChange($analysisNode, change, analysis, detailPoint, baton);
                });
            }
        };

        var appointments = [];

        _(analysis.annotations).each(function (annotation) {
            if (annotation.appointment) {
                appointments.push(annotation.appointment);
            }
        });

        _(analysis.changes).each(function (change) {
            var appointment = change.newAppointment || change.currentAppointment || change.deletedAppointment;
            if (appointment) {
                appointments.push(appointment);
            }
        });


        var after = {

            'inline-links': function () {

                if (analysis.actions.length === 1 && analysis.actions[0] === 'ignore') {
                    return;
                }

                var $well;

                $node.append(drawScaffold.call($well = drawWell()));

                $well.find('.itip-actions').addClass('block');

                _(priority).each(function (action) {
                    if (_(analysis.actions).contains(action)) {
                        $well.find('.itip-actions').append(
                            $('<button class="btn">')
                            .addClass(buttonClasses[action])
                            .text(i18n[action])
                            .on('click', function (e) {
                                e.preventDefault();
                                if (action === 'ignore') {
                                    deleteMailIfNeeded(baton);
                                }
                                http.PUT({
                                    module: 'calendar/itip',
                                    params: {
                                        action: action,
                                        dataSource: 'com.openexchange.mail.ical',
                                        descriptionFormat: 'html'
                                    },
                                    data: {
                                        "com.openexchange.mail.conversion.fullname": baton.data.folder_id,
                                        "com.openexchange.mail.conversion.mailid": baton.data.id,
                                        "com.openexchange.mail.conversion.sequenceid": baton.imip.attachment.id
                                    }
                                })
                                .done(function () {
                                    notifications.yell('success', success[action]);
                                    deleteMailIfNeeded(baton);
                                })
                                .fail(notifications.yell);
                            }),
                            '&nbsp;'
                        );
                    }
                });

                $well.find('.appointmentInfo').append(
                    _(appointments).map(function (appointment) {
                        var recurrenceString = util.getRecurrenceString(appointment);
                        return $("<div>").append(
                            $("<b>").text(appointment.title), $.txt(", "),
                            $("<span>").addClass("day").append(
                                $.txt(gt.noI18n(util.getDateInterval(appointment))),
                                $.txt(gt.noI18n((recurrenceString !== "" ? " \u2013 " + recurrenceString : "")))
                            )
                        );
                    })
                );

                _(analysis.changes).each(function (change) {
                    $well.find('.appointmentInfo').append(renderDiffDescription(change));
                });

                if (appointments.length === 0) {
                    $well.find(".muted").remove();
                }

                $well.show();
            }
        };


        baton.imip.analysis = analysis;

        // Let's remove the ITip Attachments
        baton.data.attachments = _(baton.data.attachments).filter(function (attachment) {
            return !(/\.ics$/).test(attachment.filename);
        });

        detailPoint.each(function (extension) {
            if (replace[extension.id]) {
                replace[extension.id]();
            } else {
                if (extension.drawInvitation) {
                    extension.invoke('drawInvitation', $node, baton);
                } else {
                    extension.invoke('draw', $node, baton);
                }
            }
            if (after[extension.id]) {
                after[extension.id]();
            }
        });


    }

    function renderAnnotation($node, annotation, analysis, detailPoint, baton) {
        $node.append(
            $('<div class="annotation">').append(
                $('<div class="message alert">').append(annotation.message),
                renderAppointment(annotation.appointment, baton, detailPoint)
            )
        );
    }

    function renderChange($node, change, analysis, detailPoint, baton) {
        $node.append(
            $('<div class="change">').append(
                renderConflicts(change),
                renderAppointment(change.newAppointment || change.currentAppointment || change.deletedAppointment, detailPoint, baton)
            )
        );
    }

    function renderAppointment(appointment, detailPoint, baton) {
        if (!appointment) {
            return $();
        }
        var node = $("<div>");
        require(["io.ox/calendar/view-detail"], function (viewDetail) {
            node.append(viewDetail.draw(appointment, {brief: true}));
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
        var $node = $("<div>");
        var text = gt.format(gt.ngettext('You already have %1$d appointment in this timeframe.',
            'You already have %1$d appointments in this timeframe.', change.conflicts.length), change.conflicts.length);

        $node.append($('<div class="alert alert-error">').append(text).append($('<a href="#">').text(gt(" Show"))).on("click", function (e) {
            e.preventDefault();

            require(["io.ox/calendar/conflicts/conflictList"], function (conflictList) {
                $node.find(".alert").remove();
                $node.append(
                    $('<div>').css({marginTop: "2em", marginBottom: "2em"}).append(
                        conflictList.drawList(change.conflicts)
                    )
                );
            });

        }));

        return $node;
    }

    function deleteMailIfNeeded(baton) {
        require(["io.ox/mail/api", "settings!io.ox/calendar"], function (api, settings) {
            if (settings.get("deleteInvitationMailAfterAction")) {
                api.remove([baton.data]);
            }
        });
    }

    ext.point("io.ox/mail/detail/alternatives").extend({
        index: 100,
        id: 'imip',
        accept: function (baton) {
            var imipAttachment = discoverIMipAttachment(baton);
            if (imipAttachment) {
                baton.imip = {
                    attachment: imipAttachment
                };
                return true;
            }
            return false;
        },
        draw: function (baton, detailPoint) {
            var $node = this;
            $node.busy();
            analyzeAttachment(baton).done(function (analysis) {
                $node.idle();
                _(analysis).each(function (a) {
                    renderAnalysis($node, a, detailPoint, baton);
                });
            });
        }
    });

    function drawWell() {
        return $('<div class="well io-ox-calendar-itip-analysis">').hide();
    }

    function drawScaffold() {
        return this.append(
            $('<div class="muted">').text(gt("This email contains an appointment")),
            $('<div class="appointmentInfo">'),
            $('<div class="itip-action-container">').css({ textAlign: 'right', marginTop: '1em' }).append(
                $('<div class="itip-actions">')
            )
        );
    }

    function loadAppointment(baton) {
        require(['io.ox/calendar/api', 'settings!io.ox/calendar'], function (api, settings) {
            api.get({ folder: baton.appointment.folder_id, id: baton.appointment.id }).then(
                function success(appointment) {
                    baton.appointment = appointment;
                    if (appointment.end_date > _.now()) {
                        drawAppointmentDetails(baton, api, settings);
                    }
                },
                function fail() {
                    // bad luck or most probably the appointment is deleted
                    baton.$.well.remove();
                }
            );
        });
    }

    function drawAppointmentDetails(baton, api, settings) {

        var defaultReminder = settings.get('defaultReminder', 15),
            reminderSelect = $(),
            recurrenceString = util.getRecurrenceString(baton.appointment);

        baton.$.well.find('.appointmentInfo').append(
            $("<b>").text(baton.appointment.title), $.txt(", "),
            $("<span>").addClass("day").append(
                $.txt(gt.noI18n(util.getDateInterval(baton.appointment))),
                $.txt(gt.noI18n((recurrenceString !== "" ? " \u2013 " + recurrenceString : "")))
            )
        );

        // 0 = none, 1 = accepted, 2 = declined, 3 = tentative
        var status = util.getConfirmationStatus(baton.appointment),
            accepted = status === 1,
            message = '', className = '', selector;

        if (status > 0) {
            switch (status) {
            case 1:
                message = gt('You have accepted this invitation');
                className = 'accepted';
                selector = 'button.btn-success';
                break;
            case 2:
                message = gt('You declined this invitation');
                className = 'declined';
                selector = 'button.btn-danger';
                break;
            case 3:
                message = gt('You tentatively accepted this invitation');
                className = 'tentative';
                selector = 'button.btn-warning';
                break;
            }
            baton.$.well.find('.appointmentInfo').append(
                $('<div class="confirmation-status">').addClass(className).text(message)
            );
        }

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
                        .append(function (i, html) {
                            var self = $(this),
                                options = util.getReminderOptions();
                            _(options).each(function (label, value) {
                                self.append($("<option>", {value: value}).text(label));
                            });
                        }).val(defaultReminder)
                    )
                )
            )
            .append(
                $('<button class="btn btn-danger" data-action="2">').text(gt("Decline")),
                "&nbsp;",
                $('<button class="btn btn-warning" data-action="3">').text(gt("Tentative")),
                "&nbsp;",
                $('<button class="btn btn-success" data-action="1">').text(gt("Accept"))
            )
            .on("click", "button", function (e) {

                baton.$.well.empty().busy();

                api.confirm({
                    folder: baton.appointment.folder_id,
                    id: baton.appointment.id,
                    data: {
                        confirmation: Number($(e.target).data("action"))
                    }
                })
                .done(function () {
                    if (!accepted) {
                        var reminder = parseInt(reminderSelect.find('select').val(), 10);
                        if (reminder !== defaultReminder) {
                            baton.appointment.alarm = reminder;
                            api.update(baton.appointment);
                        }
                    }
                    require(["io.ox/mail/api", "settings!io.ox/core/calendar"], function (api, settings) {
                        if (settings.get("deleteInvitationMailAfterAction")) {
                            // remove mail
                            notifications.yell('success', successInternal[Number($(e.target).data("action"))]);
                            api.remove([baton.data]);
                        } else {
                            // update well
                            drawScaffold.call(baton.$.well.idle());
                            loadAppointment(baton);
                        }
                    });
                })
                .fail(notifications.yell);
            });

            // disable button matching current status
            baton.$.well.find(selector).addClass('disabled').attr('disabled', 'disabled');
        }

        baton.$.well.show();
    }

    ext.point('io.ox/mail/detail').extend({
        index: 175,
        id: 'accept-decline',
        draw: function (baton) {

            var $well;

            if (baton.data.headers["X-OX-Reminder"] && baton.data.headers["X-Open-Xchange-Module"] === "Appointments") {

                this.append(
                    drawScaffold.call(baton.$.well = drawWell())
                );

                var address = baton.data.headers["X-OX-Reminder"].split(/,\s*/);
                baton.appointment = {
                    folder_id: address[1],
                    id: address[0]
                };

                require(['io.ox/calendar/util'], function (calendarUtil) {
                    util = calendarUtil;
                    loadAppointment(baton);
                });
            }
        }
    });

});
