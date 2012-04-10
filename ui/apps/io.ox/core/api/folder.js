/**
 * All content on this website (including text, images, source code and any
 * other original works), unless otherwise noted, is licensed under a Creative
 * Commons License.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * Copyright (C) Open-Xchange Inc., 2006-2012 Mail: info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/folder',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'io.ox/core/config',
     'io.ox/core/event'], function (http, cache, config, Events) {

    'use strict';

    var // folder object cache
        folderCache = new cache.SimpleCache('folder', true),
        subFolderCache = new cache.SimpleCache('subfolder', true),

        // magic permission check
        perm = function (bits, offset) {
            return (bits >> offset) & (offset >= 28 ? 1 : 127);
        },

        // get single folder
        getFolder = function (id, opt) {
            // get cache
            opt = opt || {};
            var cache = opt.storage || folderCache;
            // cache miss?
            var getter = function () {
                return http.GET({
                    module: 'folders',
                    params: {
                        action: 'get',
                        id: id,
                        tree: '1'
                    }
                })
                .done(function (data, timestamp) {
                    // add to cache
                    cache.add(data.id, data);
                })
                .fail(function (error) {
                    console.error('folder.get', id, error);
                });
            };
            if (opt.cache === false) {
                return getter();
            } else {
                return cache.contains(id).pipe(function (check) {
                    if (check) {
                        return cache.get(id);
                    } else {
                        return getter();
                    }
                });
            }
        };

    var api = {

        get: function (options) {
            // options
            var opt = _.extend({
                folder: '1',
                event: false,
                cache: true,
                storage: null
            }, options || {}),
            // hash for fetching multiple folders
            hash = {};
            // get multiple folders at once?
            if (_.isArray(opt.folder)) {
                return $.when.apply(
                    null,
                    _(opt.folder).map(function (id) {
                        // force success even if a single folder fails
                        var success = $.Deferred();
                        if (id !== undefined) {
                            getFolder(id, opt)
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
                return getFolder(opt.folder, opt);
            }
        },

        getSubFolders: function (options) {
            // options
            var opt = _.extend({
                folder: '1',
                all: false,
                event: false,
                cache: true,
                storage: null
            }, options || {}),
            // get cache
            cache = opt.storage || subFolderCache;
            // cache miss?
            var getter = function () {
                return http.GET({
                    module: 'folders',
                    params: {
                        action: 'list',
                        parent: opt.folder,
                        tree: '1',
                        all: opt.all ? '1' : '0'
                    },
                    appendColumns: true
                })
                .done(function (data, timestamp) {
                    // add to cache
                    cache.add(opt.folder, data);
                    // also add to folder cache
                    _(data).each(function (folder) {
                        folderCache.add(folder.id, folder);
                    });
                })
                .fail(function (error) {
                    console.error('folder.getSubFolders', opt.folder, error);
                });
            };

            if (opt.cache === false) {
                return getter();
            } else {
                return cache.contains(opt.folder)
                .pipe(function (check) {
                    if (check) {
                        return cache.get(opt.folder);
                    } else {
                        return getter();
                    }
                });
            }
        },

        create: function (options) {

            // options
            var opt = $.extend({
                folder: '1',
                tree: '1',
                event: true
            }, options || {});

            // default data
            opt.data = $.extend({
                module: 'mail',
                title: 'New Folder',
                subscribed: 1
            }, opt.data || {});

            // get parent folder to inherit permissions
            return api.get({
                folder: opt.folder
            })
            .pipe(function (parent) {
                // inherit rights only if folder isn't a system folder
                // (type = 5)
                if (parent.type === 5) {
                    opt.data.permissions = [{
                        group: false,
                        bits: 403710016,
                        entity: config.get('identifier')
                    }];
                } else {
                    opt.data.permissions = parent.permissions;
                }
                // go!
                return http.PUT({
                    module: 'folders',
                    params: {
                        action: 'new',
                        folder_id: opt.folder,
                        tree: '1'
                    },
                    data: opt.data,
                    appendColumns: false
                })
                .pipe(function (data) {
                    // wait for updating sub folder cache
                    return api.getSubFolders({
                        folder: opt.folder,
                        cache: false
                    })
                    .pipe(function () {
                        // return proper data
                        return data;
                    });
                });
            });
        },

        derive: {

            bits: function (data, offset) {
                return perm(_.firstOf(data.own_rights, data, 0),
                        offset || 0);
            }
        },

        folderCache: folderCache,
        subFolderCache: subFolderCache,

        needsRefresh: function (folder) {
            return subFolderCache.contains(folder);
        },

        decreaseUnreadCount: function (folder) {
            return folderCache.get(folder).pipe(function (data) {
                if (data.unread > 0) {
                    data.unread--;
                }
                return folderCache.add(folder, data);
            });
        },

        getTextNode: function (id) {
            var node = document.createTextNode('');
            getFolder(id)
                .done(function (data) {
                    node.nodeValue = data.title || data.id;
                })
                .always(function () {
                    _.defer(function () { // use defer! otherwise we return null on cache hit
                        node = null; // don't leak
                    });
                });
            return node;
        }
    };

    Events.extend(api);

    return api;
});
