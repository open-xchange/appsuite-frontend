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
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
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
            if (response.birthday && moment.utc(response.birthday).local(true).year() === 1) {
                response.birthday = util.julianToGregorian(response.birthday);
            }
            return response;
        //we have an array of users
        } else {
            //convert birthdays with year 1 from julian to gregorian calendar
            _(response).each(function (contact) {
                //birthday without year
                if (contact.birthday && moment.utc(contact.birthday).local(true).year() === 1) {
                    contact.birthday = util.julianToGregorian(contact.birthday);
                }
            });
            return response;
        }
    };

    // generate basic API
    var api = apiFactory({
        module: 'user',
        keyGenerator: function (obj) {
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
                columns: '1,20,500,501,502,505,524,555,606,614',
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
    api.update =  function (o) {

        if (_.isEmpty(o.data)) return $.when();

        return require(['io.ox/contacts/api']).then(function (contactsApi) {
            //convert birthdays with year 1(birthdays without year) from gregorian to julian calendar
            if (o.data.birthday && moment.utc(o.data.birthday).local(true).year() === 1) {
                o.data.birthday = util.gregorianToJulian(o.data.birthday);
            }
            return http.PUT({
                module: 'user',
                params: {
                    action: 'update',
                    id: o.id,
                    folder: o.folder,
                    timestamp: o.timestamp || _.then()
                },
                data: o.data,
                appendColumns: false
            })
            .then(function () {
                // get updated contact
                return api.get({ id: o.id }, false).then(function (data) {
                    return $.when(
                        api.caches.get.add(data),
                        api.caches.all.clear(),
                        api.caches.list.remove({ id: o.id }),
                        // update contact caches
                        //no add here because this userdata not contactdata (similar but not equal)
                        contactsApi.caches.get.remove({ folder_id: data.folder_id, id: data.contact_id }),
                        contactsApi.caches.all.grepRemove(o.folder + contactsApi.DELIM),
                        contactsApi.caches.list.remove({ id: data.contact_id, folder: o.folder }),
                        contactsApi.clearFetchCache()
                    )
                    .then(function () {
                        return data;
                    })
                    .done(function () {
                        api.trigger('update:' + _.ecid(data), data);
                        api.trigger('update', data);
                        api.trigger('refresh.list');
                        // get new contact and trigger contact events
                        // skip this if GAB is missing
                        if (data.folder_id === 6 && capabilities.has('!gab')) return;
                        // fetch contact
                        contactsApi.get({ folder_id: data.folder_id, id: data.contact_id }).done(function (contactData) {
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
            ).pipe(function () {
                api.trigger('refresh.list');
                api.trigger('update', {
                    id: o.id
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
            .pipe(filter);
        } else {
            return http.FORM({
                module: 'user',
                action: 'update',
                form: file,
                data: changes,
                params: { id: o.id, folder: o.folder_id, timestamp: o.timestamp || _.then() }
            })
            .pipe(filter);
        }
    };

    /**
     * get user display name (or email if display name undefined)
     * @param {string} id of a user
     * @return { deferred} returns name string
     */
    api.getName = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.display_name || data.email1 || '');
        });
    };

    /**
     * get greeting ('Hello ...')
     * @param {string} id of a user
     * @return { deferred} returns greeting string
     */
    api.getGreeting = function (id) {
        return api.get({ id: id }).pipe(function (data) {
            return _.noI18n(data.first_name || data.display_name || data.email1 || '');
        });
    };

    /**
     * get text node which fetches user name asynchronously
     * @param {string} id of a user
     * @return { object} text node
     */
    api.getTextNode = function (id) {
        var node = document.createTextNode(_.noI18n(''));
        api.get({ id: id })
            .done(function (data) {
                node.nodeValue = _.noI18n(data.display_name || data.email1);
            })
            .always(function () {
                // use defer! otherwise we return null on cache hit
                _.defer(function () {
                    // don't leak
                    node = null;
                });
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
        text = text ? $.txt(_.noI18n(text)) : api.getTextNode(id);
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

    return api;
});
