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

define("io.ox/core/collection",
    ["io.ox/core/config", "io.ox/core/api/folder"], function (config, api) {

    "use strict";

    var myself = 0,

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
                myself = myself || config.get("identifier");
                return owner === myself;
            } else {
                // all objects or admin
                return true;
            }
        },

        // get properties of object collection (async)
        getProperties = function (collection) {

            // selection length
            var $l = collection.length || 0,
                /**
                 * Property object
                 */
                props = {
                    "read": true,
                    "modify": true,
                    "delete": true,
                    "none": $l === 0,
                    "some": $l > 0,
                    "one": $l === 1,
                    "multiple": $l > 1
                };

            // get all folders first
            var folders = _(collection)
                .chain()
                .map(function (item) {
                    // is app?
                    if (_.isObject(item.folder) && _.isFunction(item.folder.get)) {
                        return item.folder.get();
                    } else {
                        return item.folder_id || item.folder;
                    }
                })
                .filter(function (item) {
                    return item !== null && item !== undefined;
                })
                .value();

            return api.get({ folder: folders })
                .done(function (hash) {
                    var i = 0, item = null, folder = null;
                    for (; i < $l; i++) {
                        item = collection[i];
                        if ((folder = hash[item.folder_id || item.folder])) {
                            // get properties
                            props.read = props.read && getRight(folder, item.created_by, 7); // read
                            props.modify = props.modify && getRight(folder, item.created_by, 14); // write
                            props["delete"] = props["delete"] && getRight(folder, item.created_by, 21); // delete
                        } else {
                            // folder unknown
                            props.unknown = true;
                            props.read = false;
                            props.modify = false;
                            props["delete"] = false;
                            break;
                        }
                    }
                })
                .pipe(function () {
                    return props;
                });
        };

    function Collection(list) {

        var items = _.compact([].concat(list)),
            properties = {};

        // resolve properties (async).
        // Must be done upfront before "has" checks for example
        this.getProperties = function () {
            return getProperties(items)
                .done(function (props) {
                    properties = props;
                });
        };

        // check if collection satisfies a set of properties
        // e.g. has("some") or has("one", "read")
        this.has = function () {
            return _(arguments).inject(function (memo, key) {
                    return memo && properties[key] === true;
                }, true);
        };
    }

    // publish class
    return Collection;
});