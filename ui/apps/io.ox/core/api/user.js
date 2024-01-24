/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/core/api/user', [
    'io.ox/core/http',
    'io.ox/core/api/factory',
    'io.ox/contacts/util',
    'io.ox/core/capabilities'
], function (http, apiFactory, util, capabilities) {

    'use strict';

    //helper function

    var convertResponseToGregorian = function (response) {
        //we have only one user
        if (response.id) {
            //convert birthdays with year 1 from julian to gregorian calendar
            if (response.birthday && moment.utc(response.birthday).local(true).year() <= 1) {
                response.birthday = util.julianToGregorian(response.birthday);
            }
            //convert anniversaries with year 1 from julian to gregorian calendar
            if (response.anniversary && moment.utc(response.anniversary).local(true).year() <= 1) {
                response.anniversary = util.julianToGregorian(response.anniversary);
            }
            return response;
        }
        //we have an array of users
        //convert birthdays with year 1 from julian to gregorian calendar
        _(response).each(function (contact) {
            //birthday without year
            if (contact.birthday && moment.utc(contact.birthday).local(true).year() <= 1) {
                contact.birthday = util.julianToGregorian(contact.birthday);
            }
            //convert anniversaries with year 1 from julian to gregorian calendar
            if (response.anniversary && moment.utc(response.anniversary).local(true).year() <= 1) {
                response.anniversary = util.julianToGregorian(response.anniversary);
            }
        });
        return response;
    };

    // generate basic API
    var api = apiFactory({
        module: 'user',
        keyGenerator: function (obj) {
            // if this is already a string or number, where done, if this is an object, use the id parameter. May happen when a list request uses array of ids instead of array of objects with ids
            if (typeof obj === 'string' || typeof obj === 'number') return obj;
            return String(obj.id);
        },
        requests: {
            all: {
                columns: '1,20,500',
                extendColumns: 'io.ox/core/api/user/all',
                // display_name
                sort: '500',
                order: 'asc'
            },
            list: {
                action: 'list',
                columns: '1,20,500,501,502,505,524,555,606,614,616',
                extendColumns: 'io.ox/core/api/user/list'
            },
            get: {
                action: 'get'
            },
            search: {
                action: 'search',
                columns: '1,20,500,524',
                extendColumns: 'io.ox/core/api/user/search',
                sort: '500',
                order: 'asc',
                getData: function (query) {
                    return { pattern: query };
                }
            }
        },
        pipe: {
            get: convertResponseToGregorian,
            search: convertResponseToGregorian
        }
    });

    // use rampup data
    if (ox.rampup.user && ox.rampup.user.id === ox.user_id) {
        api.caches.get.add(ox.rampup.user);
        api.caches.list.add(ox.rampup.user);
    }

    /**
     * update user attributes
     * @param  {object} o (o.data contains key/values of changed attributes)
     * @fires  api#update: + id
     * @fires  api#update, (id)
     * @fires  api#refresh.list
     * @return { deferred} done returns object with timestamp, data
     */
    api.update = function (o) {
        if (_.isEmpty(o.data)) return $.when();

        return require(['io.ox/contacts/api']).then(function (contactsApi) {
            //convert birthdays with year 1(birthdays without year) from gregorian to julian calendar
            if (o.data.birthday && moment.utc(o.data.birthday).local(true).year() <= 1) {
                o.data.birthday = util.gregorianToJulian(o.data.birthday);
            }
            //convert anniversaries with year 1(birthdays without year) from gregorian to julian calendar
            if (o.data.anniversary && moment.utc(o.data.anniversary).local(true).year() <= 1) {
                o.data.anniversary = util.gregorianToJulian(o.data.anniversary);
            }

            // remove empty values before updating
            o.data = _(o.data).each(function (value, key) {
                if (value === '' || value === undefined) {
                    o.data[key] = null;
                }
            });

            return http.PUT({
                module: 'user',
                params: {
                    action: 'update',
                    id: o.id,
                    timestamp: o.timestamp || _.then()
                },
                data: o.data,
                appendColumns: false
            })
            .then(function () {
                // get updated contact
                return api.get({ id: o.id }, false).then(function (data) {
                    // contacts api needs prefix
                    var contactsFolder = 'con://0/' + data.folder_id;
                    return $.when(
                        api.caches.get.add(data),
                        api.caches.all.clear(),
                        api.caches.list.remove({ id: o.id }),
                        // update contact caches
                        // no add here because this is user data not contact data (similar but not equal)
                        contactsApi.caches.get.remove({ folder_id: contactsFolder, id: data.contact_id }),
                        contactsApi.caches.all.grepRemove(contactsFolder + contactsApi.DELIM),
                        contactsApi.caches.list.remove({ id: data.contact_id, folder: contactsFolder }),
                        contactsApi.clearFetchCache()
                    )
                    .then(function () {
                        return data;
                    })
                    .done(function () {
                        api.trigger('update:' + _.ecid(data), data);
                        api.trigger('update', data);
                        api.trigger('refresh.list');
                        // reset image?
                        if (o.data.image1 === null) {
                            // to clear picture halo's cache
                            contactsApi.trigger('update:image', data);
                            api.trigger('reset:image reset:image:' + o.id, { id: o.id });
                        }
                        // get new contact and trigger contact events
                        // skip this if GAB is missing
                        if (String(data.folder_id) === util.getGabId(true) && capabilities.has('!gab')) return;
                        // fetch contact
                        contactsApi.get({ folder_id: contactsFolder, id: data.contact_id }).done(function (contactData) {
                            contactsApi.trigger('update:' + _.ecid(contactData), contactData);
                            contactsApi.trigger('update', contactData);
                        });
                    });
                });
            });
        });
    };

    /**
     * update user image (and properties)
     * @param  {object} o (id and folder_id)
     * @param  {object} changes (target values)
     * @param  {object} file
     * @fires  api#refresh.list
     * @fires  api#update ({id })
     * @return { deferred} object with timestamp
     */
    api.editNewImage = function (o, changes, file) {
        var filter = function (data) {
            $.when(
                api.caches.get.clear(),
                api.caches.all.clear(),
                api.caches.list.clear()
            )
            .then(function () {
                api.trigger('refresh.list');
                require(['io.ox/contacts/api']).then(function (contactsApi) {
                    contactsApi.trigger('update:image', { id: o.id });
                    api.trigger('update update:image update:image:' + o.id, { id: o.id });
                });
            });

            return data;
        };

        if ('FormData' in window && file instanceof window.File) {
            var form = new FormData();
            form.append('file', file);
            form.append('json', JSON.stringify(changes));

            return http.UPLOAD({
                module: 'user',
                params: { action: 'update', id: o.id, timestamp: o.timestamp || _.then() },
                data: form,
                fixPost: true
            })
            .then(filter);
        }
        return http.FORM({
            module: 'user',
            action: 'update',
            form: file,
            data: changes,
            params: { id: o.id, folder: o.folder_id, timestamp: o.timestamp || _.then() }
        })
        .then(filter);
    };

    /**
     * get user display name (or email if display name undefined)
     * @param {string} id of a user
     * @return { deferred} returns name string
     */
    api.getName = function (id) {
        return api.get({ id: id }).then(function (data) {
            return data.display_name || data.email1 || '';
        });
    };

    /**
     * get greeting ('Hello ...')
     * @param {string} id of a user
     * @return { deferred} returns greeting string
     */
    api.getGreeting = function (id) {
        return api.get({ id: id }).then(function (data) {
            return data.first_name || data.display_name || data.email1 || '';
        });
    };

    /**
     * get text node which fetches user name asynchronously
     * @param {string} id of a user
     * @return { object} text node
     */
    api.getTextNode = function (id, options) {
        var opt = _.extend({ type: 'name', textZoom: true }, options),
            node = opt.node || document.createTextNode('');
        api.get({ id: id })
            .done(function (data) {
                var name = '';
                if (opt.type === 'name') name = data.display_name || data.email1;
                else if (opt.type === 'email') name = data.email1 || data.display_name;
                else if (opt.type === 'email-localpart') name = (data.email1 || data.display_name || '').replace(/@.*$/, '');
                else if (opt.type === 'initials') name = util.getInitials(data);
                if (opt.textZoom) {
                    node.nodeValue = name;
                    return;
                }
                $(node).replaceWith('<svg viewbox="0 0 48 48"><text x="24" y="30" text-anchor="middle">' + _.escape(name) + '</text></svg>');
            });
        return node;
    };

    /**
     * get halo text link
     * @param {string} id of a user
     * @param  {string} text [optional]
     * @return { jquery} textlink node
     */
    api.getLink = function (id, text) {
        text = text ? $.txt(text) : api.getTextNode(id);
        return $('<a href="#" class="halo-link">').append(text).data({ internal_userid: id });
    };

    /**
     * get a contact model of the currently logged in user
     * @return { object} a contact model of the current user
     */
    api.getCurrentUser = function () {
        return require(['io.ox/core/settings/user']).then(function (api) {
            return api.getCurrentUser();
        });
    };

    // auto-inject user_id to guarantee client-side caching
    var getUser = api.get;
    api.get = function () {
        // no arguments, empty object or no id
        if (!arguments.length || _.isEmpty(arguments) || (_.isObject(arguments[0]) && arguments[0].id === undefined)) return getUser({ id: ox.user_id });
        return getUser.apply(this, arguments);
    };

    var currentUserChanged = false;
    // make sure this is fast (then vs pipe)
    api.me = function () {
        return ox.rampup.user && !currentUserChanged ? $.when(ox.rampup.user) : api.get();
    };

    // reload account API if current user gets changed
    api.on('update:' + _.ecid({ folder_id: 6, id: ox.user_id }), function () {
        // current user was changed, do not use the rampup data anymore
        currentUserChanged = true;
        require(['io.ox/core/api/account'], function (accountAPI) {
            accountAPI.reload().then(function () {
                // Trigger an update of the primary account (displayname might be updated). This updates the mails sender collection
                ox.trigger('account:update', 0);

            });
        });
    });

    // helper functions for federated sharing (sharing from other appsuites or contexts)

    // helper function to get usernames from objects with modified/created_from columns (folders files etc). uses modified/created_by as fallback
    // type should be "created" or "modified", default is created
    // data is the object containing the created_by or modified_by attributes
    api.getNameExtended = function (data, type) {
        if (data === undefined) return $.Deferred().reject({ error: 'Unknown User' });

        // support model and attributes object
        data = data.get ? data.attributes : data;
        type = type || 'created';

        // try extended data first (no need to request data from the server)
        var userData = data[type + '_from'],
            name = api.checkForName(userData);

        if (name) return $.when(name);

        // try to get name via user id second, handles also cases when no created/modified _by/_from are provided by the backend
        userData = data[type + '_by'] === 0 && userData && api.isMyself(userData) ? ox.user_id : data[type + '_by'];

        if (userData) return api.getName(userData);

        return $.Deferred().reject({ error: 'Unknown User' });
    };

    // creates a text node and fills it with a display name (inserting the name may be asynchronous if it has to be requested first)
    api.getTextNodeExtended = function (data, type) {
        if (data === undefined) return '';

        // support model and attributes object
        data = data.get ? data.attributes : data;
        type = type || 'created';

        var node = document.createTextNode(''),
            // try extended data first (no need to request data from the server)
            userData = data[type + '_from'],
            name = api.checkForName(userData);

        if (name) {
            node.nodeValue = name;
            return node;
        }

        // try to get name via user id second, handles also cases when no created/modified _by/_from are provided by the backend
        userData = data[type + '_by'] === 0 && userData && api.isMyself(userData) ? ox.user_id : data[type + '_by'];

        if (userData) api.getTextNode(userData, { node: node });

        return node;
    };

    // extendedProperty is either created_from or created by
    api.isMyself = function (extendedProperty) {
        // object was created in this context, so entity or identifier matches user id
        if (extendedProperty.entity === ox.user_id || extendedProperty.identifier === String(ox.user_id)) return true;
        // object was not created in this context but we might have created/modified this as a guest (federated sharing)
        // is there a way to get the primary mail address in a synchronous way without rampup
        if (extendedProperty.type === 'guest' && extendedProperty.contact && ox.rampup && ox.rampup.user && extendedProperty.contact.email1 === ox.rampup.user.email1) return true;
        return false;
    };

    // helper to find the first usable name, uses contact util for language specific formats (lastname, firstname | firstname lastname etc)
    api.checkForName = function (userData) {
        if (!userData) return;
        // try to get name via contact data
        var result = _.isEmpty(userData.contact) ? userData.display_name : util.getFullName(userData.contact);
        // display name as Fallback
        if (!result && userData.displayName) result = userData.displayName;
        // mail address as fallback if not myself
        if (!result && !api.isMyself(userData) && userData.contact && userData.contact.email1) result = userData.contact.email1;
        return result;
    };

    return api;
});
