/*
 *
 * @copyright Copyright (c) Open-Xchange GmbH, Germany <info@open-xchange.com>
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with OX App Suite. If not, see <https://www.gnu.org/licenses/agpl-3.0.txt>.
 *
 * Any use of the work other than as authorized under this license or copyright law is prohibited.
 *
 */

define('io.ox/mail/compose/api', [
    'io.ox/core/http',
    'io.ox/contacts/api'
], function (http, contactsAPI) {

    'use strict';

    var api = {},
        TOKEN = generateToken(),
        // used as pseudo-"channel" to propagate claims to all browser tabs
        localStorageKey = 'mail-compose-claim';

    ox.ui.spaces = ox.ui.spaces || {};

    _.extend(api, Backbone.Events);

    // concurrent editing
    var claims = (function () {
        var hash = {};

        (function register() {
            if (!window.Modernizr.localstorage) return;
            window.addEventListener('storage', function (event) {
                if (event.storageArea !== localStorage || event.key !== localStorageKey) return;
                var id = localStorage.getItem(localStorageKey);
                if (!id) return;
                // trigger event and remove from claim-hash
                api.trigger(localStorageKey + ':' + id);
                delete hash[id];
            });
        })();

        return {
            get: function (id) {
                return hash[id];
            },
            set: function (id, value) {
                if (hash[id]) return;
                hash[id] = value;
                // propagate to other browser tabs
                if (!window.Modernizr.localstorage) return;
                // trigger event and reset
                window.localStorage.setItem(localStorageKey, id);
                window.localStorage.removeItem(localStorageKey);
            }
        };
    })();

    function generateToken() {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            token = '';
        for (var i = 1; i <= 3; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token + String(Date.now());
    }

    api.queue = (function () {

        function pct(loaded, total) {
            if (!total) return 0;
            return Math.max(0, Math.min(100, Math.round(loaded / total * 100))) / 100;
        }

        return {

            collection: new Backbone.Collection().on('add remove change:pct', function () {
                var loaded = 0, total = 0, abortList = [];
                this.each(function (model) {
                    loaded += model.get('loaded');
                    total += model.get('total');
                    // only register abort function if upload is not yet done. Mail sending should not be canceled while the request is handled by the server
                    if (model.get('loaded') < model.get('total')) abortList.push({ abort: model.get('abort') });
                });
                this.trigger('progress', { count: this.length, loaded: loaded, pct: pct(loaded, total), total: total, abort: _.invoke.bind(_, abortList, 'abort') });
            }),

            add: function (model, abort) {
                if (this.collection.get(model.get('id'))) return;

                var csid = model.get('id'),
                    attachments = model.get('attachments'),
                    pending = attachments.filter(function (attachment) {
                        return attachment.get('uploaded') < 1;
                    }),
                    loaded = pending.reduce(function (memo, attachment) {
                        return memo + attachment.get('uploaded');
                    }, 0),
                    total = pending.length + 1,
                    uploadModel = new Backbone.Model({ id: csid, loaded: loaded, pct: pct(loaded, total), total: total, abort: abort });

                attachments.on('change:uploaded', function (model) {
                    var loaded = uploadModel.get('loaded');
                    loaded += (model.get('uploaded') - model.previous('uploaded'));
                    uploadModel.set({ loaded: loaded, pct: pct(loaded, total) });
                });

                this.collection.add(uploadModel);
            },

            remove: function (csid) {
                var model = this.collection.get(csid);
                this.collection.remove(model);
            },

            update: function (csid, loaded, total, abort) {
                var model = this.collection.get(csid);
                if (!model) return;
                var totalLoad = model.get('total') - 1 + loaded / total;
                abort = abort || model.get('abort');
                model.set({ loaded: totalLoad, pct: pct(totalLoad, model.get('total')), abort: abort });
            }
        };
    }());

    // fill mapping cache (mailref to space) and cid construction
    var process = (function () {
        function apply(space) {
            var editFor = space.meta && space.meta.editFor,
                mailPath = space.mailPath, mailref;
            if (editFor && !mailPath) {
                // db drafts (backward compability)
                mailref = _.cid({ id: editFor.originalId, folder: editFor.originalFolderId });
                space.cid = 'io.ox/mail/compose:' + mailref + ':edit';
            }
            if (mailPath) {
                // real drafts
                mailref = _.cid({ id: mailPath.id, folder: mailPath.folderId });
                api.trigger('mailref:' + space.id, mailPath);
                space.cid = 'io.ox/mail/compose:' + space.id + ':edit';
            }
            // fallback for db draft from scratch
            space.cid = space.cid || ('io.ox/mail/compose:' + space.id + ':edit');
            // add to mailref mapping;
            ox.ui.spaces[mailref] = space.id;
            return space;
        }

        return function (data) {
            return _.isArray(data) ? _.map(data, apply) : apply(data);
        };
    })();

    // composition space
    // claim/clientToken:
    // - as part of body/url (claim): binds edit rights for this client token
    // - as part of url (clientToken): enables middleware check that denies writing calls when clientToken does not match
    // - to force edit rights use a patch request WITH claim as body property and WITHOUT clientToken within url (app.space.claim)

    api.space = {

        hash: ox.ui.spaces,

        process: process,

        all: function () {
            // requestable columns limited to: meta, subject & security
            return http.GET({ url: 'api/mail/compose', params: { action: 'all', columns: 'subject,meta,security' } }).then(process);
        },

        add: function (obj, opt) {
            // reply or forwarding of single/multiple mails
            var references = JSON.stringify([].concat(obj.original || []));
            return http.POST({
                module: 'mail/compose',
                data: references,
                params: {
                    type: obj.type,
                    vcard: !!opt.vcard,
                    sharedAttachmentsEnabled: opt.sharedAttachmentsEnabled,
                    originalAttachments: opt.attachments,
                    claim: TOKEN
                },
                contentType: 'application/json'
            }).then(process).done(function (result) {
                claims.set(result.id, 'add');
                api.trigger('add', obj, result);
            });
        },

        get: function (id) {
            // only claim on GET when not claimed before
            return (claims.get(id) ? $.when() : api.space.claim(id)).then(function () {
                return http.GET({ url: 'api/mail/compose/' + id }).then(process);
            });
        },

        list: function () {
            return http.GET({ url: 'api/mail/compose' });
        },

        remove: function (id, data, parameters) {
            var params = _.extend({ clientToken: TOKEN, harddelete: true }, parameters || {});
            return http.DELETE({ url: 'api/mail/compose/' + id, params: params }).then(function (data) {
                if (data && data.success) return data;
                return $.Deferred().reject({ action: 'remove', error: 'unknown', id: id });
            }).done(function (result) {
                api.trigger('after:remove', data, result);
            });
        },

        reset: function () {
            return api.space.list().then(function (list) {
                // process all updates
                _(list).map(function (id) {
                    return api.space.remove(id);
                });
                return $.when.apply($, list);
            });
        },

        send: function (id, data, attachments) {
            data = _(data).clone();

            api.trigger('before:send', id, data);
            ox.trigger('mail:send:start', data);

            if (data.sharedAttachments && data.sharedAttachments.expiryDate) {
                // explicitly clone share attachments before doing some computations
                data.sharedAttachments = _(data.sharedAttachments).clone();
                // expiry date should count from mail send
                data.sharedAttachments.expiryDate = _.now() + parseInt(data.sharedAttachments.expiryDate, 10);
            }

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            (attachments || []).forEach(function (attachment, index) {
                if (attachment.name) formData.append('file_' + index, attachment, attachment.name);
                else formData.append('file_' + index, attachment);
            });

            var def = http.UPLOAD({
                url: 'api/mail/compose/' + id + '/send',
                data: formData,
                // this call always expects a json response. avoid errors in html format (user only sees json parsing error in this case)
                params: { force_json_response: true, clientToken: TOKEN }
            });

            def.progress(function (e) {
                api.queue.update(id, e.loaded, e.total, def.abort);
            }).fail(function () {
                ox.trigger('mail:send:fail');
            }).always(function () {
                api.queue.remove(id);
            }).done(function (result) {
                contactsAPI.trigger('maybeNewContact');
                api.trigger('after:send', data, result);
                ox.trigger('mail:send:stop', data);
                if (data.sharedAttachments && data.sharedAttachments.enabled) ox.trigger('please:refresh refresh^');
            });

            return def;
        },

        save: function (id, data, attachments) {
            api.trigger('before:save', id, data);

            var formData = new FormData();
            formData.append('JSON', JSON.stringify(data));

            (attachments || []).forEach(function (attachment, index) {
                if (attachment.name) formData.append('file_' + index, attachment, attachment.name);
                else formData.append('file_' + index, attachment);
            });

            return http.UPLOAD({
                url: 'api/mail/compose/' + id + '/save',
                params: { clientToken: TOKEN },
                data: formData
            }).done(function (result) {
                api.trigger('after:save', data, result);
            });
        },

        update: function (id, data, options) {
            // to bypass server check we force by omitting clientToken queryparam
            var opt = _.extend({ force: !claims.get(id) }, options);
            return http[_.browser.ie ? 'PUT' : 'PATCH']({
                url: 'api/mail/compose/' + id,
                params: opt.force ? {} : { clientToken: TOKEN },
                data: $.extend({ claim: TOKEN }, data)
            }).then(process).done(function (result) {
                claims.set(result.id, 'update');
                api.trigger('after:update', data, result);
            });
        },

        claim: function (id) {
            // to bypass server check we force by omitting clientToken queryparam
            return http[_.browser.ie ? 'PUT' : 'PATCH']({
                url: 'api/mail/compose/' + id,
                data: { claim: TOKEN }
            }).then(process).done(function (result) {
                claims.set(result.id, 'claim');
            });
        }
    };

    function upload(url, data, type) {
        var formData = new FormData();
        formData.append('contentDisposition', (type || 'attachment').toUpperCase());

        if (data.file) {
            if (data.file.name) formData.append('file', data.file, data.file.name);
            else formData.append('file', data.file);
        } else {
            formData.append('JSON', JSON.stringify(data));
        }

        var upload = http.UPLOAD({
                url: url,
                params: { clientToken: TOKEN },
                data: formData
            }),
            process = upload.then(function (res) {
                return processAttachment(res.data);
            });

        // keep abort function as attribute of the returning promise
        process.abort = upload.abort;
        return process;
    }

    var processAttachment = function (data) {
        // result: attachment data with mailPath prop
        var mailPath = data.compositionSpace.mailPath || {},
            mailref = _.cid({ id: mailPath.id, folder: mailPath.folderId });
        api.trigger('mailref:changed', { mailPath: mailPath });
        api.trigger('mailref:' + data.compositionSpace.id, mailPath);
        // add to mailref mapping;
        ox.ui.spaces[mailref] = data.compositionSpace.id;
        return _.extend({}, data.attachments[0], { mailPath: mailPath });
    };

    // composition space
    api.space.attachments = {

        original: function (space) {
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/original',
                params: { clientToken: TOKEN }
            });
        },

        vcard: function (space) {
            return http.POST({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/vcard',
                params: { clientToken: TOKEN }
            }).then(processAttachment);
        },

        add: function (space, data, type) {
            var url = ox.apiRoot + '/mail/compose/' + space + '/attachments';
            return upload(url, data, type);
        },

        update: function (space, data, type, attachmentId) {
            var url = ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachmentId;
            return upload(url, data, type);
        },

        get: function (space, attachment) {
            return http.GET({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment
            });
        },

        remove: function (space, attachment) {
            return http.DELETE({
                url: ox.apiRoot + '/mail/compose/' + space + '/attachments/' + attachment,
                params: { clientToken: TOKEN }
            }).then(processAttachment);
        }
    };

    return api;
});
