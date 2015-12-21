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

define('io.ox/mail/api', [
    'io.ox/core/http',
    'io.ox/core/cache',
    'settings!io.ox/core',
    'io.ox/core/api/factory',
    'io.ox/core/folder/api',
    'io.ox/contacts/api',
    'io.ox/core/api/account',
    'io.ox/core/notifications',
    'io.ox/mail/util',
    'io.ox/core/api/collection-pool',
    'io.ox/core/api/collection-loader',
    'io.ox/core/tk/visibility-api-util',
    'settings!io.ox/mail',
    'gettext!io.ox/mail',
    'io.ox/core/capabilities'
], function (http, cache, coreConfig, apiFactory, folderAPI, contactsAPI, accountAPI, notifications, util, Pool, CollectionLoader, visibilityApi, settings, gt, capabilities) {

    // SHOULD NOT USE notifications inside API!

    'use strict';

    var DELIM = '//';

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
                columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652',
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

        // fail: {
        //     get: function (e, ids) {
        //         if (e.code === 'MSG-0032') {
        //             // mail no longer exists, so we remove it from caches
        //             // we don't trigger any event here, as it might run into cyclic event chains
        //             api.updateCaches([ids]);
        //         }
        //     }
        // },

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
                return response;
            },
            get: function (data, options) {
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
        api.options.requests.get.view = 'text';
        if (settings.get('allowHtmlMessages', true)) {
            api.options.requests.get.view = settings.get('allowHtmlImages', false) ? 'html' : 'noimg';
        }
        //special event to redraw current detailview
        api.trigger('viewChanged');
    };

    api.separator = settings.get('defaultseparator', '/');

    api.SENDTYPE = {
        NORMAL:     0,
        REPLY:      1,
        FORWARD:    2,
        EDIT_DRAFT: 3,
        DRAFT:      4
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

    var get = api.get,
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
            // delete potential 'cid' attribute (see bug 40136); otherwise the mail gets lost
            delete data.cid;
            //don't save raw data in our models. We only want preformated content there
            if (!obj.view || (obj.view && obj.view !== 'raw')) {
                // either update or add model
                if (model) {
                    // if we already have a model we promote changes for threads
                    model.set(data);
                    propagate(model);
                } else {
                    // add new model
                    pool.add('detail', data);
                }
            }
        });
    };

    api.getAll = function (options, useCache) {
        options = options || {};

        // special handling for top-level mail account folders
        if (/^default\d+$/.test(options.folder)) return $.when([]);

        // support for from-to
        if (options.sort === 'from-to') {
            options.sort = accountAPI.is('sent|drafts', options.folder) ? 604 : 603;
        }

        return getAll.call(this, options, useCache);
    };

    /**
     * pipes getList() to remove typesuffix from sender
     * @param  {array} ids
     * @param  {boolean} useCache (default is true)
     * @param  {object} options
     * @return { deferred }
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

    //
    // Utility functions
    //

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

    function resetFolderByType(type) {
        return pool.resetFolder(accountAPI.getFoldersByType(type));
    }

    function unsetSorted(list, sort) {
        _(list)
            .chain()
            .pluck('folder_id')
            .uniq()
            .map(pool.getBySorting.bind(pool, sort))
            .flatten()
            .each(function (collection) {
                collection.sorted = false;
            });
    }

    /**
     * wrapper for factories remove to update counters
     * @param  {array} ids
     * @param  {object} options [see api factory]
     * @return { deferred} resolves as array
     */
    api.remove = (function () {

        var pending = false, queue = [], wait = $.Deferred();

        var dequeue = _.debounce(function () {
            if (queue.length) {
                remove(queue).always(wait.resolve);
                queue = [];
                wait = $.Deferred();
            } else {
                pending = false;
            }
        }, 5000);

        function enqueue(ids) {
            queue = queue.concat(ids);
            return wait.promise();
        }

        function remove(ids) {
            pending = true;
            return http.wait(
                // wait a short moment, so that the UI reacts first, i.e. triggers
                // the next message; apparently a "delete" blocks that otherwise
                _.wait(100).then(function () {
                    return http.PUT({
                        module: 'mail',
                        params: { action: 'delete', withFolders: true, timestamp: _.then() },
                        data: http.simplify(ids),
                        appendColumns: false
                    })
                    .done(function (data) {
                        // update affected folders
                        _(data.folders).each(function (item) {
                            folderAPI.pool.getModel(item.folder_id).set(_(item).pick('total', 'unread'));
                        });
                        // trigger delete to update notification area
                        api.trigger('delete');
                        api.trigger('deleted-mails', ids);
                        // if this is a trash folder trigger special event (quota updates)
                        // checking the first id is enough, all id's must be from the same folder anyway when using our UI
                        if (accountAPI.is('trash', ids[0].folder_id)) {
                            api.trigger('deleted-mails-from-trash');
                        }
                    })
                    .fail(function () {
                        // something went wrong; let's kind of rollback
                        api.trigger('refresh.all');
                    })
                    .always(dequeue);
                })
            );
        }

        return function (ids, all) {
            try {
                // avoid parallel delete requests
                return pending ? enqueue(ids) : remove(ids);
            } finally {
                // try/finally is used to set up http.wait() first
                // otherwise we run into race-conditions (see bug 37707)
                prepareRemove(ids, all);
            }
        };

    }());

    /**
     * archives a list of files
     * @param  {array} ids
     * @return { deferred}
     */
    api.archive = function (ids) {

        if (!_.isArray(ids) || ids.length === 0) return;

        prepareRemove(ids);

        return http.wait(
            http.PUT({
                module: 'mail',
                params: { action: 'archive', timestamp: _.then() },
                data: http.simplify(ids)
            })
            .done(function (data) {
                // backend tells us the if the archive folder is new and its id
                if (data.created) {
                    // update account data
                    accountAPI.reload().done(function () {
                        // refresh all folders because the archive folder might be new
                        folderAPI.refresh();
                        // reload mail views
                        api.trigger('refresh.all');
                    });
                } else {
                    folderAPI.reload(data.id);
                }
            })
        );
    };

    //
    // Archive all messages inside a folder which are older than 90 days
    //
    api.archiveFolder = function (id) {

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
     * @return { deferred} returns array of threads
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

        return getAll.call(this, options, useCache, null, false);
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
                //give response if its a copy action (to look if there was an error)
                //not doing this as a standardaction to prevent errors with functions looking only for the list parameter
                return { list: list, response: response };
            }
            // return list
            return list;
        });
    };

    api.update = function () {
        console.error('Do not call this directly because mail is so special');
    };

    api.on('not-found', function () {
        api.trigger('refresh.list');
    });

    /**
     * cleaning up
     * @param  {string]} folder_id
     * @fires  api#refresh.all
     * @return { deferred }
     */
    api.expunge = function (folder_id) {

        // remove deleted messages immediately
        _(pool.getByFolder(folder_id)).each(function (collection) {
            collection.set(
                collection.filter(function (model) {
                    return !util.isDeleted(model.toJSON());
                })
            );
        });

        return http.PUT({
            module: 'mail',
            appendColumns: false,
            params: { action: 'expunge' },
            data: [folder_id]
        })
        .done(function () {
            folderAPI.reload(folder_id);
        });
    };

    //
    // Respond to folder API events
    //

    folderAPI.on({
        'before:clear': function (id) {
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
     * @fires  api#refresh.list
     * @return { promise} done returns list of mails in current folder
     */
    api.changeColor = function (list, label) {

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
            api.trigger('update:' + _.ecid(obj), obj);
        });

        return http.wait(
            update(list, { color_label: label })
        ).done(function () {
            unsetSorted(list, 102);
        });
    };

    /**
     * marks list of mails unread
     * @param {array} list
     * @fires api#refresh.list
     * @return { deferred }
     */
    api.markUnread = function (list) {
        list = [].concat(list);

        _(list).each(function (obj) {
            obj.flags = obj.flags & ~32;
            pool.propagate('change', {
                id: obj.id,
                folder_id: obj.folder_id,
                flags: obj.flags
            });
            // update thread model
            api.threads.touch(obj);
            api.trigger('update:' + _.ecid(obj), obj);
            api.trigger('refresh.unseen', list);
        });

        return update(list, { flags: api.FLAGS.SEEN, value: false }).done(function () {
            unsetSorted(list, 651);
            folderAPI.reload(list);
        });
    };

    /**
     * marks list of mails read
     * @param {array} list
     * @fires api#refresh.list
     * @fires api#update:set-seen (list)
     * @return { deferred }
     */
    api.markRead = function (list) {

        list = [].concat(list);

        _(list).each(function (obj) {
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
            api.trigger('refresh.seen', list);
            api.trigger('update:set-seen', list); // used by notification area
        });

        return update(list, { flags: api.FLAGS.SEEN, value: true }).done(function () {
            unsetSorted(list, 651);
            folderAPI.reload(list);
        });
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
        // reset spam folder; we assume that the spam handler will move the message to the spam folder
        resetFolderByType('spam');

        return update(list, { flags: api.FLAGS.SPAM, value: true }).fail(notifications.yell);
    };

    api.noSpam = function (list) {

        prepareRemove(list);
        // reset inbox; we assume that the spam handler will move the message (back) to the inbox
        resetFolderByType('inbox');

        return update(list, { flags: api.FLAGS.SPAM, value: false }).fail(notifications.yell);
    };

    // combines move & copy
    function transfer(type, list, targetFolderId) {

        // mark target folder as expired
        pool.resetFolder(targetFolderId);

        return http.wait(
            update(list, { folder_id: targetFolderId }, type).then(function (response) {
                // assume success
                api.trigger(type, list, targetFolderId);
                folderAPI.reload(targetFolderId, list);
                // any errors? (debugging code below)
                var error = _(response).find(function (item) { return !!item.error; });
                if (error) return $.Deferred().reject(error);
            })
        );
    }

    // debugging error
    // response[0] = {
    //     error: 'Die zulässige Quota auf dem Mailserver \"dovecot.qa.open-xchange.com\" wurde überschritten.',
    //     error_params: ['dovecot.qa.open-xchange.com ', 'applause40', 42, 26, 'NO [OVERQUOTA] Quota exceeded (mailbox for user is full) (0.000 secs).'],
    //     code: 'MSG-1024'
    // };

    /**
     * move mails to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @fires  api#refresh.all
     * @fires  api#move (list, targetFolderId)
     * @return { deferred }
     */
    api.move = function (list, targetFolderId, all) {
        try {
            return transfer('update', list, targetFolderId);
        } finally {
            // try/finally is used so that transfer() set up http.wait()
            // otherwise we run into race-conditions (see bug 37707)
            prepareRemove(list, all);
        }
    };

    /**
     * copies a number of mails to another folder
     * @param  {array} list
     * @param  {string} targetFolderId
     * @return { deferred }
     */
    api.copy = function (list, targetFolderId) {
        return transfer('copy', list, targetFolderId);
    };

    var parseMsgref = function (msgref) {
        var base = _(msgref.toString().split(api.separator)),
            id = base.last(),
            folder = base.without(id).join(api.separator);
        return { folder_id: folder, id: id };
    };

    api.autosave = function (obj) {
        try {
            return http.wait(
                http.PUT({
                    module: 'mail',
                    params: {
                        action: 'autosave'
                    },
                    data: obj,
                    appendColumns: false
                })
            .then(function (result) {

                // reset draft folder
                var draftsFolder = accountAPI.getFoldersByType('drafts');
                pool.resetFolder(draftsFolder);
                folderAPI.reload(draftsFolder);
                api.trigger('refresh.all');
                return result;
            }));
        } finally {
            // try/finally is used to set up http.wait() first
            if (obj.msgref) prepareRemove(parseMsgref(obj.msgref));
        }
    };

    // composition space id
    api.csid = function () {
        return _.uniqueId() + '.' + _.now();
    };

    var react = function (action, obj, view) {
        var isDraft = (action === 'edit'),
            isAlternative = (view === 'alternative');

        if (isAlternative) view = obj.content_type === 'text/plain' ? 'text' : 'html';

        // get proper view first
        view = $.trim(view || 'text').toLowerCase();
        view = view === 'text/plain' ? 'text' : view;
        view = view === 'text/html' ? 'html' : view;

        if (view === 'html' && obj.content_type === 'text/plain' && !isDraft) view = 'text';
        if (view === 'text' && obj.content_type === 'text/plain' && isDraft) view = 'raw';

        // attach original message on touch devices?
        var attachOriginalMessage = view === 'text' && Modernizr.touch && settings.get('attachOriginalMessage', false) === true,
            csid = api.csid();

        return http.PUT({
            module: 'mail',
            // using jQuery's params because it ignores undefined values

            params: $.extend({}, {
                action: isDraft ? 'get' : action || '',
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
            var text = '',
                tmp = '';
            // inject csid
            data.csid = csid;
            // transform pseudo-plain text to real text
            if (data.attachments && data.attachments.length) {
                if (data.attachments[0].content === '') {
                    // nothing to do - nothing to break
                } else if (data.attachments[0].content_type === 'text/html') {
                    // content-type specific
                    // robust approach for large mails
                    tmp = document.createElement('DIV');
                    tmp.innerHTML = data.attachments[0].content;
                    _(tmp.getElementsByTagName('BLOCKQUOTE')).each(function (node) {
                        node.removeAttribute('style');
                    });
                    text = tmp.innerHTML;
                    tmp = null;
                } else {
                    text = $.trim(data.attachments[0].content);
                }
            } else {
                data.attachments = data.attachments || [{}];
            }
            // replace
            data.attachments[0].content = text;
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
     * @return { deferred} obj (mail object)
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
                        }
                        return false;
                    })
                    .first().value();
            });
        }
        console.error('api.getUnmodified(). Invalid case.', obj);
        return $.Deferred().resolve(obj);
    };

    /**
     * get source code of specified mail
     * @param  {object} obj (mail)
     * @return { deferred} returns source string
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
     * @return { deferred} done returns prepared object
     */
    api.replyall = function (obj, view) {
        return react('replyall', obj, view);
    };

    /**
     * prepares object content for 'reply' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return { deferred} done returns prepared object
     */
    api.reply = function (obj, view) {
        return react('reply', obj, view);
    };

    /**
     * prepares object content for 'forward' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return { deferred} done returns prepared object
     */
    api.forward = function (obj, view) {
        return react('forward', obj, view);
    };

    /**
     * prepares object content for 'edit' action
     * @param  {object} obj (mail object)
     * @param  {string} view (html or text)
     * @return { deferred} done returns prepared object
     */
    api.edit = function (obj, view) {
        return react('edit', obj, view);
    };

    /**
     * sends a mail
     * @param  {object} data (mail object)
     * @param  {array} files
     * @param  {jquery} form (for 'oldschool')
     * @fires  api#refresh.all
     * @fires  api#refresh.list
     * @return { deferred }
     */
    api.send = function (data, files, form) {
        var deferred,
            flatten = function (recipient) {
                var name = $.trim(recipient[0] || '').replace(/^["']+|["']+$/g, ''),
                    address = String(recipient[1] || ''),
                    typesuffix = recipient[2] || '',
                    isMSISDN = typesuffix === '/TYPE=PLMN';

                // don't send display name for MSISDN numbers
                if (isMSISDN && !/\/TYPE=PLMN$/.test(address)) {
                    name = null;
                    address = address + typesuffix;
                }
                // otherise ... check if name is empty or name and address are identical
                if (name === '' || name === address) name = null;
                return [name, address];
            };

        // clone data (to avoid side-effects)
        data = _.clone(data);

        // flatten from, to, cc, bcc
        data.from = _(data.from).map(flatten);
        data.to = _(data.to).map(flatten);
        data.cc = _(data.cc).map(flatten);
        data.bcc = _(data.bcc).map(flatten);

        function mapArgs(obj) {
            return {
                'args': [{ 'com.openexchange.groupware.contact.pairs': [{ 'folder': obj.folder_id, 'id': obj.id }] }],
                'identifier': 'com.openexchange.contact'
            };
        }

        if (data.contacts_ids) {
            data.datasources = _.chain(data.contacts_ids).map(mapArgs).value();
        }

        api.trigger('beforesend', { data: data, files: files, form: form });
        ox.trigger('mail:send:start', data, files);

        deferred = handleSendXHR2(data, files, deferred);

        return deferred
            .done(function () {
                contactsAPI.trigger('maybyNewContact');
                api.trigger('send', { data: data, files: files, form: form });
                ox.trigger('mail:send:stop', data, files);
            })
            .fail(function () {
                ox.trigger('mail:send:fail');
            })
            .then(function (text) {
                // wait a moment, then update mail index
                setTimeout(function () {
                    resetFolderByType('inbox');
                    resetFolderByType('sent');
                    resetFolderByType('drafts');
                    api.trigger('refresh.all');
                }, 3000);
                // IE9
                if (_.isObject(text)) return text;
                // process HTML-ish non-JSONP response
                var a = text.indexOf('{'),
                    b = text.lastIndexOf('}');
                if (a > -1 && b > -1) {
                    return JSON.parse(text.substr(a, b - a + 1));
                }
                return {};
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
            if (window.cordova && _.device('android')) {
                form.append('file_' + index, file, file.name);
            } else {
                form.append('file_' + index, file);
            }
        });

        return http.UPLOAD({
            module: 'mail',
            params: {
                action: 'new'
            },
            data: form,
            dataType: 'json',
            fixPost: true
        });
    }

    /**
     * save mail attachments in files app
     * @param  {array} list
     * @param  {string} target (folder id) [optional]
     * @fires  api#refresh.all
     * @return { deferred }
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
                fileAPI.pool.resetFolder(target);
                fileAPI.trigger('add:file');
            });
        });
    };

    /**
     * get url for attachment in requested mode
     * @param  {object} data (attachment)
     * @param  {string} mode ('download', 'zip', 'email, 'view', 'open')
     * @return { string} url
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
            }
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
    };

    var lastUnseenMail = 0;

    /**
     * checks inbox for new mails
     * @fires api#new-mail (recent, unseen)
     * @return { deferred} done returns { unseen: [], recent: [] }
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
     * @return { promise }
     */
    api.refresh = function () {
        // do not react on events when user has no mail (e.g. drive only)
        if (!ox.online || !capabilities.has('webmail')) return;
        return api.checkInbox().always(function () {
            api.trigger('refresh.all');
        });
    };

    /**
     * @return { string} default folder for mail
     */
    api.getDefaultFolder = function () {
        return folderAPI.getDefaultFolder('mail');
    };

    /**
     * get account id
     * @param  {[type]} initialFolder (folder id)
     * @return { string} account id
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
     * @return { deferred} returns array with objects (id, folder_id)
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
        .done(function () {
            pool.resetFolder(options.folder);
            folderAPI.reload(options.folder);
            api.trigger('refresh.all');
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

    accountAPI.on('refresh.all create:account', function () {
        folderAPI.list('1', { cache: false }).done(function () {
            folderAPI.pool.unfetch();
        });
    });

    //If the folder api creates a new folder in mail, the mail api needs to be refreshed
    folderAPI.on('create', function (data) {
        if (data.module === 'mail') api.refresh();
    });

    /**
     * sets title to 'New Mail' or default
     * @param  {boolean} state
     * @return { undefined }
     */
    api.newMailTitle = (function () {

        var interval = null, alt = false;

        $(visibilityApi).on('visibility-changed', function (e, data) {
            //remove new mail title if page becomes visible again
            if (data.currentHiddenState === false) {
                original();
            }
        });

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
            if (_.device('smartphone') || !visibilityApi.isHidden) return;
            if (state === true) blink(); else original();
        };

    }());

    // publish pool
    api.pool = pool;

    // resolve a list of composite keys
    api.resolve = (function () {

        function map(cid) {
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
        collection: {},

        contains: function (cid) {
            return !!this.hash[cid];
        },

        getModels: function (cid) {
            if (!_.isString(cid)) return [];

            var thread = this.hash[cid] || [cid];
            if (_.isEmpty(this.collection)) {
                this.collection = pool.get('detail');
            }
            return _(thread)
                .chain()
                .map(this.collection.get, this.collection)
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
                    columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656',
                    sort: '610',
                    order: params.order || 'desc',
                    includeSent: !accountAPI.is('sent|drafts', params.folder),
                    max: (params.offset || 0) + 300,
                    timezone: 'utc'
                };
            }
            return {
                action: 'all',
                folder: params.folder,
                columns: '102,600,601,602,603,604,605,606,607,608,610,611,614,652,656',
                sort: params.sort || '610',
                order: params.order || 'desc',
                timezone: 'utc'
            };
        },
        fail: function (error) {
            api.trigger('error error:' + error.code, error);
            return error;
        },

        PRIMARY_PAGE_SIZE: settings.get('listview/primaryPageSize', 50),
        SECONDARY_PAGE_SIZE: settings.get('listview/secondaryPageSize', 200)
    });

    function filterDeleted(item) {
        return !util.isDeleted(item);
    }

    function getThreadList(obj) {
        // thread references returned within object
        if (obj.thread) return obj.thread;
        // may thread references already available in pool
        var current = api.threads.get(_.cid(obj)) || {};
        if (current && current.length > 1) return current;
        // no thread references at all
        return [obj];
    }

    api.processThreadMessage = function (obj) {

        // get thread
        var thread = getThreadList(obj), list;

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
