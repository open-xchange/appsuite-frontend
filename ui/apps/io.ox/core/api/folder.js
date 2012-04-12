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
        visibleCache = new cache.SimpleCache('visible-folder', true),

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

        getVisible: function (options) {

            // options
            var opt = _.extend({
                    type: 'mail',
                    cache: true
                }, options || {}),

                getter = function () {
                    return http.GET({
                            module: 'folders',
                            appendColumns: true,
                            params: {
                                tree: '1',
                                action: 'allVisible',
                                content_type: opt.type
                            }
                        })
                        .pipe(function (data, timestamp) {
                            // make objects
                            var id, i, $i, folders,
                                defaultFolder = String(config.get('folder.' + opt.type, 0)),
                                sorter = function (a, b) {
                                    return a.id === defaultFolder ? -1 :
                                        (a.title.toLowerCase() > b.title.toLowerCase() ? +1 : -1);
                                };
                            for (id in data) {
                                for (i = 0, folders = data[id], $i = folders.length; i < $i; i++) {
                                    // replace by object
                                    folders[i] = http.makeObject(folders[i], 'folders');
                                    // add to folder cache
                                    folderCache.add(folders[i], timestamp);
                                }
                                if ($i === 0) {
                                    delete data[id];
                                } else {
                                    // sort by title, default folder always first
                                    // (skip shared folder due to special order)
                                    if (id !== 'shared') {
                                        folders.sort(sorter);
                                    }
                                }
                            }
                            return data;
                        })
                        .done(function (data) {
                            // add to simple cache
                            visibleCache.add(opt.type, data);
                        });
                };

            if (opt.cache === false) {
                return getter();
            } else {
                return visibleCache.contains(opt.type).pipe(function (check) {
                    if (check) {
                        return visibleCache.get(opt.type);
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

        is: function (type, data) {
            var result, i = 0, $i, id;
            // check multiple folder?
            if (_.isArray(data)) {
                // for multiple folders, all folders must satisfy the condition
                return _(data).reduce(function (memo, o) {
                    return memo && api.is(type, o);
                }, true);
            } else {
                // split? (OR)
                if (type.search(/\|/) > -1) {
                    var types = type.split(/\|/);
                    for ($i = types.length, result = false; i < $i; i++) {
                        if (this.is(types[i], data)) {
                            result = true;
                            break;
                        }
                    }
                    return result;
                } else {
                    // is?
                    switch (type) {
                    case 'private':
                        return data.type === 1;
                    case 'public':
                        return data.type === 2;
                    case 'shared':
                        return data.type === 3;
                    case 'system':
                        return data.type === 5;
                    case 'mail':
                        return data.module === 'mail';
                    case 'messaging':
                        return data.module === 'messaging';
                    case 'calendar':
                        return data.module === 'calendar';
                    case 'contacts':
                        return data.module === 'contacts';
                    case 'tasks':
                        return data.module === 'tasks';
                    case 'infostore':
                        return data.module === 'infostore';
                    case 'account':
                        return data.module === 'system' && /^default(\d+)?/.test(String(data.id));
//                    case 'unifiedmail':
//                        id = data ? (data.id !== undefined ? data.id : data) : '';
//                        var match = String(id).match(/^default(\d+)/);
//                        // is account? (unified inbox is not a usual account)
//                        return match ? !ox.api.cache.account.contains(match[1]) : false;
//                    case 'external':
//                        return /^default[1-9]/.test(String(data.id)) && !this.is('unifiedmail', data);
                    case 'defaultfolder':
                        // get default folder
                        var folders = config.get('mail.folder');
                        for (id in folders) {
                            if (folders[id] === data.id) {
                                return true;
                            }
                        }
                        return false;
                    case 'published':
                        if (data['com.openexchange.publish.publicationFlag']) {
                            return true; // published
                        }
                        if (data.permissions.length <= 1) {
                            return false; // not shared
                        }
                        // only shared BY me, not TO me
                        return data.type === 1 || data.type === 7 ||
                            (data.module === 'infostore' && data.created_by === config.get('identifier'));
                    }
                }
            }
        },

        folderCache: folderCache,
        subFolderCache: subFolderCache,

        needsRefresh: function (folder) {
            return subFolderCache.contains(folder);
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

    var changeUnread = function (list, delta) {
        // array?
        list = _.isArray(list) ? list : [list];
        // wait for all cache ops
        var def = $.when.apply($,
            _(list).map(function (o) {
                var folder = _.isString(o) ? o : o.folder_id;
                return folderCache.get(folder).pipe(function (data) {
                    data.unread = Math.max(0, data.unread + delta);
                    return folderCache.add(folder, data);
                });
            })
        );
        // trigger change event for each affected folder
        _.chain(list).pluck('folder_id').uniq().each(function (id) {
            api.trigger('change:' + id);
        });
        return def;
    };

    api.setUnread = function (folder, unread) {
        return folderCache.get(folder).pipe(function (data) {
                data.unread = Math.max(0, unread);
                return folderCache.add(folder, data);
            })
            .done(function () {
                api.trigger('change:' + folder);
            });
    };

    api.decUnread = function (folder) {
        return changeUnread(folder, -1);
    };

    api.incUnread = function (folder) {
        return changeUnread(folder, +1);
    };

    Events.extend(api);

    return api;
});
