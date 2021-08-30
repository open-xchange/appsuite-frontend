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

define('io.ox/core/collection', [
    'io.ox/core/folder/api',
    'io.ox/core/folder/util',
    'io.ox/core/api/user'
], function (api, util, userAPI) {

    'use strict';

    // helper
    var getRight = function (folder, owner, offset) {
            // no folder, no permissions
            if (!folder) return false;

            // get bits
            var bits = api.bits(folder, offset);
            // check
            if (bits === 0) {
                // no permissions
                return false;
            } else if (bits === 1) {
                // only own objects
                return owner === ox.user_id;
            }
            // all objects or admin
            return true;
        },

        isFolder = function (obj) {
            return 'standard_folder' in obj || obj.folder_id === 'folder';
        },

        getFolderId = function (obj) {
            if (!_.isObject(obj)) return undefined;
            if (isFolder(obj)) return obj.id;
            return obj.folder_id || obj.folder;
        },

        // get properties of object collection (async)
        getProperties = function (collection) {

            // selection length
            var $l = collection.length || 0,
                /**
                 * Property object
                 */
                props = {
                    // item permissions
                    'read': true,
                    'modify': true,
                    'delete': true,
                    'create': true,
                    // folder permissions
                    'create:folder': true,
                    'rename:folder': true,
                    'delete:folder': true,
                    // special
                    'change:seen': true,
                    // quantity
                    'none': $l === 0,
                    'some': $l > 0,
                    'one': $l === 1,
                    'multiple': $l > 1,
                    // quality
                    'items': false,
                    'folders': false,
                    'mixed': false,
                    // guard
                    'guard': false
                },

                // get all folders first
                folders = _.chain(collection).map(getFolderId).compact().uniq().value();

            // mail specific: toplevel? (in contrast to nested mails)
            props.toplevel = _(collection).reduce(function (memo, item) {
                // nested mails don't have a folder_id but a filename
                return memo && 'folder_id' in item && !('filename' in item);
            }, true);

            if (folders.length === 0) {
                props.unknown = true;
                'read modify delete create:folder rename:folder delete:folder change:seen'.split(' ').forEach(function (id) {
                    props[id] = false;
                });
                return $.when(props);
            }

            function findUserPermissions(item, userData) {
                // see if user has direct permission or as a member of a group
                return (item.group === false && item.entity === ox.user_id) || (item.group === true && _(userData.groups).contains(item.entity));
            }

            // pipe/then
            return $.when(api.multiple(folders), userAPI.me()).pipe(function (array, userData) {

                var i = 0, item = null, folder = null, hash = _.toHash(array, 'id'), folders = false, items = false, objectPermission;

                for (; i < $l; i++) {

                    item = collection[i];
                    objectPermission = item && item.object_permissions && _(item.object_permissions).find(function (item) {
                        return findUserPermissions(item, userData);
                    });
                    folder = hash[getFolderId(item)];

                    // Check for Guard files or folders
                    if (item.meta && item.meta.Encrypted) props.guard = true;

                    if (isFolder(item)) {

                        // use fresh data from multiple() request
                        if (item.own_rights === undefined) item = hash[item.id];

                        folders = true;
                        props['create:folder'] = props['create:folder'] && api.can('create:folder', item);
                        props['rename:folder'] = props['rename:folder'] && api.can('rename:folder', item);
                        props['delete:folder'] = props['delete:folder'] && api.can('delete:folder', item);
                        props['change:seen'] = props['change:seen'] && api.can('change:seen', item);
                        // we unify delete; otherwise the action checks are too complicated
                        props.delete = props.delete && api.can('delete:folder', item);

                    } else if (objectPermission || folder) {

                        // get properties
                        items = true;
                        // calendar items use an object here instead of a simple number
                        var created_by = item.createdBy && item.createdBy.entity ? item.createdBy.entity : item.created_by;

                        // bug #52825, check if permission is granted by the folder or by the object
                        props.read = props.read && ((objectPermission && objectPermission.bits >= 1) || getRight(folder, created_by, 7));
                        props.modify = props.modify && ((objectPermission && objectPermission.bits >= 2) || getRight(folder, created_by, 14));
                        props.delete = props.delete && ((objectPermission && objectPermission.bits >= 4) || getRight(folder, created_by, 21));

                        if (folder) {
                            // create new objects
                            props.create = props.create && (folder.own_rights & 127) >= 2;
                        }

                        // no bidirectional sync for subscribed folders (Bug 62440, MW-1133)
                        if (util.is('subscribed', folder)) {
                            props.modify = props.delete = props.create = false;
                        }
                    } else {
                        // folder unknown
                        props.unknown = true;
                        props.read = props.modify = props.delete = props.create = props['change:seen'] = false;
                        break;
                    }
                }

                if (!folders) {
                    'create:folder rename:folder'.split(' ').forEach(function (id) {
                        props[id] = false;
                    });
                }

                if (!items) {
                    'create read modify'.split(' ').forEach(function (id) {
                        props[id] = false;
                    });
                }

                // items and folders are exclusive,
                // so it's EITHER items OR folders OR mixed
                props.items = items && !folders;
                props.folders = folders && !items;
                props.mixed = folders && items;

                return props;
            });
        };

    function Collection(list) {

        var items = _.compact([].concat(list)),
            properties = {},
            resolved = false;

        // resolve properties (async).
        // Must be done upfront before 'has' checks for example
        this.getProperties = function () {
            return getProperties(items).always(function (props) {
                _.extend(properties, props);
                resolved = true;
            });
        };

        this.getPromise = function () {
            return this.getProperties().pipe(_.identity.bind(null, this));
        };

        this.isResolved = function () {
            return resolved;
        };

        // avoid too large selections (just freezes browsers)
        this.isLarge = function () {
            return items.length >= 100;
        };

        // for debugging
        this.toJSON = function () {
            return properties;
        };

        // check if collection satisfies a set of properties
        // e.g. has('some') or has('one', 'read')
        this.has = function () {
            if (!this.isResolved()) {
                console.error('Using Collection.has before properties are resolved!', list, arguments);
            }
            return _(arguments).inject(function (memo, key) {
                return memo && properties[key] === true;
            }, true);
        };

        this.matches = createMatches(properties);
    }

    Collection.Simple = function (items) {

        var l = items.length,
            properties = { none: l === 0, some: l > 0, one: l === 1, multiple: l > 1 };

        this.matches = createMatches(properties);

        this.getPromise = function () { return $.when(this); };

        // backward compatibility
        this.has = function () {
            return _(arguments).inject(function (memo, key) {
                return memo && properties[key] === true;
            }, true);
        };
    };

    function createMatches(properties) {
        return _.memoize(function (str) {
            var condition = String(str || '').replace(/[a-z:]+/ig, function (match) {
                return !!properties[match.toLowerCase()];
            });
            try {
                /*eslint no-new-func: 0*/
                return new Function('return !!(' + condition + ')')();
            } catch (e) {
                console.error('Collection.matches', condition, e);
                return false;
            }
        });
    }

    // publish class
    return Collection;
});
