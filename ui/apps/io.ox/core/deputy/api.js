/*
 *
 * @copyright Copyright (c) OX Software GmbH, Germany <info@open-xchange.com>
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

define('io.ox/core/deputy/api', [
    'io.ox/core/http',
    'io.ox/core/api/user',
    'io.ox/contacts/util'
], function (http, userAPI, util) {

    'use strict';

    // simple caches for requests used in mail compose.
    var granteeAddressCache = [],
        granteeAddressFolderCache = {};

    var api = {
        getAll: function () {
            return http.GET({
                module: 'deputy',
                params: {
                    action: 'all'
                }
            });
        },
        create: function (model) {
            var params =  _.clone(model.attributes);
            delete params.userData;
            return http.PUT({
                module: 'deputy',
                params: {
                    action: 'new'
                },
                data: params
            }).done(function () {
                ox.trigger('please:refresh');
            });
        },
        remove: function (model) {
            return http.PUT({
                module: 'deputy',
                params: {
                    action: 'delete',
                    deputyId: model.get('deputyId')
                }
            }).done(function () {
                ox.trigger('please:refresh');
            });
        },
        update: function (model) {
            var params =  _.clone(model.attributes);
            delete params.userData;
            return http.PUT({
                module: 'deputy',
                params: {
                    action: 'update',
                    deputyId: model.get('deputyId')
                },
                data: params
            }).done(function () {
                ox.trigger('please:refresh');
            });
        },
        // returns deputy data where the current user is deputy
        reverse: function () {
            return http.GET({
                module: 'deputy',
                params: {
                    action: 'reverse'
                }
            });
        },

        // utility function that returns a list of senders, that granted deputy rights to the current user, with "allowed to send mails" permissions
        getGranteeAddresses: function (useCache) {
            useCache = useCache || true;
            var def = $.Deferred();

            if (useCache && granteeAddressCache.length) return def.resolve(granteeAddressCache);

            def.then(function (result) {
                granteeAddressCache = result;
                return result;
            });

            // ignore errors, just send an empty array then
            api.reverse(useCache).then(function (grantedPermissions) {
                var addresses = _(grantedPermissions).chain().map(function (deputyData) {
                    // can there be more than one address?
                    return deputyData.granteeAddresses ? [deputyData.granteeId, deputyData.granteeAddresses[0]] : undefined;
                }).compact().valueOf();

                var userIds = _(addresses).chain().map(function (address) { return address[0]; }).uniq().compact().valueOf();

                userAPI.getList(userIds).then(function (users) {
                    _(addresses).each(function (address) {
                        address[0] = util.getDisplayName(_(users).findWhere({ id: address[0] }));
                    });
                    def.resolve(addresses);
                }, function () {
                    def.resolve([]);
                });
                return def;
            }, function () {
                def.resolve([]);
            });

            return def;
        },

        // utility function that returns the mail address from a folder you are allowed to send mails from as a deputy
        getGranteeAddressFromFolder: function (id, useCache) {
            useCache = useCache || true;
            if (!id) return $.when([]);
            var def = $.Deferred();

            if (useCache && granteeAddressFolderCache[id]) return def.resolve(granteeAddressFolderCache[id]);

            def.then(function (result) {
                granteeAddressFolderCache[id] = result;
                return result;
            });

            // ignore errors, just send an empty array then
            api.reverse().then(function (grantedPermissions) {
                var deputyData = _(grantedPermissions).find(function (data) {
                    return data.sendOnBehalfOf && data.modulePermissions && data.modulePermissions.mail && _(data.modulePermissions.mail.folderIds).contains(id);
                });

                // no fitting mail address for this folder
                if (!deputyData) return def.resolve([]);

                userAPI.get({ id: deputyData.granteeId }).then(function (user) {
                    def.resolve([util.getDisplayName(user), deputyData.granteeAddresses[0]]);
                }, function () {
                    def.resolve([]);
                });
                return def;
            }, function () {
                def.resolve([]);
            });

            return def;
        }
    };

    // clear caches on refresh
    ox.on('refresh^', function () {
        granteeAddressCache = [];
        granteeAddressFolderCache = {};
    });


    return api;
});
