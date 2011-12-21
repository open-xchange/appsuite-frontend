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
    ["io.ox/core/http", "io.ox/core/config",
     "io.ox/core/api/factory"], function (http, config, apiFactory) {

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
                view: "html"
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
        }
    });

    // ~ all
    api.getAllThreads = function (options, useCache) {

        options = options || {};
        options.columns = "601,600,610,612"; // +level, +received_date
        options.sort = "thread";

        // clear threads
        threads = {};

        return this.getAll(options, useCache)
            .pipe(function (data) {
                // loop over data
                var i = 0, obj, tmp = null, all = [], first,
                    // store thread
                    store = function () {
                        if (tmp) {
                            // sort
                            tmp.sort(dateSort);
                            // add most recent element to list
                            all.push(first = tmp[0]);
                            // add to hash
                            threads[first.folder_id + "." + first.id] = tmp;
                        }
                    };
                for (; (obj = data[i]); i++) {
                    if (obj.level === 0) {
                        store();
                        tmp = [obj];
                    } else if (tmp) {
                        tmp.push(obj);
                    }
                }
                // store last thread
                store();
                // resort all
                all.sort(dateSort);
                return all;
            });
    };

    // get mails in thread
    api.getThread = function (obj) {
        var key = obj.folder_id + "." + obj.id;
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
                        // fix reply/forward quoting
                        // TODO: remove when backend does this properly
                        if (action === 'replyall' || action === 'reply') {
                            text = '> ' + text.replace(/\n/, "\n> ");
                        } else if (action === 'forward') {
                            text = '> ' + text.replace(/\n/g, "\n> ");
                        }
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

        var deferred = $.Deferred(),
            form = new FormData(),
            flatten = function (recipient) {
                return '"' + recipient[0] + '" <' + recipient[1] + '>';
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

        return deferred;
    };

    // refresh
    api.bind('refresh!', function (folder) {
        api.getAllThreads({ folder: folder }, false)
            .done(function () {
                api.trigger('refresh.all');
            });
    });

    return api;
});