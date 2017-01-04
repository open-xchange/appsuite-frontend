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
    'io.ox/core/capabilities',
    'io.ox/contacts/api',
    'io.ox/core/api/user',
    'io.ox/mail/util',
    'io.ox/core/yell',
    'settings!io.ox/core',
    'gettext!io.ox/core'
], function (capabilities, contactAPI, userAPI, util, yell, settings, gt) {

    'use strict';

    var throbber = setTimeout(function () { ox.busy(true); }, 500);

    function idle() {
        clearTimeout(throbber);
        ox.idle();
    }

    function fetch(data) {
        return userAPI.get()
            .then(function (user) {
                // filter current user (is added automatically as organisator); filter msisdn;
                var useraddresses = _.compact([user.email1, user.email2, user.email3]);
                return _.chain([].concat(data.to, data.cc, data.from))
                    .compact()
                    .map(function (obj) { return obj[1]; })
                    .unique()
                    .reject(function (mail) { return _.contains(useraddresses, mail); })
                    .reject(function (mail) { return capabilities.has('msisdn') ? false : util.getChannel(mail, false) === 'phone'; })
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

    function launchCalendar(participants, title) {
        var data = { participants: participants, title: title, folder_id: settings.get('folder/calendar') };
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
                this.create(settings.get('folder/contacts'), { distribution_list: members, display_name: title });
            });
    }

    return {
        createAppointment: function (baton) {
            fetch(baton.data).then(function (/*contact, contact...*/) {
                // map contacts to participants and create new appointment
                var participants = [];
                _(arguments).each(function (contact) {
                    participants.push(
                        contact.internal_userid ?
                            { type: 1, id: contact.internal_userid } :
                            { type: 5, display_name: contact.display_name, mail: contact.email1 }
                    );
                });
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
