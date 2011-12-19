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

define("io.ox/core/api/folder",
    ["io.ox/core/http", "io.ox/core/cache"], function (http, cache) {

    "use strict";

    var // folder object cache
        folderCache = new cache.SimpleCache("folder", true),
        subFolderCache = new cache.SimpleCache("subfolder", true),

        // magic permission check
        perm = function (bits, offset) {
            return (bits >> offset) & (offset >= 28 ? 1 : 127);
        },

        // get single folder
        getFolder = function (opt, id) {
            // get cache
            var cache = opt.storage || folderCache;
            // cache miss?
            if (opt.cache === false || !cache.contains(id)) {
                // cache miss!
                return http.GET({
                        module: "folders",
                        params: {
                            action: "get",
                            id: id,
                            tree: "1"
                        }
                    })
                    .done(function (data, timestamp) {
                        // add to cache
                        cache.add(data.id, data);
                    })
                    .fail(function (error) {
                        console.error("folder.get", id, error);
                    });
            } else {
                // cache hit
                return $.Deferred().resolve(cache.get(id));
            }
        };

    return {

        get: function (options) {
            // options
            var opt = _.extend({
                    folder: "1",
                    event: false,
                    cache: true,
                    storage: null
                }, options || {}),
                // hash for fetching multiple folders
                hash = {};
            // get multiple folders at once?
            if (_.isArray(opt.folder)) {
                return $.when.apply(null,
                        _(opt.folder).map(function (id) {
                            // force success even if a single folder fails
                            var success = $.Deferred();
                            if (id !== undefined) {
                                getFolder(opt, id)
                                    .done(function (data) {
                                        hash[String(id)] = data;
                                    })
                                    .always(function () {
                                        success.resolve();
                                    });
                            } else {
                                // be robust against missing ids
                                success.resolve();
                            }
                            return success;
                        })
                    )
                    .pipe(function () {
                        return hash;
                    });
            } else {
                return getFolder(opt, opt.folder);
            }
        },

        derive: {

            bits: function (data, offset) {
                return perm(_.firstOf(data.own_rights, data, 0), offset || 0);
            }
        },

        folderCache: folderCache,

        subFolderCache: subFolderCache
    };
});