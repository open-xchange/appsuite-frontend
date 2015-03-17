/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2012 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/core/api/folder',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'settings!io.ox/mail',
     'settings!io.ox/core',
     'io.ox/core/api/account',
     'io.ox/core/event',
     'io.ox/core/notifications',
     'io.ox/core/capabilities',
     'io.ox/core/extensions',
     'gettext!io.ox/core',
     'io.ox/filter/folder'
    ], function (http, cache, mailSettings, settings, account, Events, notifications, capabilities, ext, gt) {

    'use strict';

    if (ox.debug) console.warn('Module "io.ox/core/api/folder" is deprecated. Please migrate to "io.ox/core/folder/api".');



    var // folder object cache
        folderCache = new cache.SimpleCache('folder'),
        subFolderCache = new cache.SimpleCache('subfolder'),
        visibleCache = new cache.SimpleCache('visible-folder'),
        firstSubFolderFetch = {},

        /**
         * checks if folder is currently blacklisted
         * @param  {object} folder
         * @return {boolean} true if not blacklisted
         */
        visible = function (folder) {
            var point = ext.point('io.ox/folder/filter');
            return point.filter(function (p) {
                    return p.invoke('isEnabled', this, folder) !== false;
                })
                .map(function (p) {
                    return p.invoke('isVisible', this, folder);
                })
                .reduce(function (acc, isVisible) {
                    return acc && isVisible;
                }, true);
        },

        // magic permission check
        perm = function (bits, offset) {
            return (bits >> offset) & (offset >= 28 ? 1 : 127);
        },

        // get single folder
        getFolder = function (id, opt) {
            // get cache
            opt = opt || {};
            var cache = opt.storage ? opt.storage.folderCache : folderCache;
            // make sure it's a string
            id = String(id);
            // fetch GAB but GAB is disabled?
            if (id === '6' && !capabilities.has('gab')) {
                var error = gt('Accessing global address book is not permitted');
                console.warn(error);
                return $.Deferred().reject({ error: error });
            }
            // cache miss?
            var getter = function () {
                return http.GET({
                    module: 'folders',
                    params: {
                        action: 'get',
                        id: id,
                        tree: '1',
                        altNames: true,
                        timezone: 'UTC'
                    }
                })
                .then(function (data) {
                    // update subfolder cache
                    return subFolderCache.get(data.folder_id).then(function (list) {
                        if (list === null) return data;
                        // loop over list and replace with fresh data
                        for (var i = 0, $i = list.length; i < $i; i++) {
                            if (list[i].id === data.id) {
                                list[i] = data;
                                break;
                            }
                        }
                        return subFolderCache.add(data.folder_id, list).then(function () {
                            return data;
                        });
                    });
                })
                .then(
                    function (data) {
                        // add to cache
                        return cache.add(data.id, data);
                    },
                    function (error) {
                        if (error.categories === 'PERMISSION_DENIED') {
                            if (!opt.suppressYell)
                                notifications.yell(error);
                        } else {
                            if (ox.debug) {
                                console.error('folder.get', id, error);
                            }
                        }
                    }
                );
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
        if (this.is('defaultfolder', folder)) {
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

    var processFolderList = function (id, data) {

        // apply blacklist
        data = _.filter(data, visible);

        // fix order of mail folders (INBOX first)
        if (id === '1') {

            var head = new Array(1 + 5), types = 'inbox sent drafts trash spam'.split(' ');

            // get unified folder first
            _(data).find(function (folder) {
                return account.isUnified(folder.id) && !!(head[0] = folder);
            });

            // get standard folders
            _(data).each(function (folder) {
                _(types).find(function (type, index) {
                    return account.is(type, folder.id) && !!(head[index + 1] = folder);
                });
            });

            // exclude unified and standard folders
            data = _(data).reject(function (folder) {
                return account.isUnified(folder.id) || account.isStandardFolder(folder.id);
            });

            // sort the rest
            data.sort(function (a, b) {
                // external accounts at last
                var extA = account.isExternal(a.id),
                    extB = account.isExternal(b.id),
                    order = a.title.toLowerCase() > b.title.toLowerCase() ? +1 : -1;
                if (extA && extB) return order;
                if (extA) return +1;
                if (extB) return -1;
                return order;
            });

            // combine
            data.unshift.apply(data, _(head).compact());
        }

        return data;
    };

    // use ramp-up data
    _(ox.rampup.folder).each(function (data, id) {
        folderCache.add(id, data);
    });

    ox.rampup.folderlist = ox.rampup.folderlist || {};

    _(ox.rampup.folderlist).each(function (list, id) {
        // make objects
        ox.rampup.folderlist[id] = _(list).map(function (data) {
            return http.makeObject(data, 'folders');
        });
    });

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
            var cache = opt.storage ? opt.storage.subFolderCache : subFolderCache;

            function updateFolderCache(folder, data, cache) {
                firstSubFolderFetch[folder] = false;
                return $.when.apply($,
                    // add to cache
                    [].concat(
                        cache.add(folder, data),
                        // also add to folder cache
                        _(data).map(function (subfolder) {
                            return folderCache.add(subfolder.id, subfolder);
                        })
                    )
                )
                .then(function () {
                    return data;
                });
            }

            function fetch(opt) {
                var data = ox.rampup.folderlist[opt.folder];
                if (data) {
                    delete ox.rampup.folderlist[opt.folder];
                    return $.Deferred().resolve(data);
                } else {
                    return http.GET({
                        module: 'folders',
                        params: {
                            action: 'list',
                            parent: opt.folder,
                            tree: '1',
                            all: opt.all ? '1' : '0',
                            altNames: true,
                            timezone: 'UTC'
                        },
                        appendColumns: true
                    });
                }
            }

            function getter() {
                return fetch(opt).then(
                    function success(data, timestamp) {

                        // rearrange on multiple ???
                        if (data.timestamp) {
                            // force update
                            timestamp = _.then();
                            data = data.data;
                        }

                        data = processFolderList(opt.folder, data);

                        return $.when(
                            // add to cache
                            cache.add(opt.folder, data),
                            // also add to folder cache
                            $.when.apply($,
                                _(data).map(function (folder) {
                                    return folderCache.add(folder.id, folder);
                                })
                            )
                        )
                        .then(function () {
                            return data;
                        });
                    },
                    function fail(e) {
                        if (ox.debug) console.error('folder.getSubFolders', opt.folder, e.error, e);
                    }
                );
            }

            return opt.cache === false ?
                getter() :
                cache.get(opt.folder, getter).then(function (data) {
                    return firstSubFolderFetch[opt.folder] !== false ?
                        updateFolderCache(opt.folder, data, cache) : data;
                });
        },

        getPath: function (options) {
            // options
            var opt = _.extend({
                    folder: '1',
                    event: false,
                    cache: true,
                    storage: null,
                    altNames: true,
                    timezone: 'UTC'
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
                                altNames: true,
                                timezone: 'UTC'
                            }
                        })
                        .pipe(function (data, timestamp) {
                            // clean up
                            var id, folders, tmp = {},

                                makeObject = function (raw) {
                                    return http.makeObject(raw, 'folders');
                                },
                                blacklisted = function (folder) {
                                    // checks if folder is blacklisted
                                    return visible(folder);
                                },
                                canReadOrIsAdmin = function (obj) {
                                    // read permission?
                                    return api.can('read', obj) || (perm(obj.own_rights, 28) === 1);
                                },
                                addToCache = function (obj) {
                                    // add to folder cache
                                    folderCache.add(obj.id, obj, timestamp);
                                    return obj;
                                };
                            for (id in data) {
                                folders = _.chain(data[id])
                                    .map(makeObject)
                                    .filter(blacklisted)
                                    .filter(canReadOrIsAdmin)
                                    // since each doesn't chain
                                    .map(addToCache)
                                    .value();
                                // empty?
                                if (folders.length > 0) {
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

            require(['io.ox/core/config'], function (config) {
                var folderInConfig = config.get('modules.mail.contactCollectFolder') || '';

                if (folderInConfig.toString() === options.folder) {
                    notifications.yell('success', gt('The settings for collecting contacts in this folder will become disabled when you enter the application the next time.'));
                }
            });

            var opt = _.extend({
                folder: null
            }, options || {});

            // get folder
            return this.get({ folder: opt.folder }).then(function (data) {
                var id = data.id, folder_id = data.folder_id;

                // clear caches first
                return $.when(
                    folderCache.remove(id),
                    subFolderCache.remove(id),
                    subFolderCache.remove(folder_id),
                    visibleCache.clear()
                )
                .then(function () {
                    // trigger event
                    api.trigger('delete:prepare', data);
                    // delete on server
                    return http.PUT({
                        module: 'folders',
                        params: {
                            action: 'delete',
                            folder_id: opt.folder,
                            tree: '1',
                            failOnError: true
                        },
                        data: [opt.folder],
                        appendColumns: false
                    })
                    .done(function () {
                        api.trigger('delete', id, folder_id);
                        api.trigger('delete:' + id, data);
                        api.trigger('delete:' + data.module, data);
                    });
                });
            })
            .fail(function () {
                api.trigger('delete:fail', opt.folder);
            });
        },

        create: function (options) {
            // options
            var opt = $.extend({
                folder: null,
                autorename: true,
                silent: false
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
                        autorename: opt.autorename,
                        folder_id: opt.folder,
                        module: module,
                        tree: '1'
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
                        (!/^(mail|infostore)$/.test(module) ? api.getVisible({ type: module, cache: false }) : $.when())
                    )
                    .pipe(function (getRequest) {
                        // return proper data
                        var data = getRequest;
                        if (!options.silent) {
                            if (!visible(data)) {
                                api.trigger('warn:hidden', data);
                            }
                            api.trigger('create', data);
                        }
                        return data;
                    });
                });
            })
            .fail(function (error) {
                api.trigger('create:fail', error, opt.folder);
            });
        },

        sync: function () {
            // renew subfoldercache
            // get all folders from subfolder cache
            return subFolderCache.keys()
                .then(function (keys) {
                    // clear subfolder cache (to get rid of deprecated stuff)
                    return subFolderCache.clear().then(function () {
                        // renew all subfolder entries
                        http.pause();
                        return $.when.apply($,
                            _(keys).map(function (id) {
                                // need cache: false here, otherwise requests get not collected by http.pause()
                                return api.getSubFolders({ folder: id, cache: false });
                            }),
                            http.resume()
                        );
                    });
                })
                .done(function () {
                    api.trigger('refresh');
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
                            tree: '1',
                            timezone: 'UTC'
                        },
                        data: opt.changes || {},
                        appendColumns: false
                    })
                    .done(function (id) {
                        // get fresh folder data (use maybe changed id)
                        api.get({ folder: id, cache: false}).done(function (data) {
                            if (!visible(data)) {
                                api.trigger('warn:hidden', data);
                            }
                            // trigger event
                            api.trigger('update', opt.folder, id, data);
                        });
                    });
                })
                .fail(function (error) {
                    if (error && error.code && error.code === 'FLD-0018')
                        error.error = gt('Could not save settings. There have to be at least one user with administration rights.');
                    api.trigger('update:fail', error, opt.folder);
                });
            });
        },

        move: function (sourceId, targetId) {
            return this.update({ folder: sourceId, changes: { folder_id: targetId } });
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
                        // special file folder: regard as public
                        return data.type === 2 || /^(10|14|15)$/.test(data.id);
                    case 'shared':
                        return data.type === 3;
                    case 'system':
                        return data.type === 5;
                    case 'trash':
                        return data.type === 16;
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
                    case 'unifiedfolder':
                        id = data ? (data.id !== undefined ? data.id : data) : '';
                        return account.isUnifiedFolder(id);
                    case 'external':
                        return (/^default[1-9]/).test(String(data.id)) && !this.is('unifiedmail', data);
                    case 'defaultfolder':
                        // get default folder
                        var folders = mailSettings.get('folder');
                        for (id in folders) {
                            if (folders[id] === data.id) {
                                return true;
                            }
                        }
                        return false;
                    case 'insideDefaultfolder':
                        // get default folder
                        var folders = mailSettings.get('folder');
                        for (id in folders) {
                            //folder starts with defaultfolder id
                            if (data.id.indexOf(folders[id]) === 0) {
                                return true;
                            }
                        }
                        return false;
                    case 'published':
                        return !!data['com.openexchange.publish.publicationFlag'];
                    case 'subscribed':
                        return !!data['com.openexchange.subscribe.subscriptionFlag'];
                    case 'unlocked':
                        // maybe need a better word. It's shared TO others
                        if (!data.permissions || data.permissions.length <= 1) return false;
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
                // is my folder ?
                compareValue = (obj && ox.user_id !== _.firstOf(obj.created_by, 0)) ? 1 : 0;
            // switch
            switch (action) {
            case 'read':
                // can read?
                // 256 = read own, 512 = read all, 8192 = admin
                // hide folders where your only permission is to see the foldername (rights !== 1)
                // return (rights & 256 || rights & 512 || rights & 8192) > 0;
                // 10: shared files folder
                return perm(rights, 7) > 0 /*|| (!isSystem && this.is('public', data) && data.folder_id !== '10') // see bug 28379 and 23933 */&& rights !== 1;
                // please use parantheses properly OR OR AND or OR AND AND?
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
            case 'publish':
                // check folder capability
                if (_(data.supported_capabilities).indexOf('publication') === -1) return false;
                // contact?
                if (data.module === 'contacts') return true;
                // files?
                return data.module === 'infostore' && this.can('create', data) && rights !== 1 && rights !== 4;
            case 'subscribe':
                // check folder capability
                if (_(data.supported_capabilities).indexOf('subscription') === -1) return false;
                // check rights
                return (/^(contacts|calendar|infostore)$/).test(data.module) && api.can('write', data);
            case 'imap-subscribe':
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
                    // use defer! otherwise we return null on cache hit
                    _.defer(function () {
                        // don't leak
                        node = null;
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
                        var equalData = a.title === b.title &&
                                        a.subfolders === b.subfolders &&
                                        a.subscr_subflds === b.subscr_subflds &&
                                        a['com.openexchange.publish.publicationFlag'] === b['com.openexchange.publish.publicationFlag'] &&
                                        a['com.openexchange.publish.subscriptionFlag'] === b['com.openexchange.publish.subscriptionFlag'];
                        api.trigger('update:total', id, b);
                        api.trigger('update:total:' + id, b);
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
                            return _.isString(arg) ? arg : (arg ? arg.folder_id : null);
                        })
                        .compact()
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
        return type === 'mail' ? mailSettings.get('folder/inbox') : settings.get('folder/' + type);
    };

    // central hub to coordinate events and caches
    // (see files/api.js for a full implementation for files)
    api.propagate = function (type) {

        var ready = $.when();

        if (/^account:(create|delete|unified-enable|unified-disable)$/.test(type)) {
            // need to refresh subfolders of root folder 1
            return api.getSubFolders({ folder: '1', cache: false }).done(function () {
                api.trigger('refresh');
            });
        }

        return ready;
    };

    // shortens the folder title and adds ellipsis
    api.getFolderTitle = function (title, max) {

        title = String(title || '').trim();

        // anything to do?
        if (title.length < max) return title;

        var leadingDelimiter = /[_-]/.test(title[0]) ? title[0] : false,
            endingDelimiter = /[_-]/.test(title[title.length - 1]) ? title[title.length - 1] : false,
            split = title.split(/[ _-]+/),
            delimiters = title.split(/[^ _-]+/),
            length = title.length;

        if (leadingDelimiter) {
            split[1] = leadingDelimiter + split[1];
            split.splice(0, 1);
        }

        if (endingDelimiter) {
            split[split.length - 1] = endingDelimiter + split[split.length - 1];
            split.splice(split.length - 1, 1);
        }

        while (length > max && split.length > 2) {
            var index = Math.floor(split.length / 2);
            length -= split[index].length + 2;
            split.splice(index, 1);
            delimiters.splice(index + 1, 1);
            delimiters[Math.floor(delimiters.length / 2)] = '\u2026';
        }

        if (length > max) {
            return _.ellipsis(title, { charpos: 'middle', max: max, length: Math.floor(max / 2 - 1) });
        }

        return _(split).map(function (val, key) { return val + delimiters[key + 1]; }).join('');
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
     *                     - no relevance if subfolder option is set to true and element is 'clickable' (*)
     *                     - false: same as true if element is 'clickable' (*)
     *                     - false: a link that reacts to the function assigned to the handler option
     *     handler: {function} - a handler function, called with the id of the folder as parameter
     *     module: {string} - provide a module to limit 'clickable' attribute (*) to a specific module
     *     subfolder: {boolean} - show all subfolders of the folder as a dropdown if element is 'clickable' (*)
     *                          - default: true
     * }
     * (*) - element is defined to be clickable, if a few conditions are met:
     *         - module option equals the folder module or module option is undefined
     *         - handler function is defined
     *
     * @return {Node} - an ul element that contains the list (populated later, after path is loaded via the API (async))
     */
    api.getBreadcrumb = (function () {

        var dropdown = function (li, id, title, options) {
            _.defer(function () {
                api.getSubFolders({ folder: id }).done(function (list) {
                    if (list.length) {
                        li.addClass('dropdown').append(
                            $('<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="menuitem" aria-haspopup="true" tabindex="1">')
                            .attr(
                                'title', title
                            ).append(
                                $.txt(gt.noI18n(api.getFolderTitle(title, 30))),
                                $('<b class="caret">')
                            ),
                            $('<ul class="dropdown-menu">')
                            .attr({
                                'role': 'menu',
                                'aria-haspopup': 'true',
                                'aria-label': gt.format(gt('subfolders of %s'), gt.noI18n(api.getFolderTitle(title, 30)))
                            }).append(
                                _(list).map(function (folder) {
                                    var $a, $li = $('<li>').append(
                                        $a = $('<a href="#" tabindex="1" role="menuitem">')
                                        .attr({'data-folder-id': folder.id}).text(gt.noI18n(api.getFolderTitle(folder.title, 30)))
                                    );
                                    /**
                                     * special mobile handling due to on-the-fly bootstrap-dropdown mod on mobile
                                     *
                                     * on mobile devices the dropdowns are moved around in the down
                                     * causing the click delegate to break which is defined on the "breadcrump" element
                                     * Therfore we need to bind the handler on each dropdown href for mobile as the
                                     * handlers will stay alive after append the whole dropdown to a new
                                     * root node in the DOM.
                                     */
                                    if (_.device('smartphone')) {
                                        $a.on('click', function (e) {
                                            e.preventDefault();
                                            var id = $(this).attr('data-folder-id');
                                            if (id !== undefined) {
                                                _.call(options.handler, id, $(this).data());
                                            }
                                        });
                                    }
                                    return $li;
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
                clickable = properModule && options.handler !== undefined,
                displayTitle = gt.noI18n(api.getFolderTitle(folder.title, 30));

            if (isLast && options.subfolder && clickable) {
                dropdown(elem = li, folder.id, folder.title, options);
            } else if (isLast && options.last) {
                elem = li.addClass('active').text(displayTitle);
            } else {
                if (!clickable) {
                    elem = li.addClass('active').text(displayTitle);
                } else {
                    li.append(elem = $('<a href="#" tabindex="1" role="menuitem">').attr('title', folder.title).text(displayTitle));
                }
            }

            elem.attr('data-folder-id', folder.id).data(folder);
            this.append(li);
        };

        var draw = function (list, ul, options) {
            var exclude = _(options.exclude);
            _(list).each(function (o, i, list) {
                if (!exclude.contains(o.id)) {
                    add.call(ul, o, i, list, options);
                }
            });
            ul = null;
        };

        return function (id, options) {
            var ul;
            options = _.extend({ subfolder: true, last: true, exclude: [] }, options);
            try {
                ul = $('<ul class="breadcrumb">')
                    .attr({
                        'role': 'menubar'
                    })
                    .on('click', 'a', function (e) {
                        e.preventDefault();
                        var id = $(this).attr('data-folder-id');
                        if (id !== undefined) {
                            _.call(options.handler, id, $(this).data());
                        }
                    });
                if (options.prefix) {
                    ul.append($('<li class="prefix">').append(
                        $.txt(options.prefix)
                    ));
                }
                return ul;
            }
            finally {
                api.path({ folder: id }).then(
                    function success(list) {
                        draw(list, ul, options);
                    },
                    function fail() {
                        api.get({ folder: id }).then(
                            function (folder) {
                                draw([folder], ul, options);
                            },
                            function () {
                                // cannot show breadcrumb, for example due to disabled GAB

                                ul.remove();
                                ul = null;
                            }
                        );
                    }
                );
            }
        };
    }());

    Events.extend(api);

    ox.on('refresh^', function () {
        api.sync();
    });

    api.on('warn:hidden', function (e, folder) {
        notifications.yell('info',
           //#. %1$s is the filename
           gt('Folder with name "%1$s" will be hidden. Enable setting "Show hidden files and folders" to access this folder again.', folder.title));
    });

    // publish caches
    api.caches = {
        folderCache: folderCache,
        subFolderCache: subFolderCache,
        visibleCache: visibleCache
    };

    // check a list of object if they originate from more than one folder
    // if so remove items from "sent" folder
    // useful for delete/move actions and threads
    api.ignoreSentItems = (function () {

        function fromSameFolder(list) {
            return _(list).chain().pluck('folder_id').uniq().value().length <= 1;
        }

        function isNotSentFolder(obj) {
            return !account.is('sent', obj.folder_id);
        }

        return function (list) {
            // not array or just one?
            if (!_.isArray(list) || list.length === 1) return list;
            // all from same folder?
            if (fromSameFolder(list)) return list;
            // else: exclude sent items
            return _(list).filter(isNotSentFolder);
        };
    }());

    api.clearCaches = function () {
        return $.when(
            folderCache.clear(),
            subFolderCache.clear(),
            visibleCache.clear()
        );
    };

    // filename validator
    ext.point('io.ox/core/filename')
        .extend({
            index: 100,
            id: 'empty',
            validate: function (name, type) {
                if (name === '') {
                    return type === 'file' ?
                        gt('File names must not be empty') :
                        gt('Folder names must not be empty');
                }
                return true;
            }
        })
        .extend({
            index: 200,
            id: 'slash',
            validate: function (name, type) {
                if (/\//.test(name)) {
                    return type === 'file' ?
                        gt('File names must not contain slashes') :
                        gt('Folder names must not contain slashes');
                }
                return true;
            }
        });

    return api;
});
