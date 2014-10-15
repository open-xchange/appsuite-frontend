/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2013 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Christoph Hellweg <christoph.hellweg@open-xchange.com>
 */

define('io.ox/contacts/actions/invite', [
    'io.ox/contacts/api'
], function (api) {

    'use strict';

    return function (list) {
        var distLists = [];

        function mapContact(obj) {
            if (obj.distribution_list && obj.distribution_list.length) {
                distLists.push(obj);
                return;
            } else if (obj.internal_userid || obj.user_id) {
                // internal user
                return { type: 1, id: obj.internal_userid || obj.user_id };
            } else {
                // external user
                return { type: 5, display_name: obj.display_name, mail: obj.mail || obj.email1 || obj.email2 || obj.email3 };
            }
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
                    distLists = distLists.concat(single.distribution_list);
                }
            });
            return cleaned;
        }

        api.getList(list, true, {
            check: function (obj) {
                return obj.mark_as_distributionlist || obj.internal_userid || obj.email1 || obj.email2 || obj.email3;
            }
        }).done(function (list) {
            // set participants
            var def = $.Deferred(),
                resolvedContacts = [],
                cleanedList = filterForDistlists(list),
                participants = _.chain(cleanedList).map(mapContact).flatten(true).filter(filterContact).value();

            distLists = _.union(distLists);
            //remove external participants without contact or they break the request
            var externalParticipants = [];
            _(distLists).each(function (participant) {
                if (!participant.id) {
                    externalParticipants.push(participant);
                }
            });
            distLists = _.difference(distLists, externalParticipants);

            api.getList(distLists).done(function (obj) {
                resolvedContacts = resolvedContacts.concat(obj, externalParticipants);//put everyone back in
                def.resolve();
            });

            // open app
            def.done(function () {
                resolvedContacts = _.chain(resolvedContacts).map(mapContact).flatten(true).filter(filterContact).value();

                participants = participants.concat(resolvedContacts);

                require(['io.ox/calendar/edit/main', 'settings!io.ox/core'], function (m, coreSettings) {
                    m.getApp().launch().done(function () {
                        this.create({ participants: participants, folder_id: coreSettings.get('folder/calendar') });
                    });
                });
            });

        });
    };

});
