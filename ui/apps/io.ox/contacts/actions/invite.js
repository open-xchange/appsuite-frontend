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
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/invite', [
    'io.ox/contacts/api',
    'io.ox/core/capabilities',
    'io.ox/calendar/util',
    'io.ox/contacts/util'
], function (api, capabilities, calendarUtil, util) {

    'use strict';

    return function (list) {
        var def = null,
            distLists = [];

        function mapContact(obj) {
            if (obj.distribution_list && obj.distribution_list.length) {
                distLists.push(obj);
                return;
            } else if ((obj.internal_userid || obj.user_id) && (obj.field === 'email1' || !obj.field)) {
                // internal user
                return { type: 1, user_id: obj.internal_userid || obj.user_id, display_name: obj.display_name, email1: obj.email1 };
            }
            // external user
            return { type: 5, display_name: obj.display_name, mail: obj[obj.field] || obj.mail || obj.email1 || obj.email2 || obj.email3 };
        }

        function filterContact(obj) {
            return obj.type === 1 || !!obj.mail;
        }

        function filterForDistlists(list) {
            var cleaned = [];
            _(list).each(function (single) {
                if (!single.mark_as_distributionlist) {
                    cleaned.push(single);
                } else {
                    distLists = distLists.concat(single.distribution_list || []);
                }
            });
            return cleaned;
        }

        // check for anonymous contacts
        if (list.length === 1 && (list[0].id === 0 || String(list[0].folder_id) === '0' || list[0].folder_id === null)) {
            var address = list[0].email1 || list[0].email2 || list[0].email3;
            def = $.Deferred().resolve([{ type: 5, mail: address }]);
        } else {

            def = api.getList(list, true, {
                check: function (obj) {
                    return obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3;
                }
            })
            .then(function (list) {
                // set participants
                var participants = _.chain(filterForDistlists(list)).map(mapContact).flatten(true).filter(filterContact).value(),
                    externalParticipants = [];

                distLists = _.union(distLists);
                //remove external participants without contact or they break the request
                _(distLists).each(function (participant) {
                    if (!participant.id) {
                        externalParticipants.push(participant);
                    }
                });
                distLists = _.difference(distLists, externalParticipants);
                distLists = util.validateDistributionList(distLists);

                return api.getList(distLists)
                    .then(function (obj) {
                        // make sure we use the mail address given in the distributionlist
                        obj = _(obj).map(function (contact, index) {
                            if (distLists[index].mail_field) {
                                contact.field = 'email' + distLists[index].mail_field;
                            }
                            return contact;
                        });
                        var resolvedContacts = _.chain([].concat(obj, externalParticipants))
                            .map(mapContact)
                            .flatten(true)
                            .filter(filterContact)
                            .value();
                        return participants.concat(resolvedContacts);
                    });

            });
        }

        def.done(function (participants) {

            require(['io.ox/calendar/edit/main', 'io.ox/core/folder/api'], function (m, folderAPI) {

                $.when(launchApp(), getDefaultFolder()).done(function (calendar, folderId) {
                    var app = calendar,
                        refDate = moment().startOf('hour').add(1, 'hours'),
                        attendees = _.map(participants, function (participant) {
                            return calendarUtil.createAttendee(participant);
                        });

                    app.create({
                        attendees: attendees,
                        folder: folderId,
                        startDate: { value: refDate.format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() },
                        endDate: { value: refDate.add(1, 'hours').format('YYYYMMDD[T]HHmmss'), tzid: refDate.tz() }
                    });
                });

                function getDefaultFolder() {
                    if (!capabilities.has('guest')) return folderAPI.getDefaultFolder('calendar');
                    // guest case
                    var alreadyFetched = folderAPI.getFlatCollection('calendar', 'shared').fetched;
                    return alreadyFetched ?
                        folderAPI.getFlatCollection('calendar', 'shared').models[0].get('id') :
                        folderAPI.flat({ module: 'calendar' }).then(function (sections) {
                            return (sections.shared[0] || {}).id;
                        });
                }

                function launchApp() {
                    return m.getApp().launch().then(function () { return this; });
                }
            });
        });

    };

});
