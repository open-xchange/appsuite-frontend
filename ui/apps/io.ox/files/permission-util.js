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

define('io.ox/files/permission-util', [
    'io.ox/core/api/user',
    'io.ox/core/api/filestorage'
], function (userAPI, filestorageApi) {

    'use strict';

    return {

        // federated sharing: check if identifier belongs to an own subscribed account
        isOwnIdentity: function (identity) {
            return _.contains(filestorageApi.getAllGuestUserIdentifier(), identity);
        },

        // return first found user permission for the current user
        getOwnPermission: function (permissions) {
            var mySelf = [];

            // early out
            if (!permissions) { return mySelf; }

            // internal
            mySelf = _(permissions).findWhere({ entity: ox.user_id, group: false });

            // federated sharing: check if an identifer matches with the current user as fallback
            if (!mySelf) {
                mySelf = _.find(filestorageApi.getAllGuestUserIdentifier(), function (guetUserIdentifer) {
                    return _(permissions).findWhere({ identifier: guetUserIdentifer, group: false });
                });
            }

            return mySelf;
        },

        // return all found group permissions for the current user
        getOwnPermissionsFromGroup: function (permissions, groupsFromUser) {
            return permissions.filter(function (perm) {
                return perm.group === true && (_.contains(groupsFromUser, perm.entity)); // so far no case were an federated sharing identity could be used in a group
            });
        },

        hasObjectWritePermissions: function (data) {
            var self = this;
            var array = data.object_permissions || data['com.openexchange.share.extendedObjectPermissions'],
                myself = self.getOwnPermission(array);
            // check if there is a permission for a group, the user is a member of
            // use max permissions available
            if ((!myself || (myself && myself.bits < 2)) && _(array).findWhere({ group: true })) {
                return userAPI.get().then(
                    function (userData) {
                        myself = self.getOwnPermissionsFromGroup(array, userData.groups);
                        return myself.reduce(function (acc, perm) {
                            return acc || perm.bits >= 2;
                        }, false);
                    },
                    function () { return false; }
                );
            }

            return $.when(!!(myself && (myself.bits >= 2)));
        }
    };
});
