/**
 * This work is provided under the terms of the CREATIVE COMMONS PUBLIC
 * LICENSE. This work is protected by copyright and/or other applicable
 * law. Any use of the work other than as authorized under this license
 * or copyright law is prohibited.
 *
 * http://creativecommons.org/licenses/by-nc-sa/2.5/
 *
 * © 2016 OX Software GmbH, Germany. info@open-xchange.com
 *
 * @author Matthias Biggeleben <matthias.biggeleben@open-xchange.com>
 */

define('io.ox/mail/compose/api', [
    'io.ox/core/http',
    'io.ox/mail/api',
    'io.ox/core/folder/api',
    'io.ox/contacts/api',
    'io.ox/core/api/account',
    'io.ox/core/event',
    'settings!io.ox/mail'
], function (http, mailAPI, folderAPI, contactsAPI, accountAPI, Events, settings) {

    'use strict';

    /**
     *
     * moved events: beforesend, send
     *
     **/

    var api = {};

    Events.extend(api);

    api.SENDTYPE = {
        NORMAL:     0,
        REPLY:      1,
        FORWARD:    2,
        EDIT_DRAFT: 3,
        DRAFT:      4
    };

    var GET_IDS = 'id: folder_id:folder folder: recurrence_position:'.split(' ');

    /**
     * reduce object to id, folder, recurrence_position
     * @param  {object|string} obj
     * @return { object }
     */
    // TODO: copied from apifactory
    api.reduce = function (obj) {
        return !_.isObject(obj) ? obj : _(GET_IDS).reduce(function (memo, prop) {
            var p = prop.split(':'), source = p[0], target = p[1] || p[0];
            if (source in obj) { memo[target] = obj[source]; }
            return memo;
        }, {});
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
        var attachOriginalMessage = obj.attachOriginalMessage || (view === 'text' && _.device('touch') && settings.get('attachOriginalMessage', false) === true),
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
                max_size: obj.max_size,
                decrypt: (obj.security && obj.security.decrypted),
                process_plain_text: false
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
        if (data.share_attachments && data.share_attachments.expiry_date) {
            // explicitedy clone share attachments before doing some computations
            data.share_attachments = _.clone(data.share_attachments);
            // expiry date should count from mail send
            data.share_attachments.expiry_date = _.now() + parseInt(data.share_attachments.expiry_date, 10);
        }
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

        var DELAY = api.SEND_REFRESH_DELAY,
            isSaveDraft = data.flags === mailAPI.FLAGS.DRAFT,
            csid = data.csid;

        api.queue.add(csid, deferred.abort);

        return deferred
            .done(function () {
                contactsAPI.trigger('maybeNewContact');
                api.trigger('send', { data: data, files: files, form: form });
                ox.trigger('mail:send:stop', data, files);
                if (data.share_attachments) ox.trigger('please:refresh refresh^');
            })
            .fail(function () {
                ox.trigger('mail:send:fail');
            })
            .progress(function (e) {
                // no progress for saving a draft
                if (isSaveDraft) return;
                api.queue.update(csid, e.loaded, e.total);
            })
            .always(function () {
                api.queue.remove(csid);
            })
            .then(function (text) {
                // wait a moment, then update mail index
                setTimeout(function () {
                    // reset collections and folder (to update total count)
                    var affectedFolders = _(['inbox', 'sent', 'drafts'])
                        .chain()
                        .map(function (type) {
                            var folders = accountAPI.getFoldersByType(type);
                            mailAPI.pool.resetFolder(folders);
                            return folders;
                        })
                        .flatten()
                        .value();
                    folderAPI.multiple(affectedFolders, { cache: false });
                    api.trigger('refresh.all');
                }, DELAY);
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
                if (result.error) {
                    return $.Deferred().reject(result).promise();
                } else if (result.data) {
                    var base = _(result.data.toString().split(api.separator)),
                        id = base.last(),
                        folder = base.without(id).join(api.separator);
                    $.when(accountAPI.getUnifiedMailboxName(), accountAPI.getPrimaryAddress())
                    .done(function (isUnified, senderAddress) {
                        // check if mail was sent to self to update inbox counters correctly
                        var sendToSelf = false;
                        _.chain(_.union(data.to, data.cc, data.bcc)).each(function (item) {
                            if (item[1] === senderAddress[1]) {
                                sendToSelf = true;
                                return;
                            }
                        });
                        // wait a moment, then update folders as well
                        setTimeout(function () {
                            if (isUnified !== null) {
                                folderAPI.refresh();
                            } else if (sendToSelf) {
                                folderAPI.reload(folder, accountAPI.getInbox());
                            } else {
                                folderAPI.reload(folder);
                            }
                        }, DELAY);
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
            if (file.name) {
                form.append('file_' + index, file, file.name);
            } else {
                form.append('file_' + index, file);
            }
        });

        return http.UPLOAD({
            module: 'mail',
            params: {
                action: 'new',
                lineWrapAfter: 0,
                // force the response to be json(ish) instead of plain html (fixes some error messages)
                force_json_response: true
            },
            data: form,
            dataType: 'json',
            fixPost: true
        });
    }

    // delay to refresh mail list and folders after sending a message
    api.SEND_REFRESH_DELAY = 5000;

    api.queue = (function () {

        function pct(loaded, total) {
            if (!total) return 0;
            return Math.max(0, Math.min(100, Math.round(loaded / total * 100))) / 100;
        }

        return {

            collection: new Backbone.Collection().on('add remove change:pct', function () {
                var loaded = 0, total = 0, abort;
                this.each(function (model) {
                    loaded += model.get('loaded');
                    total += model.get('total');
                    abort = model.get('abort');
                });
                this.trigger('progress', { count: this.length, loaded: loaded, pct: pct(loaded, total), total: total, abort: abort });
            }),

            add: function (csid, abort) {
                this.collection.add(new Backbone.Model({ id: csid, loaded: 0, pct: 0, total: 0, abort: abort }));
            },

            remove: function (csid) {
                var model = this.collection.get(csid);
                this.collection.remove(model);
            },

            update: function (csid, loaded, total) {
                var model = this.collection.get(csid);
                if (!model) return;
                model.set({ loaded: loaded, pct: pct(loaded, total), total: total });
            }
        };
    }());

    // TODO: remove
    api.unittest = function (obj) {
        var id, count;
        return api.space.list().then(function (list) {
            console.log(list);
            count = list.length;
            return api.space.add('forward', obj);
        }).then(function (data) {
            console.log(data.id);
            id = data.id;
            return api.space.get(data.id);
        }).then(function (data) {
            console.log(data);
            return api.space.list();
        }).then(function (list) {
            console.log(list);
            if (count + 1 !== list.length) console.log('%c' + 'COUNT', 'color: white; background-color: red');
            if (!_.contains(list, id)) console.log('%c' + 'CONTAINS', 'color: white; background-color: red');
            return api.space.remove(id);
        }).then(function () {
            return api.space.list();
        }).then(function (list) {
            console.log(list);
            if (count !== list.length) console.log('%c' + 'COUNT', 'color: white; background-color: red');
            if (_.contains(list, id)) console.log('%c' + 'CONTAINS', 'color: white; background-color: red');
        }).catch(function () {
            console.log('%c' + 'CATCH', 'color: white; background-color: red');
        });
    };

    api.spaced = function (meta, opt) {
        return api.space.add(meta, opt).then(function (space) {
            var obj;
            return api.space.get(space.id).then(function (data) {
                obj = _.extend({}, data);
                // TOOD: should be an option like 'vcard' in space.add request
                return opt.original ? api.space.attachments.original(data.id) : $.when([]);
            }).then(function (list) {
                obj.attachments = (obj.attachments || []).concat(list);
                return obj;
            });
        });
    };

    // composition space
    api.space = {

        // limit (aktuell 3)
        add: function (meta, opt) {
            opt = _.extend({ vcard: false }, opt);
            console.log('> ADD: ' + meta.type);
            return http.POST({
                module: 'mail/compose',
                params: $.extend({}, {
                    type: meta.type,
                    id: meta.originalId,
                    folderId: meta.originalFolderId,
                    vcard: opt.vcard
                })
            });
        },

        get: function (id) {
            console.log('> GET: ' + id);
            return http.GET({ url: 'api/mail/compose/' + id });
        },


        list: function () {
            console.log('> LIST');
            return http.GET({ url: 'api/mail/compose' });
        },

        remove: function (id) {
            console.log('> REMOVE: ' + id);
            return http.DELETE({ url: 'api/mail/compose/' + id }).then(function (data) {
                if (data && data.success) return data;
                return $.Deferred().reject({ action: 'remove', error: 'unknown', id: id });
            });
        },

        reset: function () {
            console.log('> RESET');
            return api.space.list().then(function (list) {
                // TODO: use case? adjust http pause/resume? add mw endpoint?
                // process all updates
                _(list).map(function (id) {
                    return api.space.remove(id);
                });
                return $.when.apply($, list);
            });
        },

        send: function (id, data) {
            console.log('> SEND: ' + id);
            // TODO missing spec/support for addional data on send
            return api.space.update(id, data).then(function () {
                return http.POST({
                    url: 'api/mail/compose/' + id + '/send',
                    params: $.extend({}, data)
                });
            });
        },

        update: function (id, data) {
            console.log('> UPDATE: ' + id);
            return http.PATCH({
                url: 'api/mail/compose/' + id,
                data: $.extend({}, data)
            });
        }
    };

    // composition space
    api.space.attachments = {

        original: function (space) {
            console.log('> ATTACHMENTS ORIGINAL: ' + space);
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/original'
            });
        },
        vcard: function (space) {
            console.log('> ATTACHMENTS VCARD: ' + space);
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/vcard'
            });
        },
        add: function (space, data, type) {
            console.log('> ATTACHMENTS: ' + space);

            var formData = new FormData();
            formData.append('contentDisposition', type || 'attachment');

            if (data.file) formData.append('file', data.file);
            else formData.append('JSON', JSON.stringify(data));

            return http.UPLOAD({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments',
                data: formData
            });
        },
        get: function (space, attachment) {
            console.log('> ATTACHMENTS GET: ' + space + ', ' + attachment);
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment
            });
        },
        remove: function (space, attachment) {
            console.log('> ATTACHMENTS REMOVE: ' + space + ', ' + attachment);
            return http.DELETE({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment
            });
        }
    };


    return api;
});
