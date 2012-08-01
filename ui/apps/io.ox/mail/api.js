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
     "io.ox/core/config",
     "io.ox/core/cache",
     "io.ox/core/api/factory",
     "io.ox/core/api/folder",
     "io.ox/core/api/account"], function (http, config, cache, apiFactory, folderAPI, accountAPI) {

    "use strict";

    // simple temporary thread cache
    var threads = {},
        threadHash = {},
        unreadCount = {};

    // default separator
    var separator = config.get('modules.mail.defaultseparator', '/');

    // helper: get number of mails in thread

    var getThreadSize = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return key in threads ? threads[key].length - 1 : 0;
    };

    var getUnreadCount = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return key in unreadCount ? unreadCount[key] : 0;
    };

    var getThreadRoot = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return key in threadHash ? threadHash[key] : '';
    };

    var decUnreadCount = function (obj) {
        var key = getThreadRoot(obj);
        if (key in unreadCount) {
            unreadCount[key] = Math.max(0, unreadCount[key] - 1);
        }
    };

    var incUnreadCount = function (obj) {
        var key = getThreadRoot(obj);
        if (key in unreadCount) {
            unreadCount[key]++;
        }
    };

    // lookup hash for flags & color_label (since mail has no "updates")
    var latest = {};

    // remember latest state
    var updateLatest = function (data) {
        var cid = data.folder_id + '.' + data.id;
        if (cid in latest) {
            if ('flags' in data) { latest[cid].flags = data.flags; }
            if ('color_label' in data) { latest[cid].color_label = data.color_label; }
        }
        return data;
    };

    // apply latest state of flag & color_label on mail
    var applyLatest = function (data) {
        if (data) {
            var cid = data.folder_id + '.' + data.id, obj;
            if (cid in latest) {
                obj = latest[cid];
                data.flags = obj.flags;
                data.color_label = obj.color_label;
            }
        }
        return data;
    };

    // generate basic API
    var api = apiFactory({
        module: "mail",
        requests: {
            all: {
                folder: "default0/INBOX",
                columns: "601,600,611", // + flags
                sort: "610", // received_date
                order: "desc",
                deleted: 'false',
                cache: true // allow DB cache
            },
            list: {
                action: "list",
                columns: "102,600,601,602,603,604,607,610,611,614"
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
            all: function (data, opt) {
                // apply unread count
                folderAPI.setUnread(opt.folder, data.unreadCount || 0);
                return data;
            },
            allPost: function (data) {
                _(data).each(function (obj) {
                    // update hash
                    latest[obj.folder_id + '.' + obj.id] = { flags: obj.flags, color_label: obj.color_label };
                });
                return data;
            },
            listPost: function (data) {
                _(data).each(applyLatest);
                return data;
            },
            get: function (data) {
                // local update
                latest[data.folder_id + '.' + data.id] = { flags: data.flags, color_label: data.color_label };
                // was unseen?
                if (data.unseen) {
                    // look for proper thread
                    decUnreadCount(data);
                    folderAPI.decUnread(data);
                }
                return data;
            },
            getPost: function (data) {
                return applyLatest(data);
            }
        }
    });

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
        FORWARDED: 128
    };

    api.COLORS = {
        NONE:      0,
        RED:       1,
        BLUE:      2,
        GREEN:     3,
        GREY:      4,
        BROWN:     5,
        AQUA:      6,
        ORANGE:    7,
        PINK:      8,
        LIGHTBLUE: 9,
        YELLOW:   10
    };

    // control for each folder:
    // undefined -> first fetch
    // true -> has been fetched in this session
    // false -> caused by refresh
    var cacheControl = {};

    // ~ all
    api.getAllThreads = function (options, useCache) {
        // request for brand new thread support
        options = options || {};
        options = $.extend(options, {
            action: 'threadedAll',
            columns: '601,600,611,102', // +flags +color_label
            sort: options.sort || '610',
            sortKey: 'threaded-' + (options.sort || '610'),
            order: options.order || 'desc',
            includeSent: false, //!accountAPI.is(options.folder, 'sent')
            cache: false, // never use server cache
            max: 1000 // apply internal limit to build threads fast enough
        });
        var t1, t2;
        console.log('time.pre', 't1', (t1 = _.now()) - ox.t0, new Date(_.now()));
        // use cache?
        if (useCache === 'auto') {
            useCache = (cacheControl[options.folder] !== false);
        }
        return this.getAll(options, useCache, null, false)
            .done(function (response) {
                _(response.data).each(function (obj) {
                    // build thread hash
                    var key = obj.folder_id + '.' + obj.id;
                    threads[key] = [options.order]
                        .concat(options.order === 'desc' ? obj.thread : obj.thread.slice().reverse());
                    unreadCount[key] = obj.unreadCount || 0;
                    _(obj.thread).each(function (o) {
                        o = String(o).indexOf('.') > -1 ? o : obj.folder_id + '.' + o;
                        threadHash[o] = key;
                    });
                });
                console.log('time.post', '#', (response && response.data) ? response.data.length : 'no data', 't2', (t2 = _.now()) - ox.t0, 'took', t2 - t1);
                cacheControl[options.folder] = true;
            });
    };

    // get mails in thread
    api.getThread = function (obj) {
        var key, folder, account, thread, order, len, retVal;
        if (typeof obj === 'string') {
            key = obj;
            obj = obj.split(/\./);
            obj = { folder_id: (folder = obj[0]), id: obj[1] };
        } else {
            key = (folder = obj.folder_id) + "." + obj.id;
            obj = { folder_id: folder, id: obj.id };
        }
        if (key in threads && (thread = threads[key].slice()).length) {
            order = thread.shift();
            len = thread.length;
            account = folder.split(separator, 2)[0];
            retVal = _(thread).map(function (id, i) {
                var pos = order === 'desc' ? len - i : i + 1,
                    split = id.split(separator);
                // get proper folder & id
                folder = split.length > 1 ? account + separator + split.slice(0, -1).join(separator) : folder;
                id = split.slice(-1).join('');
                return {
                    folder_id: folder,
                    id: id,
                    threadKey: key,
                    threadPosition: pos,
                    threadSize: len
                };
            });
        } else {
            obj.threadKey = key;
            obj.threadPosition = 1;
            obj.threadSize = 1;
            retVal = [obj];
        }
        //console.debug('getThread', retVal);
        return retVal;
    };

    api.getThreadOrder = function (obj) {
        var key = typeof obj === 'string' ? obj : obj.folder_id + "." + obj.id;
        return key in threads ? threads[key][0] : 'desc';
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
                    obj.threadSize = getThreadSize(obj);
                    obj.unreadCount = getUnreadCount(obj);
                }
                return data;
            });
    };

    var change = function (list, data, apiAction) {

        // allow single object and arrays
        list = _.isArray(list) ? list : [list];

        // pause http layer
        http.pause();

        var flagUpdate = 'flags' in data && 'value' in data,

            localUpdate = function (obj) {
                if ('flags' in obj) {
                    if (data.value) {
                        obj.flags = obj.flags | data.flags;
                    } else {
                        obj.flags = obj.flags & ~data.flags;
                    }
                    updateLatest(obj);
                    return $.when(
                         api.caches.list.merge(obj),
                         api.caches.get.merge(obj)
                    );
                } else {
                    return $.when();
                }
            };

        // process local update first
        if (flagUpdate) {
            $.when.apply($, _(list).map(localUpdate)).done(function () {
                api.trigger('refresh.list');
            });
        }

        // now talk to server
        _(list).map(function (obj) {
            return http.PUT({
                module: 'mail',
                params: {
                    action: apiAction,
                    id: obj.id,
                    folder: obj.folder || obj.folder_id
                },
                data: data,
                appendColumns: false
            })
            .pipe(function () {
                // not just a flag update?
                if (!flagUpdate) {
                    // color_label?
                    if ('color_label' in data) {
                        obj.color_label = data.color_label;
                        updateLatest(obj);
                    }
                    // remove affected object from caches
                    return $.when(
                        api.caches.get.remove(obj),
                        api.caches.list.remove(obj)
                    );
                }
            });
        });
        // resume & trigger refresh
        return http.resume().done(function () {
            if (!flagUpdate) {
                api.trigger('refresh.list');
            }
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
                    api.caches.all.grepRemove(id + '\t'), // clear source folder
                    api.caches.all.grepRemove(targetFolderId + '\t') // clear target folder
                );
            };
        },
        refreshAll = function (obj) {
            $.when.apply($, obj).done(function () {
                api.trigger('refresh.all refresh.list');
            });
        };

    api.update = function (list, data) {
        return change(list, data, 'update');
    };

    /*
     * Mark unread/read (not trivial)
     */
    function updateFlags(cache, folder, hash, bitmask) {
        // get proper keys (differ due to sort/order suffix)
        return cache.grepKeys(folder + '\t').pipe(function (keys) {
            return $.when.apply($,
                _(keys).each(function (folder) {
                    return cache.get(folder).pipe(function (data) {
                        if (data) {
                            // update affected items
                            _(data).each(function (obj) {
                                var cid = obj.folder_id + '.' + obj.id;
                                if (cid in hash) {
                                    obj.flags = obj.flags & bitmask;
                                }
                            });
                            return cache.add(folder, data);
                        } else {
                            return $.when();
                        }
                    });
                })
            );
        });
    }

    function mark(list, value, bitmask, bool, call) {
        // get list first in order to have flags
        return api.getList(list).pipe(function (list) {
            // remove unseen mails
            var folders = {}, items = {};
            list = _(list).filter(function (o) {
                if ((o.flags & 32) === value) { // seen? = read?
                    return (folders[o.folder_id] = items[o.folder_id + '.' + o.id] = true);
                } else {
                    return false;
                }
            });
            // loop over affected 'all' index
            return $.when.apply($,
                    _(folders).map(function (value, folder) {
                        return updateFlags(api.caches.all, folder, items, bitmask);
                    })
                )
                .pipe(function () {
                    return api.update(list, { flags: api.FLAGS.SEEN, value: bool })
                        .pipe(function () {
                            folderAPI[call](list);
                            folders = items = null;
                            return list;
                        });
                });
        });
    }

    api.markUnread = function (list) {
        return mark(list, 32, ~32, false, 'incUnread').done(function (list) {
            _(list).each(incUnreadCount);
            api.trigger('refresh.list');
        });
    };

    api.markRead = function (list) {
        return mark(list, 0, 32, true, 'decUnread').done(function (list) {
            _(list).each(decUnreadCount);
            api.trigger('refresh.list');
        });
    };

    api.move = function (list, targetFolderId) {
        return api.update(list, { folder_id: targetFolderId })
            .pipe(function () {
                list = _.isArray(list) ? list : [list];
                return _(list).map(function (obj) {
                    return (clearCaches(obj, targetFolderId))();
                });
            })
            .done(refreshAll);
    };

    api.copy = function (obj, targetFolderId) {
        return change(obj, { folder_id: targetFolderId }, 'copy')
            .pipe(clearCaches(obj, targetFolderId))
            .done(refreshAll);
    };

    var react = function (action, obj, view) {
        return http.PUT({
                module: 'mail',
                params: {
                    action: action || '',
                    view: view || 'text'
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
                return '"' + recipient[0].replace(/^["']+|["']+$/g, '') + '" <' + recipient[1] + '>';
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
                return '"' + recipient[0].replace(/^["']+|["']+$/g, '') + '" <' + recipient[1] + '>';
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

        window.callback_new = function (newMailId) {
            $('#' + tmpName).remove();
            deferred.resolve(newMailId);
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
                fileAPI.caches.all.grepRemove(target + '\t');
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
            _(cacheControl).each(function (val, id) {
                cacheControl[id] = false;
            });
            api.checkInbox().done(function () {
                // trigger
                api.trigger('refresh.all');
            });
        }
    };

    function updateTopLevel(folder_id, mapper) {
        // grep keys
        var cache = api.caches.all;
        return cache.grepKeys(folder_id + '\t').pipe(function (key) {
            // now get cache entry
            return cache.get(key).pipe(function (items) {
                if (items) {
                    return cache.add(key, _(items).map(mapper));
                } else {
                    return $.when();
                }
            });
        });
    }

    api.prepareRemove = function (ids) {
        return $.when.apply($,
            _(ids).map(function (obj, index) {
                // find thread
                var key = obj.threadKey, top, list, pos;
                if (key in threads) {
                    // is not top element?
                    top = _.cid(key);
                    list = threads[key];
                    pos = _(list).indexOf(obj.id);
                    // trick: remove from array to avoid further processing
                    ids.splice(index, 1);
                    if (pos === 1) {
                        // proper replace
                        return updateTopLevel(top.folder_id, function (o) {
                            if (o.id === top.id) {
                                o.thread = _(o.thread).without(obj.id);
                                o.id = _(o.thread).first();
                            }
                            return o;
                        });
                    } else {
                        // just remove from thread list
                        return updateTopLevel(top.folder_id, function (o) {
                            if (o.id === top.id) {
                                o.thread = _(o.thread).without(obj.id);
                            }
                            return o;
                        });
                    }
                } else {
                    return $.when();
                }
            })
        );
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
                return api.caches.all.grepRemove(options.folder + '\t').pipe(function () {
                    api.trigger('refresh.all');
                    return data;
                });
            });
    };

    return api;
});
