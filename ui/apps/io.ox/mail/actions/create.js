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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 * @author Daniel Dickhaus <daniel.dickhaus@open-xchange.com>
 * @author Frank Paczynski <frank.paczynski@open-xchange.com>
 */

define('io.ox/mail/actions/create', [
    'io.ox/contacts/api',
    'io.ox/core/api/user',
    'io.ox/mail/util',
    'io.ox/core/yell',
    'settings!io.ox/core',
    'settings!io.ox/calendar',
    'gettext!io.ox/core',
    'io.ox/calendar/util'
], function (contactAPI, userAPI, util, yell, settings, calendarSettings, gt, calendarUtil) {

    'use strict';

    var throbber = setTimeout(function () { ox.busy(true); }, 500);

    function idle() {
        clearTimeout(throbber);
        ox.idle();
    }

    function fetch(data) {
        return userAPI.get()
            .then(function (user) {
                // filter current user (is added automatically as organisator);
                var useraddresses = _.compact([user.email1, user.email2, user.email3]);
                return _.chain([].concat(data.to, data.cc, data.from))
                    .compact()
                    .map(function (obj) { return obj[1]; })
                    .unique()
                    .reject(function (mail) { return _.contains(useraddresses, mail); })
                    .value();
            }).
            then(function (recipients) {
                // resolve data by mail
                var apiCalls = _(recipients).map(function (mail) {
                    return contactAPI.search(mail)
                        .then(function (list) {
                            // ensure minimal contact data
                            return list[0] || { email1: mail, display_name: mail, mail_field: 0 };
                        });
                });
                return $.when.apply($, apiCalls);
            })
            .fail(function () {
                idle();
                yell('error', gt('Error while resolving mail addresses. Please try again.'));
            });
    }

    function launchCalendar(attendees, title) {
        var refDate = moment().startOf('hour').add(1, 'hours'),
            data = {
                attendees: attendees,
                summary: title,
                folder_id: calendarSettings.get('chronos/defaultFolderId'),
                startDate: { value: refDate.format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() },
                endDate: { value: refDate.add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() }
            };

        ox.launch('io.ox/calendar/edit/main')
            .always(idle)
            .done(function () {
                this.create(data);
                // set dirty
                this.model.toSync = data;
            });
    }

    function launchContacts(members, title) {
        ox.launch('io.ox/contacts/distrib/main')
            .always(idle)
            .done(function () {
                this.create(settings.get('folder/contacts'), {
                    distribution_list: members,
                    display_name: title
                });
            });
    }

    return {
        createAppointment: function (baton) {
            fetch(baton.data).then(function (/*contact, contact...*/) {
                // map contacts to participants and create new appointment
                var participants = [];
                _(arguments).each(function (contact) {
                    // fuzzy check is ok here, internal_userid = 0 is reserved for external contacts
                    if (contact.internal_userid) {
                        contact.type = 1;
                        contact.user_id = contact.internal_userid;
                    } else {
                        contact.type = 5;
                        contact.mail = contact.email1;
                    }

                    participants.push(calendarUtil.createAttendee(contact));

                });
                console.log(baton.data.subject);
                launchCalendar(participants, baton.data.subject);
            });

        },
        createDistributionList: function (baton) {
            fetch(baton.data).then(function (/*contact, contact...*/) {
                // map contacts to members
                var members = [];
                _(arguments).each(function (contact) {
                    members.push(
                        contact.id ?
                            { id: contact.id, folder_id: contact.folder_id, display_name: contact.display_name, mail: contact.email1, mail_field: 1 } :
                            { type: 5, display_name: contact.display_name, mail: contact.email1 }
                    );
                });
                launchContacts(members, baton.data.subject);
            });

        }
    };
});
