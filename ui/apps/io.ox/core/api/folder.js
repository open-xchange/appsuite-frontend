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
     'io.ox/core/api/account',
     'io.ox/core/event'], function (http, cache, config, account, Events) {

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

            return opt.cache === false ? getter() : cache.get(id, getter);
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
                cache = opt.storage || subFolderCache,
                // cache miss?
                getter = function () {
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

            return opt.cache === false ? getter() : cache.get(opt.folder, getter);
        },

        getPath: function (options) {
            // options
            var opt = _.extend({
                    folder: '1',
                    event: false,
                    cache: true,
                    storage: null
                }, options || {}),
                // get cache
                cache = opt.storage || folderCache,
                // result
                def = $.Deferred(),
                result = [],
                // get via cache?
                useCache = function (id) {
                    cache.get(id).done(function (data) {
                        if (data === null) {

                        }
                    });
                };

            return useCache(opt.folder);
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
                            // clean up
                            var id, folders, tmp = {},
                                defaultFolder = String(config.get('folder.' + opt.type, 0)),

                                makeObject = function (raw) {
                                    return http.makeObject(raw, 'folders');
                                },
                                canRead = function (obj) {
                                    // read permission?
                                    return api.can('read', obj);
                                },
                                addToCache = function (obj) {
                                    // add to folder cache
                                    folderCache.add(obj, timestamp);
                                    return obj;
                                },
                                sorter = function (a, b) {
                                    return a.id === defaultFolder ? -1 :
                                        (a.title.toLowerCase() > b.title.toLowerCase() ? +1 : -1);
                                };
                            for (id in data) {
                                folders = _.chain(data[id])
                                    .map(makeObject)
                                    .filter(canRead)
                                    .map(addToCache) // since each doesn't chain
                                    .value();
                                // empty?
                                if (folders.length > 0) {
                                    // sort by title, default folder always first
                                    // (skip shared folder due to special order)
                                    if (id !== 'shared') {
                                        folders.sort(sorter);
                                    }
                                    tmp[id] = folders;
                                }
                            }
                            return tmp;
                        })
                        .done(function (data) {
                            // add to simple cache
                            visibleCache.add(opt.type, data);
                        });
                };

            return opt.cache === false ? getter() : visibleCache.get(opt.type, getter);
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
                    case 'unifiedmail':
                        id = data ? (data.id !== undefined ? data.id : data) : '';
                        return account.isUnified(id);
                    case 'external':
                        return (/^default[1-9]/).test(String(data.id)) && !this.is('unifiedmail', data);
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

        /**
         * Can?
         */
        can: function (action, data) {
            // check multiple folder?
            if (_.isArray(data)) {
                // for multiple folders, all folders must satisfy the condition
                return _(data).reduce(function (memo, folder) {
                    return memo && api.can(action, folder);
                }, true);
            }
            // vars
            var result = true,
                rights = data.own_rights,
                isSystem = data.standard_folder || this.is('system', data),
                isAdmin = perm(rights, 28) === 1,
                isMail = data.module === 'mail';
            // switch
            switch (action) {
            case 'read':
                // can read?
                // 256 = read own, 512 = read all, 8192 = admin
                //return (rights & 256 || rights & 512 || rights & 8192) > 0;
                return perm(rights, 7) > 0;
            case 'write':
                // can write?
                return perm(rights, 0) >= 2;
            case 'rename':
                // can rename?
                if (!isAdmin || isSystem) {
                    // missing admin privileges or system folder
                    result = false;
                } else if (perm(rights, 30) === 1) {
                    // special new rename bit
                    result = true;
                } else {
                    if (!isMail) {
                        result = true;
                    } else {
                        // default folder cannot be renamed
                        result = !this.is('defaultfolder', data);
                    }
                }
                return result;
            case 'create':
                return (isAdmin || this.derive('permissions', data).bit >= 4);
            case 'delete':
                // must be admin; system and default folder cannot be deleted
                return isAdmin && !isSystem && !this.is('defaultfolder', data);
            case 'import':
                // import data
                return (rights & 127) >= 2 && this.is('calendar|contacts|tasks', data);
            case 'export':
                // export data (not allowed for shared folders)
                return !this.is('shared', data) && this.is('contacts|calendar', data);
            case 'empty':
                // empty folder
                return (rights >> 21 & 127) && this.is('mail', data);
            case 'changepermissions':
                return isAdmin;
            case 'viewproperties':
                // view properties
                return !isMail && !this.is('account', data) && (data.capabilities & 1);
            case 'subscribe':
                // can subscribe
                return isMail && Boolean(data.capabilities & Math.pow(2, 4));
            default:
                return false;
            }
        },

        folderCache: folderCache,
        subFolderCache: subFolderCache,

        needsRefresh: function (folder) {
            return subFolderCache.get(folder).pipe(function (data) {
                return data !== null;
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

    var changeUnread = function (list, delta) {
        // array?
        list = _.isArray(list) ? list : [list];
        // wait for all cache ops
        var def = $.when.apply($,
            _(list).map(function (o) {
                var folder = _.isString(o) ? o : o.folder_id;
                return folderCache.get(folder).pipe(function (data) {
                    if (data) {
                        data.unread = Math.max(0, data.unread + delta);
                        return folderCache.add(folder, data);
                    } else {
                        return $.when();
                    }
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
                if (data) {
                    data.unread = Math.max(0, unread);
                    return folderCache.add(folder, data).done(function () {
                        api.trigger('change:' + folder);
                    });
                } else {
                    return $.when();
                }
            });
    };

    api.decUnread = function (folder) {
        return changeUnread(folder, -1);
    };

    api.incUnread = function (folder) {
        return changeUnread(folder, +1);
    };

    api.getDefaultFolder = function (type) {
        type = type || 'mail';
        return config.get(type === 'mail' ? 'mail.folder.inbox' : 'folder.' + type);
    };

    Events.extend(api);

    return api;
});
