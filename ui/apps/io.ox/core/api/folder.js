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
     'io.ox/core/event',
     'gettext!io.ox/core'], function (http, cache, config, account, Events, gt) {

    'use strict';

    var // folder object cache
        myself = null,
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
                // get from server
                getter = function () {
                    http.GET({
                        module: 'folders',
                        params: {
                            action: 'path',
                            id: opt.folder,
                            tree: '1'
                        },
                        appendColumns: true
                    })
                    .done(function (data) {
                        // loop over folders to remove root & update cache
                        data = _(data).filter(function (folder) {
                            cache.add(folder.id, folder);
                            return folder.id !== '1';
                        });
                        // resolve in reverse order (root > folder)
                        def.resolve(data.reverse());
                    })
                    .fail(def.reject);
                },
                // get via cache?
                useCache = function (id) {
                    cache.get(id).done(function (data) {
                        if (data !== null) {
                            if (data.folder_id !== '0') {
                                result.unshift(data);
                                useCache(data.folder_id);
                            } else {
                                def.resolve(result);
                            }
                        } else {
                            getter();
                        }
                    });
                };

            useCache(opt.folder);
            return def;
        },

        getVisible: function (options) {

            // options
            var opt = _.extend({
                    type: 'contacts',
                    cache: true
                }, options || {}),

                getter = function () {
                    return http.GET({
                            module: 'folders',
                            appendColumns: true,
                            params: {
                                action: 'allVisible',
                                content_type: opt.type,
                                tree: '1'
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

        remove: function (options) {

            var opt = _.extend({
                folder: null
            }, options || {});

            // get folder
            return this.get({ folder: opt.folder }).pipe(function (data) {

                var id = data.id, folder_id = data.folder_id;

                // clear caches first
                return $.when(
                    folderCache.remove(id),
                    subFolderCache.remove(id),
                    subFolderCache.remove(folder_id),
                    visibleCache.remove(data.module)
                )
                .pipe(function () {
                    // trigger event
                    api.trigger('delete:prepare', id, folder_id);
                    // delete on server
                    return http.PUT({
                        module: 'folders',
                        params: {
                            action: 'delete',
                            folder_id: opt.folder,
                            tree: '1'
                        },
                        data: [opt.folder],
                        appendColumns: false
                    })
                    .done(function () {
                        api.trigger('delete', id, folder_id);
                    });
                });
            })
            .fail(function (error) {
                api.trigger('delete:fail', opt.folder);
            });
        },

        create: function (options) {

            // options
            var opt = $.extend({
                folder: null
            }, options || {});

            // default data
            opt.data = $.extend({
                title: gt('New Folder'),
                subscribed: 1
            }, opt.data || {});

            // get parent folder to inherit permissions
            return this.get({ folder: opt.folder }).pipe(function (parent) {
                // inherit module
                var module = (opt.data.module = opt.data.module || parent.module);

                // inherit rights only if folder isn't a system folder
                // (type = 5)
                if (parent.type === 5) {
                    opt.data.permissions = [{
                        group: false,
                        bits: 403710016,
                        entity: ox.user_id
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
                    return $.when(
                        api.get({ folder: data, cache: false }),
                        api.getSubFolders({ folder: opt.folder, cache: false }),
                        !/^(mail|infostore)$/.test(module) ? api.getVisible({ type: module, cache: false }) : $.when()
                    )
                    .pipe(function (getRequest) {
                        // return proper data
                        return getRequest[0];
                    });
                });
            })
            .fail(function (error) {
                api.trigger('create:fail', error, opt.folder);
            });
        },

        update: function (options) {

            // options
            var opt = $.extend({
                folder: '1',
                changes: {}
            }, options || {});

            return this.get({ folder: opt.folder }).pipe(function (data) {
                // trigger event
                api.trigger('update:prepare', opt.folder);
                // remove from caches
                return $.when(
                    folderCache.remove(data.id),
                    subFolderCache.remove(data.folder_id),
                    visibleCache.remove(data.module)
                )
                .pipe(function () {
                    // update folder on server (unless no changes are given)
                    return http.PUT({
                        module: 'folders',
                        params: {
                            action: 'update',
                            id: opt.folder,
                            tree: '1'
                        },
                        data: opt.changes || {}
                    })
                    .done(function (id) {
                        // get fresh folder data (use maybe changed id)
                        api.get({ folder: id}, false).done(function () {
                            // trigger event
                            api.trigger('update', opt.folder, id, data);
                        });
                    });
                })
                .fail(function (error) {
                    api.trigger('update:fail', error, opt.folder);
                });
            });
        },

        Bitmask: (function () {

            var parts = { folder: 0, read: 7, write: 14, modify: 14, 'delete': 21, admin: 28 },

                resolve = function (offset) {
                    // use symbolic offset or plain numeric value?
                    if (_.isString(offset)) {
                        if (offset in parts) return parts[offset];
                        console.error('Typo!?', offset);
                    }
                    return offset || 0;
                };

            return function (value) {

                value = value || 0;

                // this way we may forget the new operator
                var Bitmask = {

                    get: function (offset) {
                        // return value OR relevant bits only
                        return arguments.length === 0 ? value : (value >> resolve(offset)) & 127;
                    },

                    set: function (offset, bits) {
                        offset = resolve(offset);
                        // clear 7 bits first
                        value &= 536870911 ^ (127 << offset);
                        // set bits
                        value |= bits << offset;
                        return this;
                    }
                };

                return Bitmask;
            };

        }()),

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
                            (data.module === 'infostore' && data.created_by === ox.user_id);
                    }
                }
            }
        },

        /**
         * Can?
         */
        can: function (action, data, obj) {
            var compareValue = 1;
            if (obj) {
                myself = myself || ox.user_id;
                if (myself === _.firstOf(obj.created_by, 0)) {
                    compareValue--;
                }
            }

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
                return perm(rights, 7) > compareValue;
            case 'create':
                // can create objects?
                return perm(rights, 0) > 1;
            case 'write':
                // can write objects
                return perm(rights, 14) > compareValue;
            case 'delete':
                // can delete objects
                return perm(rights, 21) > compareValue;
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
            case 'createFolder':
                return (isAdmin || this.derive.bits(data.permissions, 0) >= 4);
            case 'deleteFolder':
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
                    node.nodeValue = _.noI18n(data.title || data.id);
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

    api.getBreadcrumb = (function () {

        var dropdown = function (li, id, title) {
            _.defer(function () {
                api.getSubFolders({ folder: id }).done(function (list) {
                    var first;
                    if (list.length) {
                        // add first folder as dropdown
                        first = list[0];
                        li.addClass('dropdown').append(
                            $('<a href="#" class="dropdown-toggle" data-toggle="dropdown">')
                            .append(
                                $.txt(gt.noI18n(title)),
                                $('<b class="caret">')
                            ),
                            $('<ul class="dropdown-menu" role="menu" aria-labelledby="dLabel">').append(
                                _(list).map(function (folder) {
                                    return $('<li>').append(
                                        $('<a href="#">')
                                        .attr('data-folder-id', folder.id).text(gt.noI18n(folder.title))
                                    );
                                })
                            )
                        );
                    }
                });
            });
        };

        var add = function (folder, i, list, options) {

            var li = $('<li>'), elem, isLast = i === list.length - 1,
                properModule = options.module === undefined || folder.module === options.module,
                clickable = properModule && options.handler !== undefined;

            if (isLast && options.subfolder && clickable) {
                dropdown(elem = li, folder.id, folder.title);
            } else if (isLast && options.last) {
                elem = li.addClass('active').text(gt.noI18n(folder.title));
            } else {
                if (!clickable) {
                    elem = li.addClass('active').text(gt.noI18n(folder.title));
                } else {
                    li.append(elem = $('<a href="#">').text(gt.noI18n(folder.title)));
                }
                li.append(isLast ? $() : $('<span class="divider">').text(gt.noI18n(' / ')));
            }
            elem.attr('data-folder-id', folder.id);
            this.append(li);
        };

        return function (id, options) {
            var ul;
            options = _.extend({ subfolder: true, last: true }, options);
            try {
                ul = $('<ul class="breadcrumb">').on('click', 'a', function (e) {
                    e.preventDefault();
                    var id = $(this).attr('data-folder-id');
                    if (id !== undefined) {
                        _.call(options.handler, id);
                    }
                });
                if (options.prefix) {
                    ul.append($('<li>').append(
                        $.txt(options.prefix), $('<span class="divider">').text(gt.noI18n(' '))
                    ));
                }
                return ul;
            }
            finally {
                api.getPath({ folder: id }).done(function (list) {
                    _(list).each(function (o, i, list) {
                        add.call(ul, o, i, list, options);
                    });
                    ul = null;
                });
            }
        };
    }());

    Events.extend(api);

    return api;
});
