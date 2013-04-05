/**
 * All content on this website (including text, images, source
 * code and any other original works), unless otherwise noted,
 * is licensed under a Creative Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2011
 * Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/collection', ['io.ox/core/api/folder'], function (api) {

    'use strict';

    var unresolved = {},

        // helper
        getRight = function (folder, owner, offset) {
            // get bits
            var bits = api.derive.bits(folder, offset);
            // check
            if (bits === 0) {
                // no permissions
                return false;
            } else if (bits === 1) {
                // only own objects
                return owner === ox.user_id;
            } else {
                // all objects or admin
                return true;
            }
        },

        getFolderId = function (obj) {
            return obj ? obj.folder_id || obj.folder : undefined;
        },

        // get properties of object collection (async)
        getProperties = function (collection) {

            // selection length
            var $l = collection.length || 0,
                /**
                 * Property object
                 */
                props = {
                    'read': true,
                    'modify': true,
                    'delete': true,
                    'create': true,
                    'none': $l === 0,
                    'some': $l > 0,
                    'one': $l === 1,
                    'multiple': $l > 1
                },

                // get all folders first
                folders = _.chain(collection)
                    .map(getFolderId).compact().uniq().value();
            // mail specific: toplevel? (in contrast to nested mails)
            props.toplevel = _(collection).reduce(function (memo, item) {
                // nested mails don't have a folder_id but a filename
                return memo && 'folder_id' in item && !('filename' in item);
            }, true);

            if (folders.length === 0) {
                props.unknown = true;
                props.read = props.modify = props['delete'] = false;
                return $.Deferred().resolve(props);
            }

            return api.get({ folder: folders }).pipe(function (hash) {
                var i = 0, item = null, folder = null;
                for (; i < $l; i++) {
                    item = collection[i];
                    if ((folder = hash[getFolderId(item)])) {
                        // get properties
                        props.read = props.read && getRight(folder, item.created_by, 7); // read
                        props.modify = props.modify && getRight(folder, item.created_by, 14); // write
                        props['delete'] = props['delete'] && getRight(folder, item.created_by, 21); // delete
                        props.create = props.create && (folder.own_rights & 127) >= 2; // create new objects
                    } else {
                        // folder unknown
                        props.unknown = true;
                        props.read = props.modify = props['delete'] = props.create = false;
                        break;
                    }
                }
                return props;
            });
        };

    function Collection(list) {

        var items = _.compact([].concat(list)),
            properties = unresolved;

        // resolve properties (async).
        // Must be done upfront before 'has' checks for example
        this.getProperties = function () {
            return getProperties(items).always(function (props) {
                properties = props;
            });
        };

        this.isResolved = function () {
            return properties !== unresolved;
        };

        // avoid too large selections (just freezes browsers)
        this.isLarge = function () {
            return items.length >= 100;
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
    }

    // publish class
    return Collection;
});
