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

define("io.ox/mail/api",
    ["io.ox/core/http",
     "io.ox/core/cache",
     "io.ox/core/config",
     "io.ox/core/api/factory",
     "io.ox/core/api/folder",
     "io.ox/core/api/account",
     "io.ox/core/notifications"], function (http, cache, config, apiFactory, folderAPI, accountAPI, notifications) {

    'use strict';

    var DONE = $.when(),
        DELAY = 1000 * 3, // 3 seconds
        DELIM = '//';

    var tracker = (function () {

        // simple temporary thread cache
        var threads = {},

            // stores CIDs to find items in threads
            // key is item CID, value is top-level item CID
            threadHash = {},

            // track mails that are manually marked as unseen
            explicitUnseen = {},
            unseen = {};

        var extend = function (a, b) {
            return _.extend(a, { flags: b.flags, color_label: b.color_label });
        };

        var calculateUnread = function (memo, obj) {
            return memo + ((obj.flags & 32) !== 32 ? 1 : 0);
        };

        var getCID = function (param) {
            return _.isString(param) ? param : _.cid(param);
        };

        var self = {

            addThread: function (obj) {
                var cid = getCID(obj);
                threads[cid] = obj.thread;
                _(obj.thread).each(function (o) {
                    threadHash[_.cid(o)] = cid;
                });
            },

            hasThread: function (obj) {
                var cid = getCID(obj);
                return cid in threads;
            },

            getThread: function (obj, copy) {
                var cid = getCID(obj),
                    thread = threads[cid] || [];
                return copy ? _.deepCopy(thread) : thread;
            },

            getThreadCID: function (obj) {
                var cid = getCID(obj);
                return threadHash[cid];
            },

            getThreadSize: function (obj) {
                var cid = getCID(obj);
                return cid in threads ? threads[cid].length : 0;
            },

            getUnreadCount: function (obj) {
                var cid = getCID(obj), root = threads[cid];
                return root === undefined ? 0 : _(root.thread).inject(calculateUnread, 0);
            },

            update: function (list, callback) {

                var hash = {};

                list = _(list).chain()
                    .map(function (obj) {
                        var cid = _.cid(obj), top = threadHash[cid];
                        hash[cid] = true;
                        return top in threads ? _(threads[top]).first() : null;
                    })
                    .compact().value();

                function process(obj) {
                    var cid = _.cid(obj);
                    if (cid in hash) {
                        callback(obj);
                    }
                }

                return api.updateAllCache(list, function (obj) {
                    process(obj);
                    _(obj.thread).each(process);
                });
            },

            reset: (function () {

                function reset(obj) {
                    var cid = _.cid(obj);
                    unseen[cid] = (obj.flags & 32) !== 32;
                }

                return function (list) {
                    _(list).each(function (obj) {
                        reset(obj);
                        _(obj.thread).each(reset);
                    });
                };

            }()),

            setUnseen: function (obj) {
                var cid = getCID(obj);
                explicitUnseen[cid] = _.now();
                unseen[cid] = true;
            },

            setSeen: function (obj) {
                var cid = getCID(obj);
                delete explicitUnseen[cid];
                unseen[cid] = false;
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
                var cid = getCID(obj);
                return !!unseen[cid];
            },

            applyAutoRead: function (obj) {
                var cid = getCID(obj);
                if (unseen[cid] === true) {
                    unseen[cid] = false;
                    delete explicitUnseen[cid];
                    api.markRead(obj);
                }
            },

            canAutoRead: function (obj) {
                var cid = getCID(obj);
                return this.isUnseen(cid) && (!(cid in explicitUnseen) || explicitUnseen[cid] < (_.now() - DELAY));
            }
        };

        return self;

    }());

    // generate basic API
    var api = apiFactory({
        module: "mail",
        keyGenerator: function (obj) {
            return obj ? (obj.folder_id || obj.folder) + '.' + obj.id + '.' + (obj.view || 'noimg') : '';
        },
        requests: {
            all: {
                folder: "default0/INBOX",
                columns: "601,600,611", // + flags
                sort: "610", // received_date
                order: "desc",
                deleted: 'false',
                cache: false // allow DB cache
            },
            list: {
                action: "list",
                columns: "102,600,601,602,603,604,605,607,610,611,614"
            },
            get: {
                action: "get",
                view: "noimg",
                embedded: "true"
            },
            getUnmodified: {
                action: "get",
                unseen: "true",
                view: "html",
                embedded: "true"
            },
            search: {
                action: "search",
                folder: "default0/INBOX",
                columns: "601,600",
                sort: "610",
                order: "desc",
                getData: function (query) {
                    return [
                        { col: 603, pattern: query }, // from
                        { col: 607, pattern: query }  // subject
                    ];
                }
            }
        },
        // composite key for "all" cache
        cid: function (o) {
            return (o.action || 'all') + ':' + o.folder + DELIM + [o.sort, o.order, o.max || 0, !!o.unseen, !!o.deleted].join('.');
        },

        fail: {
            get: function (e, params) {
                if (e.code === "MSG-0032") {
                    // mail no longer exists, so we remove it locally
                    api.remove([params], true).done(function () {
                        api.trigger('not-found');
                    });
                }
            }
        },
        // filter list request (special fix for nested messages; don't have folder; inline action checks fail)
        filter: function (obj) {
            return obj.folder_id !== undefined;
        },
        pipe: {
            all: function (response, opt) {
                // debug flags
//                _(response.data.slice(0, 7)).each(function (obj, i) {
//                    console.warn('server > all', i, _.cid(obj), 'seen?', (obj.flags & 32) === 32);
//                });
                // reset tracker! if we get a seen mail here, although we have it in 'explicit unseen' hash,
                // another devices might have set it back to seen.
                tracker.reset(response.data);
                // apply unread count
                folderAPI.setUnread(opt.folder, tracker.getUnreadCount(response.data));
                return response;
            },
            get: function (data) {
                // a mail should be always marked as seen on fetch
                data.flags = data.flags | 32;
                // was unseen?
                if (data.unseen) {
                    folderAPI.decUnread(data);
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
        }
    });

    // publish tracker
    api.tracker = tracker;

    api.SENDTYPE = {
        NORMAL:  0,
        REPLY:   1,
        FORWARD: 2,
        DRAFT:   3
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
        GREY:        4
    };

    // control for each folder:
    // undefined -> first fetch
    // true -> has been fetched in this session
    // false -> caused by refresh
    var cacheControl = {}, getAll = api.getAll;

    api.getAll = function (options, useCache) {
        // use cache?
        var cid = api.cid(options);
        if (useCache === 'auto') {
            useCache = (cacheControl[cid] !== false);
        }
        return getAll.call(this, options, useCache).done(function () {
            cacheControl[cid] = true;
        });
    };

    // ~ all
    api.getAllThreads = function (options, useCache) {
        // request for brand new thread support
        options = options || {};
        options = $.extend(options, {
            action: 'threadedAll',
            columns: '601,600,611,102', // +flags +color_label
            sort: options.sort || '610',
            sortKey: 'threaded-' + (options.sort || '610'),
            konfetti: true,
            order: options.order || 'desc',
            includeSent: !accountAPI.is('sent', options.folder),
            cache: false, // never use server cache
            max: 1000 // apply internal limit to build threads fast enough
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

    // get mails in thread
    api.getThread = function (obj) {

        var cid, thread, len;

        if (typeof obj === 'string') {
            cid = obj;
            obj = _.cid(obj);
        } else {
            cid = _.cid(obj);
            obj = api.reduce(obj);
        }

        if ((thread = tracker.getThread(cid)).length) {
            len = thread.length;
            return _(thread).map(function (obj, i) {
                return {
                    folder_id: obj.folder_id,
                    id: obj.id,
                    threadKey: cid,
                    threadPosition: len - i,
                    threadSize: len
                };
            });
        } else {
            return [{
                folder_id: obj.folder_id || obj.folder,
                id: obj.id,
                threadKey: cid,
                threadPosition: 1,
                threadSize: 1
            }];
        }
    };

    // ~ list
    api.getThreads = function (ids) {

        return this.getList(ids)
            .pipe(function (data) {
                // clone not to mess up with searches
                data = _.deepClone(data);
                // inject thread size
                var i = 0, obj;
                for (; (obj = data[i]); i++) {
                    obj.threadSize = tracker.getThreadSize(obj);
                    obj.unreadCount = tracker.getUnreadCount(obj);
                }
                return data;
            });
    };

    var update = function (list, data, apiAction) {

        // allow single object and arrays
        list = _.isArray(list) ? list : [list];

        // pause http layer
        http.pause();

        // now talk to server
        _(list).map(function (obj) {
            return http.PUT({
                module: 'mail',
                params: {
                    action: apiAction || 'update',
                    id: obj.id,
                    folder: obj.folder || obj.folder_id,
                    timestamp: _.now() // to be safe
                },
                data: data,
                appendColumns: false
            });
        });
        // resume & trigger refresh
        return http.resume().pipe(function () {
            // trigger update events
            _(list).each(function (obj) {
                api.trigger('update:' + _.cid(obj), obj);
            });
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
                    api.caches.all.grepRemove(targetFolderId + DELIM) // clear target folder
                );
            };
        };

    var refreshAll = function (obj) {
        $.when.apply($, obj).done(function () {
            api.trigger('refresh.all');
        });
    };

    api.update = function () {
        console.error('Do not call this directly because mail is so special');
    };

    api.updateAllCache = (function () {

        function update(folder_id, hash, callback) {
            // get proper keys (differ due to sort/order suffix)
            return api.caches.all.grepKeys(folder_id + DELIM).pipe(function (keys) {
                return $.when.apply($, _(keys).map(function (folder_id) {
                    return api.caches.all.get(folder_id).pipe(function (co) {
                        if (co && co.data) {
                            // update affected items
                            return $.when.apply($,
                                _(co.data).map(function (obj) {
                                    if (_.cid(obj) in hash) {
                                        callback(obj);
                                        return $.when(
                                            api.caches.list.merge(obj),
                                            api.caches.get.merge(obj)
                                        );
                                    } else {
                                        return DONE;
                                    }
                                })
                            ).pipe(function () {
                                return api.caches.all.add(folder_id, co);
                            });
                        } else {
                            return DONE;
                        }
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

    api.changeColor = function (list, label, local) {

        list = [].concat(list);

        return $.when(
            tracker.update(list, function (obj) {
                obj.color_label = label;
            })
            .done(function () { api.trigger('refresh.list'); }),
            local ? DONE : update(list, { color_label: label })
        );

    };

    api.markUnread = function (list, local) {

        list = [].concat(list);

        return $.when(
            tracker.update(list, function (obj) {
                tracker.setUnseen(obj);
                obj.flags = obj.flags & ~32;
            })
            .done(function () { api.trigger('refresh.list'); }),
            local ? DONE : update(list, { flags: api.FLAGS.SEEN, value: false })
        );
    };

    api.markRead = function (list, local) {

        list = [].concat(list);

        return $.when(
            tracker.update(list, function (obj) {
                tracker.setSeen(obj);
                obj.flags = obj.flags | 32;
            })
            .done(function () { api.trigger('refresh.list'); }),
            local ? DONE : update(list, { flags: api.FLAGS.SEEN, value: true })
        );
    };

    api.markSpam = function (list) {
        return update(list, { flags: api.FLAGS.SPAM, value: true })
            .pipe(function () {
                return $.when(
                    // clear source folder
                    api.caches.all.grepRemove(_(list).first().folder_id + DELIM)
                );
            })
            .done(refreshAll);
    };

    api.move = function (list, targetFolderId) {
        // call updateCaches (part of remove process) to be responsive
        return api.updateCaches(list).pipe(function () {
            // trigger visual refresh
            api.trigger('refresh.all');
            // start update on server
            return update(list, { folder_id: targetFolderId })
                .pipe(function () {
                    list = _.isArray(list) ? list : [list];
                    return _(list).map(function (obj) {
                        return (clearCaches(obj, targetFolderId))();
                    });
                })
                .done(function () {
                    notifications.yell('success', 'Mail has been moved');
                });
        });
    };

    api.copy = function (list, targetFolderId) {
        return update(list, { folder_id: targetFolderId }, 'copy')
            .pipe(clearCaches(list, targetFolderId))
            .done(refreshAll)
            .done(function () {
                notifications.yell('success', 'Mail has been copied');
            });
    };

    var react = function (action, obj, view) {
        // get proper view first
        view = $.trim(view || 'text').toLowerCase();
        view = view === 'text/plain' ? 'text' : view;
        view = view === 'text/html' ? 'html' : view;
        return http.PUT({
                module: 'mail',
                params: {
                    action: action || '',
                    view: view
                },
                data: _([].concat(obj)).map(function (obj) {
                    return api.reduce(obj);
                }),
                appendColumns: false
            })
            .pipe(function (data) {
                var text = '', quote = '', tmp = '';
                // transform pseudo-plain text to real text
                if (data.attachments && data.attachments.length) {
                    if (data.attachments[0].content === '') {
                        // nothing to do - nothing to break
                    } else if (data.attachments[0].content_type === 'text/plain') {
                        $('<div>')
                            // escape everything but BR tags
                            .html(data.attachments[0].content.replace(/<(?!br)/ig, '&lt;'))
                            .contents().each(function () {
                                if (this.tagName === 'BR') {
                                    text += "\n";
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
                                    tmp += (quote !== '' ? '<blockquote><p>' + quote + '</p></blockquote>' : '') + line + '\n';
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
                } else {
                    data.attachments = data.attachments || [{}];
                    data.attachments[0].content = '';
                }
                return data;
            });
    };

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

    api.getSource = function (obj) {
        return this.get({
            action: 'get',
            id: obj.id,
            src: 1,
            folder: obj.folder || obj.folder_id,
            view: 'html'
        }, false);
    };

    api.replyall = function (obj, view) {
        return react('replyall', obj, view);
    };

    api.reply = function (obj, view) {
        return react('reply', obj, view);
    };

    api.forward = function (obj, view) {
        return react('forward', obj, view);
    };

    api.send = function (data, files) {

        var deferred = $.Deferred();

        if (Modernizr.file) {
            handleSendXHR2(data, files, deferred);
        } else {
            handleSendTheGoodOldWay(data, files, deferred);
        }

        return deferred;
    };

    function handleSendXHR2(data, files, deferred) {
        var form = new FormData(),
            flatten = function (recipient) {
                return '"' + (recipient[0] || '').replace(/^["']+|["']+$/g, '') + '" <' + recipient[1] + '>';
            };

        // clone data (to avoid side-effects)
        data = _.clone(data);

        // flatten from, to, cc, bcc
        data.from = _(data.from).map(flatten).join(', ');
        data.to = _(data.to).map(flatten).join(', ');
        data.cc = _(data.cc).map(flatten).join(', ');
        data.bcc = _(data.bcc).map(flatten).join(', ');

        // add mail data
        form.append('json_0', JSON.stringify(data));
        // add files
        _(files).each(function (file, index) {
            form.append('file_' + index, file);
        });

        http.UPLOAD({
                module: 'mail',
                params: { action: 'new' },
                data: form,
                dataType: 'text'
            })
            .done(function (text) {
                // process HTML-ish non-JSONP response
                var a = text.indexOf('{'),
                b = text.lastIndexOf('}');
                if (a > -1 && b > -1) {
                    deferred.resolve(JSON.parse(text.substr(a, b - a + 1)));
                } else {
                    deferred.resolve({});
                }
                // wait a moment, then update mail index
                setTimeout(function () {
                    api.getAllThreads({}, false)
                        .done(function (data) {
                            api.trigger('refresh.all');
                        });
                }, 3000);
            })
            .fail(deferred.reject);
    }

    function handleSendTheGoodOldWay(data, files, deferred) {
        var form = $('.io-ox-mail-write form'),
            flatten = function (recipient) {
                return '"' + (recipient[0] || '').replace(/^["']+|["']+$/g, '') + '" <' + recipient[1] + '>';
            };

        // clone data (to avoid side-effects)
        data = _.clone(data);

        // flatten from, to, cc, bcc
        data.from = _(data.from).map(flatten).join(', ');
        data.to = _(data.to).map(flatten).join(', ');
        data.cc = _(data.cc).map(flatten).join(', ');
        data.bcc = _(data.bcc).map(flatten).join(', ');


        var uploadCounter = 0;
        $(':input:enabled', form).each(function (index, field) {
            var jqField = $(field);
            if (jqField.attr('type') === 'file') {
                jqField.attr('name', 'file_' + uploadCounter);
                uploadCounter++;
            }
        });

        // add mail data
        if ($('input[name="json_0"]', form).length === 0) {
            $(form).append($('<input>', {'type': 'hidden', 'name': 'json_0', 'value': JSON.stringify(data)}));
        } else {
            $('input[name="json_0"]', form).val(JSON.stringify(data));
        }

        var tmpName = 'iframe_' + _.now(),
            frame = $('<iframe>', {'name': tmpName, 'id': tmpName, 'height': 1, 'width': 1});
        $('.io-ox-mail-write').append(frame);

        $(form).attr({
            method: 'post',
            action: ox.apiRoot + '/mail?action=new&session=' + ox.session,
            target: tmpName
        });

        $(form).submit();

        window.callback_new = function (response) {
            $('#' + tmpName).remove();
            deferred[(response && response.error ? 'reject' : 'resolve')](response);
            window.callback_new = null;
        };
    }

    api.saveAttachments = function (list, target) {
        // be robust
        target = target || config.get('folder.infostore');
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
                data: { folder_id: target, description: 'Saved mail attachment' },
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

    api.getUrl = function (data, mode) {
        var url = ox.apiRoot + '/mail', first;
        if (mode === 'zip') {
            first = _(data).first();
            return url + '?' + $.param({
                action: 'zip_attachments',
                folder: (first.parent || first.mail).folder_id,
                id: (first.parent || first.mail).id,
                attachment: _(data).pluck('id').join(','),
                session: ox.session // required here!
            });
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
                return url + '?' + $.param($.extend(api.reduce(first), {
                    action: 'get',
                    src: 1,
                    save: 1,
                    session: ox.session
                }));
            }
        } else {
            // inject filename for more convenient file downloads
            url += (data.filename ? '/' + encodeURIComponent(data.filename) : '') + '?' +
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

    api.checkInbox = function () {
        // look for new unseen mails in INBOX
        return http.GET({
            module: 'mail',
            params: {
                action: 'all',
                folder: 'default0/INBOX',
                columns: '610,600,601', //received_date, id, folder_id
                unseen: 'true',
                deleted: 'false',
                sort: '610',
                order: 'desc'
            }
        })
        .pipe(function (unseen) {
            var recent;
            // found unseen mails?
            if (unseen.length) {
                // check most recent mail
                recent = _(unseen).filter(function (obj) {
                    return obj.received_date > lastUnseenMail;
                });
                if (recent.length > 0) {
                    api.trigger('new-mail', recent);
                    lastUnseenMail = recent[0].received_date;
                }
                api.trigger('unseen-mail', unseen);
            }
            return {
                unseen: unseen,
                recent: recent || []
            };
        });
    };

    // refresh
    api.refresh = function (e) {
        if (ox.online) {
            // reset cache control
            _(cacheControl).each(function (val, cid) {
                cacheControl[cid] = false;
            });
            api.checkInbox().done(function () {
                // trigger
                api.trigger('refresh.all');
            });
        }
    };

    api.localRemove = function (list, hash) {
        // reverse lookup first to get affacted top-level elements
        var reverse = {};
        _(hash).each(function (obj) {
            var threadCID = tracker.getThreadCID(obj);
            if (threadCID !== undefined) {
                reverse[threadCID] = true;
            }
        });
        // loop over list and check occurence via hash
        return _(list).filter(function (obj) {
            var cid = _.cid(obj), found = cid in hash, length = obj.thread.length, s, entire;
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
                    return _.cid(o) !== cid;
                });
                return true;
            }
            // otherwise
            return true;
        });
    };

    api.getDefaultFolder = function () {
        return folderAPI.getDefaultFolder('mail');
    };

    api.getAccountIDFromFolder = function (inintialFolder) {
        var accountId = /^default(\d*)\b/.exec(inintialFolder);
        return accountId[1];
    };

    api.beautifyMailText = function (str, lengthLimit) {
        lengthLimit = lengthLimit || 500;
        str = String(str)
            .substr(0, lengthLimit) // limit overall length
            .replace(/-{3,}/g, '---') // reduce dashes
            .replace(/<br\s?\/?>(&gt;)+/ig, ' ') // remove quotes after line breaks
            .replace(/<br\s?\/?>/ig, ' ') // remove line breaks
            .replace(/<[^>]+(>|$)/g, '') // strip tags
            .replace(/(http(s?):\/\/\S+)/i, '<a href="$1" target="_blank">http$2://...</a>') // links
            .replace(/&#160;/g, ' ') // convert to simple white space
            .replace(/\s{2,}/g, ' '); // reduce consecutive white space
        // trim
        return $.trim(str);
    };

    // import mail as EML
    api.importEML = function (options) {

        options.folder = options.folder || api.getDefaultFolder();

        var form = new FormData();
        form.append('file', options.file);

        return http.UPLOAD({
                module: 'mail',
                params: {
                    action: 'import',
                    folder: options.folder,
                    force: true // don't check from address!
                },
                data: form,
                fixPost: true
            })
            .pipe(function (data) {
                return api.caches.all.grepRemove(options.folder + DELIM).pipe(function () {
                    api.trigger('refresh.all');
                    return data;
                });
            });
    };

    return api;
});
