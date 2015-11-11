/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2011 Open-Xchange Inc., Tarrytown, NY, USA. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/api',
    ['io.ox/core/http',
     'io.ox/core/cache',
     'settings!io.ox/core',
     'io.ox/core/api/factory',
     'io.ox/core/folder/api',
     'io.ox/core/api/account',
     'io.ox/core/notifications',
     'io.ox/mail/util',
     'io.ox/core/api/collection-pool',
     'io.ox/core/api/collection-loader',
     'settings!io.ox/mail',
     'gettext!io.ox/mail'
    ], function (http, cache, coreConfig, apiFactory, folderAPI, accountAPI, notifications, util, Pool, CollectionLoader, settings, gt) {

    // SHOULD NOT USE notifications inside API!

    'use strict';

    var DONE = $.when(),
        DELIM = '//';

    var tracker = (function () {

        // simple temporary thread cache
        var threads = {},

            // stores CIDs to find items in threads
            // key is item CID, value is top-level item CID
            threadHash = {},

            // track mails that are manually marked as unseen
            unseen = {},
            colorLabel = {};

        var calculateUnread = function (memo, obj) {
            return memo + ((obj.flags & 32) !== 32 ? 1 : 0);
        };

        var getCID = function (param) {
            return _.isString(param) ? param : _.cid(param);
        };

        var getTailCID = function (obj) {
            if (!obj) return '';
            if (obj.thread) return _.cid(_(obj.thread).last());
            return threadHash[getCID(obj)];
        };

        var self = {

            getTailCID: getTailCID,

            addThread: function (obj) {

                var cid = getTailCID(obj), changed = false;

                if (threads[cid]) {
                    // has changed?
                    changed = !_.isEqual(threads[cid], obj.thread);
                }

                threads[cid] = obj.thread;
                _(obj.thread).each(function (o) {
                    threadHash[_.cid(o)] = cid;
                });

                if (changed) {
                    api.trigger('threadChanged threadChanged:' + _.ecid(obj), obj);
                }
            },

            hasThread: function (obj) {
                return self.getThread(obj).length > 1;
            },

            getThread: function (obj, copy) {
                var cid = getCID(obj),
                    tail = getTailCID(obj),
                    thread = threads[tail] || [],
                    first = _.cid(_(thread).first());
                // is not first item?
                if (cid !== first) return [];
                return copy ? _.deepCopy(thread) : thread;
            },

            getThreadCID: function (obj) {
                var cid = getCID(obj);
                return threadHash[cid];
            },

            getThreadSize: function (obj) {
                return self.getThread(obj).length || 1;
            },

            getUnreadCount: function (obj) {
                var cid = getCID(obj), root = threads[cid];
                return root === undefined ? 0 : _(root.thread).inject(calculateUnread, 0);
            },

            update: function (list, callback) {

                var hash = {};

                // hash affected cids
                // return top thread obj (threadview) or mail obj (singleview)
                list = _(list).chain()
                    .map(function (obj) {
                        var cid = _.cid(obj), top = threadHash[cid];
                        hash[cid] = true;
                        return top in threads ? _(threads[top]).first() : obj;
                    })
                    .compact().value();

                function process(obj) {
                    var cid = _.cid(obj);
                    if (cid in hash) {
                        callback(obj);
                    }
                }

                return api.updateAllCache(list, function (obj) {
                    // handles threadView: on || off
                    if (obj.thread)
                        _(obj.thread).each(process);
                    else
                        process(obj);
                });
            },

            reset: (function () {

                function reset(obj) {
                    var cid = _.cid(obj);
                    unseen[cid] = (obj.flags & 32) !== 32;
                    colorLabel[cid] = parseInt(obj.color_label, 10) || 0;
                }

                return function (list) {
                    _(list).each(function (obj) {
                        reset(obj);
                        _(obj.thread).each(reset);
                    });
                };

            }()),

            setUnseen: function (obj, options) {
                var cid = getCID(obj);
                unseen[cid] = true;
                options = options || {};
                if (!options.silent) {
                    api.trigger('refresh.list');
                }
            },

            setSeen: function (obj, options) {
                var cid = getCID(obj);
                unseen[cid] = false;
                options = options || {};
                if (!options.silent) {
                    api.trigger('refresh.list');
                }
            },

            /**
             * @param {object|string} obj (id, folder_id) or string (cid)
             * @returns {void}
             */
            remove: function (obj) {
                var cid = getCID(obj),
                    root = this.getThreadCID(cid);
                if (root) {
                    threads[root] = _(threads[root]).filter(function (item) {
                        return cid !== getCID(item);
                    });
                }
            },

            // use this to check if mails in a thread are unseen
            isPartiallyUnseen: function (obj) {
                var cid = getCID(obj), top = threads[threadHash[cid]];
                if (top) {
                    return _(top).reduce(function (memo, obj) {
                        return memo || unseen[_.cid(obj)] === true;
                    }, false);
                } else {
                    return false;
                }
            },

            isUnseen: function (obj) {
                if (_.isObject(obj)) {
                    var cid = getCID(obj);
                    return cid in unseen ? !!unseen[cid] : (obj.flags & 32) !== 32;
                } else {
                    return !!unseen[obj];
                }
            },

            getThreadColorLabel: function (obj) {
                var cid = getCID(obj), top = threads[threadHash[cid]];
                if (top) {
                    return _(top).reduce(function (memo, obj) {
                        return memo || colorLabel[cid] || obj.color_label;
                    }, 0);
                } else {
                    return self.getColorLabel(obj);
                }
            },

            getColorLabel: function (obj) {
                var cid = getCID(obj);
                // fallback to 0 to avoid undefined
                return (cid in colorLabel ? colorLabel[cid] : obj.color_label) || 0;
            },

            setColorLabel: function (obj) {
                var cid = getCID(obj);
                colorLabel[cid] = parseInt(obj.color_label, 10) || 0;
            },

            clear: function () {
                threads = {};
                threadHash = {};
            }
        };

        return self;

    }());

    // color_label resort hash
    var colorLabelResort = _('0 1 7 10 6 3 9 2 5 8 4'.split(' ')).invert(),
        colorLabelSort = function (a, b) {
            return colorLabelResort[b.color_label] - colorLabelResort[a.color_label];
        };

    // model pool
    var pool = Pool.create('mail');

    // client-side fix for missing to/cc/bcc fields
    if (settings.get('features/fixtoccbcc')) {
        pool.map = function (data) {
            var cid = _.cid(data), model = this.get(cid);
            if (!model) return data;
            ['to', 'cc', 'bcc'].forEach(function (field) {
                var list = model.get(field);
                if (_.isArray(list) && list.length > 0) delete data[field];
            });
            return data;
        };
    }

    // generate basic API
    var api = apiFactory({
        module: 'mail',
        keyGenerator: function (obj) {
            return obj ? (obj.folder_id || obj.folder) + '.' + obj.id + '.' + (obj.view || api.options.requests.get.view || '') : '';
        },
        requests: {
            all: {
                folder: 'default0/INBOX',
                // + flags & color_label
                columns: '601,600,611,102',
                extendColumns: 'io.ox/mail/api/all',
                // received_date
                sort: '610',
                order: 'desc',
                deleted: 'true',
                // allow DB cache
                cache: false
            },
            list: {
                action: 'list',
                columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
                extendColumns: 'io.ox/mail/api/list'
            },
            get: {
                action: 'get',
                embedded: 'true'
            },
            getUnmodified: {
                action: 'get',
                unseen: 'true',
                view: 'html',
                embedded: 'true'
            },
            search: {
                action: 'search',
                folder: 'default0/INBOX',
                columns: '601,600,611',
                extendColumns: 'io.ox/mail/api/all',
                sort: '610',
                order: 'desc',
                getData: function (query, options) {
                    var map = { from: 603, to: 604, cc: 605, subject: 607, text: -1 }, composite = [];
                    _(options).each(function (value, key) {
                        if (key in map && value === 'on') {
                            composite.push({ col: map[key], pattern: query });
                        }
                    });
                    return composite;
                }
            }
        },
        // composite key for 'all' cache
        cid: function (o) {
            return (o.action || 'all') + ':' + o.folder + DELIM + [o.sort, o.order, o.max || 0, !!o.unseen, !!o.deleted].join('.');
        },

        fail: {
            get: function (e, ids) {
                if (e.code === 'MSG-0032') {
                    // mail no longer exists, so we remove it from caches
                    // we don't trigger any event here, as it might run into cyclic event chains
                    api.updateCaches([ids]);
                }
            }
        },
        // filter list request (special fix for nested messages; don't have folder; inline action checks fail)
        filter: function (obj) {
            return obj.folder_id !== undefined || obj.folder !== undefined;
        },
        pipe: {
            all: function (response, opt) {
                // fix sort order for "label"
                if (opt.sort === '102') {
                    response.sort(colorLabelSort);
                    if (opt.order === 'desc') response.reverse();
                }
                // reset tracker! if we get a seen mail here, although we have it in 'explicit unseen' hash,
                // another devices might have set it back to seen.
                // threadedAll || all
                tracker.reset(response.data || response);
                return response;
            },
            listPost: function (data) {
                _(data).each(function (obj) {
                    if (obj) {
                        if (tracker.isUnseen(obj)) {
                            obj.flags = obj.flags & ~32;
                        } else {
                            obj.flags = obj.flags | 32;
                        }
                    }
                });
                return data;
            },
            get: function (data, options) {
                // check integrated unread counter
                folderAPI.setUnseenCounter(data.folder_id, data.unread);
                // inject view (text/html/noimg). need this to generate proper cache keys.
                // data might be plain string, e.g. for mail source
                if (_.isObject(data)) {
                    data.view = options.view;
                }
                return data;
            }
        },
        params: {
            all: function (options) {
                if (options.sort === 'thread') {
                    options.sort = 610;
                }
                return options;
            }
        },
        //special function for list requests that fall back to a get request (only one item in the array)
        simplify: function (options) {
            // fix mail unseen issue
            options.simplified.unseen = true;
            return options.simplified;
        }
    });

    /**
     * updates the view used for get requests, used on mail settings save to be responsive
     */
    api.updateViewSettings = function () {
        api.options.requests.get.view = settings.get('allowHtmlMessages', true) ? (settings.get('allowHtmlImages', false) ? 'html' : 'noimg') : 'text';
        //special event to redraw current detailview
        api.trigger('viewChanged');
    };

    // publish tracker
    api.tracker = tracker;

    api.separator = settings.get('defaultseparator', '/');

    api.SENDTYPE = {
        NORMAL:  '0',
        REPLY:   '1',
        FORWARD: '2',
        EDIT_DRAFT: '3',
        DRAFT:   '4'
    };

    api.FLAGS = {
        ANSWERD:     1,
        DELETED:     2,
        DRAFT:       4,
        FLAGGED:     8,
        RECENT:     16,
        SEEN:       32,
        USER:       64,
        SPAM:      128,
        FORWARDED: 256
    };

    api.COLORS = {
        NONE:        0,
        RED:         1,
        ORANGE:      7,
        YELLOW:     10,
        LIGHTGREEN:  6,
        GREEN:       3,
        LIGHTBLUE:   9,
        BLUE:        2,
        PURPLE:      5,
        PINK:        8,
        GRAY:        4
    };

    // respond to change:flags
    pool.get('detail').on('change:flags', function (model) {
        // get previous and current flags to determine if unseen bit has changed
        var previous = util.isUnseen(model.previous('flags')),
            current = util.isUnseen(model.get('flags'));
        if (previous === current) return;
        // update folder
        folderAPI.changeUnseenCounter(model.get('folder_id'), current ? +1 : -1);
    });

    // respond to removing unseen messages
    pool.get('detail').on('remove', function (model) {
        // check if removed message was unseen
        var unseen = util.isUnseen(model.get('flags'));
        if (!unseen) return;
        // update folder
        folderAPI.changeUnseenCounter(model.get('folder_id'), -1);
    });

    // control for each folder:
    // undefined -> first fetch
    // true -> has been fetched in this session
    // false -> caused by refresh
    var cacheControl = {},
        get = api.get,
        getAll = api.getAll,
        getList = api.getList,
        search = api.search;

    // update thread model
    function propagate(model) {
        api.threads.touch(model.toJSON());
    }

    function allowImages(obj) {
        if (!settings.get('allowHtmlImages', false)) return false;
        if (accountAPI.is('spam|trash', obj.folder_id || obj.folder)) return false;
        return true;
    }

    function defaultView(obj) {
        if (!settings.get('allowHtmlMessages', true)) return 'text';
        return allowImages(obj) ? 'html' : 'noimg';
    }

    api.get = function (obj, options) {

        var cid = _.isObject(obj) ? _.cid(obj) : obj,
            model = pool.get('detail').get(cid);

        // TODO: make this smarter
        if (!obj.src && (obj.view === 'noimg' || !obj.view) && model && model.get('attachments')) return $.when(model.toJSON());

        // determine default view parameter
        if (!obj.view) obj.view = defaultView(obj);

        // limit default size
        obj.max_size = settings.get('maxSize/view', 1024 * 100);

        return get.call(api, obj, options && options.cache).done(function (data) {
            if (model) {
                // if we already have a model we promote changes for threads
                model.set(data);
                propagate(model);
            } else {
                // add new model
                pool.add('detail', data);
            }
        });
    };

    api.getAll = function (options, useCache) {

        // use cache?
        var cid = api.cid(options);
        if (useCache === 'auto') {
            useCache = (cacheControl[cid] !== false);
        }

        options = options || {};

        // special handling for top-level mail account folders
        if (/^default\d+$/.test(options.folder)) return $.when([]);

        // support for from-to
        if (options.sort === 'from-to') {
            options.sort = accountAPI.is('sent|drafts', options.folder) ? 604 : 603;
        }

        return getAll.call(this, options, useCache).done(function () {
            cacheControl[cid] = true;
        });
    };

    /**
     * pipes getList() to remove typesuffix from sender
     * @param  {array} ids
     * @param  {boolean} useCache (default is true)
     * @param  {object} options
     * @return {deferred}
     */
    api.getList = function (ids, useCache, options) {
        //TOOD: use this until backend removes channel suffix
        return getList.call(this, ids, useCache, options).then(function (data) {
            _.each(data, util.removeChannelSuffix);
            return data;
        });
    };

    api.search = function (query, options) {
        if (options.sort === 'from-to') {
            options.sort = accountAPI.is('sent|drafts', options.folder) ? 604 : 603;
        }
        return search.call(this, query, options);
    };

    function prepareRemove(ids, all) {

        var collection = pool.get('detail');

        // fallback
        all = all || ids;

        if (all.length === 1) {
            api.threads.remove(all[0]);
            api.threads.touch(all[0]);
        }

        // we need the original list of ids "all" to also catch threads
        // that start with an email from the sent folder
        api.trigger('beforedelete', all);

        _(all).each(function (item) {
            var cid = _.cid(item), model = collection.get(cid);
            if (model) collection.remove(model);
        });
    }

    /**
     * wrapper for factories remove to update counters
     * @param  {array} ids
     * @param  {object} options [see api factory]
     * @return {deferred} resolves as array
     */
    api.remove = function (ids, all) {

        prepareRemove(ids, all);

        return http.wait(
            http.PUT({
                module: 'mail',
                params: { action: 'delete', timestamp: _.then() },
                data: http.simplify(ids),
                appendColumns: false
            })
            .done(function () {
                // reset trash folder
                var trashId = accountAPI.getFoldersByType('trash');
                _(pool.getByFolder(trashId)).each(function (collection) {
                    collection.expired = true;
                });
                // update unread counter and folder item counter
                folderAPI.reload(ids, trashId);
                // trigger delete to update notification area
                api.trigger('delete');
                api.trigger('deleted-mails', ids);
            })
        );
    };

    //
    // Archive messages
    //
    api.archive = function (id) {

        return http.PUT({
            module: 'mail',
            params: { action: 'archive_folder', folder: id, days: 90 },
            appendColumns: false
        })
        .done(function () {
            // refresh all folders because the archive folder might be new
            folderAPI.refresh();
            // reload mail views
            api.trigger('refresh.all');
        });
    };

    /**
     * requests data for all ids
     * @param  {object} options
     * @param  {boolean} useCache (default is true)
     * @return {deferred} returns array of threads
     */
    api.getAllThreads = function (options, useCache) {
        // request for brand new thread support
        options = options || {};
        options = $.extend(options, {
            action: 'threadedAll',
            // +flags +color_label
            columns: options.columns || '601,600,611,102',
            sort: options.sort || '610',
            sortKey: 'threaded-' + (options.sort || '610'),
            konfetti: true,
            order: options.order || 'desc',
            includeSent: !accountAPI.is('sent|drafts', options.folder),
            // never use server cache
            cache: false,
            // apply internal limit to build threads fast enough
            max: options.max || 500
        });
        // use cache?
        var cid = api.cid(options);
        if (useCache === 'auto') {
            useCache = (cacheControl[cid] !== false);
        }
        return getAll.call(this, options, useCache, null, false)
            .done(function (response) {
                _(response.data).each(tracker.addThread);
                cacheControl[cid] = true;
            });
    };

    var update = function (list, data, apiAction) {

        var move = false,
            modfolder = data.folder_id || data.folder;

        // allow single object and arrays
        list = _.isArray(list) ? list : [list];

        // pause http layer
        http.pause();

        // now talk to server
        _(list).map(function (obj) {
            var folder  = obj.folder || obj.folder_id;
            if (modfolder && modfolder !== folder) {
                move = true;
            }
            return http.PUT({
                module: 'mail',
                params: {
                    action: apiAction || 'update',
                    id: obj.id,
                    folder: folder,
                    // to be safe
                    timestamp: _.then()
                },
                data: data,
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume().pipe(function (response) {
            // trigger update events
            _(list).each(function (obj) {
                api.trigger('update:' + _.ecid(obj), obj);
            });
            if (apiAction === 'copy' || move) {
                // give response (to look if there was an error)
                // not doing this as a standardaction to prevent errors with functions looking only for the list parameter
                return { list: list, response: response};
            }
            // return list
            return list;
        });
    };

    var clearCaches = function (obj, targetFolderId) {
        return function () {
            var id = obj.folder_id || obj.folder;
            return $.when(
                api.caches.get.remove(obj),
                api.caches.get.remove(id),
                api.caches.list.remove(obj),
                api.caches.list.remove(id),
                // clear target folder
                api.caches.all.grepRemove(targetFolderId + DELIM)
            );
        };
    };

    api.update = function () {
        console.error('Do not call this directly because mail is so special');
    };

    /**
     * update item in all caches via callback in element
     * @param {array} list
     * @param {function} callback
     * @return {deferred}
     */
    api.updateAllCache = (function () {
        function update(folder_id, hash, callback) {
            // get proper keys (differ due to sort/order suffix)
            return api.caches.all.grepKeys(folder_id + DELIM).then(function (keys) {
                return $.when.apply($, _(keys).map(function (folder_id) {
                    return api.caches.all.get(folder_id).then(function (co) {
                        // handles threadView: on || off
                        if (!co) return DONE;

                        co.data = co.data || co;
                        // update affected items
                        var defs,
                            list = _(co.data)
                            .chain()
                            .filter(function (obj) {
                                return _.cid(obj) in hash;
                            })
                            .map(function (obj) {
                                callback(obj);
                                // handles threadView: on || off
                                return obj.thread || obj;
                            })
                            .value();

                        if (list.length < 100) {
                            defs = [
                                api.caches.list.merge(list),
                                api.caches.get.merge(list)
                            ];
                        } else {
                            // due to performace reasons kill caches on to many update requests
                            defs = [
                                api.caches.list.clear(),
                                api.caches.get.clear()
                            ];
                        }
                        return $.when.apply($, defs).then(function () {
                            return api.caches.all.add(folder_id, co);
                        });
                    });
                }));
            });
        }

        return function (list, callback) {
            // get affected folders first
            var folders = {}, hash = {};
            _([].concat(list)).each(function (obj) {
                hash[_.cid(obj)] = true;
                folders[obj.folder_id] = true;
            });
            // run update for each folder
            return $.when.apply($, _(folders).map(function (value, folder_id) {
                return update(folder_id, hash, callback || _.identity);
            }));
        };
    }());

    api.on('not-found', function (e, obj) {
        tracker.ignore(obj);
        api.trigger('refresh.list');
    });

    /**
     * cleaning up
     * @param  {string]} folder_id
     * @fires  api#refresh.all
     * @return {deferred}
     */
    api.expunge = function (folder_id) {
        // new clear
        return http.PUT({
            module: 'mail',
            appendColumns: false,
            params: {
                action: 'expunge'
            },
            data: [folder_id]
        })
        .then(function (data) {
            return api.caches.all.grepRemove(folder_id + DELIM).then(function () {
                return data;
            });
        })
        .done(function () {
            api.trigger('refresh.all');
            folderAPI.reload(folder_id);
        });
    };

    //
    // Respond to folder API events
    //

    folderAPI.on({
        'before:clear': function (e, id) {
            // clear target folder
            _(pool.getByFolder(id)).each(function (collection) {
                collection.reset([]);
            });
        },
        'clear remove:mail': function () {
            // reset trash folder
            var trashId = accountAPI.getFoldersByType('trash');
            _(trashId).each(function (id) {
                folderAPI.list(id, { cache: false });
            });
            _(pool.getByFolder(trashId)).each(function (collection) {
                collection.expired = true;
            });
        }
    });

    /**
     * sets color
     * @param  {array|object} list of mail objects
     * @param  {string} label (numeric color id mapped in api.COLORS)
     * @param  {boolean} local
     * @fires  api#refresh.list
     * @return {promise} done returns list of mails in current folder
     */
    api.changeColor = function (list, label, local) {

        list = [].concat(list);

        // see Bug 24730 - Folder "INBOX" does not support user-defined flags. Update of color flag ignored.
        label = String(label);

        _(list).each(function (obj) {
            obj.color_label = label;
            pool.propagate('change', {
                id: obj.id,
                folder_id: obj.folder_id,
                color_label: parseInt(label, 10) || 0
            });
            // update thread model
            api.threads.touch(obj);
            tracker.setColorLabel(obj);
            api.trigger('update:' + _.ecid(obj), obj);
        });

        return http.wait(
            tracker.update(list, function (obj) {
                obj.color_label = label;
                tracker.setColorLabel(obj);
            })
            .then(function () {
                return local ? DONE : update(list, { color_label: label });
            })
            .done(function () {
                api.trigger('refresh.color', list);
                api.trigger('refresh.all');
            })
        );
    };

    /**
     * marks list of mails unread
     * @param {array} list
     * @fires api#refresh.list
     * @return {deferred}
     */
    api.markUnread = function (list) {
        list = [].concat(list);

        _(list).each(function (obj) {
            tracker.setUnseen(obj, { silent: true });
            obj.flags = obj.flags & ~32;
            pool.propagate('change', {
                id: obj.id,
                folder_id: obj.folder_id,
                flags: obj.flags
            });
            // update thread model
            api.threads.touch(obj);
            api.trigger('update:' + _.ecid(obj), obj);
        });

        return $.when(
            // local update
            tracker.update(list, function (obj) {
                tracker.setUnseen(obj, { silent: true });
                obj.flags = obj.flags & ~32;
            })
            .done(function () {
                api.trigger('refresh.list');
                api.trigger('refresh.unseen', list);
            }),
            // server update
            update(list, { flags: api.FLAGS.SEEN, value: false }).done(function () {
                folderAPI.reload(list);
            })
        );
    };

    /**
     * marks list of mails read
     * @param {array} list
     * @fires api#refresh.list
     * @fires api#update:set-seen (list)
     * @return {deferred}
     */
    api.markRead = function (list) {

        list = [].concat(list);

        _(list).each(function (obj) {
            tracker.setSeen(obj, { silent: true });
            obj.flags = obj.flags | 32;
            pool.propagate('change', {
                id: obj.id,
                folder_id: obj.folder_id,
                flags: obj.flags,
                unseen: false
            });
            // update thread model
            api.threads.touch(obj);
            api.trigger('update:' + _.ecid(obj), obj);
        });

        return $.when(
            // local update
            tracker.update(list, function (obj) {
                tracker.setSeen(obj, { silent: true });
                obj.flags = obj.flags | 32;
            })
            .done(function () {
                api.trigger('refresh.list');
                api.trigger('refresh.seen', list);
            }),
            // server update
            update(list, { flags: api.FLAGS.SEEN, value: true }).done(function () {
                folderAPI.reload(list);
                //used by notification area
                api.trigger('update:set-seen', list);
            })
        );
    };

    api.allSeen = function (folder) {

        // loop over detail collection
        pool.get('detail').each(function (model) {
            var data = model.toJSON();
            if (data.folder_id === folder && util.isUnseen(data)) {
                pool.propagate('change', {
                    id: data.id,
                    folder_id: data.folder_id,
                    flags: data.flags | 32
                });
                // update affected threads
                api.threads.touch(data);
            }
        });

        // remove notifications in notification area
        api.trigger('update:set-seen', folder);

        return http.PUT({
            module: 'mail',
            params: {
                action: 'all_seen',
                folder: folder
            },
            appendColumns: false
        })
        .done(function () {
            folderAPI.reload(folder);
        });
    };

    /**
     * marks list of mails as spam
     * @param {array} list
     * @return {deferred}
     */
    api.markSpam = function (list) {

        prepareRemove(list);

        this.trigger('refresh.pending');
        tracker.clear();

        _(pool.getByFolder(accountAPI.getFoldersByType('spam'))).each(function (collection) {
            collection.expired = true;
        });

        return update(list, { flags: api.FLAGS.SPAM, value: true }).fail(notifications.yell);
    };

    api.noSpam = function (list) {

        prepareRemove(list);

        this.trigger('refresh.pending');
        tracker.clear();

        _(pool.getByFolder(accountAPI.getFoldersByType('inbox'))).each(function (collection) {
            collection.expired = true;
        });

        return update(list, { flags: api.FLAGS.SPAM, value: false }).fail(notifications.yell);
    };

    /**
     * move mails to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @fires  api#refresh.all
     * @fires  api#move (list, targetFolderId)
     * @return {deferred}
     */
    api.move = function (list, targetFolderId, all) {

        prepareRemove(list, all);

        // mark target folder as expired
        _(pool.getByFolder(targetFolderId)).each(function (collection) {
            collection.expired = true;
        });

        // start update on server
        return http.wait(
            update(list, { folder_id: targetFolderId }).then(function (data) {
                // look if anything went wrong
                var failed = _(data.response).find(function (item) { return !!item.error; });
                api.trigger('move', list, targetFolderId);
                folderAPI.reload(targetFolderId, list);
                if (failed) return failed.error;
            })
        );
    };

    /**
     * copies a number of mails to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return {deferred}
     */
    api.copy = function (list, targetFolderId) {

        // mark target folder as expired
        _(pool.getByFolder(targetFolderId)).each(function (collection) {
            collection.expired = true;
        });

        return update(list, { folder_id: targetFolderId }, 'copy')
            .then(function (result) {
                return (clearCaches(list, targetFolderId)()).then(function () {
                    return result;
                });
            })
            .then(function (result) {

                var response = result.response, errorText;

                // look if something went wrong
                for (var i = 0; i < response.length; i++) {
                    if (response[i].error) {
                        response = response[i].error.error;
                        break;
                    }
                }

                api.trigger('copy', list, targetFolderId);
                folderAPI.reload(targetFolderId);

                return errorText ? errorText : _(response).pluck('data');
            });
    };

    api.autosave = function (obj) {
        return http.PUT({
            module: 'mail',
            params: {
                action: 'autosave'
            },
            data: obj,
            appendColumns: false
        }).pipe(function (data) {
            return $.Deferred().resolve(data);
        });
    };

    // composition space id
    api.csid = function () {
        return _.uniqueId() + '.' + _.now();
    };

    var react = function (action, obj, view) {

        // get proper view first
        view = $.trim(view || 'text').toLowerCase();
        view = view === 'text/plain' ? 'text' : view;
        view = view === 'text/html' ? 'html' : view;

        // attach original message on touch devices?
        var attachOriginalMessage = view === 'text' && Modernizr.touch && settings.get('attachOriginalMessage', false) === true,
            csid = api.csid();

        return http.PUT({
                module: 'mail',
                // using jQuery's params because it ignores undefined values
                params: $.extend({}, {
                    action: action || '',
                    attachOriginalMessage: attachOriginalMessage,
                    view: view,
                    setFrom: (/reply|replyall|forward/.test(action)),
                    csid: csid,
                    embedded: obj.embedded,
                    max_size: obj.max_size
                }),
                data: _([].concat(obj)).map(function (obj) {
                    return api.reduce(obj);
                }),
                appendColumns: false
            })
            .then(function (data) {
                var text = '', quote = '', tmp = '';
                // inject csid
                data.csid = csid;
                // transform pseudo-plain text to real text
                if (data.attachments && data.attachments.length) {
                    if (data.attachments[0].content === '') {
                        // nothing to do - nothing to break
                    } else {
                        //content-type specific
                        if (data.attachments[0].content_type === 'text/plain') {
                            $('<div>')
                                // escape everything but BR tags
                                .html(data.attachments[0].content.replace(/<(?!br)/ig, '&lt;'))
                                .contents().each(function () {
                                    if (this.tagName === 'BR') {
                                        text += '\n';
                                    } else {
                                        text += $(this).text();
                                    }
                                });
                            // remove white space
                            text = $.trim(text);
                            // polish for html editing
                            if (view === 'html') {
                                // escape '<'
                                text = text.replace(/</ig, '&lt;');
                                // replace '\n>' sequences by blockquote-tags
                                _(text.split(/\n/).concat('\n')).each(function (line) {
                                    if (/^> /.test(line)) {
                                        quote += line.substr(2) + '\n';
                                    } else {
                                        tmp += (quote !== '' ? '<blockquote type="cite"><p>' + quote + '</p></blockquote>' : '') + line + '\n';
                                        quote = '';
                                    }
                                });
                                // transform line-feeds back to BR
                                data.attachments[0].content = $.trim(tmp).replace(/\n/g, '<br>');
                            } else {
                                // replace
                                data.attachments[0].content = $.trim(text);
                            }
                        } else if (data.attachments[0].content_type === 'text/html') {
                            // robust approach for large mails
                            tmp = document.createElement('DIV');
                            tmp.innerHTML = data.attachments[0].content;
                            _(tmp.getElementsByTagName('BLOCKQUOTE')).each(function (node) {
                                node.removeAttribute('style');
                            });
                            data.attachments[0].content = tmp.innerHTML;
                            tmp = null;
                        }
                    }
                } else {
                    data.attachments = data.attachments || [{}];
                    data.attachments[0].content = '';
                }
                return data;
            });
    };


    /**
     * By updating the last access timestamp the referenced file is prevented from being deleted from both session and disk storage.
     * Needed for inline images
     */
    api.keepalive = function (id) {
        return http.GET({
            module: 'file',
            params: { action: 'keepalive', id: id }
        });
    };

    /**
     * get mail object with unmodified content (in case externalresources warning message was ignored)
     * @param  {object]} obj (mail object)
     * @return {deferred} obj (mail object)
     */
    api.getUnmodified = function (obj) {
        // has folder?
        if ('folder_id' in obj || 'folder' in obj) {
            return this.get({
                action: 'get',
                id: obj.id,
                folder: obj.folder || obj.folder_id,
                view: 'html'
            }, false);
        } else if ('parent' in obj) {
            // nested message!?
            var id = obj.id, parent = obj.parent;
            return this.get({
                    action: 'get',
                    id: obj.parent.id,
                    folder: obj.parent.folder || obj.parent.folder_id,
                    view: 'html'
                }, false)
                .pipe(function (data) {
                    return _.chain(data.nested_msgs)
                        .filter(function (obj) {
                            if (obj.id === id) {
                                obj.parent = parent;
                                return true;
                            } else {
                                return false;
                            }
                        })
                        .first().value();
                });
        } else {
            console.error('api.getUnmodified(). Invalid case.', obj);
            return $.Deferred().resolve(obj);
        }
    };

    /**
     * get source code of specified mail
     * @param  {object} obj (mail)
     * @return {deferred} returns source string
     */
    api.getSource = function (obj) {
        return this.get({
            action: 'get',
            id: obj.id,
            src: true,
            folder: obj.folder || obj.folder_id,
            view: 'html'
        }, false);
    };

    /**
     * prepares object content for 'replayall' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return {deferred} done returns prepared object
     */
    api.replyall = function (obj, view) {
        return react('replyall', obj, view);
    };

    /**
     * prepares object content for 'reply' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return {deferred} done returns prepared object
     */
    api.reply = function (obj, view) {
        return react('reply', obj, view);
    };

    /**
     * prepares object content for 'forward' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return {deferred} done returns prepared object
     */
    api.forward = function (obj, view) {
        return react('forward', obj, view);
    };

    /**
     * sends a mail
     * @param  {object} data (mail object)
     * @param  {array} files
     * @param  {jquery} form (for 'oldschool')
     * @fires  api#refresh.all
     * @fires  api#refresh.list
     * @return {deferred}
     */
    api.send = function (data, files, form) {

        var deferred;

        function processRecipient(recipient) {

            var name = $.trim(recipient[0] || '')
                    // remove outer quotes only
                    .replace(/^"(.+)"$/, '$1')
                    .replace(/^'(.+)'$/, '$1'),
                address = String(recipient[1] || ''),
                typesuffix = recipient[2] || '',
                isMSISDN = typesuffix === '/TYPE=PLMN' || /\/TYPE=PLMN$/.test(address);

            // check if name is empty or name and address are identical
            // generally don't send display name for MSISDN numbers
            if (name === '' || name === address || isMSISDN) name = null;

            // add type suffix if not yet added
            if (isMSISDN && !/\/TYPE=PLMN$/.test(address)) address = address + typesuffix;

            // return array notation (no further escaping needed)
            return [name, address];
        }

        // clone data (to avoid side-effects)
        data = _.clone(data);

        // flatten from, to, cc, bcc
        data.from = _(data.from).map(processRecipient);
        data.to = _(data.to).map(processRecipient);
        data.cc = _(data.cc).map(processRecipient);
        data.bcc = _(data.bcc).map(processRecipient);

        function mapArgs(obj) {
            return {
                'args': [{'com.openexchange.groupware.contact.pairs': [{'folder': obj.folder_id, 'id': obj.id}]}],
                'identifier': 'com.openexchange.contact'
            };
        }

        if (data.contacts_ids) {
            data.datasources = _.chain(data.contacts_ids).map(mapArgs).value();
        }

        api.trigger('beforesend', { data: data, files: files, form: form });
        ox.trigger('mail:send:start', data, files);

        if (Modernizr.filereader && 'FormData' in window) {
            deferred = handleSendXHR2(data, files, deferred);
        } else {
            deferred = handleSendTheGoodOldWay(data, form);
        }

        return deferred
            .done(function () {
                api.trigger('send', { data: data, files: files, form: form });
                ox.trigger('mail:send:stop', data, files);
            })
            .then(function (text) {
                // wait a moment, then update mail index
                setTimeout(function () {
                    api.trigger('refresh.all');
                }, 3000);
                // IE9
                if (_.isObject(text))
                    return text;
                // process HTML-ish non-JSONP response
                var a = text.indexOf('{'),
                    b = text.lastIndexOf('}');
                if (a > -1 && b > -1) {
                    return JSON.parse(text.substr(a, b - a + 1));
                } else {
                    return {};
                }
            })
            .then(function (result) {
                if (result.data) {
                    var base = _(result.data.toString().split(api.separator)),
                        id = base.last(),
                        folder = base.without(id).join(api.separator);
                    $.when(accountAPI.getUnifiedMailboxName())
                    .done(function (isUnified) {
                        if (isUnified !== null) {
                            folderAPI.refresh();
                        } else {
                            folderAPI.reload(folder);
                        }
                        api.trigger('refresh.list');
                    });
                }

                return result;
            });
    };

    function handleSendXHR2(data, files) {

        var form = new FormData();

        // add mail data
        form.append('json_0', JSON.stringify(data));
        // add files
        _(files).each(function (file, index) {
            form.append('file_' + index, file);
        });

        return http.UPLOAD({
            module: 'mail',
            params: {
                action: 'new',
            },
            data: form,
            dataType: 'text'
        });
    }

    function handleSendTheGoodOldWay(data, form) {

        return http.FORM({
            module: 'mail',
            action: 'new',
            data: data,
            form: form,
            field: 'json_0'
        });
    }

    /**
     * save mail attachments in files app
     * @param  {array} list
     * @param  {string} target (folder id) [optional]
     * @fires  api#refresh.all
     * @return {deferred}
     */
    api.saveAttachments = function (list, target) {
        // be robust
        target = target || coreConfig.get('folder/infostore');
        // support for multiple attachments
        list = _.isArray(list) ? list : [list];
        http.pause();
        // loop
        _(list).each(function (data) {
            http.PUT({
                module: 'mail',
                params: {
                    action: 'attachment',
                    id: data.mail.id,
                    folder: data.mail.folder_id,
                    dest_folder: target,
                    attachment: data.id
                },
                data: { folder_id: target, description: gt('Saved mail attachment') },
                appendColumns: false
            });
        });
        return http.resume().done(function () {
            require(['io.ox/files/api'], function (fileAPI) {
                fileAPI.caches.all.grepRemove(target + DELIM);
                fileAPI.trigger('refresh.all');
            });
        });
    };

    /**
     * get url for attachment in requested mode
     * @param  {object} data (attachment)
     * @param  {string} mode ('download', 'zip', 'email, 'view', 'open')
     * @return {string} url
     */
    api.getUrl = function (data, mode) {
        var url = ox.apiRoot + '/mail', first;
        if (mode === 'zip') {
            first = _(data).first();
            return url + '?' + $.param({
                action: 'zip_attachments',
                folder: (first.parent || first.mail).folder_id,
                id: (first.parent || first.mail).id,
                attachment: _(data).pluck('id').join(','),
                // required here!
                session: ox.session
            });
        } else if (mode === 'eml:reference') {
            //if eml stored as reference use parent object
            return this.getUrl(_([].concat(data)).first().parent, 'eml');
        } else if (mode === 'eml') {
            data = [].concat(data);
            first = _(data).first();
            // multiple?
            if (data.length > 1) {
               // zipped
                return url + '?' + $.param({
                    action: 'zip_messages',
                    folder: first.folder_id,
                    id: _(data).pluck('id').join(','),
                    session: ox.session
                });
            } else {
                // single EML
                url += (first.subject ? '/' + encodeURIComponent(first.subject.replace(/[\\:\/]/g, '_') + '.eml') : '') + '?' +
                    $.param($.extend(api.reduce(first), {
                        action: 'get',
                        src: 1,
                        save: 1,
                        session: ox.session
                    }));
                return url;
            }
        } else {
            // inject filename for more convenient file downloads
            var filename = data.filename ? data.filename.replace(/[\\:\/]/g, '_').replace(/\(/g, '%28').replace(/\)/, '%29') : undefined;
            url += (data.filename ? '/' + encodeURIComponent(filename) : '') + '?' +
                $.param({
                    action: 'attachment',
                    folder: (data.parent || data.mail).folder_id,
                    id: (data.parent || data.mail).id,
                    attachment: data.id
                });
            switch (mode) {
            case 'view':
            case 'open':
                return url + '&delivery=view';
            case 'download':
                return url + '&delivery=download';
            default:
                return url;
            }
        }
    };

    var lastUnseenMail = 0;

    /**
     * checks inbox for new mails
     * @fires api#new-mail (recent, unseen)
     * @return {deferred} done returns { unseen: [], recent: [] }
     */
    api.checkInbox = function () {
        // look for new unseen mails in INBOX
        return http.GET({
            module: 'mail',
            params: {
                action: 'all',
                folder: 'default0/INBOX',
                //received_date, id, folder_id, flags
                columns: '610,600,601,611',
                // only unseen mails are interesting here!
                unseen: 'true',
                // any reason to see them?
                deleted: 'false',
                sort: '610',
                order: 'desc',
                // not really sure if limit works as expected
                // if I only fetch 10 mails and my inbox has some unread mails but the first 10 are seen
                // I still get the unread mails
                limit: 100
            }
        })
        .then(function (unseen) {
            //update the tracker
            //needed if mail app was not opened before to prevent mails not being marked as read because the tracker doesn't know them
            tracker.reset(unseen);

            // check most recent mail
            var recent = _(unseen).filter(function (obj) {
                // ignore mails 'mark as deleted'
                return obj.received_date > lastUnseenMail && (obj.flags & 2) !== 2;
            });

            // Trigger even if no new mails are added to ensure read mails are removed
            api.trigger('new-mail', recent, unseen);

            if (recent.length > 0) {
                lastUnseenMail = recent[0].received_date;
                api.newMailTitle(true);
            } else {
                //if no new mail set lastUnseenMail to now, to prevent mark as unread to trigger new mail
                lastUnseenMail = _.utc();
            }

            return {
                unseen: unseen,
                recent: recent || []
            };
        });
    };

    /**
     * bind to global refresh; clears caches and trigger refresh.all
     * @fires  api#refresh.all
     * @return {promise}
     */
    api.refresh = function () {
        if (!ox.online) return;
        // reset cache control
        _(cacheControl).each(function (val, cid) {
            cacheControl[cid] = false;
        });
        api.checkInbox().always(function () {
            api.trigger('refresh.all');
        });
    };

    /**
     * remove elements from list
     * @param  {array} list (list)
     * @param  {object} hash (ids of items to be removed)
     * @return {array} (cleaned list)
     */
    api.localRemove = function (list, hash) {
        // reverse lookup first to get affacted top-level elements
        var reverse = {};
        _(hash).each(function (value, cid) {
            var threadCID = tracker.getThreadCID(cid);
            if (threadCID !== undefined) {
                // is a thread, but we store the inner cid since we loop over root elements
                reverse[threadCID] = cid;
            }
        });
        // loop over list and check occurrence via hash
        list = _(list).filter(function (obj) {
            var cid = _.cid(obj), found = cid in hash, length = obj.thread ? obj.thread.length : 1, s, entire;
            // case #1: found in hash; no thread
            if (found && length <= 1) {
                return false;
            }
            // case #2: found in hash; root element
            if (found && length > 1) {
                // delete entire thread?
                entire = _(obj.thread).chain().map(_.cid)
                    .inject(function (sum, cid) { return sum + (cid in hash ? 1 : 0); }, 0).value() === length;
                if (entire) {
                    return false;
                } else {
                    // copy props from second thread item
                    s = obj.thread[1];
                    _.extend(obj, { folder_id: s.folder_id, id: s.id, flags: s.flags, color_label: s.color_label });
                    obj.thread.splice(0, 1);
                    return true;
                }
            }
            // case #3: found via reverse lookup
            if (cid in reverse) {
                obj.thread = _(obj.thread).filter(function (o) {
                    return _.cid(o) !== reverse[cid];
                });
                return true;
            }
            // otherwise
            return true;
        });

        try {
            return list;
        } finally {
            // avoid leaks
            list = reverse = hash = null;
        }
    };

    /**
     * @return {string} default folder for mail
     */
    api.getDefaultFolder = function () {
        return folderAPI.getDefaultFolder('mail');
    };

    /**
     * get account id
     * @param  {[type]} initialFolder (folder id)
     * @return {string} account id
     */
    api.getAccountIDFromFolder = function (initialFolder) {
        var accountId = /^default(\d*)\b/.exec(initialFolder);
        return accountId[1];
    };

    /**
     * beautifies mail text
     * @param  {string} str
     * @param  {integer} lengthLimit
     * @return {string}
     */
    api.beautifyMailText = function (str, lengthLimit) {
        lengthLimit = lengthLimit || 500;
        str = String(str)
            // remove line breaks
            .replace(/(\r\n|\n|\r)/gm, '')
            // limit overall length
            .substr(0, lengthLimit)
            // reduce dashes
            .replace(/-{3,}/g, '---')
            // remove quotes after line breaks
            .replace(/<br\s?\/?>(&gt;)+/ig, ' ')
            // remove line breaks
            .replace(/<br\s?\/?>/ig, ' ')
            // strip tags
            .replace(/<[^>]+(>|$)/g, '')
            // links
            .replace(/(http(s?):\/\/\S+)/i, '<a href="$1" target="_blank">http$2://...</a>')
            // convert to simple white space
            .replace(/&#160;/g, ' ')
            // reduce consecutive white space
            .replace(/\s{2,}/g, ' ');
        // trim
        return $.trim(str);
    };

    /**
     * imports mail as EML
     * @param  {object} options (file: {}, folder: string )
     * @fires  api#refresh.all
     * @return {deferred} returns array with objects (id, folder_id)
     */
    api.importEML = function (options) {
        options.folder = options.folder || api.getDefaultFolder();

        var form = new FormData();
        form.append('file', options.file);

        return http.UPLOAD({
                module: 'mail',
                params: {
                    action: 'import',
                    folder: options.folder,
                    // don't check from address!
                    force: true
                },
                data: form,
                fixPost: true
            })
            .pipe(function (data) {
                return api.caches.all.grepRemove(options.folder + DELIM).pipe(function () {
                    api.trigger('refresh.all');
                    folderAPI.reload(options.folder);
                    return data;
                });
            });
    };

    // send read receipt
    // data must include "folder" and "id"
    api.ack = function (data) {

        return accountAPI.getPrimaryAddressFromFolder(data.folder).then(function (addressArray) {

            var name = addressArray[0],
                address = addressArray[1],
                from = !name ? address : '"' + name + '" <' + address + '>';

            return http.PUT({
                module: 'mail',
                params: { action: 'receipt_ack' },
                data: _.extend({ from: from }, data)
            });
        });
    };

    // change API's default options if allowHtmlMessages changes
    settings.on('change:allowHtmlMessages', function (e, value) {
        api.options.requests.get.view = value ? 'noimg' : 'text';
        pool.get('detail').each(function (model) {
            model.unset('attachments', { silent: true });
        });
    });

    // RegExp suffix for recursive grepRemove:
    // id + '/' for subfolders or id + DELIM for the top folder
    var reSuffix = ')(?:/|' + _.escapeRegExp(DELIM) + ')';

    accountAPI.on('refresh.all create:account', function () {
        folderAPI.list('1', { cache: false }).done(function (folders) {
            var ids = _(folders)
                .chain()
                .filter(function (obj) {
                    return /^default/.test(obj.id) && accountAPI.isUnified(obj.id);
                })
                .map(function (obj) {
                    return _.escapeRegExp(obj.id);
                })
                .value();
            var re = new RegExp('(?:' + ids.join('|') + reSuffix);
            api.caches.all.grepRemove(re);
            folderAPI.pool.unfetch();
        });
    });

    //If the folder api creates a new folder in mail, the mail api needs to be refreshed
    folderAPI.on('create', function (e, data) {
        if (data.module === 'mail') {
            api.refresh();
        }
    });

    /**
     * sets title to 'New Mail' or default
     * @param  {boolean} state
     * @return {undefined}
     */
    api.newMailTitle = (function () {

        var interval = null, alt = false;

        function tick() {
            document.title = (alt = !alt) ? gt('New Mail') : document.customTitle;
        }

        function blink() {
            if (interval) return;
            // 1s is fast, 2s feels slow, 1.5 is compromise
            interval = setInterval(tick, 1500);
        }

        function original() {
            if (document.customTitle) document.title = document.customTitle;
            if (interval) { clearInterval(interval); interval = null; }
        }

        return function (state) {
            if (_.device('smartphone')) return;
            if (state === true) blink(); else original();
        };

    }());

    // publish pool
    api.pool = pool;

    // resolve a list of composite keys
    api.resolve = (function () {

        function map(cid) {
            // yep, also in non-threaded mails
            cid = String(cid).replace(/^thread\./, '');
            return pool.get('detail').get(cid);
        }

        return function (list, threaded) {
            // threaded
            if (threaded) return api.threads.resolve(list);
            // non-threaded
            return _(list).chain().map(map).compact().invoke('toJSON').value();
        };

    }());

    // simple thread support
    api.threads = {

        // keys are cid, values are array of flat cids
        hash: {},
        reverse: {},

        contains: function (cid) {
            return !!this.hash[cid];
        },

        getModels: function (cid) {
            if (!_.isString(cid)) return [];
            var thread = this.hash[cid] || [cid], collection = pool.get('detail');
            return _(thread)
                .chain()
                .map(collection.get, collection)
                .compact()
                .value();
        },

        get: function (cid) {
            return _(this.getModels(cid))
                .chain()
                .invoke('toJSON')
                .map(function injectIndex(obj, index) {
                    obj.index = index;
                    return obj;
                })
                .value();
        },

        // get 'head' data, for example, to show details of most recent message in list view
        head: function (data) {
            return data.head || data;
        },

        // propagate changed within a thread to root model
        touch: function (cid) {
            cid = _.isString(cid) ? cid : _.cid(cid);
            var top = this.reverse[cid];
            if (!top || top === cid) return;
            pool.propagate('change', _.extend({ timestamp: _.now() }, _.cid(top)));
        },

        // resolve a list of cids
        resolve: function (list) {
            return _(list).chain()
                .map(function (cid) {
                    // strip 'thread.' prefix
                    cid = String(cid).replace(/^thread\.(.+)$/, '$1');
                    // get thread
                    var thread = api.threads.get(cid);
                    return thread.length > 0 && thread;
                })
                .flatten().compact().value();
        },

        clear: function () {
            this.hash = {};
            this.reverse = {};
        },

        add: function (obj) {
            var cid = _.cid(obj);
            this.hash[cid] = obj.thread || [cid];
            _(this.hash[cid]).each(function (thread_cid) {
                this.reverse[thread_cid] = cid;
            }, this);
        },

        remove: function (cid) {
            cid = _.isString(cid) ? cid : _.cid(cid);
            var top = this.reverse[cid];
            if (!top || !this.hash[top]) return;
            this.hash[top] = _(this.hash[top]).without(cid);
        },

        size: function (cid) {
            cid = _.isString(cid) ? cid : _.cid(cid);
            var top = this.reverse[cid];
            if (!top) return 1;
            return (this.hash[top] || [cid]).length;
        }
    };

    // help garbage collector to find dependent models
    api.pool.getDependentModels = function (cid) {
        return api.threads.getModels(cid);
    };

    // collection loader
    api.collectionLoader = new CollectionLoader({
        module: 'mail',
        getQueryParams: function (params) {
            // use threads?
            if (params.thread === true) {
                return {
                    action: 'threadedAll',
                    folder: params.folder,
                    columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
                    sort: '610',
                    order: params.order || 'desc',
                    includeSent: !accountAPI.is('sent|drafts', params.folder),
                    max: (params.offset || 0) + 300,
                    timezone: 'utc'
                };
            } else {
                return {
                    action: 'all',
                    folder: params.folder,
                    columns: '102,600,601,602,603,604,605,607,608,610,611,614,652',
                    sort: params.sort || '610',
                    order: params.order || 'desc',
                    timezone: 'utc'
                };
            }
        }
    });

    function filterDeleted(item) {
        return !util.isDeleted(item);
    }

    api.processThreadMessage = function (obj) {

        // get thread
        var thread = obj.thread || [obj], list;

        // remove deleted mails
        thread = _(list = thread).filter(filterDeleted);
        // don't remove all if all marked as deleted
        if (thread.length === 0) thread = list.slice(0, 1);

        // we use the last item to generate the cid. More robust because unlikely to change.
        var last = _(thread).last();

        // get thread size - deleted messages are ignored; minimum is 1
        var size = thread.length;

        // store data of most recent message as head
        obj.head = _.extend({ threadSize: size }, obj);

        // Use last item's id and folder_id.
        // As we got obj by reference, such changes affect the CID
        // in the collection which is wanted behavior.
        _.extend(obj, last);

        // only store plain composite keys instead of full objects
        obj.thread = _(thread).map(_.cid);
        obj.threadSize = size;

        // also copy thread property to 'last' item to detect model changes
        last.thread = _(thread).map(_.cid);

        // add to thread hash - this must be done before the pool so that this
        // hash is up to date if the pool starts propagating changes.
        api.threads.add(obj);

        // add full models to pool
        api.pool.add('detail', thread);
    };

    api.collectionLoader.virtual = function (options) {
        // special handling for top-level mail account folders (e.g. bug 34818)
        if (/^default\d+$/.test(options.folder)) return [];
    };

    api.collectionLoader.each = function (obj, index, offset, params) {
        if (params.action === 'threadedAll') api.processThreadMessage(obj); else api.pool.add('detail', obj);
    };

    return api;
});
