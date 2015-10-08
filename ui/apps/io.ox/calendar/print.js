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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/calendar/print', [
    'io.ox/core/print',
    'io.ox/calendar/api',
    'io.ox/calendar/util',
    'io.ox/contacts/util',
    'io.ox/core/api/user',
    'io.ox/core/api/group',
    'io.ox/core/api/resource',
    'io.ox/core/util',
    'gettext!io.ox/calendar'
], function (print, api, util, contactsUtil, userAPI, groupAPI, resourceAPI, coreUtil, gt) {

    'use strict';

    function injectInternalConfirmations(users, confirmations) {
        _(users).each(function (user) {
            var obj = confirmations[user.id] || {};
            user.status = obj.status || 0;
            user.comment = obj.comment || '';
            // polish display_name
            user.display_name = contactsUtil.getFullName(user);
        });
        return users;
    }

    function injectExternalConfirmations(contacts, confirmations) {
        _(contacts).each(function (contact) {
            var obj = confirmations[contact.mail] || {};
            contact.status = (obj && obj.status) || 0;
            contact.comment = (obj && obj.comment) || '';
            // fix missing display_name
            contact.display_name = contact.display_name ? contact.display_name + ' <' + contact.mail + '>' : contact.mail;
        });
        return contacts;
    }

    function injectResourceConfirmations(resources) {
        _(resources).each(function (resource) {
            resource.status = 1;
            resource.comment = '';
        });
        return resources;
    }

    function getConfirmationLists(internal, external, resources) {
        var states = { unconfirmed: [], accepted: [], declined: [], tentative: [] },
            // 0 = unconfirmed, 1 = accepted, 2 = declined, 3 = tentative
            map = { 0: 'unconfirmed', 1: 'accepted', 2: 'declined', 3: 'tentative' };
        _([].concat(internal, external, resources)).each(function (obj) {
            var state = map[obj.status] || 'unconfirmed';
            states[state].push(obj);
        });
        // sort by display_name
        _(states).each(function (list, state) {
            states[state] = _(list).sortBy('display_name');
        });
        return states;
    }

    function getString(list) {
        return _(list).map(function (obj) {
            return '<span class="person">' + _.escape(obj.display_name) + '</span>' +
                (obj.comment !== '' ? ' <i class="comment">&quot;' + _.escape(obj.comment) + '&quot;</i>' : '');
        }).join('\u00A0\u00A0\u2022\u00A0 ');
    }

    function getContent(data) {
        // soft-break long words (like long URLs)
        return coreUtil.breakableText($.trim(data.note));
    }

    function unify(data, userList, groupList, resourceList, externalContacts) {
        var usersInGroups = _.chain(groupList).pluck('members').flatten().uniq().value();
        return userAPI.getList(usersInGroups).pipe(function (resolvedUsers) {
            // inject confirmations
            var confirmations = util.getConfirmations(data),
                internal = injectInternalConfirmations([].concat(userList, resolvedUsers), confirmations),
                external = injectExternalConfirmations(externalContacts, confirmations),
                resources = injectResourceConfirmations(resourceList);
            // get lists per confirmation state
            var states = getConfirmationLists(internal, external, resources),
                numParticipants = _(states).reduce(function (sum, list) { return sum + list.length; }, 0);
            // return unified lists
            return {
                // lists
                internal: internal,
                external: external,
                resources: resources,
                // states
                unconfirmed: states.unconfirmed,
                accepted: states.accepted,
                declined: states.declined,
                tentative: states.tentative,
                // string
                strings: {
                    unconfirmed: getString(states.unconfirmed),
                    accepted: getString(states.accepted),
                    declined: getString(states.declined),
                    tentative: getString(states.tentative)
                },
                // flags
                numParticipants: numParticipants,
                hasUnconfirmed: states.unconfirmed.length > 0,
                hasAccepted: states.accepted.length > 0,
                hasDeclined: states.declined.length > 0,
                hasTentative: states.tentative.length > 0
            };
        });
    }

    function load(data) {

        var list = data.participants;

        // get internal users
        var users = _.chain(list)
            .filter(function (obj) { return obj.type === 1; })
            .map(function (obj) { return obj.id; })
            .value();
        // get user groups
        var groups = _.chain(list)
            .filter(function (obj) { return obj.type === 2; })
            .map(function (obj) { return { id: obj.id }; })
            .value();
        // get resources
        var resources = _.chain(list)
            .filter(function (obj) { return obj.type === 3; })
            .map(function (obj) { return { id: obj.id }; })
            .value();
        // get external participants
        var external = _.chain(list)
            .filter(function (obj) { return obj.type === 5; })
            .sortBy(function (obj) { return obj.mail; })
            .value();

        var fetchUsers = users.length ? userAPI.getList(users) : $.Deferred().resolve([]);

        return $.when(fetchUsers, groupAPI.getList(groups), resourceAPI.getList(resources))
            .pipe(function (userList, groupList, resourceList) {
                return unify(data, userList, groupList, resourceList, external);
            });
    }

    function getDate(data) {
        var recurrenceString = util.getRecurrenceString(data),
            date = util.getDateInterval(data);
        return date + (recurrenceString !== '' ? ' \u2013 ' + recurrenceString : '');
    }

    function getTime(data) {
        return util.getTimeInterval(data);
    }

    function process(data) {
        return load(data).pipe(function (unified) {
            return _.extend(unified, {
                original: data,
                subject: data.title,
                location: $.trim(data.location),
                content: getContent(data),
                date: getDate(data),
                time: getTime(data)
            });
        });
    }

    return {

        // publish this, can also be used to print tasks
        load: load,

        open: function (selection, win) {

            print.smart({

                get: function (obj) {
                    return api.get(obj);
                },

                title: selection.length === 1 ? selection[0].title : undefined,

                i18n: {
                    accepted: gt('Accepted'),
                    declined: gt('Declined'),
                    tentative: gt('Tentatively accepted'),
                    unconfirmed: gt('Unconfirmed')
                },

                process: process,
                selection: selection,
                selector: '.appointment',
                window: win
            });
        }
    };
});
