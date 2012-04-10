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
     "io.ox/core/api/folder"], function (http, config, cache, apiFactory, folderAPI) {

    "use strict";

    // simple temporary thread cache
    var threads = {};

    // helper: get number of mails in thread
    var threadSize = function (obj) {
        var key = obj.folder_id + "." + obj.id;
        return (threads[key] || []).length;
    };

    // helper: sort by received date
    var dateSort = function (a, b) {
        return b.received_date - a.received_date;
    };

    // generate basic API
    var api = apiFactory({
        module: "mail",
        requests: {
            all: {
                folder: "default0/INBOX",
                columns: "601,600",
                sort: "610", // received_date
                order: "desc"
            },
            list: {
                action: "list",
                columns: "102,600,601,602,603,607,610,611,614"
            },
            get: {
                action: "get",
                view: "noimg"/*,
                format: "preview_filtered"*/
            },
            getUnmodified: {
                action: "get",
                view: "html"/*,
                format: "preview_filtered"*/
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
                    api.remove([params], true);
                }
            }
        },
        pipe: {
            all: function (data) {
                // ignore deleted mails
                data = _(data).filter(function (obj) {
                    return (obj.flags & 2) === 0;
                });
                // because we also have brand new flags, we merge with list & get caches
                api.caches.list.merge(data);
                api.caches.get.merge(data);
                return data;
            },
            get: function (data) {
                // decrease unread count
                var folder = data.folder_id;
                folderAPI.get({ folder: folder }).done(function (data) {
                    folderAPI.decreaseUnreadCount(folder).done(function () {
                        folderAPI.trigger('change:' + folder);
                    });
                });
                return data;
            }
        }
    });

    api.SENDTYPE = {
        'NORMAL':  1,
        'REPLY':   2,
        'FORWARD': 3,
        'DRAFT':   4
    };

    api.FLAGS = {
        'ANSWERD':     1,
        'DELETED':     2,
        'DRAFT':       4,
        'FLAGGED':     8,
        'RECENT':     16,
        'SEEN':       32,
        'USER':       64,
        'FORWARDED': 128
    };

    api.COLORS = {
        'NONE':      0,
        'RED':       1,
        'BLUE':      2,
        'GREEN':     3,
        'GREY':      4,
        'BROWN':     5,
        'AQUA':      6,
        'ORANGE':    7,
        'PINK':      8,
        'LIGHTBLUE': 9,
        'YELLOW':   10
    };

    // add all thread cache
    api.caches.allThreaded = new cache.SimpleCache('mail-all-threaded', true);

    // ~ all
    api.getAllThreads = function (options, useCache) {
        // request for brand new thread support
        options = options || {};
        options.action = 'threadedAll';
        options.columns = '601,600,611'; // + flags
        options.sort = '610';
        return this.getAll(options, useCache, api.caches.allThreaded)
            .done(function (data) {
                _(data).each(function (obj) {
                    // build thread hash
                    threads[obj.folder_id + "." + obj.id] = obj.thread;
                });
            });
    };

    // get mails in thread
    api.getThread = function (obj) {
        var key;
        if (typeof obj === 'string') {
            key = obj;
            obj = obj.split(/\./);
            obj = { folder_id: obj[0], id: obj[1] };
        } else {
            key = obj.folder_id + "." + obj.id;
        }
        return threads[key] || [obj];
    };

    // ~ get
    api.getFullThread = function (obj) {
        // get list of IDs
        var key = obj.folder_id + "." + obj.id,
            thread = threads[key] || [obj],
            defs = [],
            self = this;
        // get each mail
        _.each(thread, function (t) {
            defs.push(self.get(t));
        });
        // join all deferred objects
        var result = $.Deferred();
        $.when.apply($, defs).done(function () {
            var args = $.makeArray(arguments), tmp = [];
            args = defs.length > 1 ? args : [args];
            // loop over results
            _.each(args, function (obj) {
                tmp.push(obj[0] || obj);
            });
            // resolve
            result.resolve(tmp);
        });
        return result;
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
                    obj.threadSize = threadSize(obj);
                }
                return data;
            });
    };

    var change = function (list, data, apiAction) {
        // allow single object and arrays
        list = _.isArray(list) ? list : [list];
        // pause http layer
        http.pause();
        // process all updates
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
                // update flags locally?
                if ('flags' in data && 'value' in data && 'flags' in obj) {
                    if (data.value) {
                        obj.flags = obj.flags | data.flags;
                    } else {
                        obj.flags = obj.flags & ~data.flags;
                    }
                    return $.when(
                         api.caches.list.merge(obj),
                         api.caches.get.merge(obj)
                    );
                } else {
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
            api.trigger('refresh.list');
        });
    };

    var clearCaches = function (obj, targetFolderId) {
            return function () {
                return $.when(
                    api.caches.get.remove(obj),
                    api.caches.get.remove(obj.folder_id || obj.folder),
                    api.caches.list.remove(obj),
                    api.caches.list.remove(obj.folder_id || obj.folder),
                    api.caches.all.remove(obj.folder_id || obj.folder), // clear source folder
                    api.caches.all.remove(targetFolderId), // clear target folder
                    api.caches.allThreaded.remove(obj.folder_id || obj.folder),
                    api.caches.allThreaded.remove(targetFolderId)
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
        return http.GET({
                module: 'mail',
                params: {
                    action: action || '',
                    id: obj.id,
                    folder: obj.folder || obj.folder_id,
                    view: view || 'text'
                }
            })
            .pipe(function (data) {
                // transform pseudo-plain text to real text
                if (data.attachments && data.attachments.length) {
                    var text = '', tmp = '', quote = '';
                    if (data.attachments[0].content_type === 'text/plain') {
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

                        data.attachments[0].content = $('<div>')
                            .html(data.attachments[0].content)
                            .find('blockquote').removeAttr('style')
                            .end()
                            .html();
                    }
                } else {
                    data.attachments = data.attachments || [{}];
                    data.attachments[0].content = '';
                }
                return data;
            });
    };

    api.getUnmodified = function (obj) {
        return this.get({
            action: 'get',
            id: obj.id,
            folder: obj.folder || obj.folder_id,
            view: 'html'
        }, false);
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
            'method': 'post',
            'action': '/ox7/api/mail?action=new&session=' + ox.session,
            'target': tmpName
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
                fileAPI.caches.all.remove(target);
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
                attachment: _(data).pluck('id').join(',')
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

    // disable default refresh
    ox.off('refresh^.mail');

    // refresh
    ox.on('refresh^', function (e, folder) {
        if (ox.online) {
            api.getAllThreads({ folder: folder }, false)
                .done(function () {
                    api.trigger('refresh.all');
                });
        }
    });

    return api;
});
