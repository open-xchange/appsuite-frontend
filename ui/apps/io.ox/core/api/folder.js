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
     'io.ox/core/notifications',
     'gettext!io.ox/core'], function (http, cache, config, account, Events, notifications, gt) {

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
            var cache = opt.storage ? opt.storage.folderCache : folderCache;
            // cache miss?
            var getter = function () {
                return http.GET({
                    module: 'folders',
                    params: {
                        action: 'get',
                        id: id,
                        tree: '1',
                        altNames: true
                    }
                })
                .done(function (data, timestamp) {
                    // add to cache
                    cache.add(data.id, data);
                })
                .fail(function (error) {
                    if (error.categories === "PERMISSION_DENIED") {
                        notifications.yell(error);
                    } else {
                        console.error('folder.get', id, error);
                    }
                });
            };

            return opt.cache === false ? getter() : cache.get(id, getter);
        };

    var canMove = function (folder, target) {

        if (folder.folder_id === target.id) {
            return false;
        }
        // Prevent moving into folder itself
        if (folder.id === target.id) {
            return false;
        }
        // Prevent moving shared folders
        if (folder.type === 3 || target.type === 3) {
            return false;
        }
        // Prevent moving system folders
        if (folder.type === 5) {
            return false;
        }
        // Prevent moving default folders
        if (this.is("defaultfolder", folder)) {
            return false;
        }
        // Prevent moving private folders to other folders than
        // private folders
        if (folder.type === 1 && target.type !== 1 && target.id !== 1 && (target.type !== 7)) {
            return false;
        }
        // Prevent moving public folders to other folders than
        // public folders
        if (folder.type === 2 && target.type !== 2 && !(target.id in { 2: 1, 10: 1, 15: 1 })) {
            return false;
        }
        // Prevent moving folders to other not allowed modules
        if (folder.module !== target.module) {
            return false;
        }
        // Check rights Admin right source folder and create
        // subfolders in target
        if (!api.can('createFolder', folder) || !api.can('createFolder', target)) {
            return false;
        }
        return true;
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
                }, options || {});
            if (opt.all) opt.cache = false;

                // get cache
            var cache = opt.storage ? opt.storage.subFolderCache : subFolderCache,
                // cache miss?
                getter = function () {
                    return http.GET({
                        module: 'folders',
                        params: {
                            action: 'list',
                            parent: opt.folder,
                            tree: '1',
                            all: opt.all ? '1' : '0',
                            altNames: true
                        },
                        appendColumns: true
                    })
                    .pipe(function (data, timestamp) {
                        // rearrange on multiple ???
                        if (data.timestamp) {
                            timestamp = _.now(); // force update
                            data = data.data;
                        }
                        return $.when(
                            // add to cache
                            cache.add(opt.folder, data, timestamp),
                            // also add to folder cache
                            $.when.apply($,
                                _(data).map(function (folder) {
                                    return folderCache.add(folder.id, folder, timestamp);
                                })
                            )
                        )
                        .pipe(function () {
                            return data;
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
                    storage: null,
                    altNames: true
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
                            tree: '1',
                            altNames: true
                        },
                        appendColumns: true
                    })
                    .done(function (data) {
                        // loop over folders to remove root & 1 cache
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

            if (opt.cache === false) {
                getter();
            } else {
                useCache(opt.folder);
            }
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
                                tree: '1',
                                altNames: true
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
                                    folderCache.add(obj.id, obj, timestamp);
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
                folder: null,
                autorename: true
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
                        module: module,
                        action: 'new',
                        folder_id: opt.folder,
                        tree: '1',
                        autorename: opt.autorename
                    },
                    data: opt.data,
                    appendColumns: false
                })
                .pipe(function (data) {
                    // wait for updating sub folder cache
                    return $.when(
                        // get new folder
                        api.get({ folder: data, cache: false }),
                        // refresh parent folder
                        api.get({ folder: opt.folder, cache: false }),
                        // refresh parent folder's subfolder list
                        api.getSubFolders({ folder: opt.folder, cache: false }),
                        // refresh flat lists
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

        sync: function () {
            // action=update doesn't inform us about new unread mails, so we need another approach

            // renew subfoldercache
            // get all folders from subfolder cache
            return subFolderCache.keys().pipe(function (keys) {
                // clear subfolder cache
                subFolderCache.clear();

                // renew all subfolder entries
                http.pause();
                _(keys).map(function (id) {
                    return api.getSubFolders({ folder: id, cache: false });
                });

                api.trigger('update');

                return http.resume();
            });
        },

        update: function (options, storage) {

            if (storage) {
                storage.subFolderCache.clear();
                storage.folderCache.clear();
            }

            subFolderCache.clear();
            folderCache.clear();
            visibleCache.clear();

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
                        data: opt.changes || {},
                        appendColumns: false
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

        move: function (sourceId, targetId) {
            return this.update({ folder: sourceId, changes: { folder_id: targetId } }).pipe(function (id) {
                return api.get({ folder: sourceId, cache: false }).done(function (data) {
                    // trigger event
                    api.trigger('update', sourceId, data.id, data);
                    return data;
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
                        return data.type === 2 || /^(10|14|15)$/.test(data.id); // special file folder: regard as public
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
                        return !!data['com.openexchange.publish.publicationFlag'];
                    case 'accessible':
                        // maybe need a better word. It's shared TO others
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
            // check multiple folder?
            if (_.isArray(data)) {
                // for multiple folders, all folders must satisfy the condition
                return _(data).reduce(function (memo, folder) {
                    return memo && api.can(action, folder, obj);
                }, true);
            }
            // vars
            var result = true,
                rights = data.own_rights,
                isSystem = data.standard_folder || this.is('system', data),
                isAdmin = perm(rights, 28) === 1,
                isMail = data.module === 'mail',
                compareValue = (obj && ox.user_id !== _.firstOf(obj.created_by, 0)) ? 1 : 0; // is my folder ?
            // switch
            switch (action) {
            case 'read':
                // can read?
                // 256 = read own, 512 = read all, 8192 = admin
                // hide folders where your only permission is to see the foldername (rights !== 1)
                // return (rights & 256 || rights & 512 || rights & 8192) > 0;
                return perm(rights, 7) > 0 ||
                        (!isSystem && this.is('public', data) && data.folder_id !== '10') &&
                        rights !== 1;
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
            case 'moveFolder':
                return canMove.call(this, data, obj);
            case 'import':
                // import data
                return (rights & 127) >= 2 && this.is('calendar|contacts|tasks', data);
            case 'export':
                // export data (not allowed for shared folders)
                return !this.is('shared', data) && this.is('contacts|calendar|tasks', data);
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
        },

        reload: (function () {

            var pending = {};

            function get(id, a) {
                pending[id] = true;
                getFolder(id, { cache: false })
                    .done(function (b) {
                        // compare folder data. Might be different due to differences in get & list requests (sadly),
                        // so we cannot use _.isEqual(). Actually we are just interested in some fields:
                        // unread, title, subfolders, subscr_subflds
                        var equalUnread = a.unread === b.unread,
                            equalData = a.title === b.title && a.subfolders === b.subfolders && a.subscr_subflds === b.subscr_subflds;
                        api.trigger('update:unread', id, b);
                        api.trigger('update:unread:' + id, b);
                        if (!equalData) {
                            api.trigger('update', id, id, b);
                        }
                    })
                    .always(function () {
                        delete pending[id];
                    });
            }

            return function () {
                if (ox.online) {
                    _.chain(arguments)
                        .flatten()
                        .map(function (arg) {
                            return _.isString(arg) ? arg : arg.folder_id;
                        })
                        .uniq()
                        .each(function (id) {
                            if (!(id in pending)) {
                                folderCache.get(id).done(function (data) {
                                    if (data !== null) { get(id, data); }
                                });
                            }
                        });
                }
            };

        }())
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


    /**
     * Create a Breadcrum widget for a given folder.
     *
     * This widget can be customized in different ways. You can pass an options parameter
     * containing an object with these attributes:
     *
     * @param {string} - folder id
     * @param {object} - options:
     * {
     *     exclude: {Array} - An array of folder IDs that are ignored and won't appear in the breadcrumb
     *     leaf: {DOMnode} - An extra node that is appended as last crumb
     *     last: {boolean} - true: last item should have the active class set (default)
     *                     - no relevance if subfolder option is set to true and element is "clickable" (*)
     *                     - false: same as true if element is "clickable" (*)
     *                     - false: a link that reacts to the function assigned to the handler option
     *     handler: {function} - a handler function, called with the id of the folder as parameter
     *     module: {string} - provide a module to limit "clickable" attribute (*) to a specific module
     *     subfolder: {boolean} - show all subfolders of the folder as a dropdown if element is "clickable" (*)
     *                          - default: true
     * }
     * (*) - element is defined to be clickable, if a few conditions are met:
     *         - module option equals the folder module or module option is undefined
     *         - handler function is defined
     *
     * @return {Node} - an ul element that contains the list (populated later, after path is loaded via the API (async))
     */
    api.getBreadcrumb = (function () {

        var dropdown = function (li, id, title) {
            _.defer(function () {
                api.getSubFolders({ folder: id }).done(function (list) {
                    if (list.length) {
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
                    } else {
                        li.addClass('active').text(gt.noI18n(title));
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
            elem.attr('data-folder-id', folder.id).data(folder);
            this.append(li);
        };

        return function (id, options) {
            var ul;
            options = _.extend({ subfolder: true, last: true, exclude: [] }, options);
            try {
                ul = $('<ul class="breadcrumb">').on('click', 'a', function (e) {
                    e.preventDefault();
                    var id = $(this).attr('data-folder-id');
                    if (id !== undefined) {
                        _.call(options.handler, id, $(this).data());
                    }
                });
                if (options.prefix) {
                    ul.append($('<li class="prefix">').append(
                        $.txt(options.prefix), $('<span class="divider">').text(gt.noI18n(' '))
                    ));
                }
                return ul;
            }
            finally {
                api.getPath({ folder: id }).done(function (list) {
                    var exclude = _(options.exclude);
                    _(list).each(function (o, i, list) {
                        if (!exclude.contains(o.id)) {
                            add.call(ul, o, i, list, options);
                        }
                    });
                    if (options.leaf) {
                        ul.append(
                            $('<li>').append($('<span class="divider">').text(gt.noI18n(' / ')), options.leaf)
                        );
                    }
                    ul = null;
                });
            }
        };
    }());

    Events.extend(api);

    ox.on('refresh^', function () {
        api.sync();
    });

    // publish caches
    api.caches = {
        folderCache: folderCache,
        subFolderCache: subFolderCache,
        visibleCache: visibleCache
    };

    return api;
});
