/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2020 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Jonas Regier <jonas.regier@open-xchange.com>
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
